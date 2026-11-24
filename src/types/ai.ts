import { AirQualityContext } from './air-quality.ts';
import { HouseholdProfile } from './profile.ts';
import { WeatherContext } from './weather.ts';

export type AIProviderMode = 'webllm' | 'gemini' | 'deterministic';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  provider: AIProviderMode;
  isStreaming?: boolean;
}

export interface AirAwareContext {
  airQuality: AirQualityContext;
  weather?: WeatherContext;
  profile: HouseholdProfile;
  activeScreen?: string;
}

export interface AIResponse {
  content: string;
  provider: AIProviderMode;
  modelName: string;
  latencyMs: number;
  isFallback: boolean;
  confidenceNote?: string;
}
