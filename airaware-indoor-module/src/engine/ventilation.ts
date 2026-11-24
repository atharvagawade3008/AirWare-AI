import type {
  OutdoorAirContext,
  OutdoorFreshness,
  VentilationGuidance,
  VentilationPosture,
} from '../types/indoor';

/**
 * Outdoor-context interpretation and ventilation advice.
 *
 * This module never fetches outdoor data and never invents an AQI. It only
 * interprets a context object supplied by the parent AirAware application.
 */

export type OutdoorBand =
  | 'clean'
  | 'moderate'
  | 'elevated'
  | 'high'
  | 'very-high'
  | 'unknown';

export interface OutdoorClassification {
  band: OutdoorBand;
  /** True only when a finite, non-negative numeric AQI was supplied. */
  hasNumericAqi: boolean;
  /** True when the context is usable enough to shape the advice. */
  usable: boolean;
}

/** Band boundaries used for ventilation advice (AQI index points). */
export const AQI_BANDS = {
  cleanMax: 50,
  moderateMax: 100,
  elevatedMax: 150,
  highMax: 200,
} as const;

export function classifyOutdoorAqi(aqi: number): OutdoorBand {
  if (!Number.isFinite(aqi) || aqi < 0) return 'unknown';
  if (aqi <= AQI_BANDS.cleanMax) return 'clean';
  if (aqi <= AQI_BANDS.moderateMax) return 'moderate';
  if (aqi <= AQI_BANDS.elevatedMax) return 'elevated';
  if (aqi <= AQI_BANDS.highMax) return 'high';
  return 'very-high';
}

const CATEGORY_HINTS: Array<{ pattern: RegExp; band: OutdoorBand }> = [
  { pattern: /severe|hazardous/i, band: 'very-high' },
  { pattern: /very\s+poor|very\s+unhealthy/i, band: 'very-high' },
  { pattern: /moderate(?:ly)?\s+polluted|unhealthy\s+for\s+sensitive/i, band: 'elevated' },
  { pattern: /poor|unhealthy/i, band: 'high' },
  { pattern: /moderate|satisfactory|acceptable/i, band: 'moderate' },
  { pattern: /good|clean|excellent/i, band: 'clean' },
];

/**
 * Maps a provider category label to a coarse band. Used only when no numeric
 * AQI is available; it never produces a number.
 */
export function classifyOutdoorCategory(category?: string): OutdoorBand {
  if (!category) return 'unknown';
  const match = CATEGORY_HINTS.find((hint) => hint.pattern.test(category));
  return match ? match.band : 'unknown';
}

export function classifyOutdoorContext(context?: OutdoorAirContext): OutdoorClassification {
  if (!context || context.freshness === 'unavailable') {
    return { band: 'unknown', hasNumericAqi: false, usable: false };
  }

  const hasNumericAqi =
    typeof context.aqi === 'number' && Number.isFinite(context.aqi) && context.aqi >= 0;

  if (hasNumericAqi) {
    const band = classifyOutdoorAqi(context.aqi as number);
    return { band, hasNumericAqi: true, usable: band !== 'unknown' };
  }

  const band = classifyOutdoorCategory(context.category);
  return { band, hasNumericAqi: false, usable: band !== 'unknown' };
}

const FRESHNESS_LABEL: Record<OutdoorFreshness, string> = {
  fresh: 'recent',
  delayed: 'delayed',
  stale: 'stale',
  unavailable: 'unavailable',
};

const POSTURE_BY_BAND: Record<Exclude<OutdoorBand, 'unknown'>, VentilationPosture> = {
  clean: 'ventilate',
  moderate: 'ventilate',
  elevated: 'ventilate-with-caution',
  high: 'keep-closed-filter',
  'very-high': 'keep-closed-filter',
};

/** Stale or unavailable data must not unlock confident "open the windows" advice. */
function degradePosture(posture: VentilationPosture): VentilationPosture {
  if (posture === 'ventilate') return 'ventilate-with-caution';
  if (posture === 'ventilate-with-caution') return 'keep-closed-filter';
  return posture;
}

