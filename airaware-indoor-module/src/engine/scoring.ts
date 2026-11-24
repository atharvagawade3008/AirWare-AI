import { QUESTIONS, QUESTION_MAP, TOTAL_QUESTIONS } from '../data/questions';
import type {
  BuildAssessmentOptions,
  ConfidenceLevel,
  FactorId,
  IndoorAssessment,
  QuestionId,
  QuestionnaireAnswers,
  RiskFactor,
  RiskLevel,
} from '../types/indoor';
import { buildRecommendations } from './recommendations';
import { getVentilationGuidance } from './ventilation';

/**
 * Deterministic indoor air risk scoring engine.
 *
 * ASSUMPTIONS (documented in README + INTEGRATION):
 * 1. There are no indoor sensors. The score is an *indicative questionnaire
 *    index*, not a measured AQI, PM2.5 concentration or health prediction.
 * 2. Each answer carries a relative risk contribution between 0 and 1. These
 *    values rank known indoor pollution pathways against each other; they are
 *    not probabilities and are not derived from a clinical study.
 * 3. Questions are combined into six weighted risk factors. Within a factor,
 *    only answered questions count, so a partly answered factor is not
 *    penalised for what was skipped.
 * 4. A factor with no answers is given a neutral baseline (NEUTRAL_FACTOR_RATIO)
 *    rather than a zero. Missing answers are therefore never treated as
 *    evidence of clean air.
 * 5. Two documented compounding rules can raise the overall band by one level:
 *    unvented combustion, and persistent dampness without air exchange.
 * 6. The index is ordinal. Two homes scoring 40 and 45 should be read as
 *    broadly similar, not as a precise 12% difference.
 */

export const NEUTRAL_FACTOR_RATIO = 0.32;

export const BAND_THRESHOLDS = {
  moderateMin: 30,
  highMin: 55,
} as const;

export const DISCLAIMER =
  'This is an indicative Indoor Air Risk Assessment generated only from your questionnaire answers. It is not a measurement of indoor AQI, PM2.5 or any other pollutant, and it is not a medical diagnosis or a prediction of illness. Use it to decide which practical improvements to try first. If anyone in the household has breathing or other health concerns, speak to a qualified health professional.';

interface FactorDefinition {
  id: FactorId;
  title: string;
  /** Weight in the overall index. Weights sum to 1. */
  weight: number;
  questions: Array<{ id: QuestionId; weight: number }>;
  explanation: (ratio: number) => string;
}

export const FACTOR_DEFINITIONS: FactorDefinition[] = [
  {
    id: 'cooking_emissions',
    title: 'Cooking emissions',
    weight: 0.26,
    questions: [
      { id: 'cookingFuel', weight: 1.5 },
      { id: 'kitchenExhaust', weight: 2 },
      { id: 'smokeSpread', weight: 1.5 },
      { id: 'kitchenVentilation', weight: 1.5 },
    ],
    explanation: (ratio) =>
      ratio >= 0.6
        ? 'Cooking smoke and combustion by-products are not being captured at the stove, so they are likely spreading through the home.'
        : ratio >= 0.3
          ? 'Cooking adds some particles and gases indoors; better capture at the stove would reduce them.'
          : 'Cooking appears to be reasonably well managed, with smoke and combustion by-products largely kept out of living areas.',
  },
  {
    id: 'indoor_combustion',
    title: 'Indoor combustion & smoke',
    weight: 0.2,
    questions: [
      { id: 'indoorSmoking', weight: 2.5 },
      { id: 'incenseCoils', weight: 2.5 },
      { id: 'candles', weight: 1 },
    ],
    explanation: (ratio) =>
      ratio >= 0.6
        ? 'One or more significant indoor combustion sources are used regularly, adding fine particles and gases directly to the air you breathe.'
        : ratio >= 0.3
          ? 'There are some indoor combustion sources, such as incense, candles or occasional smoking.'
          : 'No significant indoor combustion sources were reported.',
  },
  {
    id: 'poor_ventilation',
    title: 'Limited fresh-air exchange',
    weight: 0.14,
    questions: [
      { id: 'windowOpening', weight: 1.5 },
      { id: 'windowSafety', weight: 1 },
      { id: 'ventilationRestriction', weight: 1 },
    ],
    explanation: (ratio) =>
      ratio >= 0.6
        ? 'The home has little fresh-air exchange, so pollutants can accumulate and stay indoors for longer.'
        : ratio >= 0.3
          ? 'Ventilation happens, but not consistently enough to reliably dilute indoor pollutants.'
          : 'The home appears to get regular fresh-air exchange.',
  },
  {
    id: 'dust_accumulation',
    title: 'Dust accumulation',
    weight: 0.15,
    questions: [
      { id: 'cleaningFrequency', weight: 1 },
      { id: 'visibleDust', weight: 1.5 },
      { id: 'carpetsCurtains', weight: 1 },
      { id: 'pets', weight: 1 },
    ],
    explanation: (ratio) =>
      ratio >= 0.6
        ? 'Cleaning frequency, visible dust and soft furnishings together suggest dust is building up and being re-suspended.'
        : ratio >= 0.3
          ? 'Some dust accumulation is likely, particularly around soft furnishings and low-traffic corners.'
          : 'Dust appears to be managed well through regular cleaning and few dust-holding furnishings.',
  },
  {
    id: 'dampness_mould',
    title: 'Dampness & mould',
    weight: 0.15,
    questions: [
      { id: 'dampness', weight: 1.25 },
      { id: 'mould', weight: 1.25 },
      { id: 'leakage', weight: 1 },
    ],
    explanation: (ratio) =>
      ratio >= 0.6
        ? 'Visible dampness, mould or persistent leakage indicates a moisture problem that will keep affecting indoor air until the source is fixed.'
        : ratio >= 0.3
          ? 'There are signs of occasional dampness that are worth catching before they become a larger moisture problem.'
          : 'No dampness, mould or leakage was reported.',
  },
  {
    id: 'inadequate_filtration',
    title: 'Filtration & maintenance gaps',
    weight: 0.1,
    questions: [
      { id: 'airPurifier', weight: 1.5 },
      { id: 'filterMaintenance', weight: 0.75 },
    ],
    explanation: (ratio) =>
      ratio >= 0.6
        ? 'There is little effective filtration or filter servicing, so particles that are already indoors have fewer ways to be removed.'
        : ratio >= 0.3
          ? 'Filtration is partial or not consistently maintained.'
          : 'Filtration and maintenance appear to be in reasonable shape.',
  },
];

