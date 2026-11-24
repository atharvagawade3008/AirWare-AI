import type {
  FactorId,
  IndoorRecommendation,
  QuestionnaireAnswers,
  RiskFactor,
  VentilationGuidance,
} from '../types/indoor';
import { QUESTION_MAP } from '../data/questions';

/**
 * Deterministic recommendation selection.
 *
 * Every recommendation is triggered by an explicit answer condition. There is
 * no randomness, no network access and no medical advice. Recommendations are
 * sorted by action category and impact so the action plan reads in priority
 * order.
 */

interface RecommendationRule {
  build: (answers: QuestionnaireAnswers) => IndoorRecommendation;
  when: (answers: QuestionnaireAnswers) => boolean;
}

const CATEGORY_ORDER: Record<IndoorRecommendation['category'], number> = {
  immediate: 0,
  'low-cost': 1,
  'long-term': 2,
  avoid: 3,
};

const IMPACT_ORDER: Record<IndoorRecommendation['impact'], number> = {
  high: 0,
  moderate: 1,
  supporting: 2,
};

function isAny(value: string | undefined, candidates: string[]): boolean {
  return typeof value === 'string' && candidates.includes(value);
}

function hasVisibleMould(answers: QuestionnaireAnswers): boolean {
  return isAny(answers.mould, ['smallPatches', 'widespread']);
}

/* -------------------------------------------------------------------------- */
/* Individual rules                                                           */
/* -------------------------------------------------------------------------- */

