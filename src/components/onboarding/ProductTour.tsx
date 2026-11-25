import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ActiveTab } from '../layout/Navigation.tsx';

export type TourCloseStatus = 'completed' | 'skipped';

interface TourStep {
  id: string;
  targetId?: string;
  tab?: ActiveTab;
  openAssistant?: boolean;
  closeAssistant?: boolean;
  title: string;
  body: string;
  why: string;
  example?: string;
}

const STEPS: TourStep[] = [
  {
    id: 'welcome',
    targetId: 'tour-dashboard',
    tab: 'overview',
    title: 'Welcome to AirAware',
    body: 'Your personal clean-air companion. We help you understand air pollution and make smarter everyday decisions for your family\u2019s health and the environment.',
    why: 'Every recommendation is built from your location, your household and current air-quality data.',
    example: 'Start with the guidance card here: it is today\u2019s single most useful action.'
  },
  {
    id: 'aqi',
    targetId: 'tour-aqi',
    tab: 'overview',
    title: 'Know your air quality',
    body: 'Monitor your local AQI, PM2.5, PM10 and other available pollutants, along with the latest available measurement time. Readings come from the available monitoring or modelled sources.',
    why: 'The CPCB category tells you how serious today is; the pollutants tell you what is driving it.',
    example: 'Check whether the reading is a station observation or a modelled estimate before you rely on it.'
  },
  {
    id: 'routine',
    targetId: 'tour-routine',
    tab: 'overview',
    title: 'Your personalized daily routine',
    body: 'Get low-emission daily routines tailored to your location and lifestyle: better commuting choices, smarter outdoor activity timing and practical ways to shrink your footprint.',
    why: 'The same AQI means different things for a toddler, a senior and a two-wheeler commuter.',
    example: 'Instead of three separate private-vehicle errands, combine them into one trip.'
  },
  {
    id: 'indoor',
    targetId: 'tour-indoor',
    tab: 'indoor',
    title: 'Improve your indoor air',
    body: 'Learn how to make your home healthier during pollution episodes: ventilation timing, dust reduction, HEPA filtration and practical indoor improvements.',
    why: 'Indoor air depends on outdoor conditions and your household habits, not on guesswork.',
    example: 'Ventilate during the cleanest afternoon window, then close up before the evening inversion.'
  },
  {
    id: 'choices',
    targetId: 'tour-choices',
    tab: 'choices',
    title: 'Discover sustainable alternatives',
    body: 'Compare public transport, carpooling, cycling, walking and more sustainable household choices against your current habits.',
    why: 'Everyday decisions are where individual emissions actually change.',
    example: 'Swapping two solo car days a week cuts both tailpipe exposure and fuel spend.'
  },
  {
    id: 'assistant',
    targetId: 'tour-assistant',
    tab: 'choices',
    openAssistant: true,
    title: 'Meet your AI assistant',
    body: 'Have a conversation with AirAware AI. Ask about pollution, your family\u2019s routine and sustainable living, and get answers grounded in your available environmental data.',
    why: 'It turns raw numbers into an answer to "what should we do today?"',
    example: 'Try: "Can I go jogging today?" or "What should my family do during severe smog?"'
  },
  {
    id: 'impact',
    targetId: 'tour-impact',
    tab: 'impact',
    closeAssistant: true,
    title: 'See the impact of your choices',
    body: 'Track estimated emissions avoided, potential fuel savings and your contribution to cleaner community habits.',
    why: 'Progress is easier to keep when you can see it. These are estimates of avoided emissions, not measured pollution reductions.',
    example: 'Compare two commute options to see the yearly CO\u2082e and rupee difference.'
  },
  {
    id: 'ready',
    tab: 'overview',
    closeAssistant: true,
    title: 'You\u2019re ready to breathe smarter!',
    body: 'Explore your air quality, create your personalized clean-air routine and start making everyday choices that benefit your family and the planet.',
    why: 'You can replay this tour any time from the "Take a Tour" link in the footer.'
  }
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const CARD_WIDTH = 320;
const GAP = 14;
const MOBILE_BREAKPOINT = 640;
const SPOTLIGHT_TOP_OFFSET = 88;

/**
 * The card is an overview, not the documentation: every text field is capped at two
 * short lines so the tour never hides the page it is pointing at.
 */
const CLAMP: React.CSSProperties = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden'
};

/** Sections can be taller than the viewport; spotlight a readable top slice of them. */
function measureSpotlight(el: HTMLElement): Rect {
  const box = el.getBoundingClientRect();
  const maxHeight = Math.min(480, window.innerHeight * 0.55);
  return {
    top: Math.max(8, box.top),
    left: box.left,
    width: box.width,
    height: Math.min(box.height, maxHeight)
  };
}

