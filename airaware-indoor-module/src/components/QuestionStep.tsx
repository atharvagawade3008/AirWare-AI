import type { LucideIcon } from 'lucide-react';
import {
  Droplets,
  Flame,
  RefreshCw,
  Settings2,
  Sparkles,
  Wind,
  X,
} from 'lucide-react';
import type { Question, QuestionId, QuestionnaireAnswers, Section } from '../types/indoor';
import s from '../styles/indoor.module.css';

const SECTION_ICONS: Record<string, LucideIcon> = {
  flame: Flame,
  sparkles: Sparkles,
  wind: Wind,
  droplets: Droplets,
  refresh: RefreshCw,
  settings: Settings2,
};

interface QuestionStepProps {
  section: Section;
  questions: Question[];
  stepIndex: number;
  stepCount: number;
  answers: QuestionnaireAnswers;
  onSelect: (questionId: QuestionId, value: string) => void;
  onClear: (questionId: QuestionId) => void;
}

export function QuestionStep({
  section,
  questions,
  stepIndex,
  stepCount,
  answers,
  onSelect,
  onClear,
}: QuestionStepProps) {
  const Icon = SECTION_ICONS[section.icon] ?? Wind;

  return (
    <section className={s.qBody} aria-labelledby="iad-section-title">
      <header className={s.sectionHeader}>
        <span className={s.sectionIcon} aria-hidden="true">
          <Icon size={21} />
        </span>
        <div className={s.sectionTitleWrap}>
          <span className={s.sectionKicker}>
            Section {stepIndex + 1} of {stepCount}
          </span>
          <h2 id="iad-section-title" className={s.sectionTitle}>
            {section.title}
          </h2>
          <p className={s.sectionDescription}>{section.description}</p>
        </div>
      </header>

      <div className={s.questions}>
        {questions.map((question) => {
          const selectedValue = answers[question.id];
          const promptId = `iad-question-${question.id}`;

          return (
            <div
              key={question.id}
              className={s.questionCard}
              role="radiogroup"
              aria-labelledby={promptId}
            >
              <div className={s.questionHeader}>
                <p id={promptId} className={s.questionPrompt}>
                  {question.prompt}
                </p>
                {selectedValue ? (
                  <button
                    type="button"
                    className={s.iconOnlyButton}
                    onClick={() => onClear(question.id)}
                    aria-label={`Clear answer for: ${question.prompt}`}
                  >
                    <X size={12} aria-hidden="true" /> Clear
                  </button>
                ) : null}
              </div>

              {question.helpText ? <p className={s.questionHelp}>{question.helpText}</p> : null}

              <div className={s.optionGrid}>
                {question.options.map((option) => {
                  const selected = selectedValue === option.value;
                  return (
                    <label
                      key={option.value}
                      className={`${s.option} ${selected ? s.optionSelected : ''}`}
                    >
                      <input
                        type="radio"
                        className={s.optionInput}
                        name={`iad-${question.id}`}
                        value={option.value}
                        checked={selected}
                        onChange={() => onSelect(question.id, option.value)}
                      />
                      <span className={s.optionIndicator} aria-hidden="true" />
                      <span className={s.optionContent}>
                        <span className={s.optionLabel}>{option.label}</span>
                        {option.description ? (
                          <span className={s.optionDescription}>{option.description}</span>
                        ) : null}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default QuestionStep;
