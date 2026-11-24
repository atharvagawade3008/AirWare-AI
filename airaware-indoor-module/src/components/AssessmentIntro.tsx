import {
  ArrowRight,
  ClipboardCheck,
  Clock,
  Gauge,
  Info,
  Leaf,
  ListChecks,
  MapPin,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { OutdoorAirContext } from '../types/indoor';
import s from '../styles/indoor.module.css';

interface AssessmentIntroProps {
  onStart: () => void;
  outdoorContext?: OutdoorAirContext;
  questionCount: number;
  sectionCount: number;
}

const JOURNEY = [
  {
    title: 'Household check',
    text: 'Simple questions about cooking, burning, dust, dampness and ventilation. Skip anything you are unsure about.',
  },
  {
    title: 'Indicative risk profile',
    text: 'A deterministic engine groups your answers into six risk factors and explains what drove each one.',
  },
  {
    title: 'Personal action plan',
    text: 'Immediate steps, low-cost fixes, long-term upgrades and habits to avoid — adapted to outdoor air when it is known.',
  },
];

function outdoorStatus(context?: OutdoorAirContext) {
  if (!context || context.freshness === 'unavailable') {
    return { text: 'No outdoor reading linked', dot: s.outdoorDot, tone: 'General guidance only' };
  }

  const hasAqi = typeof context.aqi === 'number' && Number.isFinite(context.aqi) && context.aqi >= 0;
  const label = hasAqi
    ? `AQI ${Math.round(context.aqi as number)}`
    : context.category ?? 'Category only';
  const suffix = context.freshness === 'stale' ? ' · stale' : context.freshness === 'delayed' ? ' · delayed' : '';
  const category =
    hasAqi && context.category ? ` · ${context.category}` : '';

  return {
    text: context.freshness === 'stale' || context.freshness === 'delayed'
      ? `${label}${category}${suffix}`
      : `${label}${category}`,
    dot: context.freshness === 'fresh' ? `${s.outdoorDot} ${s.outdoorDotGood}` : `${s.outdoorDot} ${s.outdoorDotWarn}`,
    tone: hasAqi ? `Source: ${context.source ?? 'parent app'}` : 'Advice uses the reported category',
  };
}

export function AssessmentIntro({
  onStart,
  outdoorContext,
  questionCount,
  sectionCount,
}: AssessmentIntroProps) {
  const outdoor = outdoorStatus(outdoorContext);

  return (
    <div className={s.intro}>
      <section className={s.hero} aria-labelledby="iad-intro-title">
        <span className={s.eyebrow}>
          <Leaf size={13} aria-hidden="true" /> Indoor Air Doctor
        </span>
        <h1 id="iad-intro-title" className={s.heroTitle}>
          Understand your indoor air.
          <br />
          <span className={s.heroAccent}>Improve it practically.</span>
        </h1>
        <p className={s.heroLead}>
          A three-minute household check that points to the most likely indoor pollution
          sources in your home and turns your answers into a prioritised, realistic action
          plan — no sensors, no guesswork about indoor AQI.
        </p>

        <div className={s.startRow}>
          <button type="button" className={s.primaryButton} onClick={onStart}>
            Start household check
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </div>

        <div className={s.ctaNote}>
          <span className={s.ctaNoteItem}>
            <Clock size={13} aria-hidden="true" /> About 3 minutes
          </span>
          <span className={s.ctaNoteItem}>
            <ListChecks size={13} aria-hidden="true" />
            {sectionCount} short sections · {questionCount} questions
          </span>
          <span className={s.ctaNoteItem}>
            <ShieldCheck size={13} aria-hidden="true" /> No account · nothing leaves this page
          </span>
        </div>

        <div className={s.introGrid} style={{ marginTop: '26px' }}>
          <div className={s.journey}>
            {JOURNEY.map((step, index) => (
              <div className={s.journeyItem} key={step.title}>
                <span className={s.journeyIndex} aria-hidden="true">
                  {index + 1}
                </span>
                <div className={s.journeyBody}>
                  <h2 className={s.journeyTitle}>{step.title}</h2>
                  <p className={s.journeyText}>{step.text}</p>
                </div>
              </div>
            ))}

            <div className={s.disclosure}>
              <span className={s.disclosureIcon} aria-hidden="true">
                <Info size={16} />
              </span>
              <div>
                <p className={s.disclosureTitle}>What this is — and is not</p>
                <p className={s.disclosureText}>
                  This is an <strong>Indoor Air Risk Assessment</strong> built from your
                  household's answers. It does not measure indoor AQI, PM2.5 or any other
                  pollutant, and it does not diagnose or predict illness. It highlights
                  known risk pathways so you can act on them.
                </p>
              </div>
            </div>
          </div>

          <aside className={s.asideCard} aria-label="Assessment context">
            <div className={s.asideTitle}>
              <Gauge size={15} aria-hidden="true" /> Outdoor context
            </div>
            <div className={s.asideRow}>
              <span className={s.asideLabel}>Outdoor air</span>
              <span className={s.asideValue}>
                <span className={outdoor.dot} aria-hidden="true" />
                {outdoor.text}
              </span>
            </div>
            <div className={s.asideRow}>
              <span className={s.asideLabel}>Ventilation advice</span>
              <span className={s.asideValue}>{outdoor.tone}</span>
            </div>
            <div className={s.asideRow}>
              <span className={s.asideLabel}>Reading source</span>
              <span className={s.asideValue}>
                <MapPin size={13} aria-hidden="true" />
                {outdoorContext?.source ?? 'Not provided'}
              </span>
            </div>

            <p className={s.privacy}>
              <Sparkles size={14} aria-hidden="true" style={{ flex: 'none', marginTop: '2px' }} />
              <span>
                If the AirAware app shares an outdoor reading, window-opening advice adapts
                to it. Without a reading, guidance stays general — we never invent outdoor
                AQI, and stale data is labelled as such.
              </span>
            </p>
          </aside>
        </div>
      </section>

      <div className={s.disclosure}>
        <span className={s.disclosureIcon} aria-hidden="true">
          <ClipboardCheck size={16} />
        </span>
        <div>
          <p className={s.disclosureTitle}>Answer from memory, not measurement</p>
          <p className={s.disclosureText}>
            Pick the option that best describes a typical week. Every question is optional:
            anything you skip is treated as unknown, not as clean air.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AssessmentIntro;
