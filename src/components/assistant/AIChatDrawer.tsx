import React, { useState, useEffect, useRef } from 'react';
import { AirAwareContext, ChatMessage, AIProviderMode } from '../../types/ai.ts';
import { askAirAwareAI } from '../../services/ai/ai-orchestrator.ts';
import { webLLMService, WebLLMProgress } from '../../services/ai/webllm-provider.ts';
import { X, Send, Bot, Sparkles, Cpu, Cloud, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  context: AirAwareContext;
}

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleInitWebLLM = async () => {
    setWebllmProgress({ progress: 0, text: 'Requesting WebGPU device...' });
    const success = await webLLMService.loadModel((prog) => {
      setWebllmProgress(prog);
    });
    setWebllmStatus(webLLMService.getStatus());
    if (success) {
      setProviderMode('webllm');
    }
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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-lg h-full flex flex-col shadow-2xl border-l border-slate-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
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
        <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
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
          <span className="text-[10px] text-slate-400 font-mono">
            {context.airQuality.location} AQI {context.airQuality.aqi || 'N/A'}
          </span>
        </div>

        {/* WebLLM WebGPU download alert if selected & not loaded */}
        {providerMode === 'webllm' && !webllmStatus.isLoaded && (
          <div className="p-3 bg-forest-50 border-b border-forest-200 text-xs">
            {webllmStatus.isSupported ? (
              <div>
                <div className="font-semibold text-forest-900">WebGPU Detected on Device</div>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  Download lightweight local model (Qwen 0.5B, ~300MB) for private in-browser inference.
                </p>
                {webllmProgress ? (
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] text-forest-800 font-mono mb-1">
                      <span>{webllmProgress.text}</span>
                      <span>{webllmProgress.progress}%</span>
                    </div>
                    <div className="w-full bg-forest-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-forest-700 h-full transition-all" style={{ width: `${webllmProgress.progress}%` }} />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleInitWebLLM}
                    className="mt-2 px-3 py-1 bg-forest-900 text-white font-semibold rounded-lg text-xs"
                  >
                    Download & Initialize Local Model
                  </button>
                )}
              </div>
            ) : (
              <div className="text-amber-800">
                <strong>WebGPU Not Supported:</strong> Your browser or GPU does not expose WebGPU. Automatically using the high-precision Deterministic CPCB Engine.
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
                      • {m.provider === 'webllm' ? 'Local WebLLM' : m.provider === 'gemini' ? 'Gemini 1.5' : 'Deterministic CPCB'}
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
