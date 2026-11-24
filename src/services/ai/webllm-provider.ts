import { AirAwareContext, AIResponse, WebLLMProgress, WebLLMStage } from '../../types/ai.ts';

export const PRIMARY_WEBLLM_MODEL = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';
export const FALLBACK_WEBLLM_MODEL = 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC';
const TOTAL_WEIGHTS_MB = 265.1;
const TOTAL_SHARDS = 8;
const LOAD_TIMEOUT_MS = 600000; // 10 minutes timeout to accommodate slower networks

class WebLLMService {
  private engine: any = null;
  private isLoading = false;
  private isLoaded = false;
  private loadError: string | null = null;
  private selectedModel = PRIMARY_WEBLLM_MODEL;
  private isCached = false;
  private hasShaderF16 = false;
  private currentProgress: WebLLMProgress | null = null;
  private abortController: AbortController | null = null;
  private timerInterval: any = null;
  private loadStartTime = 0;
  private actualFetchedMB = 0;
  private simulatedFetchedMB = 0;

  public isWebGPUSupported(): boolean {
    return typeof navigator !== 'undefined' && 'gpu' in navigator;
  }

  public async checkWebGPUSupport(): Promise<{ supported: boolean; hasShaderF16: boolean; reason?: string }> {
    if (!this.isWebGPUSupported()) {
      return { supported: false, hasShaderF16: false, reason: 'navigator.gpu is not available in this browser.' };
    }

    try {
      const gpu = (navigator as any).gpu;
      const adapter = await gpu.requestAdapter();
      if (!adapter) {
        return { supported: false, hasShaderF16: false, reason: 'Failed to acquire a WebGPU hardware adapter.' };
      }

      const hasF16 = adapter.features ? adapter.features.has('shader-f16') : false;
      this.hasShaderF16 = hasF16;
      this.selectedModel = hasF16 ? PRIMARY_WEBLLM_MODEL : FALLBACK_WEBLLM_MODEL;

      return { supported: true, hasShaderF16: hasF16 };
    } catch (e: any) {
      return { supported: false, hasShaderF16: false, reason: e.message || 'WebGPU adapter query failed.' };
    }
  }

  public async checkIsModelCached(modelId?: string): Promise<boolean> {
    try {
      const id = modelId || this.selectedModel;
      const webllm: any = await import('@mlc-ai/web-llm');
      if (typeof webllm.hasModelInCache === 'function') {
        const cached = await webllm.hasModelInCache(id);
        this.isCached = cached;
        return cached;
      }
      return false;
    } catch {
      return false;
    }
  }

  public getStatus() {
    return {
      isLoaded: this.isLoaded,
      isLoading: this.isLoading,
      loadError: this.loadError,
      isSupported: this.isWebGPUSupported(),
      hasShaderF16: this.hasShaderF16,
      selectedModel: this.selectedModel,
      isCached: this.isCached,
      currentProgress: this.currentProgress
    };
  }

  public reset(): void {
    this.cleanupTimer();
    this.isLoading = false;
    this.loadError = null;
    this.currentProgress = null;
    this.actualFetchedMB = 0;
    this.simulatedFetchedMB = 0;
  }

  public cancelLoading(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.cleanupTimer();
    this.isLoading = false;
    this.loadError = 'Model loading was stopped. Reverted to instant Deterministic Engine.';
    if (this.currentProgress) {
      this.currentProgress = {
        ...this.currentProgress,
        stage: 'error',
        error: this.loadError
      };
    }
  }

  public async clearCache(): Promise<boolean> {
    try {
      const webllm: any = await import('@mlc-ai/web-llm');
      if (typeof webllm.deleteModelAllInfoInCache === 'function') {
        await webllm.deleteModelAllInfoInCache(this.selectedModel);
        await webllm.deleteModelAllInfoInCache(PRIMARY_WEBLLM_MODEL);
        await webllm.deleteModelAllInfoInCache(FALLBACK_WEBLLM_MODEL);
      }

      if (typeof window !== 'undefined' && 'caches' in window) {
        const keys = await caches.keys();
        for (const key of keys) {
          if (key.includes('webllm') || key.includes('qwen') || key.includes('mlc')) {
            await caches.delete(key);
          }
        }
      }

      this.isCached = false;
      this.isLoaded = false;
      this.engine = null;
      this.reset();
      return true;
    } catch (e: any) {
      console.warn('Error clearing WebLLM cache:', e);
      return false;
    }
  }

