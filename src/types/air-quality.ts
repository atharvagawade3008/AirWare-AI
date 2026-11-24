export type PollutantType = 'pm25' | 'pm10' | 'no2' | 'so2' | 'co' | 'o3';

export type AQICategory = 
  | 'Good'
  | 'Satisfactory'
  | 'Moderately Polluted'
  | 'Poor'
  | 'Very Poor'
  | 'Severe'
  | 'Unknown';

export type DataFreshness = 'fresh' | 'delayed' | 'stale' | 'unavailable';

export interface PollutantReading {
  code: PollutantType;
  name: string;
  chemicalFormula: string;
  value: number; // raw value
  unit: string;  // e.g. µg/m³ or mg/m³
  subIndex?: number; // CPCB Sub-index calculated
  category?: AQICategory;
  averagingPeriodHours?: number;
  available: boolean;
}

export interface AirQualityContext {
  location: string;
  state?: string;
  country: string;
  latitude: number;
  longitude: number;
  provider: 'CPCB NAQI' | 'Open-Meteo Telemetry' | 'OpenAQ' | 'Simulated Test Fixture';
  aqi?: number;
  aqiCategory?: AQICategory;
  prominentPollutant?: string;
  pollutants: PollutantReading[];
  stationName?: string;
  stationDistanceKm?: number;
  lastUpdated?: string;
  freshness: DataFreshness;
  freshnessExplanation?: string;
  isCalculatedNAQI?: boolean; // true if derived using official CPCB mathematical breakpoints
}

export interface HourlyForecastPoint {
  time: string;
  pm25: number;
  pm10: number;
  estimatedAQI?: number;
}