const RULES: RecommendationRule[] = [
  /* ---------------------------- Cooking ------------------------------ */
  {
    when: (a) =>
      isAny(a.kitchenExhaust, ['none', 'windowOnly']) ||
      isAny(a.kitchenVentilation, ['poor', 'fair']),
    build: () => ({
      id: 'use-kitchen-exhaust',
      title: 'Run proper exhaust every time you cook',
      description:
        'Switch the exhaust fan or chimney on before the stove and leave it running for about ten minutes after cooking. If you only have a window, open it wide while cooking and keep the kitchen door closed so smoke does not travel through the home.',
      category: 'immediate',
      effort: 'minutes',
      impact: 'high',
      relatedFactors: ['cooking_emissions'],
    }),
  },
  {
    when: (a) => isAny(a.smokeSpread, ['sometimes', 'often']),
    build: () => ({
      id: 'contain-cooking-smoke',
      title: 'Keep cooking smoke out of living areas',
      description:
        'Close the kitchen door while frying or using high heat, use lids and a splatter guard, and cook on the back burners where exhaust capture is strongest. Let the exhaust clear the kitchen before the door is opened.',
      category: 'immediate',
      effort: 'instant',
      impact: 'moderate',
      relatedFactors: ['cooking_emissions'],
    }),
  },
  {
    when: (a) => isAny(a.cookingFuel, ['biomass', 'kerosene']),
    build: () => ({
      id: 'move-away-from-solid-fuel',
      title: 'Plan a move away from solid or kerosene cooking',
      description:
        'Wood, coal, dung and kerosene produce the highest indoor smoke levels. If an LPG connection, piped gas or electric cooking is feasible, treat the switch as the highest-value long-term improvement. Until then, cook with the exhaust on and keep children away from the kitchen while the stove is lit.',
      category: 'long-term',
      effort: 'investment',
      impact: 'high',
      relatedFactors: ['cooking_emissions', 'indoor_combustion'],
    }),
  },
  {
    when: (a) => isAny(a.kitchenExhaust, ['none', 'windowOnly']),
    build: () => ({
      id: 'install-kitchen-exhaust',
      title: 'Install a ducted exhaust fan or chimney',
      description:
        'Choose a unit sized for your kitchen and duct it outdoors — recirculating hoods without a proper filter mostly move smoke around. A simple wall-mounted exhaust fan is a low-cost first step if a full chimney is out of reach.',
      category: 'long-term',
      effort: 'investment',
      impact: 'high',
      relatedFactors: ['cooking_emissions'],
    }),
  },

  /* --------------------------- Combustion ---------------------------- */
  {
    when: (a) => isAny(a.indoorSmoking, ['occasional', 'daily']),
    build: () => ({
      id: 'make-home-smoke-free',
      title: 'Make the home smoke-free indoors',
      description:
        'Agree a household rule that smoking happens outdoors, away from doors and windows. Opening a window or running a purifier does not remove the health risk of indoor smoking; the only effective step is to stop smoking indoors.',
      category: 'immediate',
      effort: 'instant',
      impact: 'high',
      relatedFactors: ['indoor_combustion'],
    }),
  },
  {
    when: (a) => isAny(a.incenseCoils, ['occasionally', 'frequently', 'coilsNightly']),
    build: () => ({
      id: 'reduce-coils-and-incense',
      title: 'Cut back on mosquito coils and incense indoors',
      description:
        'Mosquito coils and incense produce fine smoke even in small quantities. Use nets, screens or fans for mosquitoes instead of coils, and if incense is part of a ritual, burn less of it near an open window or under an exhaust fan — never in a closed bedroom.',
      category: 'immediate',
      effort: 'minutes',
      impact: 'high',
      relatedFactors: ['indoor_combustion'],
    }),
  },
  {
    when: (a) =>
      isAny(a.incenseCoils, ['occasionally', 'frequently', 'coilsNightly']) ||
      isAny(a.candles, ['occasionally', 'frequently']) ||
      isAny(a.indoorSmoking, ['occasional', 'daily']),
    build: () => ({
      id: 'air-out-after-burning',
      title: 'Air out the room after any burning',
      description:
        'After incense, coils, candles or smoking, ventilate the room for a few minutes and keep the exhaust fan on where available. Check outdoor conditions first so you are not replacing smoke with polluted outdoor air.',
      category: 'immediate',
      effort: 'minutes',
      impact: 'moderate',
      relatedFactors: ['indoor_combustion'],
      outdoorSensitive: true,
    }),
  },
  {
    when: (a) => isAny(a.candles, ['occasionally', 'frequently']),
    build: () => ({
      id: 'choose-cleaner-candles',
      title: 'Choose cleaner lighting and trim candle wicks',
      description:
        'Paraffin candles with long, smoking wicks add soot to indoor air. Trim wicks, keep flames away from draughts, and prefer LED lighting for everyday use. Scented candles or air fresheners mask odours rather than removing particles.',
      category: 'low-cost',
      effort: 'instant',
      impact: 'supporting',
      relatedFactors: ['indoor_combustion'],
    }),
  },

  /* ------------------------------ Dust ------------------------------- */
  {
    when: (a) =>
      isAny(a.cleaningFrequency, ['weekly', 'rarely']) ||
      isAny(a.visibleDust, ['sometimes', 'often']),
    build: () => ({
      id: 'damp-dusting-routine',
      title: 'Dust with a damp cloth instead of dry sweeping',
      description:
        'Dry sweeping and dusting lift settled particles back into the air. Use a damp cloth on surfaces and a damp mop on floors, and clean from the top of the room downwards so dust does not land on freshly cleaned surfaces.',
      category: 'low-cost',
      effort: 'minutes',
      impact: 'moderate',
      relatedFactors: ['dust_accumulation'],
    }),
  },
  {
    when: (a) =>
      isAny(a.cleaningFrequency, ['weekly', 'rarely']) ||
      isAny(a.visibleDust, ['often']),
    build: () => ({
      id: 'steady-cleaning-schedule',
      title: 'Set a simple weekly cleaning rhythm',
      description:
        'A short clean more often works better than an occasional deep clean. Dust high surfaces and vacuum or mop floors once or twice a week, and wash bedding regularly — especially in bedrooms, where people spend the most time.',
      category: 'low-cost',
      effort: 'minutes',
      impact: 'supporting',
      relatedFactors: ['dust_accumulation'],
    }),
  },
  {
    when: (a) => isAny(a.carpetsCurtains, ['some', 'many']),
    build: () => ({
      id: 'manage-soft-furnishings',
      title: 'Keep soft furnishings dust-free',
      description:
        'Vacuum rugs and carpets with a HEPA-filter vacuum where possible, wash curtains each season, and air cushions and bedding in sunlight. If you are replacing flooring, hard floors are easier to keep low-dust.',
      category: 'long-term',
      effort: 'weekend',
      impact: 'moderate',
      relatedFactors: ['dust_accumulation'],
    }),
  },
  {
    when: (a) => isAny(a.pets, ['one', 'multiple']),
    build: () => ({
      id: 'pet-dander-routine',
      title: 'Keep pet hair and dander in check',
      description:
        'Brush pets outdoors, wash their bedding often, and keep them out of bedrooms if anyone is sensitive. Vacuum soft furnishings regularly and ventilate when outdoor air is suitable.',
      category: 'low-cost',
      effort: 'minutes',
      impact: 'supporting',
      relatedFactors: ['dust_accumulation'],
    }),
  },

  /* ---------------------------- Moisture ----------------------------- */
  {
    when: (a) => isAny(a.leakage, ['occasional', 'persistent']),
    build: () => ({
      id: 'fix-leaks-quickly',
      title: 'Find and fix leaks at the source',
      description:
        'Repair leaking pipes, seepage and roof or window leaks rather than just wiping them dry. Dry any wet area within one to two days and check behind furniture and under sinks where dampness is easy to miss.',
      category: 'immediate',
      effort: 'weekend',
      impact: 'high',
      relatedFactors: ['dampness_mould'],
    }),
  },
  {
    when: hasVisibleMould,
    build: () => ({
      id: 'remove-mould-safely',
      title: 'Clean mould only after fixing the moisture',
      description:
        'Small patches can be wiped with a detergent solution while wearing gloves and a mask, then dried thoroughly. Mould returns if the damp source is not fixed — and large areas, or mould in wall cavities, are best handled by a professional.',
      category: 'immediate',
      effort: 'weekend',
      impact: 'high',
      relatedFactors: ['dampness_mould'],
    }),
  },
  {
    when: (a) => isAny(a.dampness, ['minor', 'significant']) || hasVisibleMould(a),
    build: () => ({
      id: 'lower-indoor-humidity',
      title: 'Keep indoor humidity from staying high',
      description:
        'Use bathroom and kitchen exhaust fans, dry clothes outdoors or in a ventilated area, and avoid leaving wet towels or standing water indoors. A cheap hygrometer helps you see when a room needs airing.',
      category: 'low-cost',
      effort: 'minutes',
      impact: 'moderate',
      relatedFactors: ['dampness_mould'],
    }),
  },

  /* --------------------------- Ventilation --------------------------- */
  {
    when: (a) =>
      isAny(a.windowOpening, ['fewTimesWeek', 'rarely', 'never']) ||
      isAny(a.ventilationRestriction, ['partly', 'sealed']),
    build: () => ({
      id: 'daily-cross-ventilation',
      title: 'Build a short daily airing habit',
      description:
        'Open windows on opposite sides of the home for a few minutes, twice a day, to flush out accumulated pollutants. Even a short exchange is more effective than leaving one window slightly open all day.',
      category: 'low-cost',
      effort: 'minutes',
      impact: 'moderate',
      relatedFactors: ['poor_ventilation'],
      outdoorSensitive: true,
    }),
  },
  {
    when: (a) => isAny(a.windowSafety, ['restricted', 'none']),
    build: () => ({
      id: 'ventilation-when-windows-are-limited',
      title: 'Use mechanical ventilation where windows are limited',
      description:
        'If windows cannot be opened safely, run kitchen and bathroom exhaust fans and use a purifier for the rooms you use most. Ask your building manager about window guards or a ventilation fix if safety is the constraint.',
      category: 'long-term',
      effort: 'investment',
      impact: 'moderate',
      relatedFactors: ['poor_ventilation'],
    }),
  },

  /* ---------------------------- Filtration --------------------------- */
  {
    when: (a) => isAny(a.airPurifier, ['none', 'nonHepa']),
    build: () => ({
      id: 'choose-hepa-purifier',
      title: 'Choose a correctly sized true-HEPA purifier, if affordable',
      description:
        'Look for a unit with a true HEPA filter and a clean-air delivery rate matched to the room size, and run it in the room where you spend the most time. This is optional: source control and ventilation come first, and purifiers are not a substitute for either.',
      category: 'long-term',
      effort: 'investment',
      impact: 'moderate',
      relatedFactors: ['inadequate_filtration'],
    }),
  },
  {
    when: (a) =>
      isAny(a.filterMaintenance, ['irregular', 'never']) ||
      isAny(a.airPurifier, ['hepaNeglected']),
    build: () => ({
      id: 'maintain-filters',
      title: 'Service filters and exhaust vents on schedule',
      description:
        'Vacuum pre-filters monthly and replace HEPA filters as the manufacturer recommends — a clogged filter reduces airflow and can make a purifier less effective. Write the replacement date on the filter so it is easy to remember.',
      category: 'low-cost',
      effort: 'minutes',
      impact: 'moderate',
      relatedFactors: ['inadequate_filtration'],
    }),
  },

  /* ------------------------- Habits to avoid ------------------------- */
  {
    when: () => true,
    build: () => ({
      id: 'avoid-ozone-generators',
      title: 'Do not use ozone generators or “ionisers” marketed as air cleaners',
      description:
        'Ozone generators intentionally release an irritant gas and are not a safe way to clean indoor air. Avoid them, and avoid air cleaners that advertise ozone output. HEPA filtration is the safer choice.',
      category: 'avoid',
      effort: 'instant',
      impact: 'moderate',
      relatedFactors: ['inadequate_filtration'],
    }),
  },
  {
    when: () => true,
    build: () => ({
      id: 'plants-do-not-replace-filtration',
      title: 'Do not rely on houseplants to clean the air',
      description:
        'A few indoor plants look good but do not provide meaningful particle filtration at normal indoor concentrations. Keep plants for wellbeing, not as a substitute for ventilation, source control or a HEPA filter.',
      category: 'avoid',
      effort: 'instant',
      impact: 'supporting',
      relatedFactors: ['inadequate_filtration'],
    }),
  },
  {
    when: (a) =>
      isAny(a.visibleDust, ['sometimes', 'often']) ||
      isAny(a.cleaningFrequency, ['weekly', 'rarely']),
    build: () => ({
      id: 'avoid-dry-sweeping',
      title: 'Avoid dry sweeping and feather dusting',
      description:
        'These methods launch settled dust back into the air where it can be inhaled. A damp cloth, a damp mop or a HEPA vacuum keeps the dust in the cloth or bin instead.',
      category: 'avoid',
      effort: 'instant',
      impact: 'moderate',
      relatedFactors: ['dust_accumulation'],
    }),
  },
  {
    when: (a) => hasVisibleMould(a) || isAny(a.dampness, ['minor', 'significant']),
    build: () => ({
      id: 'avoid-masking-damp-odours',
      title: 'Do not mask damp smells with fresheners',
      description:
        'Air fresheners and scented sprays add more particles and volatile compounds without removing moisture. If a room smells musty, find and dry the damp source instead.',
      category: 'avoid',
      effort: 'instant',
      impact: 'supporting',
      relatedFactors: ['dampness_mould'],
    }),
  },
  {
    when: (a) => isAny(a.cookingFuel, ['biomass', 'kerosene']) || isAny(a.candles, ['frequently']),
    build: () => ({
      id: 'avoid-unvented-burning',
      title: 'Avoid unvented burning indoors',
      description:
        'Never burn wood, coal, kerosene or candles in a closed room without exhaust. If burning is unavoidable, keep a window or exhaust fan running and keep children away from the smoke.',
      category: 'avoid',
      effort: 'instant',
      impact: 'moderate',
      relatedFactors: ['cooking_emissions', 'indoor_combustion'],
    }),
  },
  {
    when: () => true,
    build: () => ({
      id: 'avoid-blind-window-opening',
      title: 'Avoid opening windows blindly during outdoor pollution',
      description:
        'Ventilation only helps when outdoor air is cleaner than indoor air. On polluted days, ventilate briefly at cleaner hours instead of leaving windows open all day, and check the outdoor reading first.',
      category: 'avoid',
      effort: 'instant',
      impact: 'supporting',
      relatedFactors: ['poor_ventilation'],
      outdoorSensitive: true,
    }),
  },
];