const FACTOR_ID_ORDER = new Map<FactorId, number>(
  FACTOR_DEFINITIONS.map((definition, index) => [definition.id, index]),
);

export interface FactorComputation {
  id: FactorId;
  /** 0–1 risk ratio for this factor. */
  ratio: number;
  score: number;
  assessed: boolean;
  answered: number;
  total: number;
}

/** Reads the option risk contribution for one answer, or null if skipped. */
export function answerRisk(answers: QuestionnaireAnswers, questionId: QuestionId): number | null {
  const value = answers[questionId];
  if (!value) return null;
  const option = QUESTION_MAP[questionId]?.options.find((candidate) => candidate.value === value);
  if (!option) return null;
  return Math.min(1, Math.max(0, option.risk));
}

export function computeFactorScores(answers: QuestionnaireAnswers): FactorComputation[] {
  return FACTOR_DEFINITIONS.map((definition) => {
    let weightedRisk = 0;
    let answeredWeight = 0;
    let answered = 0;

    for (const question of definition.questions) {
      const risk = answerRisk(answers, question.id);
      if (risk === null) continue;
      weightedRisk += risk * question.weight;
      answeredWeight += question.weight;
      answered += 1;
    }

    const assessed = answeredWeight > 0;
    const ratio = assessed ? weightedRisk / answeredWeight : NEUTRAL_FACTOR_RATIO;

    return {
      id: definition.id,
      ratio,
      score: Math.round(ratio * 100),
      assessed,
      answered,
      total: definition.questions.length,
    };
  });
}

/** Weighted index across all six factors, 0–100. */
export function computeRiskScore(answers: QuestionnaireAnswers): number {
  const factors = computeFactorScores(answers);
  let weighted = 0;
  let totalWeight = 0;
  for (let index = 0; index < factors.length; index += 1) {
    const definition = FACTOR_DEFINITIONS[index];
    weighted += definition.weight * factors[index].ratio;
    totalWeight += definition.weight;
  }
  if (totalWeight === 0) return 0;
  return clampScore(Math.round((weighted / totalWeight) * 100));
}

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export function severityForScore(score: number): RiskLevel {
  if (score >= 60) return 'high';
  if (score >= 30) return 'moderate';
  return 'low';
}

/** Band implied by the index alone, before compounding rules. */
export function bandForScore(score: number): RiskLevel {
  if (score >= BAND_THRESHOLDS.highMin) return 'high';
  if (score >= BAND_THRESHOLDS.moderateMin) return 'moderate';
  return 'low';
}

function raiseBand(band: RiskLevel): RiskLevel {
  return band === 'low' ? 'moderate' : 'high';
}

interface CompoundingResult {
  band: RiskLevel;
  reason?: string;
}

/**
 * Documented compounding rules. Both describe combinations where one factor
 * makes another markedly worse; they raise the band by at most one level.
 */
