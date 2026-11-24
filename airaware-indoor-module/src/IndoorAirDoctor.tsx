import { useCallback, useState } from 'react';
import { Leaf, ShieldCheck } from 'lucide-react';
import { SECTIONS, TOTAL_QUESTIONS } from './data/questions';
import { buildAssessment, sanitizeAnswers } from './engine/scoring';
import AssessmentIntro from './components/AssessmentIntro';
import Questionnaire from './components/Questionnaire';
import AssessmentResults from './components/AssessmentResults';
import type {
  IndoorAirDoctorProps,
  IndoorAssessment,
  QuestionId,
  QuestionnaireAnswers,
} from './types/indoor';
import s from './styles/indoor.module.css';

type Stage = 'intro' | 'questionnaire' | 'results';

/**
 * Indoor Air Doctor
 *
 * A self-contained indoor air risk assessment: questionnaire → deterministic
 * risk profile → personalised action plan. All styles are CSS-module scoped and
 * all state is local, so the component can be dropped into any React page.
 */
export function IndoorAirDoctor({
  outdoorContext,
  onAssessmentComplete,
  initialAnswers,
  className,
}: IndoorAirDoctorProps) {
  const [stage, setStage] = useState<Stage>('intro');
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(() =>
    sanitizeAnswers(initialAnswers),
  );
  const [assessment, setAssessment] = useState<IndoorAssessment | null>(null);

  const handleSelect = useCallback((questionId: QuestionId, value: string) => {
    setAnswers((previous) => ({ ...previous, [questionId]: value }));
  }, []);

  const handleClear = useCallback((questionId: QuestionId) => {
    setAnswers((previous) => {
      const next = { ...previous };
      delete next[questionId];
      return next;
    });
  }, []);

  const handleComplete = useCallback(
    (finalAnswers: QuestionnaireAnswers) => {
      const result = buildAssessment(
        finalAnswers,
        outdoorContext ? { outdoorContext } : {},
      );
      setAssessment(result);
      setStage('results');
      onAssessmentComplete?.(result);
    },
    [onAssessmentComplete, outdoorContext],
  );

  const handleStart = useCallback(() => {
    setStage('questionnaire');
  }, []);

  const handleRetake = useCallback(() => {
    setAssessment(null);
    setStage('questionnaire');
  }, []);

  const handleRestart = useCallback(() => {
    setAssessment(null);
    setAnswers({});
    setStage('intro');
  }, []);

  const handleExit = useCallback(() => {
    setStage('intro');
  }, []);

  const rootClassName = className ? `${s.root} ${className}` : s.root;

  return (
    <div className={rootClassName}>
      <div className={s.shell}>
        <header className={s.topbar}>
          <div className={s.brand}>
            <span className={s.brandMark} aria-hidden="true">
              <Leaf size={21} strokeWidth={2.2} />
            </span>
            <span className={s.brandText}>
              <span className={s.brandName}>Indoor Air Doctor</span>
              <span className={s.brandTag}>Indoor Air Risk Assessment</span>
            </span>
          </div>
          <div className={s.topbarMeta}>
            <span className={s.softPill}>
              <ShieldCheck size={13} aria-hidden="true" />
              No indoor sensors required
            </span>
            {stage === 'results' ? (
              <span className={`${s.softPill} ${s.softPillMuted}`}>Assessment complete</span>
            ) : null}
          </div>
        </header>

        <main>
          {stage === 'intro' ? (
            <AssessmentIntro
              onStart={handleStart}
              outdoorContext={outdoorContext}
              questionCount={TOTAL_QUESTIONS}
              sectionCount={SECTIONS.length}
            />
          ) : null}

          {stage === 'questionnaire' ? (
            <Questionnaire
              answers={answers}
              onSelect={handleSelect}
              onClear={handleClear}
              onComplete={handleComplete}
              onExit={handleExit}
            />
          ) : null}

          {stage === 'results' && assessment ? (
            <AssessmentResults
              assessment={assessment}
              onRetake={handleRetake}
              onRestart={handleRestart}
            />
          ) : null}
        </main>

        <footer className={s.footer}>
          <span className={s.footerText}>
            <Leaf size={12} aria-hidden="true" /> Indoor Air Doctor · AirAware AI
          </span>
          <span className={s.footerText}>
            Indicative questionnaire-based assessment — not a measured AQI
          </span>
        </footer>
      </div>
    </div>
  );
}

export default IndoorAirDoctor;
