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

export type EnvironmentalDataType = 
  | 'modelled_estimate'      // Atmospheric model forecast (CAMS / Open-Meteo)
  | 'station_observation'   // Physical ground station (CPCB / CAAQMS / OpenAQ)
  | 'simulated_fixture';     // Evaluator demonstration test fixture

export type IndexClassification = 
  | 'official_cpcb_naqi'     // Official ground station NAQI per CPCB criteria
  | 'indicative_model_index' // Indicative derived index applying CPCB breakpoints to atmospheric model
  | 'insufficient_data';     // Failed CPCB validity (fewer than 3 pollutants or missing PM)

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
  isModelled?: boolean;
}

export interface AirQualityContext {
  location: string;
  state?: string;
  country: string;
  latitude: number;
  longitude: number;
  provider: 'CPCB CAAQMS Network' | 'CAMS Atmospheric Model (Open-Meteo)' | 'OpenAQ Network' | 'Simulated Test Fixture';
  dataType: EnvironmentalDataType;
  indexClassification: IndexClassification;
  aqi?: number;
  aqiCategory?: AQICategory;
  prominentPollutant?: string;
  pollutants: PollutantReading[];
  
  // Physical Station Metadata (ONLY for physical ground stations)
  stationName?: string;
  stationDistanceKm?: number;
  
  // Atmospheric Model Metadata (for Open-Meteo / CAMS)
  modelName?: string;
  gridCoordinates?: { latitude: number; longitude: number };
  gridResolutionKm?: number;
  spatialResolutionNote?: string;

  lastUpdated?: string;
  freshness: DataFreshness;
  freshnessExplanation?: string;
  scientificDisclaimer: string;
  isCalculatedNAQI?: boolean;
}

export interface HourlyForecastPoint {
  time: string;
  pm25: number;
  pm10: number;
  estimatedAQI?: number;
}