/* -------------------------------------------------------------------------- */
/* Outdoor-sensitive ventilation actions                                      */
/* -------------------------------------------------------------------------- */

function ventilationRecommendations(guidance: VentilationGuidance): IndoorRecommendation[] {
  switch (guidance.posture) {
    case 'ventilate':
      return [
        {
          id: 'ventilate-now',
          title: 'Air the home while outdoor air is suitable',
          description:
            'Outdoor air is relatively clean right now, so this is a good time for a short cross-ventilation burst. Open windows on two sides for a few minutes, then close them again.',
          category: 'immediate',
          effort: 'minutes',
          impact: 'high',
          relatedFactors: ['poor_ventilation', 'cooking_emissions'],
          outdoorSensitive: true,
        },
      ];
    case 'ventilate-with-caution':
      return [
        {
          id: 'ventilate-briefly',
          title: 'Ventilate briefly, at cleaner hours',
          description:
            'Outdoor air is not clean enough for windows to stay open. Use short ventilation bursts — five to ten minutes — earlier or later in the day, and keep the kitchen exhaust running while cooking.',
          category: 'immediate',
          effort: 'minutes',
          impact: 'moderate',
          relatedFactors: ['poor_ventilation', 'cooking_emissions'],
          outdoorSensitive: true,
        },
      ];
    case 'keep-closed-filter':
      return [
        {
          id: 'keep-windows-closed',
          title: 'Keep windows closed while outdoor air is polluted',
          description:
            'With high outdoor pollution, wide-open windows can make indoor air worse. Close them, keep the kitchen exhaust on, and run a HEPA purifier in the room you use most. Ventilate briefly only when the outdoor reading improves.',
          category: 'immediate',
          effort: 'instant',
          impact: 'high',
          relatedFactors: ['poor_ventilation', 'inadequate_filtration'],
          outdoorSensitive: true,
        },
        {
          id: 'filter-indoor-air-today',
          title: 'Lean on filtration and source control today',
          description:
            'On a polluted outdoor day, focus on what you can control indoors: avoid burning anything, cook with exhaust on, and give the purifier a clear space to work. Do not seal a room where someone is smoking or burning coils.',
          category: 'immediate',
          effort: 'minutes',
          impact: 'moderate',
          relatedFactors: ['inadequate_filtration', 'indoor_combustion'],
          outdoorSensitive: true,
        },
      ];
    case 'unknown':
    default:
      return [
        {
          id: 'check-outdoor-before-ventilating',
          title: 'Check outdoor air before ventilating',
          description:
            'Outdoor conditions are not available to this assessment, so ventilation advice stays general. Look up a trusted local reading before opening windows for a long period — especially on hazy days.',
          category: 'low-cost',
          effort: 'instant',
          impact: 'supporting',
          relatedFactors: ['poor_ventilation'],
          outdoorSensitive: true,
        },
      ];
  }
}

