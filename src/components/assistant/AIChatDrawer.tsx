import React, { useState, useEffect, useRef } from 'react';
import { AirAwareContext, ChatMessage, AIProviderMode, WebLLMProgress, WebLLMStage } from '../../types/ai.ts';
import { askAirAwareAI } from '../../services/ai/ai-orchestrator.ts';
import { webLLMService } from '../../services/ai/webllm-provider.ts';
import { 
  X, Send, Bot, Sparkles, Cpu, Cloud, ShieldAlert, CheckCircle2, 
  AlertCircle, RefreshCw, Trash2, StopCircle, ArrowRight
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  context: AirAwareContext;
}

const STAGES: Array<{ id: WebLLMStage; step: number; label: string }> = [
  { id: 'checking_gpu', step: 1, label: '1. GPU Check' },
  { id: 'preparing_model', step: 2, label: '2. Prepare' },
  { id: 'downloading_weights', step: 3, label: '3. Download' },
  { id: 'compiling_engine', step: 4, label: '4. Engine' },
  { id: 'ready', step: 5, label: '5. Ready' }
];

export const AIChatDrawer: React.FC<Props> = ({ isOpen, onClose, context }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am **AirAware AI**, your environmental intelligence assistant for **${context.airQuality.location}**.\n\nCurrent verified AQI is **${context.airQuality.aqi || 'Unavailable'} (${context.airQuality.aqiCategory || 'Unknown'})**, with telemetry from ${context.airQuality.provider}.\n\nHow can I help your family make safer decisions today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      provider: 'deterministic'
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [providerMode, setProviderMode] = useState<AIProviderMode>('deterministic');
  const [webllmProgress, setWebllmProgress] = useState<WebLLMProgress | null>(null);
  const [webllmStatus, setWebllmStatus] = useState(webLLMService.getStatus());
  const [isClearingCache, setIsClearingCache] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setWebllmStatus(webLLMService.getStatus());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInitWebLLM = async () => {
    webLLMService.reset();
    setWebllmProgress({
      stage: 'checking_gpu',
      stageNumber: 1,
      stageName: '1. Checking GPU',
      progressPercent: 5,
      fetchedMB: 0,
      totalMB: 265.1,
      elapsedSec: 0,
      text: 'Querying WebGPU device and checking shader capabilities...'
    });

    const success = await webLLMService.loadModel((prog) => {
      setWebllmProgress(prog);
      setWebllmStatus(webLLMService.getStatus());
    });

    setWebllmStatus(webLLMService.getStatus());
    if (success) {
      setProviderMode('webllm');
    }
  };

  const handleClearCacheAndRetry = async () => {
    setIsClearingCache(true);
    await webLLMService.clearCache();
    setIsClearingCache(false);
    handleInitWebLLM();
  };

  const handleCancelLoading = () => {
    webLLMService.cancelLoading();
    setWebllmStatus(webLLMService.getStatus());
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isSending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      provider: providerMode
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsSending(true);

    try {
      const response = await askAirAwareAI(context, text, providerMode);
      const aiMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider: response.provider
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Error processing request: ${err.message}. Reverting to deterministic guidance.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider: 'deterministic'
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const sampleQuestions = [
    'Is it safe for my children to play outside today?',
    'Should I open my windows right now?',
    'How can I improve air inside my bedroom?',
    'I commute by two-wheeler. What should I change?'
  ];

  const currentStep = webllmProgress ? webllmProgress.stageNumber : 0;
  const isError = webllmProgress?.stage === 'error' || Boolean(webllmStatus.loadError);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-lg h-full flex flex-col shadow-2xl border-l border-slate-200">
        
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-forest-900 text-emerald-400 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">AirAware AI Assistant</h3>
              <p className="text-[11px] text-slate-500">Hybrid AI • Real Telemetry Context</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Provider Switcher Bar */}
        <div className="px-3 sm:px-4 py-2 bg-slate-100 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 text-xs">
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setProviderMode('deterministic')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                providerMode === 'deterministic' ? 'bg-white text-forest-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Deterministic CPCB
            </button>
            <button
              onClick={() => setProviderMode('webllm')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                providerMode === 'webllm' ? 'bg-white text-forest-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              WebLLM (WebGPU)
            </button>
            <button
              onClick={() => setProviderMode('gemini')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                providerMode === 'gemini' ? 'bg-white text-forest-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gemini Cloud
            </button>
          </div>
          <span className="hidden sm:block text-[10px] text-slate-400 font-mono">
            {context.airQuality.location} AQI {context.airQuality.aqi || 'N/A'}
          </span>
        </div>

        {/* WebLLM WebGPU Panel (Active when WebLLM mode is selected) */}
        {providerMode === 'webllm' && (
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 text-xs">
            {webllmStatus.isSupported ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                    <Cpu className="w-4 h-4 text-emerald-600" />
                    <span>Qwen2.5-0.5B Browser Inference</span>
                  </div>
                  {webllmStatus.isLoaded && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ready & Offline
                    </span>
                  )}
                </div>

                {/* 5-Stage Stepper Indicator */}
                <div className="grid grid-cols-5 gap-1 my-2">
                  {STAGES.map((s) => {
                    const isDone = webllmStatus.isLoaded || (currentStep > s.step && !isError);
                    const isCurrent = currentStep === s.step && !webllmStatus.isLoaded && !isError;
                    return (
                      <div
                        key={s.id}
                        className={`text-center py-1 px-0.5 rounded text-[10px] font-medium border transition-colors ${
                          isDone
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : isCurrent
                            ? 'bg-forest-100 border-forest-500 text-forest-900 font-bold animate-pulse'
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}
                      >
                        {s.label}
                      </div>
                    );
                  })}
                </div>

                {/* Active Loading / Progress State */}
                {webllmStatus.isLoading && webllmProgress && !isError && (
                  <div className="mt-2.5 p-2.5 bg-white rounded-lg border border-slate-200 shadow-xs">
                    <div className="flex justify-between items-center text-[11px] text-slate-700 mb-1.5">
                      <span className="font-medium text-forest-900">{webllmProgress.text}</span>
                      <span className="font-mono font-bold text-forest-800">{webllmProgress.progressPercent}%</span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2">
                      <div
                        className="bg-forest-700 h-full transition-all duration-300"
                        style={{ width: `${Math.max(5, webllmProgress.progressPercent)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>
                        {webllmProgress.fetchedMB > 0 
                          ? `${webllmProgress.fetchedMB.toFixed(1)} MB / ${webllmProgress.totalMB.toFixed(1)} MB`
                          : `Total weights: ~${webllmProgress.totalMB.toFixed(1)} MB`}
                        {webllmProgress.currentShard && ` • Shard ${webllmProgress.currentShard}/${webllmProgress.totalShards || 8}`}
                      </span>
                      <div className="flex items-center gap-2">
                        <span>{webllmProgress.elapsedSec}s elapsed</span>
                        <button
                          onClick={handleCancelLoading}
                          className="text-rose-600 hover:text-rose-800 font-sans flex items-center gap-0.5"
                          title="Cancel loading"
                        >
                          <StopCircle className="w-3 h-3" /> Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Banner with Retry & Clear Cache Options */}
                {isError && (
                  <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-900">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-semibold text-[11px]">Model Download Failed</div>
                        <p className="text-[11px] text-rose-700 mt-0.5 leading-tight">
                          {webllmProgress?.error || webllmStatus.loadError || 'Network or WebGPU error during initialization.'}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <button
                            onClick={handleInitWebLLM}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-medium transition-colors"
                          >
                            <RefreshCw className="w-3 h-3" /> Retry Download
                          </button>
                          <button
                            onClick={handleClearCacheAndRetry}
                            disabled={isClearingCache}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 rounded text-[11px] font-medium transition-colors"
                          >
                            <Trash2 className="w-3 h-3" /> Clear Cache & Retry
                          </button>
                          <button
                            onClick={() => setProviderMode('deterministic')}
                            className="text-[11px] text-slate-600 hover:text-slate-900 underline font-medium ml-1"
                          >
                            Use Deterministic Engine
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Initial Download Action (When not loaded, not loading, and no active error) */}
                {!webllmStatus.isLoaded && !webllmStatus.isLoading && !isError && (
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-slate-600 text-[11px]">
                      Download weights (~265 MB) once. Future sessions load instantly from offline cache.
                    </p>
                    <button
                      onClick={handleInitWebLLM}
                      className="shrink-0 px-3 py-1.5 bg-forest-900 hover:bg-forest-800 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs"
                    >
                      Download & Initialize
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                <div className="font-semibold flex items-center gap-1 text-[11px]">
                  <AlertCircle className="w-3.5 h-3.5" /> WebGPU Not Available
                </div>
                <p className="text-[11px] mt-0.5 text-amber-700">
                  Your current browser or GPU does not expose WebGPU hardware acceleration.
                  AirAware AI automatically runs on our verified, zero-latency <strong>Deterministic CPCB Engine</strong>.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Chat Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div key={m.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  isUser 
                    ? 'bg-forest-900 text-white rounded-br-none' 
                    : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
                }`}>
                  <div className="whitespace-pre-line">{m.content}</div>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 px-1 flex items-center gap-1.5 font-mono">
                  <span>{m.timestamp}</span>
                  {!isUser && (
                    <span className="text-forest-700 font-sans">
                      • {m.provider === 'webllm' ? 'Local WebLLM (Qwen)' : m.provider === 'gemini' ? 'Gemini Cloud' : 'Deterministic CPCB'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {isSending && (
            <div className="flex items-center gap-2 text-xs text-slate-400 italic">
              <Bot className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Analyzing environmental telemetry & household profile...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Sample Prompt Chips */}
        <div className="p-2 border-t border-slate-100 bg-slate-50 flex gap-2 overflow-x-auto no-scrollbar">
          {sampleQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              className="text-[11px] whitespace-nowrap bg-white border border-slate-200 hover:border-forest-500 text-slate-700 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 bg-white">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={`Ask AirAware AI about ${context.airQuality.location}...`}
              className="flex-1 px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isSending}
              className="p-2.5 bg-forest-900 text-white rounded-xl hover:bg-forest-800 disabled:opacity-40 transition-all shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-1.5 text-[10px] text-slate-400 text-center">
            AirAware AI strictly interprets environmental context without fabricating telemetry or giving medical diagnosis.
          </div>
        </div>

      </div>
    </div>
  );
};
