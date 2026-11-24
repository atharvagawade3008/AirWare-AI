import { AirAwareContext, AIResponse } from '../../types/ai.ts';

export interface WebLLMProgress {
  progress: number;
  text: string;
}

class WebLLMService {
  private engine: any = null;
  private isLoading = false;
  private isLoaded = false;
  private loadError: string | null = null;
  private modelName = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';

  public isWebGPUSupported(): boolean {
    return typeof navigator !== 'undefined' && 'gpu' in navigator;
  }

  public getStatus() {
    return {
      isLoaded: this.isLoaded,
      isLoading: this.isLoading,
      loadError: this.loadError,
      isSupported: this.isWebGPUSupported(),
      modelName: this.modelName
    };
  }

  public async loadModel(onProgress?: (progress: WebLLMProgress) => void): Promise<boolean> {
    if (this.isLoaded) return true;
    if (this.isLoading) return false;

    if (!this.isWebGPUSupported()) {
      this.loadError = 'WebGPU is not supported in this browser. Local browser AI cannot be initialized.';
      return false;
    }

    this.isLoading = true;
    this.loadError = null;

    try {
      // Dynamic import to prevent bundle bloat and ensure fast initial page load
      const webllm: any = await import('@mlc-ai/web-llm');
      
      this.engine = await webllm.CreateMLCEngine(this.modelName, {
        initProgressCallback: (report: any) => {
          if (onProgress) {
            onProgress({
              progress: Math.round((report.progress || 0) * 100),
              text: report.text || 'Loading weights...'
            });
          }
        }
      });

      this.isLoaded = true;
      this.isLoading = false;
      return true;
    } catch (err: any) {
      console.warn('WebLLM initialization failed:', err);
      this.isLoading = false;
      this.loadError = err.message || 'Failed to download or initialize WebGPU model.';
      return false;
    }
  }

  public async generate(context: AirAwareContext, userPrompt: string): Promise<AIResponse> {
    if (!this.isLoaded || !this.engine) {
      throw new Error('WebLLM is not loaded');
    }

    const start = Date.now();

    const systemPrompt = `You are AirAware AI. Provide concise, personalized air-quality advice.
Context:
- Location: ${context.airQuality.location}
- Verified AQI: ${context.airQuality.aqi || 'N/A'} (${context.airQuality.aqiCategory || 'N/A'})
- Prominent Pollutant: ${context.airQuality.prominentPollutant || 'PM2.5'}
- Children: ${context.profile.hasChildren ? 'Yes' : 'No'}
- Elderly: ${context.profile.hasElderly ? 'Yes' : 'No'}
- Commute: ${context.profile.commuteType}
Never hallucinate fake readings. Never make medical diagnosis.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const reply = await this.engine.chat.completions.create({
      messages,
      temperature: 0.3,
      max_tokens: 350
    });

    const content = reply.choices[0]?.message?.content || 'No response generated.';

    return {
      content,
      provider: 'webllm',
      modelName: `Local WebLLM (${this.modelName})`,
      latencyMs: Date.now() - start,
      isFallback: false
    };
  }
}

export const webLLMService = new WebLLMService();
