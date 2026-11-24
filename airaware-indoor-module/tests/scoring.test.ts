import {
  BAND_THRESHOLDS,
  DISCLAIMER,
  FACTOR_DEFINITIONS,
  NEUTRAL_FACTOR_RATIO,
  applyCompoundingRisk,
  bandForScore,
  buildAssessment,
  computeFactorScores,
  computeRiskScore,
  sanitizeAnswers,
  severityForScore,
} from '../src';
import type { IndoorAssessment } from '../src';
import {
  cleanOutdoor,
  pollutedOutdoor,
  scenarioA,
  scenarioB,
  scenarioC,
} from './fixtures';

const NOW = new Date('2026-11-24T09:30:00.000Z');

function build(answers: Parameters<typeof buildAssessment>[0]) {
  return buildAssessment(answers, { now: NOW });
}

describe('scoring engine — determinism and structure', () => {
  it('returns the documented assessment shape with a deterministic score', () => {
    const first = build(scenarioA);
    const second = build(scenarioA);

    expect(first.assessmentTimestamp).toBe(NOW.toISOString());
    expect(second.assessmentTimestamp).toBe(first.assessmentTimestamp);
    expect(second.riskScore).toBe(first.riskScore);
    expect(second.overallRisk).toBe(first.overallRisk);

    expect(['low', 'moderate', 'high']).toContain(first.overallRisk);
    expect(Number.isInteger(first.riskScore)).toBe(true);
    expect(first.riskScore).toBeGreaterThanOrEqual(0);
    expect(first.riskScore).toBeLessThanOrEqual(100);
    expect(first.assessmentTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(first.disclaimer).toBe(DISCLAIMER);
  });

  it('states clearly that the result is not a measurement or a diagnosis', () => {
    expect(DISCLAIMER).toMatch(/not a measurement/i);
    expect(DISCLAIMER).toMatch(/not a medical diagnosis/i);
    expect(DISCLAIMER).toMatch(/Indoor Air Risk Assessment/i);
  });

  it('uses six documented factors whose weights sum to 1', () => {
    expect(FACTOR_DEFINITIONS).toHaveLength(6);
    const weightSum = FACTOR_DEFINITIONS.reduce((sum, factor) => sum + factor.weight, 0);
    expect(weightSum).toBeCloseTo(1, 10);
    expect(FACTOR_DEFINITIONS.map((factor) => factor.id)).toEqual([
      'cooking_emissions',
      'indoor_combustion',
      'poor_ventilation',
      'dust_accumulation',
      'dampness_mould',
      'inadequate_filtration',
    ]);
  });
});

describe('risk categorisation', () => {
  it('maps index values to bands at the documented thresholds', () => {
    expect(bandForScore(0)).toBe('low');
    expect(bandForScore(BAND_THRESHOLDS.moderateMin - 1)).toBe('low');
    expect(bandForScore(BAND_THRESHOLDS.moderateMin)).toBe('moderate');
    expect(bandForScore(BAND_THRESHOLDS.highMin - 1)).toBe('moderate');
    expect(bandForScore(BAND_THRESHOLDS.highMin)).toBe('high');
    expect(bandForScore(100)).toBe('high');
  });

  it('maps factor scores to severity labels at 30 and 60', () => {
    expect(severityForScore(0)).toBe('low');
    expect(severityForScore(29)).toBe('low');
    expect(severityForScore(30)).toBe('moderate');
    expect(severityForScore(59)).toBe('moderate');
    expect(severityForScore(60)).toBe('high');
  });
});

describe('scenario A — gas cooking, poor kitchen ventilation, frequent coils', () => {
  const assessment = buildAssessment(scenarioA, {
    now: NOW,
    outdoorContext: pollutedOutdoor,
  });

  it('flags a high overall risk', () => {
    expect(assessment.overallRisk).toBe('high');
  });

  it('identifies cooking emissions as the leading factor, with explainable evidence', () => {
    const cooking = assessment.identifiedFactors.find((f) => f.id === 'cooking_emissions');
    expect(cooking).toBeDefined();
    expect(cooking?.severity).toBe('high');
    expect(cooking?.evidence.join(' ')).toMatch(/no exhaust fan or chimney/i);
    expect(cooking?.evidence.join(' ')).toMatch(/frequently spreads into other rooms/i);
    expect(assessment.identifiedFactors[0].id).toBe('cooking_emissions');
  });

  it('records the unvented-combustion compounding rule', () => {
    expect(assessment.escalation?.applied).toBe(true);
    expect(assessment.escalation?.reason).toMatch(/combustion/i);
    expect(assessment.scoreBand).not.toBe('high');
  });

  it('produces combustion, kitchen-exhaust and coil recommendations', () => {
    const ids = assessment.recommendations.map((item) => item.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'use-kitchen-exhaust',
        'reduce-coils-and-incense',
        'install-kitchen-exhaust',
      ]),
    );
  });
});

