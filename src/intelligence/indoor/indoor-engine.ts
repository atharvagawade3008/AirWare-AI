import { IndoorQuestionnaireAnswers, IndoorAssessmentResult } from '../../types/indoor.ts';

export interface IndoorHazardContribution {
  label: string;
  points: number;
}

export interface IndoorAssessment extends IndoorAssessmentResult {
  /** Additive points contributed by each hazard source; sums to the hazard score. */
  breakdown: IndoorHazardContribution[];
}

/**
 * Deterministic indoor hazard scoring. Pure function so the same numbers can be
 * shown on the dashboard as on the Indoor Air Doctor screen.
 * Score 0 (clean) to 100 (critical). Never invents an indoor pollutant reading.
 */
export function assessIndoorAir(
  answers: IndoorQuestionnaireAnswers,
  outdoorAqi?: number
): IndoorAssessment {
  let score = 20; // baseline
  const hazards: IndoorAssessmentResult['primaryHazards'] = [];
  const zeroCost: string[] = [];
  const mediumTerm: string[] = [];
  const equipment: string[] = [];
  const breakdown: IndoorHazardContribution[] = [{ label: 'Baseline household load', points: 20 }];

  const add = (label: string, points: number) => {
    score += points;
    breakdown.push({ label, points });
  };

  // 1. Incense / Mosquito Coils
  if (answers.incenseOrCoils === 'mosquito_coils') {
    add('Mosquito coils', 35);
    hazards.push({
      title: 'Mosquito Coil Combustion (High Particulate Hazard)',
      description: 'Burning a single mosquito coil inside an enclosed room emits particulate matter equivalent to smoking 75–100 cigarettes, releasing toxic heavy polycyclic aromatic hydrocarbons (PAHs).',
      severity: 'high'
    });
    zeroCost.push('Immediately replace smouldering mosquito coils with mosquito nets, window mesh screens, or electric liquid vaporizers.');
  } else if (answers.incenseOrCoils === 'daily_agarbatti') {
    add('Daily incense smoke', 20);
    hazards.push({
      title: 'Daily Incense Smoke (Agarbatti / Dhoop)',
      description: 'Incense combustion produces dense sub-micron carbon particles, benzene, and formaldehyde that linger in indoor air for up to 6 hours.',
      severity: 'medium'
    });
    zeroCost.push('Ventilate the prayer area directly or switch to electric LED diyas and smokeless alternatives.');
  } else if (answers.incenseOrCoils === 'festivals_only') {
    add('Occasional incense', 5);
    zeroCost.push('During festival incense use, keep a window open and run the exhaust fan for 30 minutes afterwards.');
  }

  // 2. Kitchen Exhaust & Fuel
  if (answers.kitchenExhaust === 'poor_ventilation' || answers.kitchenExhaust === 'open_window') {
    add('Cooking fume exhaust', 25);
    hazards.push({
      title: 'Inadequate Cooking Fume Exhaust',
      description: 'High-heat frying, tadka, and fuel combustion without an active mechanical exhaust fan trap ultrafine oil droplets, CO, and NO₂ inside the living quarters.',
      severity: 'high'
    });
    zeroCost.push('Turn on the kitchen exhaust fan 2 minutes BEFORE lighting the stove and keep it running for 5 minutes after cooking completes.');
    mediumTerm.push('Install a ducted kitchen chimney with a minimum airflow rating of 1000–1200 m³/hr.');
  }

  if (answers.cookingFuel === 'biomass' || answers.cookingFuel === 'kerosene') {
    add('Solid / liquid fuel', 40);
    hazards.push({
      title: 'Solid Fuel / Biomass Combustion',
      description: 'Unvented biomass or kerosene produces extreme carbon monoxide and black carbon concentrations indoors.',
      severity: 'high'
    });
    mediumTerm.push('Switch cooking entirely to clean electric induction or piped LPG/PNG.');
  }

  // 3. Indoor Smoking
  if (answers.indoorSmoking === 'regular') {
    add('Indoor tobacco smoke', 40);
    hazards.push({
      title: 'Secondhand Tobacco Smoke',
      description: 'Tobacco smoke creates persistent thirdhand toxic residue on upholstery, curtains, and flooring, emitting volatile organic compounds for weeks.',
      severity: 'high'
    });
    zeroCost.push('Designate the entire home as a 100% smoke-free zone. Smoking on balconies still drifts back through doorways.');
  } else if (answers.indoorSmoking === 'occasional') {
    add('Occasional smoking drift', 15);
    hazards.push({
      title: 'Balcony / Window Smoke Drift',
      description: 'Smoke from a balcony or window re-enters the home through the same doorway and gets trapped against the ceiling.',
      severity: 'medium'
    });
    zeroCost.push('Smoke well away from windows and doors, and ventilate the affected room for 20 minutes afterwards.');
  }

  // 4. Dampness & Mould
  if (answers.dampnessOrMould === 'visible_spots' || answers.dampnessOrMould === 'extensive') {
    add('Mould / dampness', 25);
    hazards.push({
      title: 'Fungal Spores & Mould Bio-Aerosols',
      description: 'Visible mould patches release millions of airborne mycotoxins and allergens, exacerbating chronic asthma, sinusitis, and persistent nighttime coughing.',
      severity: 'high'
    });
    mediumTerm.push('Scrub mould-affected walls using dilute hydrogen peroxide or antifungal wash, and repair structural water seepage.');
  } else if (answers.dampnessOrMould === 'musty_smell') {
    add('Musty damp air', 15);
    hazards.push({
      title: 'Musty Damp Air (Early Mould Growth)',
      description: 'A persistent musty smell signals hidden mould growth behind paint, skirting or wardrobes, long before patches become visible.',
      severity: 'medium'
    });
    zeroCost.push('Air the room daily and fix the leak source; a musty smell is an early warning, not a cosmetic issue.');
  }

  // 5. Cleaning & Dust Re-suspension
  if (answers.vacuumHabits === 'dry_sweep_only') {
    add('Dry broom dust', 15);
    hazards.push({
      title: 'Dry Broom Dust Re-suspension',
      description: 'Traditional dry broom sweeping kicks settled coarse and fine PM10 back into human breathing zones for 2 to 3 hours.',
      severity: 'medium'
    });
    zeroCost.push('Switch to two-bucket wet mopping with a damp microfiber cloth instead of dry sweeping.');
  }

  // 6. Window routine — matters most when outdoor air is bad
  if (answers.windowHabits === 'always_open') {
    const outdoorPenalty = (outdoorAqi ?? 0) > 150 ? 30 : 18;
    add('Open windows draw outdoor air in', outdoorPenalty);
    hazards.push({
      title: 'Windows Open All Day and Night',
      description: (outdoorAqi ?? 0) > 150
        ? `With today's outdoor AQI around ${outdoorAqi}, permanently open windows continuously import particulate pollution into the home.`
        : 'Permanently open windows are fine on clean days, but let in street dust, pollen and traffic fumes at peak hours.',
      severity: 'medium'
    });
    zeroCost.push('Open windows only during the cleanest 20–30 minutes of the day, then close them at rush hour.');
  } else if (answers.windowHabits === 'rarely_open') {
    add('Stale indoor air', 12);
    hazards.push({
      title: 'Stale, Unventilated Indoor Air',
      description: 'Sealed rooms accumulate exhaled CO₂, cooking fumes, and volatile organic compounds from furniture and cleaning products.',
      severity: 'low'
    });
    zeroCost.push('Give the home one short cross-ventilation burst daily, ideally mid-afternoon when outdoor air is cleanest.');
  } else if (answers.windowHabits === 'sealed_ac') {
    add('Sealed air-conditioned rooms', 6);
    zeroCost.push('Service AC filters every quarter; a clogged filter recirculates dust into the room it is meant to cool.');
  }

  // 7. Dust accumulation & pets (extra detail when provided)
  if (answers.dustAccumulation === 'heavy') {
    add('Heavy settled dust', 10);
  } else if (answers.dustAccumulation === 'moderate') {
    add('Moderate settled dust', 5);
  }

  if (answers.pets) {
    add('Pet dander', 5);
    if (answers.vacuumHabits !== 'hepa_vacuum') {
      zeroCost.push('Brush pets outdoors and use a HEPA vacuum weekly to keep dander and hair out of breathing zones.');
    }
  }

  // 8. Air Purifier
  if (!answers.hasAirPurifier) {
    add('No mechanical filtration', 10);
    equipment.push('Invest in an air purifier with a True HEPA H13 filter and Clean Air Delivery Rate (CADR) sized to your room volume (approx. 250–350 m³/hr for standard bedrooms).');
  }

  score = Math.min(100, Math.max(10, score));

  let riskLevel: IndoorAssessmentResult['riskLevel'] = 'Low Hazard';
  if (score > 70) riskLevel = 'Critical Hazard';
  else if (score > 50) riskLevel = 'High Hazard';
  else if (score > 30) riskLevel = 'Moderate Hazard';

  return {
    score,
    riskLevel,
    breakdown,
    primaryHazards: hazards,
    immediateZeroCostActions: zeroCost.length > 0 ? zeroCost : ['Maintain current good practices: keep kitchen ventilated and continue wet-mopping.'],
    mediumTermImprovements: mediumTerm,
    equipmentRecommendations: equipment,
    scientificClarifications: [
      'Houseplants Reality: Potted plants (Snake plant, Areca palm) cannot meaningfully filter real-world room air volume against particulate pollution. Mechanical HEPA filtration is required.',
      'Strict Ozone Warning: Never purchase ozone generators or uncertified negative ionizers; ozone is an aggressive lung irritant banned in healthcare standards.'
    ]
  };
}