interface ProductTourProps {
  isOpen: boolean;
  onClose: (status: TourCloseStatus) => void;
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  onOpenAssistant: () => void;
  onCloseAssistant: () => void;
}

export const ProductTour: React.FC<ProductTourProps> = ({
  isOpen,
  onClose,
  activeTab,
  onNavigate,
  onOpenAssistant,
  onCloseAssistant
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardHeight, setCardHeight] = useState(320);
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));

  const cardRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const step = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  const close = useCallback((status: TourCloseStatus) => {
    onClose(status);
  }, [onClose]);

  const next = useCallback(() => {
    setStepIndex((current) => {
      if (current >= STEPS.length - 1) {
        onClose('completed');
        return current;
      }
      return current + 1;
    });
  }, [onClose]);

  const previous = useCallback(() => {
    setStepIndex((current) => Math.max(0, current - 1));
  }, []);

  const skip = useCallback(() => {
    onClose('skipped');
  }, [onClose]);

  // Reset to step 1 and re-read the viewport whenever the tour is (re)opened.
  useEffect(() => {
    if (!isOpen) return;
    setStepIndex(0);
    setViewport({ width: window.innerWidth, height: window.innerHeight });
  }, [isOpen]);

  // Surface the right tab / assistant for each step, then locate its real element.
  useEffect(() => {
    if (!isOpen) return;
    const current = STEPS[stepIndex];
    let cancelled = false;
    const timers: number[] = [];

    if (current.tab && activeTabRef.current !== current.tab) onNavigate(current.tab);
    if (current.closeAssistant) onCloseAssistant();
    if (current.openAssistant) onOpenAssistant();

    const startedAt = Date.now();

    const attempt = () => {
      if (cancelled || !current.targetId) return;
      const el = document.getElementById(current.targetId);

      if (!el) {
        if (Date.now() - startedAt < 1800) {
          timers.push(window.setTimeout(attempt, 80));
        }
        // Missing or conditionally rendered target: the card simply centres itself.
        return;
      }

      // scrollIntoView is unreliable here (the app root uses overflow-x: clip),
      // so scroll the window explicitly and align the target below the header.
      const box = el.getBoundingClientRect();
      window.scrollTo({
        top: Math.max(0, box.top + window.scrollY - SPOTLIGHT_TOP_OFFSET),
        behavior: 'auto'
      });
    };

    timers.push(window.setTimeout(attempt, current.openAssistant ? 260 : 60));

    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [isOpen, stepIndex, onNavigate, onOpenAssistant, onCloseAssistant]);

  // Single source of truth for the spotlight: samples the real element so it stays
  // glued to tabs that mount late, scrolling, sticky headers and window resizes.
  useEffect(() => {
    if (!isOpen) return;
    const targetId = STEPS[stepIndex].targetId;

    const sync = () => {
      if (!targetId) {
        setRect((prev) => (prev === null ? prev : null));
        return;
      }
      const el = document.getElementById(targetId);
      const next = el ? measureSpotlight(el) : null;
      setRect((prev) =>
        prev && next &&
        prev.top === next.top &&
        prev.left === next.left &&
        prev.width === next.width &&
        prev.height === next.height
          ? prev
          : next
      );
    };

    sync();
    const interval = window.setInterval(sync, 150);
    const onResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('resize', onResize);
    };
  }, [isOpen, stepIndex]);

  // Measure the card so placement never clips.
  useLayoutEffect(() => {
    if (!isOpen || !cardRef.current) return;
    const el = cardRef.current;
    const update = () => setCardHeight(el.offsetHeight);
    update();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    observer?.observe(el);
    return () => observer?.disconnect();
  }, [isOpen, stepIndex, viewport.width]);

  // Keyboard support: arrows move, Escape exits.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        skip();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        next();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        previous();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, next, previous, skip]);

  useEffect(() => {
    if (isOpen) cardRef.current?.focus();
  }, [isOpen, stepIndex]);

  const isMobile = viewport.width < MOBILE_BREAKPOINT;

  const cardWidth = Math.min(CARD_WIDTH, viewport.width - GAP * 2);

  const cardStyle = useMemo<React.CSSProperties>(() => {
    if (isMobile) {
      // A small centred card, not a full-width sheet, so the page stays visible
      // around it on a phone.
      return {
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: 10,
        width: `min(${Math.min(310, viewport.width - 40)}px, calc(100vw - 40px))`,
        maxHeight: Math.round(viewport.height * 0.46)
      };
    }
    if (!rect) {
      return {
        left: Math.max(GAP, (viewport.width - cardWidth) / 2),
        top: Math.max(GAP, (viewport.height - cardHeight) / 2),
        width: cardWidth
      };
    }

    const spaceBelow = viewport.height - (rect.top + rect.height);
    const placeBelow = spaceBelow >= cardHeight + GAP * 2 || rect.top < cardHeight + GAP * 2;
    const top = placeBelow
      ? Math.min(rect.top + rect.height + GAP, viewport.height - cardHeight - GAP)
      : Math.max(GAP, rect.top - cardHeight - GAP);
    const left = Math.min(
      Math.max(GAP, rect.left + rect.width / 2 - cardWidth / 2),
      Math.max(GAP, viewport.width - cardWidth - GAP)
    );

    return { left, top: Math.max(GAP, top), width: cardWidth };
  }, [isMobile, rect, cardHeight, cardWidth, viewport]);

  if (!isOpen) return null;

  const pad = 8;
  const spotlight = rect
    ? {
        top: Math.max(0, rect.top - pad),
        left: Math.max(0, rect.left - pad),
        width: rect.width + pad * 2,
        height: rect.height + pad * 2
      }
    : null;

  return (
    <div className="fixed inset-0 z-[100]" aria-live="polite">
      {/* Dimmed background with a real cutout around the highlighted element */}
      {spotlight ? (
        <>
          <div
            className="fixed bg-slate-950/75 backdrop-blur-[1px] transition-all duration-300"
            style={{ top: 0, left: 0, right: 0, height: spotlight.top }}
          />
          <div
            className="fixed bg-slate-950/75 backdrop-blur-[1px] transition-all duration-300"
            style={{ top: spotlight.top + spotlight.height, left: 0, right: 0, bottom: 0 }}
          />
          <div
            className="fixed bg-slate-950/75 backdrop-blur-[1px] transition-all duration-300"
            style={{ top: spotlight.top, left: 0, width: spotlight.left, height: spotlight.height }}
          />
          <div
            className="fixed bg-slate-950/75 backdrop-blur-[1px] transition-all duration-300"
            style={{
              top: spotlight.top,
              left: spotlight.left + spotlight.width,
              right: 0,
              height: spotlight.height
            }}
          />
          {/* Glow ring around the highlighted feature */}
          <div
            className="fixed rounded-2xl border-2 border-emerald-400/90 shadow-[0_0_0_4px_rgba(52,211,153,0.22),0_0_36px_rgba(52,211,153,0.35)] pointer-events-none transition-all duration-300"
            style={{
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height
            }}
          />
          {/* Transparent shield so the tour cannot trigger the real feature by accident */}
          <div
            className="fixed cursor-default"
            style={{
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height
            }}
          />
        </>
      ) : (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" />
      )}

      {/* Information card */}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        tabIndex={-1}
        className={`fixed z-[101] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-3.5 outline-none transition-all duration-300 max-h-[calc(100vh-24px)] overflow-y-auto ${
          isMobile ? 'rounded-xl' : ''
        }`}
        style={cardStyle}
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Step {stepIndex + 1} of {STEPS.length}
          </span>
          <button
            onClick={skip}
            className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
          >
            <X className="w-3 h-3" /> Skip
          </button>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-1 mb-2" aria-hidden="true">
          {STEPS.map((s, i) => (
            <span
              key={s.id}
              className={`h-0.5 flex-1 rounded-full transition-colors ${
                i <= stepIndex ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        <h2 id="tour-title" className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
          {step.title}
        </h2>
        <p className="mt-1 text-[11px] leading-snug text-slate-600 dark:text-slate-300" style={CLAMP}>
          {step.body}
        </p>
        <p className="mt-1.5 text-[10.5px] leading-snug text-slate-600 dark:text-slate-300" style={CLAMP}>
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">Why: </span>
          {step.why}
        </p>
        {step.example && (
          <p className="mt-1 text-[10.5px] leading-snug text-slate-500 dark:text-slate-400" style={CLAMP}>
            <span className="font-semibold text-slate-600 dark:text-slate-300">Try: </span>
            {step.example}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            onClick={previous}
            disabled={isFirst}
            className="inline-flex items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3 h-3" /> Previous
          </button>

          {isLast ? (
            <button
              onClick={() => close('completed')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-forest-900 hover:bg-forest-800 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950 transition-colors shadow-sm"
            >
              Start Exploring <ChevronRight className="w-3 h-3" />
            </button>
          ) : (
            <button
              onClick={next}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-forest-900 hover:bg-forest-800 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950 transition-colors shadow-sm"
            >
              Next <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {isLast && (
          <button
            onClick={() => close('completed')}
            className="mt-2 w-full text-center text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 underline transition-colors"
          >
            Replay Tour Later
          </button>
        )}
      </div>
    </div>
  );
};
