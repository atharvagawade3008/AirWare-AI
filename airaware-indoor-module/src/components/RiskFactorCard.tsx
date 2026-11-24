import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { RiskFactor, RiskLevel } from '../types/indoor';
import s from '../styles/indoor.module.css';

const SEVERITY = {
  low: { label: 'Low', Icon: CheckCircle2, chip: s.severityLow, bar: '' },
  moderate: { label: 'Moderate', Icon: AlertTriangle, chip: s.severityModerate, bar: s.factorBarFillModerate },
  high: { label: 'High', Icon: ShieldAlert, chip: s.severityHigh, bar: s.factorBarFillHigh },
} satisfies Record<RiskLevel, { label: string; Icon: typeof CheckCircle2; chip: string; bar: string }>;

interface RiskFactorCardProps {
  factor: RiskFactor;
}

export function RiskFactorCard({ factor }: RiskFactorCardProps) {
  const severity = SEVERITY[factor.severity];
  const { Icon } = severity;

  const cardClass = [
    s.factorCard,
    factor.severity === 'high' ? s.factorCardHigh : '',
    factor.severity === 'moderate' ? s.factorCardModerate : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={cardClass}>
      <div className={s.factorTop}>
        <h3 className={s.factorTitle}>{factor.title}</h3>
        <span className={`${s.severityChip} ${severity.chip}`}>
          <Icon size={11} aria-hidden="true" />
          {severity.label}
        </span>
      </div>

      <p className={s.factorExplanation}>{factor.explanation}</p>

      <div className={s.factorBarWrap}>
        <div
          className={s.factorBar}
          role="img"
          aria-label={`${factor.title}: factor index ${factor.score} out of 100, ${factor.severity} concern`}
        >
          <div
            className={`${s.factorBarFill} ${severity.bar}`}
            style={{ width: `${Math.max(factor.score, 3)}%` }}
          />
        </div>
        <span className={s.factorScore} aria-hidden="true">
          {factor.score}
        </span>
      </div>

      {factor.evidence.length > 0 ? (
        <div className={s.evidence}>
          <span className={s.evidenceTitle}>What your answers show</span>
          <ul>
            {factor.evidence.map((item) => (
              <li key={item} className={s.evidenceItem}>
                <span className={s.evidenceDot} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

export default RiskFactorCard;