describe('scenario B — well-ventilated apartment, no combustion, no dampness', () => {
  const assessment = buildAssessment(scenarioB, { now: NOW, outdoorContext: cleanOutdoor });

  it('flags a low overall risk and low index', () => {
    expect(assessment.overallRisk).toBe('low');
    expect(assessment.riskScore).toBeLessThan(BAND_THRESHOLDS.moderateMin);
    expect(assessment.completeness).toBe(1);
    expect(assessment.confidence).toBe('high');
    expect(assessment.escalation).toBeUndefined();
  });

  it('does not suggest a purifier when one is already maintained', () => {
    const ids = assessment.recommendations.map((item) => item.id);
    expect(ids).not.toContain('choose-hepa-purifier');
    expect(ids).not.toContain('make-home-smoke-free');
  });

  it('still includes general safety guidance', () => {
    const ids = assessment.recommendations.map((item) => item.id);
    expect(ids).toContain('avoid-ozone-generators');
    expect(ids).toContain('plants-do-not-replace-filtration');
  });
});

describe('scenario C — dampness, mould, dust and poor ventilation', () => {
  const assessment = buildAssessment(scenarioC, { now: NOW });

  it('flags a high overall risk with high dampness and dust factors', () => {
    expect(assessment.overallRisk).toBe('high');

    const dampness = assessment.identifiedFactors.find((f) => f.id === 'dampness_mould');
    const dust = assessment.identifiedFactors.find((f) => f.id === 'dust_accumulation');
    const ventilation = assessment.identifiedFactors.find((f) => f.id === 'poor_ventilation');

    expect(dampness?.severity).toBe('high');
    expect(dampness?.score).toBe(100);
    expect(dust?.severity).toBe('high');
    expect(ventilation?.severity).toBe('high');
  });

  it('recommends dampness and mould remediation before equipment', () => {
    const ids = assessment.recommendations.map((item) => item.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'fix-leaks-quickly',
        'remove-mould-safely',
        'lower-indoor-humidity',
        'damp-dusting-routine',
      ]),
    );
  });
});

describe('missing and skipped answers', () => {
  it('treats skipped answers as unknown, never as clean air', () => {
    const empty = buildAssessment({}, { now: NOW });

    expect(empty.answeredQuestions).toBe(0);
    expect(empty.completeness).toBe(0);
    expect(empty.confidence).toBe('low');
    expect(empty.identifiedFactors).toHaveLength(0);
    expect(empty.riskScore).toBe(Math.round(NEUTRAL_FACTOR_RATIO * 100));
    expect(empty.overallRisk).toBe('moderate');
    expect(empty.ventilationGuidance.posture).toBe('unknown');
  });

  it('ignores unknown question ids and invalid option values', () => {
    const sanitized = sanitizeAnswers({
      cookingFuel: 'plutonium',
      // @ts-expect-error — unknown question id is dropped on purpose
      madeUpQuestion: 'yes',
      kitchenExhaust: 'none',
    });

    expect(sanitized).toEqual({ kitchenExhaust: 'none' });
  });

  it('does not penalise a partly answered factor for the questions that were skipped', () => {
    const onlyExhaust = computeFactorScores({ kitchenExhaust: 'none' });
    const cooking = onlyExhaust.find((factor) => factor.id === 'cooking_emissions');

    expect(cooking?.assessed).toBe(true);
    expect(cooking?.answered).toBe(1);
    expect(cooking?.total).toBe(4);
    expect(cooking?.score).toBe(100);
  });

  it('reports partial completion with reduced confidence', () => {
    const partial = buildAssessment(
      {
        cookingFuel: 'lpg',
        kitchenExhaust: 'none',
        kitchenVentilation: 'poor',
      },
      { now: NOW },
    );

    expect(partial.completeness).toBeLessThan(0.2);
    expect(partial.confidence).toBe('low');
    expect(partial.identifiedFactors.map((factor) => factor.id)).toEqual(['cooking_emissions']);
    expect(partial.answeredQuestions).toBe(3);
    expect(partial.totalQuestions).toBe(20);
  });

  it('keeps the score inside 0–100 for any combination', () => {
    const combinations = [scenarioA, scenarioB, scenarioC, {}, { cookingFuel: 'biomass' }];
    for (const answers of combinations) {
      const score = computeRiskScore(answers);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  it('never escalates above the high band', () => {
    const worst = applyCompoundingRisk(
      {
        cookingFuel: 'biomass',
        kitchenExhaust: 'none',
        smokeSpread: 'often',
        kitchenVentilation: 'poor',
        dampness: 'significant',
        mould: 'widespread',
        leakage: 'persistent',
        windowOpening: 'never',
        ventilationRestriction: 'sealed',
      },
      'high',
    );

    expect(worst.band).toBe('high');
    expect(worst.reason).toBeUndefined();
  });
});

describe('outdoor context is carried through the assessment', () => {
  it('echoes the supplied context and adapts ventilation guidance', () => {
    const clean = buildAssessment(scenarioB, { now: NOW, outdoorContext: cleanOutdoor });
    const polluted = buildAssessment(scenarioB, { now: NOW, outdoorContext: pollutedOutdoor });

    expect(clean.outdoorContext).toEqual(cleanOutdoor);
    expect(clean.ventilationGuidance.posture).toBe('ventilate');
    expect(polluted.ventilationGuidance.posture).toBe('keep-closed-filter');
    expect(clean.riskScore).toBe(polluted.riskScore);
  });

  it('does not attach a context when none was given', () => {
    const assessment: IndoorAssessment = buildAssessment(scenarioB, { now: NOW });
    expect(assessment.outdoorContext).toBeUndefined();
    expect(assessment.ventilationGuidance.basedOnOutdoorData).toBe(false);
  });
});
