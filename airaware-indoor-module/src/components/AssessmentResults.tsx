import type { CSSProperties } from 'react';
import {
  Activity,
  AlertTriangle,
  Ban,
  Clock,
  Compass,
  Gauge,
  Home,
  Info,
  Leaf,
  ListChecks,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Timer,
  Wind,
  Wrench,
  Zap,
} from 'lucide-react';
import { RECOMMENDATION_GROUPS } from '../engine/recommendations';
import type {
  IndoorAssessment,
  IndoorRecommendation,
  RiskLevel,
  VentilationPosture,
} from '../types/indoor';
import RiskFactorCard from './RiskFactorCard';
import RecommendationCard from './RecommendationCard';
import s from '../styles/indoor.module.css';

const BAND_COPY: Record<RiskLevel, { label: string; headline: string; summary: string }> = {
  low: {
    label: 'Low risk',
    headline: 'Few indoor risk factors are indicated',
    summary:
      'Your answers describe relatively few of the household conditions this assessment screens for. Keeping up ventilation, source control and cleaning is the main thing.',
  },
  moderate: {
    label: 'Moderate risk',
    headline: 'Some indoor risk factors are worth addressing',
    summary:
      'A few household conditions point to avoidable indoor pollution. The action plan below focuses on the changes that usually make the biggest difference first.',
  },
  high: {
    label: 'High risk',
    headline: 'Several significant indoor risk factors are indicated',
    summary:
      'Your answers describe multiple compounding sources of indoor pollution. Start with the immediate actions — especially combustion and dampness — before considering equipment.',
  },
};

const BAND_CLASS: Record<RiskLevel, string> = {
  low: s.bandLow,
  moderate: s.bandModerate,
  high: s.bandHigh,
};

const RING_CLASS: Record<RiskLevel, string> = {
  low: s.scoreRingBandLow,
  moderate: s.scoreRingBandModerate,
  high: s.scoreRingBandHigh,
};

const POSTURE_COPY: Record<
  VentilationPosture,
  { label: string; Icon: typeof Wind }
> = {
  ventilate: { label: 'Windows open', Icon: Wind },
  'ventilate-with-caution': { label: 'Short bursts', Icon: Timer },
  'keep-closed-filter': { label: 'Keep closed · filter', Icon: Home },
  unknown: { label: 'General guidance', Icon: Compass },
};

const CONFIDENCE_LABEL: Record<IndoorAssessment['confidence'], string> = {
  high: 'High confidence',
  medium: 'Fair confidence',
  low: 'Limited confidence',
};

const GROUP_ICONS = {
  immediate: Zap,
  'low-cost': Sparkles,
  'long-term': Wrench,
  avoid: Ban,
} as const;

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function freshnessLabel(assessment: IndoorAssessment): string {
  const context = assessment.outdoorContext;
  if (!context) return 'Not provided';
  switch (context.freshness) {
    case 'fresh':
      return 'Recent';
    case 'delayed':
      return 'Delayed';
    case 'stale':
      return 'Stale';
    default:
      return 'Unavailable';
  }
}

interface AssessmentResultsProps {
  assessment: IndoorAssessment;
  onRetake: () => void;
  onRestart: () => void;
}

