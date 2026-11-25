import { AirAwareContext, GeminiAirContext } from '../../types/ai.ts';
import { DailyGuidanceSummary, ExposurePlannerSlot } from '../../types/recommendation.ts';

const HOUSEHOLD_SAFE_PROFILE = true; // Guards against future accidental profile expansion.

/**
 * Builds the minimum context Gemini needs. Deliberately omits names, exact GPS
 * coordinates and free-text profile fields; the user's own words arrive separately.
 */
export function buildGeminiContext(
  context: AirAwareContext,
  guidance?: DailyGuidanceSummary,
  planner?: ExposurePlannerSlot[]
): GeminiAirContext {
  const aq = context.airQuality;
  const profile = context.profile;

  const payload: GeminiAirContext = {
    location: aq.location,
    region: aq.state,
    standard: aq.indexClassification === 'official_cpcb_naqi' ? 'Indian CPCB NAQI (station observation)' : 'Indian CPCB breakpoints',
    aqi: aq.aqi,
    aqiCategory: aq.aqiCategory,
    indexClassification: aq.indexClassification,
    dataType: aq.dataType,
    prominentPollutant: aq.prominentPollutant,
    pollutants: aq.pollutants.map((p) => ({
      name: p.name,
      value: p.value,
      unit: p.unit,
      subIndex: p.subIndex,
      available: p.available,
      modelled: p.isModelled
    })),
    stationName: aq.stationName,
    stationDistanceKm: aq.stationDistanceKm,
    lastUpdated: aq.lastUpdated,
    freshness: aq.freshness,
    freshnessExplanation: aq.freshnessExplanation,
    weather: context.weather
      ? {
          temperatureC: context.weather.temperatureC,
          humidityPercent: context.weather.humidityPercent,
          windSpeedKmh: context.weather.windSpeedKmh,
          weatherDescription: context.weather.weatherDescription,
          ventilationIndex: context.weather.ventilationIndex
        }
      : undefined,
    household: HOUSEHOLD_SAFE_PROFILE
      ? {
          householdSize: profile.householdSize,
          children: profile.hasChildren,
          elderly: profile.hasElderly,
          respiratorySensitive: profile.hasRespiratorySensitive,
          hasAirPurifier: profile.hasAirPurifier,
          cookingFuel: profile.indoorCookingFuel,
          commuteType: profile.commuteType,
          commuteDistanceKm: profile.commuteDistanceKm,
          outdoorExerciseTime: profile.outdoorExerciseTime
        }
      : ({} as GeminiAirContext['household'])
  };

  if (guidance || planner) {
    payload.existingGuidance = {
      headline: guidance?.headline || '',
      summary: guidance?.summary || '',
      topActions: (guidance?.topActionItems || [])
        .slice(0, 4)
        .map((item) => `${item.title}: ${item.actionableStep}`),
      routine: [
        ...(guidance?.routineAdjustments || []),
        ...(planner || []).slice(0, 4).map((slot) => `${slot.title} (${slot.hours}): ${slot.suggestedAction}`)
      ].slice(0, 4)
    };
  }

  return payload;
}