  private cleanupTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public async loadModel(onProgress?: (progress: WebLLMProgress) => void): Promise<boolean> {
    if (this.isLoaded && this.engine) {
      const readyProg: WebLLMProgress = {
        stage: 'ready',
        stageNumber: 5,
        stageName: '5. Ready',
        progressPercent: 100,
        fetchedMB: TOTAL_WEIGHTS_MB,
        totalMB: TOTAL_WEIGHTS_MB,
        currentShard: TOTAL_SHARDS,
        totalShards: TOTAL_SHARDS,
        elapsedSec: 0,
        text: 'Model is loaded in GPU memory and ready for private local inference.'
      };
      this.currentProgress = readyProg;
      if (onProgress) onProgress(readyProg);
      return true;
    }

    if (this.isLoading) return false;

    this.isLoading = true;
    this.loadError = null;
    this.actualFetchedMB = 0;
    this.simulatedFetchedMB = 0;
    this.loadStartTime = Date.now();
    this.abortController = new AbortController();

    const notify = (prog: WebLLMProgress) => {
      this.currentProgress = prog;
      if (onProgress) onProgress(prog);
    };

    // Stage 1: Checking GPU
    notify({
      stage: 'checking_gpu',
      stageNumber: 1,
      stageName: '1. GPU Check',
      progressPercent: 5,
      fetchedMB: 0,
      totalMB: TOTAL_WEIGHTS_MB,
      elapsedSec: 0,
      text: 'Querying WebGPU adapter and verifying hardware shader limits...'
    });

    const gpuCheck = await this.checkWebGPUSupport();
    if (!gpuCheck.supported) {
      this.isLoading = false;
      this.loadError = `WebGPU initialization failed: ${gpuCheck.reason || 'Hardware acceleration unavailable'}.`;
      notify({
        stage: 'error',
        stageNumber: 1,
        stageName: '1. GPU Check',
        progressPercent: 0,
        fetchedMB: 0,
        totalMB: TOTAL_WEIGHTS_MB,
        elapsedSec: 0,
        text: this.loadError,
        error: this.loadError
      });
      return false;
    }

    // Stage 2: Preparing model
    notify({
      stage: 'preparing_model',
      stageNumber: 2,
      stageName: '2. Prepare',
      progressPercent: 12,
      fetchedMB: 0,
      totalMB: TOTAL_WEIGHTS_MB,
      elapsedSec: 1,
      text: `Selected ${this.selectedModel}. Checking local browser cache & WASM runtime...`
    });

    const cached = await this.checkIsModelCached();
    if (cached) {
      this.isCached = true;
      notify({
        stage: 'preparing_model',
        stageNumber: 2,
        stageName: '2. Prepare',
        progressPercent: 20,
        fetchedMB: TOTAL_WEIGHTS_MB,
        totalMB: TOTAL_WEIGHTS_MB,
        elapsedSec: 1,
        text: 'Model found in offline browser cache! Loading tensors directly into GPU VRAM...'
      });
    }

    // Live ticker: advances smoothly every second so user sees dynamic activity and never a frozen bar
    this.timerInterval = setInterval(() => {
      if (this.currentProgress && this.isLoading && this.currentProgress.stage === 'downloading_weights') {
        const sec = Math.max(1, Math.round((Date.now() - this.loadStartTime) / 1000));
        
        // If TVM hasn't fired an exact shard completion yet, simulate smooth streaming progress
        if (this.actualFetchedMB === 0) {
          // Shard 0 (65MB) download: smoothly advance ~0.4 MB/s up to 60MB
          this.simulatedFetchedMB = Math.min(60, Math.round((sec * 0.4) * 10) / 10);
        } else {
          // Incrementally progress past actual confirmed MB
          this.simulatedFetchedMB = Math.min(
            TOTAL_WEIGHTS_MB - 5,
            Math.round((this.actualFetchedMB + (sec % 3) * 0.3) * 10) / 10
          );
        }

        const displayMB = Math.max(this.actualFetchedMB, this.simulatedFetchedMB);
        const percent = Math.min(92, Math.max(15, Math.round((displayMB / TOTAL_WEIGHTS_MB) * 100)));
        const speed = sec > 0 ? Math.round((displayMB / sec) * 100) / 100 : 0.5;

        this.currentProgress = {
          ...this.currentProgress,
          elapsedSec: sec,
          fetchedMB: displayMB,
          progressPercent: percent,
          estimatedSpeedMBs: speed,
          text: this.actualFetchedMB === 0
            ? `Actively streaming model weights from CDN (Shard 1/8, ~65 MB initial block)...`
            : `Downloading shard ${this.currentProgress.currentShard || 1}/${TOTAL_SHARDS} (${displayMB.toFixed(1)} MB / ${TOTAL_WEIGHTS_MB} MB)`
        };

        if (onProgress) onProgress(this.currentProgress);
      }
    }, 1000);

    try {
      const webllm: any = await import('@mlc-ai/web-llm');

      const timeoutPromise = new Promise<never>((_, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`Model download timed out after ${LOAD_TIMEOUT_MS / 1000}s. Check connection and retry.`));
        }, LOAD_TIMEOUT_MS);
        this.abortController?.signal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new Error('Model loading aborted by user.'));
        });
      });

      const enginePromise = webllm.CreateMLCEngine(this.selectedModel, {
        initProgressCallback: (report: any) => {
          const rawText = report.text || '';
          const rawProgress = report.progress || 0;
          const elapsed = Math.max(1, Math.round((Date.now() - this.loadStartTime) / 1000));

          let stage: WebLLMStage = 'downloading_weights';
          let stageNumber = 3;
          let stageName = '3. Download';
          let progressPercent = Math.min(99, Math.round(rawProgress * 100));
          let currentShard = 1;
          let text = rawText;

          // Parse TVM tensor cache progress (handles both "Fetching param cache[k/N]" and "Loading model from cache[k/N]")
          const shardMatch = rawText.match(/cache\[(\d+)\/(\d+)\]:\s*([\d.]+)MB/i);
          if (shardMatch) {
            currentShard = parseInt(shardMatch[1], 10);
            const confirmedMB = parseFloat(shardMatch[3]);
            this.actualFetchedMB = confirmedMB;
            stage = 'downloading_weights';
            stageNumber = 3;
            stageName = '3. Download';
            text = `Downloaded shard ${currentShard}/${TOTAL_SHARDS} (${confirmedMB.toFixed(1)} MB / ${TOTAL_WEIGHTS_MB} MB)`;
          } else if (rawText.includes('fetch params') || rawText.includes('Start to fetch params')) {
            stage = 'downloading_weights';
            stageNumber = 3;
            stageName = '3. Download';
            progressPercent = Math.max(progressPercent, 15);
            text = `Actively streaming model weights from CDN (Shard 1/${TOTAL_SHARDS}, ~65 MB initial block)...`;
          } else if (
            rawText.includes('Loading GPU model') ||
            rawText.includes('Compiling shaders') ||
            rawText.includes('wasm') ||
            rawText.includes('asyncLoadWebGPUPipelines') ||
            rawProgress >= 0.95
          ) {
            stage = 'compiling_engine';
            stageNumber = 4;
            stageName = '4. Engine';
            progressPercent = Math.max(progressPercent, 94);
            text = 'Compiling WebGPU pipelines and shaders for local hardware execution...';
          } else if (rawText.includes('All initialization finished') || rawProgress === 1) {
            stage = 'ready';
            stageNumber = 5;
            stageName = '5. Ready';
            progressPercent = 100;
            this.actualFetchedMB = TOTAL_WEIGHTS_MB;
            text = 'Local WebLLM engine ready.';
          }

          notify({
            stage,
            stageNumber,
            stageName,
            progressPercent,
            fetchedMB: Math.max(this.actualFetchedMB, this.simulatedFetchedMB),
            totalMB: TOTAL_WEIGHTS_MB,
            currentShard,
            totalShards: TOTAL_SHARDS,
            elapsedSec: elapsed,
            text
          });
        }
      });

      this.engine = await Promise.race([enginePromise, timeoutPromise]);

      this.cleanupTimer();
      this.isLoaded = true;
      this.isLoading = false;
      this.isCached = true;

      const finalProg: WebLLMProgress = {
        stage: 'ready',
        stageNumber: 5,
        stageName: '5. Ready',
        progressPercent: 100,
        fetchedMB: TOTAL_WEIGHTS_MB,
        totalMB: TOTAL_WEIGHTS_MB,
        currentShard: TOTAL_SHARDS,
        totalShards: TOTAL_SHARDS,
        elapsedSec: Math.round((Date.now() - this.loadStartTime) / 1000),
        text: `Qwen2.5-0.5B initialized successfully in browser.`
      };
      notify(finalProg);
      return true;
    } catch (err: any) {
      this.cleanupTimer();
      this.isLoading = false;
      this.isLoaded = false;
      this.engine = null;

      let diagnosed = err.message || 'Unknown WebGPU model download failure.';
      if (diagnosed.includes('Failed to fetch') || diagnosed.includes('NetworkError') || diagnosed.includes('Load failed')) {
        diagnosed = 'Network connection interrupted while downloading model weights from CDN.';
      } else if (diagnosed.includes('device lost') || diagnosed.includes('ContextLost')) {
        diagnosed = 'WebGPU device context was lost or VRAM allocation exceeded.';
      } else if (diagnosed.includes('shader-f16')) {
        diagnosed = 'Hardware lacks 16-bit float shader support. Automatic fallback configured.';
      } else if (diagnosed.includes('quota') || diagnosed.includes('QuotaExceededError')) {
        diagnosed = 'Browser storage quota exceeded. Please clear cache and retry.';
      }

      this.loadError = diagnosed;

      notify({
        stage: 'error',
        stageNumber: this.currentProgress?.stageNumber || 3,
        stageName: 'Error',
        progressPercent: this.currentProgress?.progressPercent || 0,
        fetchedMB: this.currentProgress?.fetchedMB || 0,
        totalMB: TOTAL_WEIGHTS_MB,
        elapsedSec: Math.round((Date.now() - this.loadStartTime) / 1000),
        text: diagnosed,
        error: diagnosed
      });

      return false;
    }
  }

  public async generate(context: AirAwareContext, userPrompt: string): Promise<AIResponse> {
    if (!this.isLoaded || !this.engine) {
      throw new Error('WebLLM local engine is not loaded');
    }

    const start = Date.now();

    const systemPrompt = `You are AirAware AI, an environmental intelligence assistant.
Provide concise, personalized, health-protective air-quality advice for India.
Environmental Context:
- Location: ${context.airQuality.location}
- Verified AQI: ${context.airQuality.aqi || 'N/A'} (${context.airQuality.aqiCategory || 'N/A'})
- Prominent Pollutant: ${context.airQuality.prominentPollutant || 'PM2.5'}
- Data Source: ${context.airQuality.provider} (${context.airQuality.dataType === 'station_observation' ? 'Station Observation' : 'Atmospheric Model'})
Household Profile:
- Vulnerable Members: ${context.profile.hasChildren ? 'Children' : ''} ${context.profile.hasElderly ? 'Elderly' : ''} ${context.profile.hasRespiratorySensitive ? 'Respiratory Sensitive' : ''}
- Commute: ${context.profile.commuteType} (${context.profile.commuteDistanceKm} km)
Directives:
1. Ground advice strictly in the provided AQI and profile.
2. Never hallucinate fake sensor data or give medical diagnosis.
3. Be direct, actionable, and empathetic.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const reply = await this.engine.chat.completions.create({
      messages,
      temperature: 0.25,
      max_tokens: 350
    });

    const content = reply.choices[0]?.message?.content || 'No response generated.';

    return {
      content,
      provider: 'webllm',
      modelName: `Local WebLLM (${this.selectedModel})`,
      latencyMs: Date.now() - start,
      isFallback: false
    };
  }
}

export const webLLMService = new WebLLMService();
