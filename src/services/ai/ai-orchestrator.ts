import { AirAwareContext, AIProviderMode, AIResponse } from '../../types/ai.ts';
import { runDeterministicAI } from './deterministic-provider.ts';
import { webLLMService } from './webllm-provider.ts';

export async function askAirAwareAI(
  context: AirAwareContext,
  userPrompt: string,
  preferredProvider?: AIProviderMode
): Promise<AIResponse> {
  // Strategy:
  // 1. If user explicitly requests WebLLM and it is loaded, run in-browser WebLLM
  if (preferredProvider === 'webllm' && webLLMService.getStatus().isLoaded) {
    try {
      return await webLLMService.generate(context, userPrompt);
    } catch (e: any) {
      console.warn('WebLLM local inference failed, falling back to deterministic engine:', e.message);
    }
  }

  // 2. High-precision Deterministic CPCB Rule Engine (Instant, zero-cost, 100% verified, private)
  return runDeterministicAI(context, userPrompt);
}