/* -------------------------------------------------------------------------- */
/* Assembly                                                                   */
/* -------------------------------------------------------------------------- */

/** Safety guidance that must appear even when its section was skipped. */
const ALWAYS_SHOWN = new Set([
  'avoid-ozone-generators',
  'plants-do-not-replace-filtration',
  'avoid-blind-window-opening',
]);

export function buildRecommendations(
  answers: QuestionnaireAnswers,
  factors: RiskFactor[],
  guidance: VentilationGuidance,
): IndoorRecommendation[] {
  const factorIds = new Set<FactorId>(factors.filter((f) => f.assessed).map((f) => f.id));

  const selected: IndoorRecommendation[] = [];

  for (const rule of RULES) {
    if (!rule.when(answers)) continue;
    const recommendation = rule.build(answers);
    if (ALWAYS_SHOWN.has(recommendation.id)) {
      selected.push(recommendation);
      continue;
    }
    // Only attach recommendations whose related factors were actually assessed,
    // so skipped sections never produce confident guidance.
    const related = recommendation.relatedFactors.filter((id) => factorIds.has(id));
    if (related.length === 0) continue;
    selected.push({ ...recommendation, relatedFactors: related });
  }

  selected.push(...ventilationRecommendations(guidance));

  // Always give the household at least a small, safe action plan.
  if (selected.filter((item) => item.category !== 'avoid').length < 3) {
    selected.push({
      id: 'keep-a-simple-air-routine',
      title: 'Keep a simple daily air routine',
      description:
        'Cook with exhaust on, air the home when outdoor air allows, dust with a damp cloth, and fix damp patches early. Small consistent habits matter more than one-off deep cleans.',
      category: 'low-cost',
      effort: 'minutes',
      impact: 'supporting',
      relatedFactors: [],
    });
  }

  const seen = new Set<string>();
  const deduped = selected.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  return deduped.sort((a, b) => {
    const categoryDelta = CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category];
    if (categoryDelta !== 0) return categoryDelta;
    const impactDelta = IMPACT_ORDER[a.impact] - IMPACT_ORDER[b.impact];
    if (impactDelta !== 0) return impactDelta;
    return a.id.localeCompare(b.id);
  });
}

/** Convenience for UIs that group the action plan. */
export const RECOMMENDATION_GROUPS: Array<{
  category: IndoorRecommendation['category'];
  title: string;
  description: string;
}> = [
  {
    category: 'immediate',
    title: 'Immediate actions',
    description: 'Things worth doing today, usually at no cost.',
  },
  {
    category: 'low-cost',
    title: 'Free or low-cost improvements',
    description: 'Low-effort habits and small purchases.',
  },
  {
    category: 'long-term',
    title: 'Long-term improvements',
    description: 'Upgrades and repairs to plan for.',
  },
  {
    category: 'avoid',
    title: 'Habits to avoid',
    description: 'Common practices that can make indoor air worse.',
  },
];

/** Exposed for tests and for integrators who want the raw finding text. */
export function getFinding(questionId: string, value: string | undefined): string | undefined {
  if (!value) return undefined;
  const question = QUESTION_MAP[questionId];
  return question?.options.find((option) => option.value === value)?.finding;
}
