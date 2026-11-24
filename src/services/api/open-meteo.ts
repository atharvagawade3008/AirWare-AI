import { AirQualityContext, DataFreshness, HourlyForecastPoint, PollutantReading } from '../../types/air-quality.ts';
import { WeatherContext } from '../../types/weather.ts';
import { calculateNAQI } from '../../intelligence/aqi/cpcb-calculator.ts';

function computeFreshness(dateIso: string): { freshness: DataFreshness; explanation: string } {
  try {
    const diffHours = (Date.now() - new Date(dateIso).getTime()) / (1000 * 60 * 60);
    if (diffHours < 2) {
      return { freshness: 'fresh', explanation: 'Atmospheric model run generated within the past 2 hours.' };
    } else if (diffHours < 6) {
      return { freshness: 'delayed', explanation: `Model update is ${Math.round(diffHours)} hours old.` };
    } else {
      return { freshness: 'stale', explanation: `Model output is older than ${Math.round(diffHours)} hours (stale data).` };
    }
  } catch {
    return { freshness: 'unavailable', explanation: 'Invalid timestamp from atmospheric model feed.' };
  }
}

function getWeatherDescription(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code === 1 || code === 2) return 'Mainly clear / partly cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Hazy fog / low inversion smog accumulation';
  if (code >= 51 && code <= 55) return 'Light drizzle';
  if (code >= 61 && code <= 65) return 'Rain showers (particulate washout)';
  if (code >= 80 && code <= 82) return 'Scattered showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Fair conditions';
}

