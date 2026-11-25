import { AirQualityContext } from './air-quality.ts';
import { HouseholdProfile } from './profile.ts';
import { WeatherContext } from './weather.ts';

export type AIProviderMode = 'webllm' | 'deterministic';

export type AIErrorKind =
  | 'quota'
  | 'rate_limited'
  | 'unavailable'
  | 'config'
  | 'timeout'
  | 'network'
  | 'invalid';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface GeminiPollutant {
  name: string;
  value: number;
  unit: string;
  subIndex?: number;
  available: boolean;
  modelled?: boolean;
}

/** Only the context Gemini needs. No names, no precise coordinates. */
export interface GeminiAirContext {
  location: string;
  region?: string;
  standard: string;
  aqi?: number;
  aqiCategory?: string;
  indexClassification: string;
  dataType: string;
  prominentPollutant?: string;
  pollutants: GeminiPollutant[];
  stationName?: string;
  stationDistanceKm?: number;
  lastUpdated?: string;
  freshness: string;
  freshnessExplanation?: string;
  weather?: {
    temperatureC: number;
    humidityPercent: number;
    windSpeedKmh: number;
    weatherDescription: string;
    ventilationIndex: string;
  };
  household: {
    householdSize: number;
    children: boolean;
    elderly: boolean;
    respiratorySensitive: boolean;
    hasAirPurifier: boolean;
    cookingFuel: string;
    commuteType: string;
    commuteDistanceKm: number;
    outdoorExerciseTime: string;
  };
  existingGuidance?: {
    headline: string;
    summary: string;
    topActions: string[];
    routine: string[];
  };
}

export interface GeminiChatRequest {
  message: string;
  history: ChatTurn[];
  context: GeminiAirContext;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  provider: AIProviderMode;
  isStreaming?: boolean;
  isFallback?: boolean;
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
  errorKind?: AIErrorKind;
  retryable?: boolean;
}
