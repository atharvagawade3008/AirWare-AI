import { AIErrorKind, AIResponse, GeminiChatRequest } from '../../types/ai.ts';

const CHAT_ENDPOINT = '/.netlify/functions/airaware-chat';
const CLIENT_TIMEOUT_MS = 25000;

export class AIServiceError extends Error {
  kind: AIErrorKind;
  status: number;
  retryable: boolean;

  constructor(message: string, kind: AIErrorKind, status: number, retryable: boolean) {
    super(message);
    this.name = 'AIServiceError';
    this.kind = kind;
    this.status = status;
    this.retryable = retryable;
  }
}

function mapFailure(status: number, code: unknown, serverMessage: unknown): AIServiceError {
  const safeMessage = typeof serverMessage === 'string' && serverMessage.length <= 300 ? serverMessage : '';

  if (code === 'rate_limited' || (status === 429 && code !== 'quota_exhausted')) {
    return new AIServiceError(
      safeMessage || 'You are asking very quickly. Please wait a few seconds and try again.',
      'rate_limited',
      status,
      true
    );
  }

  if (code === 'quota_exhausted' || status === 429) {
    return new AIServiceError(
      'AirAware AI has reached its current Gemini usage limit. Verified CPCB guidance is still available below.',
      'quota',
      status,
      true
    );
  }

  if (code === 'not_configured' || code === 'misconfigured' || status === 503) {
    return new AIServiceError(
      'Cloud AI is temporarily unavailable. Showing verified CPCB guidance instead.',
      'config',
      status,
      true
    );
  }

  if (code === 'timeout' || status === 504) {
    return new AIServiceError('The AI request timed out. Please try again.', 'timeout', status, true);
  }

  if (status === 400 || code === 'invalid_request') {
    return new AIServiceError(safeMessage || 'That request could not be processed. Please rephrase it.', 'invalid', status, false);
  }

  return new AIServiceError(
    'The AI service is temporarily unavailable. Verified CPCB guidance is still available below.',
    'unavailable',
    status,
    true
  );
}

export async function askGemini(request: GeminiChatRequest): Promise<AIResponse> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

  try {
    const res = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal
    });

    const payload = await res.json().catch(() => ({} as any));

    if (!res.ok) {
      throw mapFailure(res.status, (payload as any)?.code, (payload as any)?.error);
    }

    const reply = typeof (payload as any)?.reply === 'string' ? (payload as any).reply.trim() : '';
    if (!reply) {
      throw new AIServiceError('The AI service returned an empty answer. Please try again.', 'unavailable', 502, true);
    }

    return {
      content: reply,
      provider: 'gemini',
      modelName: typeof (payload as any)?.model === 'string' ? (payload as any).model : 'Gemini',
      latencyMs: Date.now() - started,
      isFallback: false
    };
  } catch (error: any) {
    if (error instanceof AIServiceError) throw error;

    if (error?.name === 'AbortError') {
      throw new AIServiceError('The AI request timed out. Please try again.', 'timeout', 504, true);
    }

    // A 404 here usually means the Netlify Function is not served in this environment
    // (plain `vite dev`), not that Google is down.
    throw new AIServiceError(
      'Could not reach the AirAware AI service. If you are running the app locally, start it with `netlify dev`.',
      'network',
      0,
      true
    );
  } finally {
    clearTimeout(timer);
  }
}