export async function fetchLiveEnvironmentalData(
  latitude: number,
  longitude: number,
  cityName: string,
  stateName?: string
): Promise<{
  airQuality: AirQualityContext;
  weather: WeatherContext;
  hourlyTrends: HourlyForecastPoint[];
}> {
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m&timezone=Asia%2FKolkata`;
  const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&hourly=pm10,pm2_5&timezone=Asia%2FKolkata`;

  const [weatherRes, airRes] = await Promise.all([
    fetch(weatherUrl),
    fetch(airUrl)
  ]);

  if (!weatherRes.ok || !airRes.ok) {
    throw new Error(`Environmental API request failed: Weather ${weatherRes.status}, AirQuality ${airRes.status}`);
  }

  const [weatherData, airData] = await Promise.all([
    weatherRes.json(),
    airRes.json()
  ]);

  // Parse Weather Context
  const curWeather = weatherData.current;
  const windKmh = Number((curWeather.wind_speed_10m || 0).toFixed(1));
  const isStagnant = windKmh < 6.0;
  let ventilationIndex: 'Poor' | 'Moderate' | 'Good' = 'Good';
  if (isStagnant && curWeather.relative_humidity_2m > 65) {
    ventilationIndex = 'Poor';
  } else if (windKmh < 12.0) {
    ventilationIndex = 'Moderate';
  }

  const weather: WeatherContext = {
    temperatureC: Math.round(curWeather.temperature_2m),
    humidityPercent: Math.round(curWeather.relative_humidity_2m),
    windSpeedKmh: windKmh,
    windDirectionDeg: Math.round(curWeather.wind_direction_10m || 0),
    weatherCode: curWeather.weather_code,
    weatherDescription: getWeatherDescription(curWeather.weather_code),
    isStagnant,
    ventilationIndex,
    lastUpdated: curWeather.time || new Date().toISOString()
  };

  // Parse Air Quality Context
  const curAir = airData.current;
  const rawPollutants: PollutantReading[] = [
    {
      code: 'pm25',
      name: 'PM2.5 (Fine Particulate)',
      chemicalFormula: 'PM₂.₅',
      value: curAir.pm2_5 !== undefined && curAir.pm2_5 !== null ? Number(curAir.pm2_5.toFixed(1)) : 0,
      unit: 'µg/m³',
      available: curAir.pm2_5 !== undefined && curAir.pm2_5 !== null,
      averagingPeriodHours: 24,
      isModelled: true
    },
    {
      code: 'pm10',
      name: 'PM10 (Coarse Particulate)',
      chemicalFormula: 'PM₁₀',
      value: curAir.pm10 !== undefined && curAir.pm10 !== null ? Number(curAir.pm10.toFixed(1)) : 0,
      unit: 'µg/m³',
      available: curAir.pm10 !== undefined && curAir.pm10 !== null,
      averagingPeriodHours: 24,
      isModelled: true
    },
    {
      code: 'no2',
      name: 'Nitrogen Dioxide',
      chemicalFormula: 'NO₂',
      value: curAir.nitrogen_dioxide !== undefined && curAir.nitrogen_dioxide !== null ? Number(curAir.nitrogen_dioxide.toFixed(1)) : 0,
      unit: 'µg/m³',
      available: curAir.nitrogen_dioxide !== undefined && curAir.nitrogen_dioxide !== null,
      averagingPeriodHours: 24,
      isModelled: true
    },
    {
      code: 'so2',
      name: 'Sulphur Dioxide',
      chemicalFormula: 'SO₂',
      value: curAir.sulphur_dioxide !== undefined && curAir.sulphur_dioxide !== null ? Number(curAir.sulphur_dioxide.toFixed(1)) : 0,
      unit: 'µg/m³',
      available: curAir.sulphur_dioxide !== undefined && curAir.sulphur_dioxide !== null,
      averagingPeriodHours: 24,
      isModelled: true
    },
    {
      code: 'co',
      name: 'Carbon Monoxide',
      chemicalFormula: 'CO',
      // CO from Open-Meteo is provided in µg/m³, normalize to mg/m³ for CPCB standard comparison
      value: curAir.carbon_monoxide !== undefined && curAir.carbon_monoxide !== null ? Number((curAir.carbon_monoxide / 1000).toFixed(2)) : 0,
      unit: 'mg/m³',
      available: curAir.carbon_monoxide !== undefined && curAir.carbon_monoxide !== null,
      averagingPeriodHours: 8,
      isModelled: true
    },
    {
      code: 'o3',
      name: 'Ground-Level Ozone',
      chemicalFormula: 'O₃',
      value: curAir.ozone !== undefined && curAir.ozone !== null ? Number(curAir.ozone.toFixed(1)) : 0,
      unit: 'µg/m³',
      available: curAir.ozone !== undefined && curAir.ozone !== null,
      averagingPeriodHours: 8,
      isModelled: true
    }
  ];

  // Compute Indicative CPCB-derived Index for Model Data (NOT official CAAQMS station observation)
  const naqiCalculation = calculateNAQI(rawPollutants, true); // true = model data
  const populatedPollutants = rawPollutants.map(p => ({
    ...p,
    subIndex: naqiCalculation.subIndices[p.code]
  }));

  const timeIso = curAir.time || new Date().toISOString();
  const { freshness, explanation } = computeFreshness(timeIso);

  // Accurate Grid metadata from Open-Meteo response
  const gridLat = Number((airData.latitude || latitude).toFixed(3));
  const gridLon = Number((airData.longitude || longitude).toFixed(3));

  const airQuality: AirQualityContext = {
    location: cityName,
    state: stateName,
    country: 'India',
    latitude,
    longitude,
    provider: 'CAMS Atmospheric Model (Open-Meteo)',
    dataType: 'modelled_estimate',
    indexClassification: naqiCalculation.indexClassification,
    aqi: naqiCalculation.aqi,
    aqiCategory: naqiCalculation.category || 'Satisfactory',
    prominentPollutant: naqiCalculation.prominentPollutant,
    pollutants: populatedPollutants,
    
    // Explicit model metadata — no fabricated station distances
    modelName: 'Copernicus Atmosphere Monitoring Service (CAMS) Global Model',
    gridCoordinates: { latitude: gridLat, longitude: gridLon },
    gridResolutionKm: 11,
    spatialResolutionNote: 'Regional atmospheric model grid cell (~11 km resolution). Does not represent a micro-local ground monitoring station outside a specific building.',

    lastUpdated: timeIso,
    freshness,
    freshnessExplanation: explanation,
    scientificDisclaimer: 'This reading represents a modelled atmospheric estimate from CAMS / Open-Meteo, not an official CPCB ground monitoring station reading. Derived index applies official CPCB NAQI breakpoints for indicative comparison only.',
    isCalculatedNAQI: true
  };

  // Parse Hourly Series (Last 24h & Next 12h)
  const hourlyTrends: HourlyForecastPoint[] = [];
  if (airData.hourly && Array.isArray(airData.hourly.time)) {
    const times: string[] = airData.hourly.time;
    const pm25Arr: number[] = airData.hourly.pm2_5 || [];
    const pm10Arr: number[] = airData.hourly.pm10 || [];

    const nowHour = new Date().toISOString().slice(0, 13);
    const curIndex = times.findIndex(t => t.startsWith(nowHour));
    const startIdx = Math.max(0, curIndex >= 0 ? curIndex - 12 : times.length - 24);
    const endIdx = Math.min(times.length, startIdx + 24);

    for (let i = startIdx; i < endIdx; i++) {
      const pm25Val = pm25Arr[i] || 0;
      const pm10Val = pm10Arr[i] || 0;
      hourlyTrends.push({
        time: times[i],
        pm25: Number(pm25Val.toFixed(1)),
        pm10: Number(pm10Val.toFixed(1))
      });
    }
  }

  return { airQuality, weather, hourlyTrends };
}
