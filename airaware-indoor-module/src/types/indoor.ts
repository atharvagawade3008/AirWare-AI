/**
 * Indoor Air Doctor — shared domain types.
 *
 * IMPORTANT: nothing in this module measures indoor air. Every value produced by
 * the engine is derived from household questionnaire answers and is described as
 * an *indicative* risk assessment, never as a measured AQI or PM2.5 reading.
 */

/* -------------------------------------------------------------------------- */
/* Questionnaire                                                              */
/* -------------------------------------------------------------------------- */

export type SectionId =
  | 'cooking'
  | 'activities'
  | 'dust'
  | 'moisture'
  | 'circulation'
  | 'equipment';

export interface Section {
  id: SectionId;
  /** Full heading used on the step screen. */
  title: string;
  /** Short label used by the progress indicator. */
  shortTitle: string;
  description: string;
  /** Lucide icon name; mapped to a component in the UI layer. */
  icon: string;
}

export type QuestionId =
  // Cooking & ventilation
  | 'cookingFuel'
  | 'kitchenExhaust'
  | 'smokeSpread'
  | 'kitchenVentilation'
  // Indoor activities
  | 'indoorSmoking'
  | 'incenseCoils'
  | 'candles'
  // Dust & cleanliness
  | 'cleaningFrequency'
  | 'visibleDust'
  | 'carpetsCurtains'
  | 'pets'
  // Moisture & dampness
  | 'dampness'
  | 'mould'
  | 'leakage'
  // Air circulation
  | 'windowOpening'
  | 'windowSafety'
  | 'ventilationRestriction'
  // Equipment
  | 'airPurifier'
  | 'filterMaintenance';

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
  /**
   * Relative risk contribution of this option, 0 (no added risk) to 1 (highest
   * risk). Consumed by the deterministic scoring engine; never shown as a
   * measurement or a probability.
   */
  risk: number;
  /**
   * Plain-language finding surfaced on the results screen when the answer
   * contributes meaningfully to a risk factor.
   */
  finding?: string;
}

export interface Question {
  id: QuestionId;
  section: SectionId;
  prompt: string;
  helpText?: string;
  options: QuestionOption[];
  /** All questions are skippable; kept explicit for UI copy and docs. */
  allowSkip: boolean;
}

/** Answers keyed by question id. A missing key means "skipped / not answered". */
export type QuestionnaireAnswers = Partial<Record<QuestionId, string>>;

/* -------------------------------------------------------------------------- */
/* Outdoor context provided by the parent application                         */
/* -------------------------------------------------------------------------- */

export type OutdoorFreshness = 'fresh' | 'delayed' | 'stale' | 'unavailable';

/**
 * Outdoor air context supplied by the parent AirAware application.
 * This module never fetches or invents outdoor data.
 */
export interface OutdoorAirContext {
  aqi?: number;
  category?: string;
  source?: string;
  freshness: OutdoorFreshness;
  lastUpdated?: string;
}

/* -------------------------------------------------------------------------- */
/* Assessment result                                                          */
/* -------------------------------------------------------------------------- */

export type RiskLevel = 'low' | 'moderate' | 'high';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type FactorId =
  | 'cooking_emissions'
  | 'indoor_combustion'
  | 'poor_ventilation'
  | 'dust_accumulation'
  | 'dampness_mould'
  | 'inadequate_filtration';

export interface RiskFactor {
  id: FactorId;
  title: string;
  severity: RiskLevel;
  /** Factor risk index, 0 (no concern indicated) to 100 (highest concern). */
  score: number;
  /** Short interpretation of this factor for this household. */
  explanation: string;
  /** Answer-derived observations that produced the factor score. */
  evidence: string[];
  relatedQuestionIds: QuestionId[];
  /** False when every question in the factor was skipped. */
  assessed: boolean;
}

export type RecommendationCategory =
  | 'immediate'
  | 'low-cost'
  | 'long-term'
  | 'avoid';

export type RecommendationEffort = 'instant' | 'minutes' | 'weekend' | 'investment';

export type RecommendationImpact = 'high' | 'moderate' | 'supporting';

export interface IndoorRecommendation {
  id: string;
  title: string;
  description: string;
  category: RecommendationCategory;
  effort: RecommendationEffort;
  impact: RecommendationImpact;
  relatedFactors: FactorId[];
  /** Marked when the advice changes with outdoor air conditions. */
  outdoorSensitive?: boolean;
}

export type VentilationPosture =
  | 'ventilate'
  | 'ventilate-with-caution'
  | 'keep-closed-filter'
  | 'unknown';

export interface VentilationGuidance {
  posture: VentilationPosture;
  headline: string;
  detail: string;
  /** Outdoor reading was usable for this advice (not stale/unavailable). */
  basedOnOutdoorData: boolean;
  /** Human-readable restatement of the provided outdoor context. */
  outdoorSummary?: string;
  /** Limitations the user must see (stale/unavailable data, no numeric AQI). */
  limitations: string[];
}

export interface ScoreEscalation {
  applied: boolean;
  reason: string;
}

export interface IndoorAssessment {
  overallRisk: RiskLevel;
  /** Indicative risk index, 0–100. Not a measured AQI or PM2.5 value. */
  riskScore: number;
  identifiedFactors: RiskFactor[];
  recommendations: IndoorRecommendation[];
  assessmentTimestamp: string;
  disclaimer: string;

  /* ------------------------- additive, documented ------------------------- */
  /** Band implied by the weighted index alone, before escalation rules. */
  scoreBand: RiskLevel;
  /** Share of questionnaire questions answered, 0–1. */
  completeness: number;
  /** How much of the questionnaire the result is based on. */
  confidence: ConfidenceLevel;
  /** Count of questions answered and available. */
  answeredQuestions: number;
  totalQuestions: number;
  /** Present when a documented compounding rule raised the band. */
  escalation?: ScoreEscalation;
  ventilationGuidance: VentilationGuidance;
  /** Echo of the outdoor context used, for display and auditability. */
  outdoorContext?: OutdoorAirContext;
}

export interface BuildAssessmentOptions {
  outdoorContext?: OutdoorAirContext;
  /** Injectable clock; defaults to `new Date()`. Keeps tests deterministic. */
  now?: Date;
}

/* -------------------------------------------------------------------------- */
/* Component contract                                                         */
/* -------------------------------------------------------------------------- */

export interface IndoorAirDoctorProps {
  /** Outdoor AQI context from the parent app. Optional — never invented. */
  outdoorContext?: OutdoorAirContext;
  /** Called once per completed assessment. */
  onAssessmentComplete?: (result: IndoorAssessment) => void;
  /** Optional pre-filled answers, e.g. restoring a saved session. */
  initialAnswers?: QuestionnaireAnswers;
  /** Optional class name applied to the outermost wrapper. */
  className?: string;
}
