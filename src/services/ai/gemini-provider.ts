import { AIErrorKind, AIResponse, GeminiChatRequest } from '../../types/ai.ts';

// The chat route is served by api/airaware-chat.ts on Vercel and by
// netlify/functions/airaware-chat.ts on Netlify. Both call the same server code,
// so the first path that answers with JSON wins and one build works on either host.
const CHAT_ENDPOINTS = ['/api/airaware-chat', '/.netlify/functions/airaware-chat'];
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

interface ChatResult {
  status: number;
  payload: any;
}

/**
 * Posts to the first chat route that actually answers with JSON. A host that does
 * not serve a route replies with the SPA's HTML fallback, which is skipped here.
 */
async function postChat(request: GeminiChatRequest, signal: AbortSignal): Promise<ChatResult | null> {
  for (const endpoint of CHAT_ENDPOINTS) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) continue;

    const payload = await res.json().catch(() => null);
    if (!payload || typeof payload !== 'object') continue;

    return { status: res.status, payload };
  }

  return null;
}

export async function askGemini(request: GeminiChatRequest): Promise<AIResponse> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

  try {
    const result = await postChat(request, controller.signal);

    if (!result) {
      throw new AIServiceError(
        'Could not reach the AirAware AI service. If you are running the app locally, start it with `netlify dev`.',
        'network',
        0,
        true
      );
    }

    if (result.status < 200 || result.status >= 300) {
      throw mapFailure(result.status, result.payload.code, result.payload.error);
    }

    const reply = typeof result.payload.reply === 'string' ? result.payload.reply.trim() : '';
    if (!reply) {
      throw new AIServiceError('The AI service returned an empty answer. Please try again.', 'unavailable', 502, true);
    }

    return {
      content: reply,
      provider: 'gemini',
      modelName: typeof result.payload.model === 'string' ? result.payload.model : 'Gemini',
      latencyMs: Date.now() - started,
      isFallback: false
    };
  } catch (error: any) {
    if (error instanceof AIServiceError) throw error;

    if (error?.name === 'AbortError') {
      throw new AIServiceError('The AI request timed out. Please try again.', 'timeout', 504, true);
    }

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
