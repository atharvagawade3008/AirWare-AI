import { AirAwareContext, AIResponse, ChatTurn } from '../../types/ai.ts';
import { DailyGuidanceSummary, ExposurePlannerSlot } from '../../types/recommendation.ts';
import { runDeterministicAI } from './deterministic-provider.ts';
import { AIServiceError, askGemini } from './gemini-provider.ts';
import { buildGeminiContext } from './context-builder.ts';

export interface AirAwareAskOptions {
  guidanceSummary?: DailyGuidanceSummary;
  planner?: ExposurePlannerSlot[];
}

function fallbackNotice(error: AIServiceError): string {
  switch (error.kind) {
    case 'quota':
      return 'Gemini usage limit reached — showing verified CPCB guidance. You can retry later.';
    case 'rate_limited':
      return 'Too many AI requests just now — showing verified CPCB guidance. Retry in a few seconds.';
    case 'timeout':
      return 'The AI request timed out — showing verified CPCB guidance. You can retry.';
    case 'network':
      return 'Could not reach Cloud AI — showing verified CPCB guidance. You can retry.';
    case 'config':
      return 'Cloud AI is not available right now — showing verified CPCB guidance. You can retry.';
    case 'invalid':
      return 'That question could not be processed — showing verified CPCB guidance instead.';
    default:
      return 'Cloud AI is temporarily unavailable — showing verified CPCB guidance. You can retry.';
  }
}

export async function askAirAwareAI(
  context: AirAwareContext,
  userPrompt: string,
  history: ChatTurn[] = [],
  options: AirAwareAskOptions = {}
): Promise<AIResponse> {
  try {
    return await askGemini({
      message: userPrompt,
      history: history.slice(-6),
      context: buildGeminiContext(context, options.guidanceSummary, options.planner)
    });
  } catch (error: any) {
    const serviceError = error instanceof AIServiceError ? error : null;

    if (!serviceError) {
      console.warn('Unexpected AI failure; using deterministic engine.');
    }

    const deterministic = runDeterministicAI(context, userPrompt);
    return {
      ...deterministic,
      isFallback: true,
      provider: 'deterministic',
      confidenceNote: serviceError ? fallbackNotice(serviceError) : fallbackNotice(new AIServiceError('', 'unavailable', 0, true)),
      errorKind: serviceError?.kind || 'unavailable',
      retryable: serviceError ? serviceError.retryable : true
    };
  }
}
