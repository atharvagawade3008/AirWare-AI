import { AQICategory, PollutantReading } from '../../types/air-quality.ts';
import { HouseholdProfile } from '../../types/profile.ts';
import { WeatherContext } from '../../types/weather.ts';

export interface VulnerabilityAssessment {
  overallRiskMultiplier: number; // 1.0 (baseline) to 3.5 (critical vulnerability)
  vulnerabilityFactors: {
    factor: string;
    description: string;
    level: 'high' | 'medium' | 'low';
  }[];
  respiratoryStrainIndex: 'Low' | 'Moderate' | 'High' | 'Severe';
  stagnationWarning?: string;
}

export function assessVulnerability(
  aqiCategory: AQICategory | undefined,
  pollutants: PollutantReading[],
  profile: HouseholdProfile,
  weather?: WeatherContext
): VulnerabilityAssessment {
  let multiplier = 1.0;
  const factors: VulnerabilityAssessment['vulnerabilityFactors'] = [];

  // Children factor
  if (profile.hasChildren) {
    multiplier += 0.5;
    factors.push({
      factor: 'Children in Household',
      description: 'Children breathe up to 50% more air per kg of body weight than adults, depositing higher relative particulate mass into developing lung tissue.',
      level: 'high'
    });
  }

  // Elderly factor
  if (profile.hasElderly) {
    multiplier += 0.6;
    factors.push({
      factor: 'Senior Family Members',
      description: 'Elderly individuals experience elevated cardiovascular strain from fine particulate matter (PM2.5) entering the bloodstream.',
      level: 'high'
    });
  }

  // Pre-existing respiratory conditions
  if (profile.hasRespiratorySensitive) {
    multiplier += 0.8;
    factors.push({
      factor: 'Respiratory Sensitivities',
      description: 'Asthma, COPD, or allergic rhinitis flare-ups increase non-linearly with elevated PM2.5 and Ozone (O3).',
      level: 'high'
    });
  }

  // Outdoor commute vulnerability
  if (['two_wheeler', 'bicycle', 'walk'].includes(profile.commuteType)) {
    multiplier += 0.4;
    factors.push({
      factor: 'High-Exposure Commute Mode',
      description: `${profile.commuteType === 'two_wheeler' ? 'Two-wheeler' : profile.commuteType === 'bicycle' ? 'Cycling' : 'Walking'} exposes commuters directly to traffic-level black carbon and nitrogen dioxide plume without cabin filtration.`,
      level: 'medium'
    });
  }

  // Weather stagnation check
  let stagnationWarning: string | undefined;
  if (weather && weather.isStagnant) {
    multiplier += 0.2;
    stagnationWarning = `Wind speed is currently only ${weather.windSpeedKmh} km/h with high humidity (${weather.humidityPercent}%). Low thermal inversion prevents vertical dispersion, trapping local exhaust at breathing height.`;
  }

  // Map to respiratory strain
  let respiratoryStrain: 'Low' | 'Moderate' | 'High' | 'Severe' = 'Low';
  if (aqiCategory === 'Severe' || (aqiCategory === 'Very Poor' && multiplier > 1.8)) {
    respiratoryStrain = 'Severe';
  } else if (aqiCategory === 'Very Poor' || aqiCategory === 'Poor' || (aqiCategory === 'Moderately Polluted' && multiplier > 1.5)) {
    respiratoryStrain = 'High';
  } else if (aqiCategory === 'Moderately Polluted' || (aqiCategory === 'Satisfactory' && multiplier > 1.8)) {
    respiratoryStrain = 'Moderate';
  }

  return {
    overallRiskMultiplier: Number(multiplier.toFixed(2)),
    vulnerabilityFactors: factors,
    respiratoryStrainIndex: respiratoryStrain,
    stagnationWarning
  };
}
