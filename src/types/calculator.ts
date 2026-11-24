export interface EmissionComparison {
  id: string;
  activity: string;
  habitualChoice: {
    label: string;
    emissionFactorKgCo2PerKm: number;
    description: string;
  };
  cleanerAlternative: {
    label: string;
    emissionFactorKgCo2PerKm: number;
    description: string;
  };
  distanceKm: number;
  frequencyDaysPerYear: number;
  calculatedKgCo2SavedPerYear: number;
  treesEquivalent: number;
  outdoorAqiSafeThreshold: number; // Do not recommend outdoor active transport if AQI > threshold
}

export interface WhatIfScenarioInput {
  baseTransport: 'petrol_car' | 'diesel_car' | 'two_wheeler_petrol' | 'cab';
  targetTransport: 'electric_bus_metro' | 'carpool' | 'electric_two_wheeler' | 'bicycle_walk';
  dailyRoundTripKm: number;
  commuteDaysPerWeek: number;
  errandTripBatching: boolean;
  noIdlingHabit: boolean;
}

export interface WhatIfResult {
  weeklyKgCo2eAvoided: number;
  annualKgCo2eAvoided: number;
  fuelCostSavedInrAnnual: number;
  co2EquivalentKmDriven: number;
  methodologyNotes: string;
}
