export interface IndoorQuestionnaireAnswers {
  cookingFuel: 'lpg' | 'induction' | 'piped_gas' | 'biomass' | 'kerosene';
  kitchenExhaust: 'chimney_hepa' | 'exhaust_fan' | 'open_window' | 'poor_ventilation';
  windowHabits: 'always_open' | 'ventilate_when_clean' | 'rarely_open' | 'sealed_ac';
  dustAccumulation: 'low' | 'moderate' | 'heavy';
  indoorSmoking: 'none' | 'occasional' | 'regular';
  incenseOrCoils: 'none' | 'festivals_only' | 'daily_agarbatti' | 'mosquito_coils';
  dampnessOrMould: 'none' | 'musty_smell' | 'visible_spots' | 'extensive';
  pets: boolean;
  hasAirPurifier: boolean;
  purifierFilterType?: 'true_hepa' | 'basic_mesh' | 'unsure';
  vacuumHabits: 'hepa_vacuum' | 'regular_sweep_mop' | 'dry_sweep_only';
}

export interface IndoorAssessmentResult {
  score: number; // 0 (best) to 100 (high risk)
  riskLevel: 'Low Hazard' | 'Moderate Hazard' | 'High Hazard' | 'Critical Hazard';
  breakdown?: { label: string; points: number }[]; // additive points per hazard source
  primaryHazards: {
    title: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
  }[];
  immediateZeroCostActions: string[];
  mediumTermImprovements: string[];
  equipmentRecommendations: string[];
  scientificClarifications: string[]; // Clarify houseplants vs HEPA, ban on ozone generators
}
