import React, { useState, useEffect, useRef } from 'react';
import { AirAwareContext, ChatMessage, ChatTurn } from '../../types/ai.ts';
import { askAirAwareAI, AirAwareAskOptions } from '../../services/ai/ai-orchestrator.ts';
import { DailyGuidanceSummary, ExposurePlannerSlot } from '../../types/recommendation.ts';
import { X, Send, Bot, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  context: AirAwareContext;
  guidanceSummary?: DailyGuidanceSummary;
  planner?: ExposurePlannerSlot[];
}

interface Notice {
  text: string;
  retryable: boolean;
}

const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const buildWelcome = (ctx: AirAwareContext) =>
  'Hello! I am **AirAware AI**, your environmental intelligence assistant for **' + ctx.airQuality.location + '**.\n\n' +
  'Current verified AQI is **' + (ctx.airQuality.aqi || 'Unavailable') + ' (' + (ctx.airQuality.aqiCategory || 'Unknown') + ')**, ' +
  'with telemetry from ' + ctx.airQuality.provider + '.\n\nHow can I help your family make safer decisions today?';

export const AIChatDrawer: React.FC<Props> = ({ isOpen, onClose, context, guidanceSummary, planner }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: buildWelcome(context),
      timestamp: now(),
      provider: 'deterministic'
    }
  ]);
  // Keep the welcome bubble aligned with the latest telemetry once it arrives.
  useEffect(() => {
    const content = buildWelcome(context);
    setMessages((prev) =>
      prev.some((m) => m.id === 'welcome' && m.content !== content)
        ? prev.map((m) => (m.id === 'welcome' ? { ...m, content } : m))
        : prev
    );
  }, [context.airQuality.location, context.airQuality.aqi, context.airQuality.aqiCategory, context.airQuality.provider]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending, notice]);

  if (!isOpen) return null;

  const buildHistory = (list: ChatMessage[]): ChatTurn[] =>
    list
      .filter((m) => m.id !== 'welcome' && !m.id.startsWith('err-'))
      .slice(-6)
      .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim().slice(0, 1500);
    if (!text || isSending) return;

    const history = buildHistory(messages);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: now(),
      provider: 'deterministic'
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setNotice(null);
    setPendingPrompt(text);
    setIsSending(true);

    const options: AirAwareAskOptions = { guidanceSummary, planner };

    try {
      const response = await askAirAwareAI(context, text, history, options);
      const aiMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: now(),
        provider: response.provider,
        isFallback: response.isFallback
      };
      setMessages((prev) => [...prev, aiMsg]);

      if (response.isFallback) {
        setNotice({
          text: response.confidenceNote || 'Cloud AI is unavailable — this answer comes from the verified CPCB rule engine.',
          retryable: response.retryable !== false
        });
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `That request could not be completed: ${err.message} The environmental dashboard and verified CPCB guidance remain fully available.`,
        timestamp: now(),
        provider: 'deterministic',
        isFallback: true
      };
      setMessages((prev) => [...prev, errorMsg]);
      setNotice({ text: err.message || 'The AI request failed. Please retry.', retryable: true });
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
      <div
        id="tour-assistant"
        className="bg-white dark:bg-slate-900 w-full max-w-lg h-full flex flex-col shadow-2xl border-l border-slate-200 dark:border-slate-800"
      >
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-forest-900 text-emerald-400 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">AirAware AI Assistant</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Live telemetry context • Deterministic CPCB Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close AI assistant"
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Engine Status Bar */}
        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-medium text-forest-900 dark:text-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Deterministic CPCB Engine</span>
            <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.2 rounded-full font-bold">Always On</span>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
            {context.airQuality.location} AQI {context.airQuality.aqi || 'N/A'}
          </span>
        </div>

        {/* Fallback / Error Notice */}
        {notice && (
          <div className="px-3.5 py-2.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-300 shrink-0 mt-0.5" />
            <div className="flex-1 leading-snug">
              {notice.text}
              {notice.retryable && pendingPrompt && (
                <button
                  onClick={() => handleSend(pendingPrompt)}
                  disabled={isSending}
                  className="ml-2 inline-flex items-center gap-1 font-semibold text-amber-900 dark:text-amber-100 underline disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isSending ? 'animate-spin' : ''}`} /> Retry
                </button>
              )}
            </div>
            <button
              onClick={() => setNotice(null)}
              aria-label="Dismiss notice"
              className="text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
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
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-700'
                }`}>
                  <div className="whitespace-pre-line">{m.content}</div>
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-1 flex items-center gap-1.5 font-mono">
                  <span>{m.timestamp}</span>
                  {!isUser && (
                    <span className="text-forest-700 dark:text-emerald-300 font-sans">
                      • {m.provider === 'deterministic' ? 'Verified CPCB engine' : m.isFallback ? 'Verified CPCB engine (fallback)' : 'Verified CPCB engine'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {isSending && (
            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 italic">
              <Bot className="w-4 h-4 animate-spin text-emerald-600" />
              <span>AirAware AI is reading your live telemetry...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Sample Prompt Chips */}
        <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex gap-2 overflow-x-auto no-scrollbar">
          {sampleQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              disabled={isSending}
              className="text-[11px] whitespace-nowrap bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-forest-500 dark:hover:border-emerald-600 text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
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
              maxLength={1500}
              aria-label="Ask AirAware AI a question"
              className="flex-1 px-3.5 py-2.5 text-xs border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500 bg-white dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isSending}
              aria-label="Send message"
              className="p-2.5 bg-forest-900 text-white rounded-xl hover:bg-forest-800 disabled:opacity-40 transition-all shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500 text-center">
            Answers are grounded in your current telemetry. AirAware AI never invents readings or gives medical diagnosis.
          </div>
        </div>

      </div>
    </div>
  );
};
