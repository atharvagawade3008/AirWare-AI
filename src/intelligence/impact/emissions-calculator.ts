import { WhatIfScenarioInput, WhatIfResult, EmissionComparison } from '../../types/calculator.ts';

// Documented India-specific emission factors (Sources: Central Electricity Authority, CPCB, ARAI emission factors)
export const EMISSION_FACTORS = {
  petrolCarKgCo2PerKm: 0.170,        // Midsize 1.2L-1.5L petrol car
  dieselCarKgCo2PerKm: 0.185,        // Midsize diesel SUV / sedan
  twoWheelerPetrolKgCo2PerKm: 0.045, // 110cc-150cc scooter/motorcycle
  cabSoloKgCo2PerKm: 0.190,          // Ride-hail sedan (includes deadhead cruising)
  carpoolKgCo2PerKm: 0.060,          // Shared car (split across 3 occupants)
  metroElectricBusKgCo2PerKm: 0.022, // Per passenger-km on Indian transit grid
  electricTwoWheelerKgCo2PerKm: 0.014,// Indian grid emission intensity factor
  bicycleWalkKgCo2PerKm: 0.000,      // Zero tailpipe emissions
  petrolPricePerLitreInr: 104,
  avgPetrolCarMileageKmPerL: 14,
  avgTwoWheelerMileageKmPerL: 45
};

export function calculateWhatIfSavings(input: WhatIfScenarioInput): WhatIfResult {
  // Baseline factor
  let baseFactor = EMISSION_FACTORS.petrolCarKgCo2PerKm;
  if (input.baseTransport === 'diesel_car') baseFactor = EMISSION_FACTORS.dieselCarKgCo2PerKm;
  else if (input.baseTransport === 'two_wheeler_petrol') baseFactor = EMISSION_FACTORS.twoWheelerPetrolKgCo2PerKm;
  else if (input.baseTransport === 'cab') baseFactor = EMISSION_FACTORS.cabSoloKgCo2PerKm;

  // Target factor
  let targetFactor = EMISSION_FACTORS.metroElectricBusKgCo2PerKm;
  if (input.targetTransport === 'carpool') targetFactor = EMISSION_FACTORS.carpoolKgCo2PerKm;
  else if (input.targetTransport === 'electric_two_wheeler') targetFactor = EMISSION_FACTORS.electricTwoWheelerKgCo2PerKm;
  else if (input.targetTransport === 'bicycle_walk') targetFactor = EMISSION_FACTORS.bicycleWalkKgCo2PerKm;

  const weeklyKm = input.dailyRoundTripKm * input.commuteDaysPerWeek;
  
  // Trip batching reduces unnecessary errand mileage by approx 15%
  const batchingMultiplier = input.errandTripBatching ? 0.85 : 1.0;
  
  // No-idling saves ~0.15 kg CO2 per day spent waiting in bottlenecks
  const idlingWeeklySavingsKg = input.noIdlingHabit ? (0.15 * input.commuteDaysPerWeek) : 0;

  const baseWeeklyEmissions = weeklyKm * baseFactor;
  const targetWeeklyEmissions = (weeklyKm * targetFactor * batchingMultiplier);
  
  const weeklyAvoided = Math.max(0, (baseWeeklyEmissions - targetWeeklyEmissions) + idlingWeeklySavingsKg);
  const annualAvoided = weeklyAvoided * 50; // 50 working weeks

  // Fuel Cost Savings (INR)
  let fuelCostSavedInrAnnual = 0;
  if (input.baseTransport === 'petrol_car') {
    const litresAnnual = (weeklyKm * 50) / EMISSION_FACTORS.avgPetrolCarMileageKmPerL;
    fuelCostSavedInrAnnual = Math.round(litresAnnual * EMISSION_FACTORS.petrolPricePerLitreInr * 0.7); // accounting for transit tickets
  } else if (input.baseTransport === 'two_wheeler_petrol') {
    const litresAnnual = (weeklyKm * 50) / EMISSION_FACTORS.avgTwoWheelerMileageKmPerL;
    fuelCostSavedInrAnnual = Math.round(litresAnnual * EMISSION_FACTORS.petrolPricePerLitreInr * 0.5);
  } else {
    fuelCostSavedInrAnnual = Math.round(weeklyKm * 50 * 6.5); // Approx ride-hail delta
  }

  // Equivalent km driven in average petrol car avoided
  const co2EquivalentKmDriven = Math.round(annualAvoided / EMISSION_FACTORS.petrolCarKgCo2PerKm);

  return {
    weeklyKgCo2eAvoided: Number(weeklyAvoided.toFixed(2)),
    annualKgCo2eAvoided: Math.round(annualAvoided),
    fuelCostSavedInrAnnual,
    co2EquivalentKmDriven,
    methodologyNotes: 'Calculated using ARAI & Central Electricity Authority carbon-intensity factors. Individual greenhouse gas reduction mitigates regional emissions, but does not substitute for personal exposure protection during active high-AQI events.'
  };
}

export const PRESET_CHOICE_COMPARISONS: EmissionComparison[] = [
  {
    id: 'car-to-metro',
    activity: 'Daily Office Commute (15 km one-way)',
    habitualChoice: {
      label: 'Solo Petrol Car Commute',
      emissionFactorKgCo2PerKm: EMISSION_FACTORS.petrolCarKgCo2PerKm,
      description: 'Single occupant driving 30 km daily roundtrip through stop-and-go traffic.'
    },
    cleanerAlternative: {
      label: 'Metro Rail or Electric City Bus',
      emissionFactorKgCo2PerKm: EMISSION_FACTORS.metroElectricBusKgCo2PerKm,
      description: 'Zero direct tailpipe emissions in dense urban streets; efficient high-capacity transit.'
    },
    distanceKm: 30,
    frequencyDaysPerYear: 240,
    calculatedKgCo2SavedPerYear: 1065,
    treesEquivalent: 48,
    outdoorAqiSafeThreshold: 500 // Metro is enclosed & safe even in high AQI
  },
  {
    id: 'bike-short-errands',
    activity: 'Local Neighbourhood Errands (3 km roundtrip)',
    habitualChoice: {
      label: 'Short Car Trip for Small Groceries',
      emissionFactorKgCo2PerKm: 0.220, // Cold start car engine has higher emissions
      description: 'Cold engine start consumes 30% more fuel during the first 5 minutes.'
    },
    cleanerAlternative: {
      label: 'Bicycle or Walking',
      emissionFactorKgCo2PerKm: 0.000,
      description: 'Zero emissions and zero parking congestion.'
    },
    distanceKm: 3,
    frequencyDaysPerYear: 150,
    calculatedKgCo2SavedPerYear: 99,
    treesEquivalent: 5,
    outdoorAqiSafeThreshold: 150 // Only recommended when AQI is satisfactory/moderate
  },
  {
    id: 'carpooling',
    activity: 'Commute Carpooling (20 km roundtrip)',
    habitualChoice: {
      label: 'Driving Alone Daily',
      emissionFactorKgCo2PerKm: EMISSION_FACTORS.petrolCarKgCo2PerKm,
      description: 'One person in a 5-seater vehicle.'
    },
    cleanerAlternative: {
      label: 'Carpooling with 2 Colleagues',
      emissionFactorKgCo2PerKm: EMISSION_FACTORS.carpoolKgCo2PerKm,
      description: 'Triples vehicle occupancy and reduces vehicles on the road by 66%.'
    },
    distanceKm: 20,
    frequencyDaysPerYear: 220,
    calculatedKgCo2SavedPerYear: 484,
    treesEquivalent: 22,
    outdoorAqiSafeThreshold: 500
  }
];
