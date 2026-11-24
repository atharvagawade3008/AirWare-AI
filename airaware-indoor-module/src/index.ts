/**
 * AirAware AI — Indoor Air Doctor module
 *
 * Public entry point. The parent application only needs:
 *   import { IndoorAirDoctor } from 'airaware-indoor-module';
 *   <IndoorAirDoctor outdoorContext={ctx} onAssessmentComplete={handle} />
 *
 * See INTEGRATION.md for copy-in instructions.
 */

export { IndoorAirDoctor, IndoorAirDoctor as default } from './IndoorAirDoctor';

export type {
  BuildAssessmentOptions,
  ConfidenceLevel,
  FactorId,
  IndoorAirDoctorProps,
  IndoorAssessment,
  IndoorRecommendation,
  OutdoorAirContext,
  OutdoorFreshness,
  Question,
  QuestionId,
  QuestionOption,
  QuestionnaireAnswers,
  RecommendationCategory,
  RecommendationEffort,
  RecommendationImpact,
  RiskFactor,
  RiskLevel,
  ScoreEscalation,
  Section,
  SectionId,
  VentilationGuidance,
  VentilationPosture,
} from './types/indoor';

export {
  BAND_THRESHOLDS,
  DISCLAIMER,
  FACTOR_DEFINITIONS,
  FACTOR_LABELS,
  NEUTRAL_FACTOR_RATIO,
  applyCompoundingRisk,
  answerRisk,
  bandForScore,
  buildAssessment,
  buildRiskFactors,
  clampScore,
  computeFactorScores,
  computeRiskScore,
  confidenceForCompleteness,
  countAnswered,
  sanitizeAnswers,
  severityForScore,
} from './engine/scoring';
export type { FactorComputation } from './engine/scoring';

export {
  AQI_BANDS,
  classifyOutdoorAqi,
  classifyOutdoorCategory,
  classifyOutdoorContext,
  getVentilationGuidance,
} from './engine/ventilation';
export type { OutdoorBand, OutdoorClassification } from './engine/ventilation';

export { RECOMMENDATION_GROUPS, buildRecommendations } from './engine/recommendations';

export {
  QUESTIONS,
  QUESTION_MAP,
  SECTIONS,
  TOTAL_QUESTIONS,
  getQuestionsForSection,
  getSection,
} from './data/questions';
