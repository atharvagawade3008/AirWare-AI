// AirAware AI — AI Orchestrator
// Routes chat requests to WebLLM (browser inference) or the deterministic
// CPCB engine. Gemini Cloud AI has been removed per design decision.

import { AirAwareContext, AIResponse, ChatTurn } from '../../types/ai.ts';
import { DailyGuidanceSummary, ExposurePlannerSlot } from '../../types/recommendation.ts';
import { runDeterministicAI } from './deterministic-provider.ts';

export interface AirAwareAskOptions {
  guidanceSummary?: DailyGuidanceSummary;
  planner?: ExposurePlannerSlot[];
}

/**
 * Ask the deterministic CPCB engine. Always succeeds.
 * WebLLM chat is handled directly in AIChatDrawer — it streams and updates
 * its own state via the WebLLM provider. This function covers any code path
 * that needs a synchronous, guaranteed response (e.g., fallback inside
 * WebLLM failure handlers).
 */
export async function askAirAwareAI(
  context: AirAwareContext,
  userPrompt: string,
  _history: ChatTurn[] = [],
  _options: AirAwareAskOptions = {}
): Promise<AIResponse> {
  try {
    return runDeterministicAI(context, userPrompt);
  } catch (err: any) {
    console.warn('[orchestrator] Deterministic engine error:', err?.message);
    return {
      content:
        'I was unable to generate a recommendation right now. Please check your location and profile settings.',
      provider: 'deterministic',
      modelName: 'CPCB Deterministic Engine',
      latencyMs: 0,
      isFallback: true,
      confidenceNote: 'Deterministic engine encountered an unexpected error.',
      retryable: true
    };
  }
}
