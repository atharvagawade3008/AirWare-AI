import type { LucideIcon } from 'lucide-react';
import { Ban, Sparkles, Wrench, Zap } from 'lucide-react';
import { FACTOR_LABELS } from '../engine/scoring';
import type { IndoorRecommendation } from '../types/indoor';
import s from '../styles/indoor.module.css';

const CATEGORY_ICON: Record<IndoorRecommendation['category'], LucideIcon> = {
  immediate: Zap,
  'low-cost': Sparkles,
  'long-term': Wrench,
  avoid: Ban,
};

const IMPACT_LABEL: Record<IndoorRecommendation['impact'], string> = {
  high: 'High impact',
  moderate: 'Moderate impact',
  supporting: 'Supporting step',
};

const EFFORT_LABEL: Record<IndoorRecommendation['effort'], string> = {
  instant: 'Instant',
  minutes: 'A few minutes',
  weekend: 'Weekend task',
  investment: 'Investment',
};

const IMPACT_CLASS: Record<IndoorRecommendation['impact'], string> = {
  high: s.chipHigh,
  moderate: s.chipModerate,
  supporting: s.chipSupporting,
};

interface RecommendationCardProps {
  recommendation: IndoorRecommendation;
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const Icon = CATEGORY_ICON[recommendation.category];
  const isAvoid = recommendation.category === 'avoid';

  return (
    <article className={s.recCard}>
      <span className={`${s.recIcon} ${isAvoid ? s.recIconAvoid : ''}`} aria-hidden="true">
        <Icon size={16} />
      </span>
      <div className={s.recBody}>
        <h4 className={s.recTitle}>{recommendation.title}</h4>
        <p className={s.recDescription}>{recommendation.description}</p>

        <div className={s.recMeta}>
          <span className={`${s.chip} ${IMPACT_CLASS[recommendation.impact]}`}>
            {IMPACT_LABEL[recommendation.impact]}
          </span>
          <span className={s.chip}>{EFFORT_LABEL[recommendation.effort]}</span>
          {recommendation.outdoorSensitive ? (
            <span className={s.chip}>Depends on outdoor air</span>
          ) : null}
          {recommendation.relatedFactors.map((factorId) => (
            <span key={factorId} className={`${s.chip} ${s.chipFactor}`}>
              {FACTOR_LABELS[factorId]}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export default RecommendationCard;