function summaryFor(context: OutdoorAirContext, classification: OutdoorClassification): string | undefined {
  if (!classification.usable) return undefined;

  const parts: string[] = [];
  if (classification.hasNumericAqi) {
    parts.push(`Outdoor AQI ${Math.round(context.aqi as number)}`);
  } else if (context.category) {
    parts.push(`Outdoor category: ${context.category}`);
  }
  if (context.category && classification.hasNumericAqi) {
    parts.push(context.category);
  }
  if (context.source) parts.push(`source: ${context.source}`);
  if (context.freshness !== 'fresh') {
    parts.push(`data marked ${FRESHNESS_LABEL[context.freshness]}`);
  } else {
    parts.push('data marked recent');
  }
  return parts.join(' · ');
}

const COPY: Record<
  VentilationPosture,
  { headline: string; detail: string }
> = {
  ventilate: {
    headline: 'Outdoor air looks suitable for ventilation',
    detail:
      'Open windows on opposite sides of the home for a few minutes at a time to flush out cooking and household pollutants. Cross-ventilation works better than a single open window.',
  },
  'ventilate-with-caution': {
    headline: 'Ventilate in short bursts when outdoor air is cleaner',
    detail:
      'Open windows briefly — early morning or late evening are often calmer — then close them. Keep the kitchen exhaust running while you cook and let a purifier help in the room you use most.',
  },
  'keep-closed-filter': {
    headline: 'Keep windows closed while outdoor air is polluted',
    detail:
      'Prioritise indoor source control and filtration today rather than wide-open windows. If you need fresh air, ventilate briefly when the outdoor reading improves, and avoid the busiest traffic hours.',
  },
  unknown: {
    headline: 'Time ventilation with local outdoor conditions',
    detail:
      'Fresh air still matters, but the best time to open windows depends on outdoor pollution where you live. Check a trusted local air-quality reading before airing the home for long periods.',
  },
};

/**
 * Builds ventilation guidance from an optional parent-supplied outdoor context.
 * Pure and deterministic: same context in, same guidance out.
 */
export function getVentilationGuidance(context?: OutdoorAirContext): VentilationGuidance {
  /* No context at all — show general guidance and say why it is general. */
  if (!context) {
    return {
      posture: 'unknown',
      ...COPY.unknown,
      basedOnOutdoorData: false,
      limitations: [
        'No outdoor air-quality reading was provided, so this advice cannot be timed to your local conditions.',
        'This module does not measure or estimate outdoor AQI.',
      ],
    };
  }

  const classification = classifyOutdoorContext(context);
  const limitations: string[] = [];

  if (context.freshness === 'unavailable') {
    return {
      posture: 'unknown',
      ...COPY.unknown,
      basedOnOutdoorData: false,
      outdoorSummary: 'Outdoor air data is currently unavailable.',
      limitations: [
        'Outdoor air-quality data is currently unavailable, so ventilation timing is general guidance only.',
        'This module does not estimate or substitute an outdoor AQI when data is missing.',
      ],
    };
  }

  if (!classification.usable) {
    return {
      posture: 'unknown',
      ...COPY.unknown,
      basedOnOutdoorData: false,
      limitations: [
        'The provided outdoor context did not include a usable AQI value or a recognised category, so ventilation timing is general guidance only.',
        'Confirm current outdoor conditions with a trusted local source before airing the home for long periods.',
      ],
    };
  }

  const summary = summaryFor(context, classification);
  const basePosture = POSTURE_BY_BAND[classification.band as Exclude<OutdoorBand, 'unknown'>];

  let posture = basePosture;
  if (context.freshness === 'stale') {
    posture = degradePosture(posture);
    limitations.push(
      'The outdoor reading is stale, so treat this as a precaution rather than a current recommendation. Re-check local air quality before ventilating.',
    );
  } else if (context.freshness === 'delayed') {
    limitations.push(
      'The outdoor reading is delayed, so conditions may have changed since it was recorded.',
    );
  }

  if (!classification.hasNumericAqi) {
    limitations.push(
      'No numeric outdoor AQI was provided; the advice uses the reported category only.',
    );
  }

  if (posture === 'keep-closed-filter') {
    limitations.push(
      'Closing windows traps indoor pollutants too — keep cooking exhaust on and use filtration, and ventilate briefly when outdoor air improves.',
    );
  }

  return {
    posture,
    ...COPY[posture],
    basedOnOutdoorData: true,
    outdoorSummary: summary,
    limitations,
  };
}
