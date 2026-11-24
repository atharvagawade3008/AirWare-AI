import { AirQualityContext } from './air-quality.ts';
import { HouseholdProfile } from './profile.ts';
import { WeatherContext } from './weather.ts';

export type AIProviderMode = 'webllm' | 'deterministic';

export type WebLLMStage = 
  | 'checking_gpu' 
  | 'preparing_model' 
  | 'downloading_weights' 
  | 'compiling_engine' 
  | 'ready' 
  | 'error';

export interface WebLLMProgress {
  stage: WebLLMStage;
  stageNumber: number; // 1 to 5
  stageName: string;
  progressPercent: number; // 0 to 100
  fetchedMB: number;
  totalMB: number;
  currentShard?: number;
  totalShards?: number;
  elapsedSec: number;
  estimatedSpeedMBs?: number;
  text: string;
  error?: string;
}

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
