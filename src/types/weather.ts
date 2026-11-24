export interface WeatherContext {
  temperatureC: number;
  humidityPercent: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  weatherCode: number;
  weatherDescription: string;
  isStagnant: boolean; // Wind < 5 km/h causes pollutant trapping
  ventilationIndex: 'Poor' | 'Moderate' | 'Good';
  lastUpdated: string;
}
