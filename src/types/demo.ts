import { AirQualityContext } from './air-quality.ts';
import { HouseholdProfile } from './profile.ts';
import { WeatherContext } from './weather.ts';

export interface DemoScenario {
  id: string;
  name: string;
  badge: string;
  description: string;
  expectedOutcome: string;
  profile: HouseholdProfile;
  airQuality: AirQualityContext;
  weather: WeatherContext;
  forceApiError?: boolean;
  forceAiError?: boolean;
}
