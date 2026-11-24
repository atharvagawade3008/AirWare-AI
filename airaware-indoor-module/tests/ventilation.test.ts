import {
  AQI_BANDS,
  classifyOutdoorAqi,
  classifyOutdoorCategory,
  classifyOutdoorContext,
  getVentilationGuidance,
} from '../src';
import type { OutdoorAirContext } from '../src';
import {
  cleanOutdoor,
  delayedOutdoor,
  pollutedOutdoor,
  staleOutdoor,
  unavailableOutdoor,
} from './fixtures';

function context(overrides: Partial<OutdoorAirContext>): OutdoorAirContext {
  return { freshness: 'fresh', ...overrides };
}

describe('AQI banding', () => {
  it('maps index points to the documented bands', () => {
    expect(classifyOutdoorAqi(0)).toBe('clean');
    expect(classifyOutdoorAqi(AQI_BANDS.cleanMax)).toBe('clean');
    expect(classifyOutdoorAqi(AQI_BANDS.cleanMax + 1)).toBe('moderate');
    expect(classifyOutdoorAqi(AQI_BANDS.moderateMax)).toBe('moderate');
    expect(classifyOutdoorAqi(AQI_BANDS.elevatedMax)).toBe('elevated');
    expect(classifyOutdoorAqi(AQI_BANDS.highMax)).toBe('high');
    expect(classifyOutdoorAqi(AQI_BANDS.highMax + 1)).toBe('very-high');
  });

  it('rejects invalid numbers instead of coercing them', () => {
    expect(classifyOutdoorAqi(Number.NaN)).toBe('unknown');
    expect(classifyOutdoorAqi(Number.POSITIVE_INFINITY)).toBe('unknown');
    expect(classifyOutdoorAqi(-5)).toBe('unknown');
  });

  it('recognises common provider categories without inventing a number', () => {
    expect(classifyOutdoorCategory('Good')).toBe('clean');
    expect(classifyOutdoorCategory('Satisfactory')).toBe('moderate');
    expect(classifyOutdoorCategory('Moderately Polluted')).toBe('elevated');
    expect(classifyOutdoorCategory('Poor')).toBe('high');
    expect(classifyOutdoorCategory('Very Poor')).toBe('very-high');
    expect(classifyOutdoorCategory('Severe')).toBe('very-high');
    expect(classifyOutdoorCategory('Unrecognised')).toBe('unknown');
  });

  it('marks unavailable context unusable even if a stale number is attached', () => {
    const result = classifyOutdoorContext(context({ aqi: 120, freshness: 'unavailable' }));
    expect(result.usable).toBe(false);
    expect(result.hasNumericAqi).toBe(false);
  });
});

describe('ventilation guidance — fresh outdoor data', () => {
  it('advises ventilation when outdoor air is clean', () => {
    const guidance = getVentilationGuidance(cleanOutdoor);
    expect(guidance.posture).toBe('ventilate');
    expect(guidance.basedOnOutdoorData).toBe(true);
    expect(guidance.limitations).toHaveLength(0);
    expect(guidance.outdoorSummary).toContain('Outdoor AQI 38');
    expect(guidance.outdoorSummary).toContain('Test fixture');
  });

  it('advises short bursts at elevated pollution', () => {
    expect(getVentilationGuidance(context({ aqi: 120 })).posture).toBe('ventilate-with-caution');
  });

  it('keeps windows closed and recommends filtration at high outdoor pollution', () => {
    const guidance = getVentilationGuidance(pollutedOutdoor);
    expect(guidance.posture).toBe('keep-closed-filter');
    expect(guidance.detail).toMatch(/keep windows closed/i);
    expect(guidance.limitations.join(' ')).toMatch(/traps indoor pollutants/i);
  });

  it('handles category-only context without a numeric AQI', () => {
    const guidance = getVentilationGuidance(context({ category: 'Poor' }));
    expect(guidance.posture).toBe('keep-closed-filter');
    expect(guidance.basedOnOutdoorData).toBe(true);
    expect(guidance.limitations.join(' ')).toMatch(/no numeric outdoor aqi/i);
  });

  it('falls back to general guidance for an unusable context', () => {
    const guidance = getVentilationGuidance(context({ category: 'Unrecognised label' }));
    expect(guidance.posture).toBe('unknown');
    expect(guidance.basedOnOutdoorData).toBe(false);
    expect(guidance.limitations.length).toBeGreaterThan(0);
  });
});

describe('ventilation guidance — stale, delayed and missing data', () => {
  it('downgrades clean advice when the reading is stale and says so', () => {
    const guidance = getVentilationGuidance(staleOutdoor);
    expect(guidance.posture).toBe('ventilate-with-caution');
    expect(guidance.limitations.join(' ')).toMatch(/stale/i);
    expect(guidance.outdoorSummary).toContain('stale');
  });

  it('flags delayed data but still reacts to the reported pollution', () => {
    const guidance = getVentilationGuidance(delayedOutdoor);
    expect(guidance.posture).toBe('ventilate-with-caution');
    expect(guidance.limitations.join(' ')).toMatch(/delayed/i);
  });

  it('never advises ventilation when the outdoor context is unavailable', () => {
    const guidance = getVentilationGuidance(unavailableOutdoor);
    expect(guidance.posture).toBe('unknown');
    expect(guidance.basedOnOutdoorData).toBe(false);
    expect(guidance.limitations.join(' ')).toMatch(/unavailable/i);
    expect(guidance.outdoorSummary).toMatch(/unavailable/i);
  });

  it('gives general guidance when no context object is supplied', () => {
    const guidance = getVentilationGuidance(undefined);
    expect(guidance.posture).toBe('unknown');
    expect(guidance.basedOnOutdoorData).toBe(false);
    expect(guidance.limitations.join(' ')).toMatch(/no outdoor air-quality reading/i);
    expect(guidance.headline).toMatch(/local outdoor conditions/i);
  });

  it('is deterministic for the same input', () => {
    expect(getVentilationGuidance(pollutedOutdoor)).toEqual(getVentilationGuidance(pollutedOutdoor));
  });
});
