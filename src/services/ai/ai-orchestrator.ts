import { AirAwareContext, AIResponse } from '../../types/ai.ts';
import { runDeterministicAI } from './deterministic-provider.ts';

export async function askAirAwareAI(
  context: AirAwareContext,
  userPrompt: string
): Promise<AIResponse> {
  // AirAware AI answers exclusively through the deterministic CPCB rule engine:
  // instant, zero-cost, private, and free of fabricated telemetry or GPU requirements.
  return runDeterministicAI(context, userPrompt);
}
