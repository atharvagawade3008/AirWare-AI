import { AirAwareContext, AIProviderMode, AIResponse } from '../../types/ai.ts';
import { runDeterministicAI } from './deterministic-provider.ts';
import { runGeminiProxyAI } from './gemini-provider.ts';
import { webLLMService } from './webllm-provider.ts';

export async function askAirAwareAI(
  context: AirAwareContext,
  userPrompt: string,
  preferredProvider?: AIProviderMode
): Promise<AIResponse> {
  // Strategy:
  // 1. If user explicitly requests WebLLM and it is loaded, run WebLLM
  if (preferredProvider === 'webllm' && webLLMService.getStatus().isLoaded) {
    try {
      return await webLLMService.generate(context, userPrompt);
    } catch (e) {
      console.warn('WebLLM inference failed, falling back:', e);
    }
  }

  // 2. Try Gemini Cloud Function if preferred or default
  if (preferredProvider === 'gemini' || !preferredProvider) {
    try {
      return await runGeminiProxyAI(context, userPrompt);
    } catch (e: any) {
      console.info('Cloud AI unavailable (expected if no API key configured). Gracefully using Deterministic Engine:', e.message);
    }
  }

  // 3. Robust Deterministic Rule Engine fallback (Zero-cost, 100% reliable, zero hallucination)
  const deterministicResult = runDeterministicAI(context, userPrompt);
  if (preferredProvider === 'gemini') {
    deterministicResult.isFallback = true;
    deterministicResult.confidenceNote = 'Cloud AI key is unconfigured. Showing instant, deterministic CPCB-verified guidance.';
  }
  return deterministicResult;
}