export function applyCompoundingRisk(
  answers: QuestionnaireAnswers,
  baseBand: RiskLevel,
): CompoundingResult {
  const reasons: string[] = [];
  let band = baseBand;

  const solidFuel = answers.cookingFuel === 'biomass' || answers.cookingFuel === 'kerosene';
  const strongCombustion =
    solidFuel ||
    answers.smokeSpread === 'often' ||
    answers.indoorSmoking === 'daily' ||
    answers.incenseCoils === 'frequently' ||
    answers.incenseCoils === 'coilsNightly' ||
    answers.candles === 'frequently';
  const noCapturedExhaust =
    answers.kitchenExhaust === 'none' ||
    (answers.kitchenExhaust === 'windowOnly' && answers.kitchenVentilation === 'poor');

  if (strongCombustion && noCapturedExhaust && band !== 'high') {
    band = raiseBand(band);
    reasons.push(
      'Combustion indoors is combined with no effective exhaust at the source, so smoke is not being captured where it is produced.',
    );
  }

  const seriousDampness =
    answers.dampness === 'significant' ||
    answers.mould === 'widespread' ||
    answers.leakage === 'persistent';
  const moistureTrapped =
    answers.windowOpening === 'rarely' ||
    answers.windowOpening === 'never' ||
    answers.ventilationRestriction === 'sealed';

  if (seriousDampness && moistureTrapped && band !== 'high') {
    band = raiseBand(band);
    reasons.push(
      'Persistent dampness or mould is combined with limited air exchange, which keeps moisture trapped indoors.',
    );
  }

  return reasons.length > 0 ? { band, reason: reasons.join(' ') } : { band };
}

function collectEvidence(
  answers: QuestionnaireAnswers,
  definition: FactorDefinition,
): string[] {
  const findings: string[] = [];
  for (const question of definition.questions) {
    const value = answers[question.id];
    if (!value) continue;
    const option = QUESTION_MAP[question.id]?.options.find((candidate) => candidate.value === value);
    if (!option || !option.finding) continue;
    if (option.risk < 0.3) continue;
    if (!findings.includes(option.finding)) findings.push(option.finding);
  }
  return findings;
}

export function buildRiskFactors(answers: QuestionnaireAnswers): RiskFactor[] {
  const computations = computeFactorScores(answers);
  const factors: RiskFactor[] = [];

  computations.forEach((computation, index) => {
    if (!computation.assessed) return;
    const definition = FACTOR_DEFINITIONS[index];
    factors.push({
      id: computation.id,
      title: definition.title,
      severity: severityForScore(computation.score),
      score: computation.score,
      explanation: definition.explanation(computation.ratio),
      evidence: collectEvidence(answers, definition),
      relatedQuestionIds: definition.questions.map((question) => question.id),
      assessed: true,
    });
  });

  return factors.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (FACTOR_ID_ORDER.get(a.id) ?? 0) - (FACTOR_ID_ORDER.get(b.id) ?? 0);
  });
}

/** Drops unknown option values and unknown question ids from restored state. */
export function sanitizeAnswers(answers: QuestionnaireAnswers | undefined): QuestionnaireAnswers {
  if (!answers) return {};
  const clean: QuestionnaireAnswers = {};
  for (const question of QUESTIONS) {
    const value = answers[question.id];
    if (!value) continue;
    if (question.options.some((option) => option.value === value)) {
      clean[question.id] = value;
    }
  }
  return clean;
}

export function countAnswered(answers: QuestionnaireAnswers): number {
  return QUESTIONS.reduce((count, question) => (answers[question.id] ? count + 1 : count), 0);
}

export function confidenceForCompleteness(completeness: number): ConfidenceLevel {
  if (completeness >= 0.85) return 'high';
  if (completeness >= 0.6) return 'medium';
  return 'low';
}

/**
 * Builds a complete assessment from questionnaire answers.
 * Pure apart from the injected/default clock, which only affects the timestamp.
 */
export function buildAssessment(
  rawAnswers: QuestionnaireAnswers,
  options: BuildAssessmentOptions = {},
): IndoorAssessment {
  const answers = sanitizeAnswers(rawAnswers);
  const answeredQuestions = countAnswered(answers);
  const completeness = TOTAL_QUESTIONS === 0 ? 0 : answeredQuestions / TOTAL_QUESTIONS;
  const riskScore = computeRiskScore(answers);
  const scoreBand = bandForScore(riskScore);
  const compounding = applyCompoundingRisk(answers, scoreBand);
  const identifiedFactors = buildRiskFactors(answers);
  const ventilationGuidance = getVentilationGuidance(options.outdoorContext);
  const recommendations = buildRecommendations(answers, identifiedFactors, ventilationGuidance);

  const assessment: IndoorAssessment = {
    overallRisk: compounding.band,
    riskScore,
    identifiedFactors,
    recommendations,
    assessmentTimestamp: (options.now ?? new Date()).toISOString(),
    disclaimer: DISCLAIMER,
    scoreBand,
    completeness: Math.round(completeness * 1000) / 1000,
    confidence: confidenceForCompleteness(completeness),
    answeredQuestions,
    totalQuestions: TOTAL_QUESTIONS,
    ventilationGuidance,
  };

  if (compounding.reason) {
    assessment.escalation = { applied: compounding.band !== scoreBand, reason: compounding.reason };
  }
  if (options.outdoorContext) {
    assessment.outdoorContext = options.outdoorContext;
  }

  return assessment;
}