export function AssessmentResults({
  assessment,
  onRetake,
  onRestart,
}: AssessmentResultsProps) {
  const band = BAND_COPY[assessment.overallRisk];
  const topFactor = assessment.identifiedFactors[0];
  const posture = POSTURE_COPY[assessment.ventilationGuidance.posture];
  const PostureIcon = posture.Icon;
  const hasOutdoorAqi =
    typeof assessment.outdoorContext?.aqi === 'number' &&
    Number.isFinite(assessment.outdoorContext.aqi);

  const summaryParts = [band.summary];
  if (topFactor) {
    summaryParts.push(`The largest contributor in your answers is ${topFactor.title.toLowerCase()}.`);
  }
  summaryParts.push(
    `Based on ${assessment.answeredQuestions} of ${assessment.totalQuestions} questions answered.`,
  );

  const grouped = RECOMMENDATION_GROUPS.map((group) => ({
    ...group,
    items: assessment.recommendations.filter((item) => item.category === group.category),
  })).filter((group) => group.items.length > 0);

  const ringStyle = {
    '--iad-score': `${assessment.riskScore}%`,
  } as CSSProperties;

  return (
    <div className={s.results}>
      <header className={s.resultHeader}>
        <div>
          <p className={s.resultEyebrow}>Indoor Air Risk Assessment</p>
          <h1 className={s.resultTitle}>Your household's indicative risk profile</h1>
        </div>
        <span className={s.resultTimestamp}>
          <Clock size={13} aria-hidden="true" />
          {formatTimestamp(assessment.assessmentTimestamp)}
        </span>
      </header>

      <section className={s.scorePanel} aria-labelledby="iad-score-heading">
        <div className={s.scoreVisual}>
          <div
            className={`${s.scoreRing} ${RING_CLASS[assessment.overallRisk]}`}
            style={ringStyle}
            role="img"
            aria-label={`Indicative risk index ${assessment.riskScore} out of 100. Overall band: ${assessment.overallRisk}.`}
          >
            <div className={s.scoreInner}>
              <span className={s.scoreValue}>{assessment.riskScore}</span>
              <span className={s.scoreSuffix}>of 100</span>
            </div>
          </div>
          <span className={s.scoreCaption}>Indicative questionnaire index</span>
        </div>

        <div className={s.scoreBody}>
          <div className={s.bandRow}>
            <span className={`${s.bandBadge} ${BAND_CLASS[assessment.overallRisk]}`}>
              {assessment.overallRisk === 'high' ? (
                <ShieldAlert size={13} aria-hidden="true" />
              ) : assessment.overallRisk === 'moderate' ? (
                <AlertTriangle size={13} aria-hidden="true" />
              ) : (
                <Leaf size={13} aria-hidden="true" />
              )}
              {band.label}
            </span>
            <span className={s.confidencePill}>
              <Activity size={12} aria-hidden="true" />
              {CONFIDENCE_LABEL[assessment.confidence]}
            </span>
          </div>

          <h2 id="iad-score-heading" className={s.resultHeadline}>
            {band.headline}
          </h2>
          <p className={s.resultSummary}>{summaryParts.join(' ')}</p>

          <div className={s.metaRow}>
            <span className={s.metaItem}>
              <ListChecks size={12} aria-hidden="true" />
              {assessment.identifiedFactors.length} factors with answers
            </span>
            <span className={s.metaItem}>
              <Gauge size={12} aria-hidden="true" />
              {assessment.answeredQuestions}/{assessment.totalQuestions} answered
            </span>
            <span className={s.metaItem}>
              <Info size={12} aria-hidden="true" />
              Not a measured AQI
            </span>
          </div>
        </div>
      </section>

      {assessment.escalation?.applied ? (
        <div className={`${s.notice} ${s.noticeWarn}`} role="note">
          <AlertTriangle size={16} aria-hidden="true" style={{ flex: 'none', marginTop: '2px' }} />
          <span>
            <strong>Compounding risk:</strong> {assessment.escalation.reason} This raised the
            overall band above the score alone.
          </span>
        </div>
      ) : null}

      {assessment.completeness < 1 ? (
        <div
          className={`${s.notice} ${assessment.completeness < 0.5 ? s.noticeWarn : s.noticeInfo}`}
          role="note"
        >
          <Info size={16} aria-hidden="true" style={{ flex: 'none', marginTop: '2px' }} />
          <span>
            You answered <strong>{assessment.answeredQuestions}</strong> of{' '}
            <strong>{assessment.totalQuestions}</strong> questions. Skipped areas are treated as
            unknown with a neutral contribution — never as evidence of clean air. Retake the
            check to sharpen the result.
          </span>
        </div>
      ) : null}

      <section className={s.panel} aria-labelledby="iad-vent-title">
        <div className={s.panelHead}>
          <span className={s.panelIcon} aria-hidden="true">
            <PostureIcon size={19} />
          </span>
          <div>
            <h2 id="iad-vent-title" className={s.panelTitle}>
              Ventilation guidance
            </h2>
            <p className={s.panelSubtitle}>
              {assessment.ventilationGuidance.basedOnOutdoorData
                ? 'Adjusted to the outdoor context supplied by the AirAware app.'
                : 'General guidance — no usable outdoor reading was supplied.'}
            </p>
          </div>
        </div>

        <div className={s.panelBody}>
          <p className={s.ventHeadline}>{assessment.ventilationGuidance.headline}</p>
          <p className={s.ventDetail}>{assessment.ventilationGuidance.detail}</p>

          <div className={s.pillRow}>
            <span className={s.ventPill}>
              <Wind size={12} aria-hidden="true" />
              {posture.label}
            </span>
            {hasOutdoorAqi ? (
              <span className={s.ventPill}>
                Reported outdoor AQI {Math.round(assessment.outdoorContext?.aqi as number)}
              </span>
            ) : null}
            {assessment.outdoorContext?.category ? (
              <span className={s.ventPill}>{assessment.outdoorContext.category}</span>
            ) : null}
            <span className={s.ventPill}>Outdoor data: {freshnessLabel(assessment)}</span>
            {assessment.outdoorContext?.source ? (
              <span className={s.ventPill}>{assessment.outdoorContext.source}</span>
            ) : null}
          </div>

          {assessment.ventilationGuidance.outdoorSummary ? (
            <p className={s.outdoorSummary}>
              <Gauge size={13} aria-hidden="true" style={{ flex: 'none', marginTop: '2px' }} />
              {assessment.ventilationGuidance.outdoorSummary}
            </p>
          ) : null}

          {assessment.ventilationGuidance.limitations.length > 0 ? (
            <div className={s.limitations}>
              {assessment.ventilationGuidance.limitations.map((limitation) => (
                <p key={limitation} className={s.limitationItem}>
                  <Info size={12} aria-hidden="true" style={{ flex: 'none', marginTop: '3px' }} />
                  {limitation}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className={s.factorSection} aria-labelledby="iad-factors-title">
        <div className={s.sectionHeading}>
          <h2 id="iad-factors-title" className={s.sectionHeadingText}>
            What is driving your result
          </h2>
          <p className={s.sectionHeadingNote}>
            Each factor is scored only from the questions you answered. Factor index is an
            indicative ranking, not a pollutant concentration.
          </p>
        </div>

        {assessment.identifiedFactors.length > 0 ? (
          <div className={s.factorGrid}>
            {assessment.identifiedFactors.map((factor) => (
              <RiskFactorCard key={factor.id} factor={factor} />
            ))}
          </div>
        ) : (
          <div className={s.emptyState}>
            <Info size={20} aria-hidden="true" />
            <p>
              No section had enough answers to identify a risk factor. Retake the assessment
              and answer at least one question in each area you can.
            </p>
          </div>
        )}
      </section>

      <section aria-labelledby="iad-plan-title">
        <div className={s.sectionHeading} style={{ marginBottom: '12px' }}>
          <h2 id="iad-plan-title" className={s.sectionHeadingText}>
            Your personalised action plan
          </h2>
          <p className={s.sectionHeadingNote}>
            Ordered by urgency. Outdoor-dependent steps are marked and follow the ventilation
            guidance above.
          </p>
        </div>

        <div className={s.actionGroups}>
          {grouped.map((group) => {
            const Icon = GROUP_ICONS[group.category];
            const isAvoid = group.category === 'avoid';
            return (
              <section
                key={group.category}
                className={`${s.actionGroup} ${isAvoid ? s.actionGroupAvoid : ''}`}
                aria-labelledby={`iad-group-${group.category}`}
              >
                <div className={s.groupHead}>
                  <span
                    className={`${s.groupIcon} ${isAvoid ? s.groupIconAvoid : ''}`}
                    aria-hidden="true"
                  >
                    <Icon size={17} />
                  </span>
                  <div className={s.groupTitleWrap}>
                    <h3 id={`iad-group-${group.category}`} className={s.groupTitle}>
                      {group.title}
                      <span className={`${s.groupCount} ${isAvoid ? s.groupCountAvoid : ''}`}>
                        {group.items.length}
                      </span>
                    </h3>
                    <p className={s.groupDescription}>{group.description}</p>
                  </div>
                </div>

                <div className={s.recList}>
                  {group.items.map((recommendation: IndoorRecommendation) => (
                    <RecommendationCard
                      key={recommendation.id}
                      recommendation={recommendation}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      <section className={s.disclaimer} aria-label="Important limitations">
        <span className={s.disclaimerIcon} aria-hidden="true">
          <Info size={16} />
        </span>
        <div>
          <p className={s.disclaimerTitle}>About this assessment</p>
          <p className={s.disclaimerText}>{assessment.disclaimer}</p>
        </div>
      </section>

      <div className={s.resultActions}>
        <button type="button" className={s.primaryButton} onClick={onRetake}>
          <RotateCcw size={16} aria-hidden="true" />
          Retake assessment
        </button>
        <span className={s.actionNote}>
          <Info size={13} aria-hidden="true" /> Retaking keeps your answers so you can adjust
          them.
        </span>
        <button type="button" className={s.outlineButton} onClick={onRestart}>
          Start over
        </button>
      </div>
    </div>
  );
}

export default AssessmentResults;
