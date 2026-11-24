import { useCallback, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Info, SkipForward } from 'lucide-react';
import {
  QUESTIONS,
  SECTIONS,
  TOTAL_QUESTIONS,
  getQuestionsForSection,
} from '../data/questions';
import QuestionStep from './QuestionStep';
import type { QuestionId, QuestionnaireAnswers } from '../types/indoor';
import s from '../styles/indoor.module.css';

interface QuestionnaireProps {
  answers: QuestionnaireAnswers;
  onSelect: (questionId: QuestionId, value: string) => void;
  onClear: (questionId: QuestionId) => void;
  onComplete: (answers: QuestionnaireAnswers) => void;
  onExit: () => void;
}

export function Questionnaire({
  answers,
  onSelect,
  onClear,
  onComplete,
  onExit,
}: QuestionnaireProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const section = SECTIONS[stepIndex];
  const questions = useMemo(() => getQuestionsForSection(section.id), [section.id]);

  const answeredTotal = useMemo(
    () => QUESTIONS.filter((question) => Boolean(answers[question.id])).length,
    [answers],
  );
  const progressPercent = Math.round((answeredTotal / TOTAL_QUESTIONS) * 100);
  const isLastStep = stepIndex === SECTIONS.length - 1;

  const goNext = useCallback(() => {
    if (isLastStep) {
      onComplete(answers);
      return;
    }
    setStepIndex((current) => Math.min(current + 1, SECTIONS.length - 1));
  }, [answers, isLastStep, onComplete]);

  const goBack = useCallback(() => {
    setStepIndex((current) => Math.max(current - 1, 0));
  }, []);

  const sectionAnswered = questions.filter((question) => Boolean(answers[question.id])).length;

  return (
    <div className={s.questionnaire}>
      <section className={s.qHeader} aria-labelledby="iad-questionnaire-title">
        <div className={s.qTop}>
          <div>
            <p className={s.sectionKicker}>Indoor Air Risk Assessment</p>
            <h1 id="iad-questionnaire-title" className={s.qTitle}>
              Household check
            </h1>
            <p className={s.qSubtitle}>
              Describe a typical week at home. Every question is optional — skipped answers
              stay unknown rather than counting as clean air.
            </p>
          </div>
          <span className={s.qCounter}>
            {answeredTotal}
            <span className={s.qCounterMuted}>/ {TOTAL_QUESTIONS} answered</span>
          </span>
        </div>

        <div className={s.progressWrap}>
          <div
            className={s.progressTrack}
            role="progressbar"
            aria-label="Questionnaire progress"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={`${answeredTotal} of ${TOTAL_QUESTIONS} questions answered`}
          >
            <div className={s.progressFill} style={{ width: `${Math.max(progressPercent, 2)}%` }} />
          </div>
          <div className={s.progressMeta}>
            <span>
              Section {stepIndex + 1} of {SECTIONS.length} · {sectionAnswered}/{questions.length}{' '}
              answered here
            </span>
            <span>{progressPercent}% complete</span>
          </div>
        </div>

        <ol className={s.steps} aria-label="Assessment sections">
          {SECTIONS.map((candidate, index) => {
            const sectionQuestions = getQuestionsForSection(candidate.id);
            const complete = sectionQuestions.every((question) => Boolean(answers[question.id]));
            const active = index === stepIndex;
            const className = [
              s.step,
              complete ? s.stepDone : '',
              active ? s.stepActive : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <li key={candidate.id} className={className} aria-current={active ? 'step' : undefined}>
                <span className={s.stepDot} aria-hidden="true">
                  {complete ? '✓' : index + 1}
                </span>
                {candidate.shortTitle}
              </li>
            );
          })}
        </ol>
      </section>

      <QuestionStep
        section={section}
        questions={questions}
        stepIndex={stepIndex}
        stepCount={SECTIONS.length}
        answers={answers}
        onSelect={onSelect}
        onClear={onClear}
      />

      <nav className={s.qNav} aria-label="Assessment navigation">
        <div className={s.qFooter} style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
          <div className={s.qFooterLeft}>
            <button type="button" className={s.ghostButton} onClick={onExit}>
              <ArrowLeft size={15} aria-hidden="true" /> Exit
            </button>
            <span className={s.qNote}>
              <Info size={13} aria-hidden="true" /> Nothing is uploaded
            </span>
          </div>
          <div className={s.qFooterRight}>
            <button
              type="button"
              className={s.secondaryButton}
              onClick={goBack}
              disabled={stepIndex === 0}
            >
              Back
            </button>
            <button type="button" className={s.skipButton} onClick={goNext}>
              <SkipForward size={14} aria-hidden="true" />
              {isLastStep ? 'Skip remaining' : 'Skip section'}
            </button>
            <button type="button" className={s.primaryButton} onClick={goNext}>
              {isLastStep ? 'See my assessment' : 'Continue'}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default Questionnaire;
