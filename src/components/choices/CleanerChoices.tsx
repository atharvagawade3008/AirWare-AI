import React, { useMemo } from 'react';
import { AirQualityContext } from '../../types/air-quality.ts';
import { PRESET_CHOICE_COMPARISONS } from '../../intelligence/impact/emissions-calculator.ts';
import { DonutChart } from '../visuals/DonutChart.tsx';
import { Bike, ShieldAlert, ArrowRight, CheckCircle2, Trees, Fuel, Footprints, Bus, Car, Leaf } from 'lucide-react';

interface Props {
  airQuality: AirQualityContext;
  onSelectAction?: (actionTitle: string) => void;
}

const SWAP_COLORS = ['#10B981', '#0EA5E9', '#8B5CF6'];

export const CleanerChoices: React.FC<Props> = ({ airQuality, onSelectAction }) => {
  const currentAQI = airQuality.aqi;
  const isHighSmog = currentAQI !== undefined && currentAQI > 150;

  const rows = useMemo(() => PRESET_CHOICE_COMPARISONS.map((choice) => {
    const tripKm = choice.distanceKm * choice.frequencyDaysPerYear;
    const habitualAnnual = Math.round(choice.habitualChoice.emissionFactorKgCo2PerKm * tripKm);
    const cleanerAnnual = Math.round(choice.cleanerAlternative.emissionFactorKgCo2PerKm * tripKm);
    const reductionPct = habitualAnnual > 0
      ? Math.round(((habitualAnnual - cleanerAnnual) / habitualAnnual) * 100)
      : 0;
    const safeForActive = currentAQI === undefined ? true : currentAQI <= choice.outdoorAqiSafeThreshold;
    return { choice, habitualAnnual, cleanerAnnual, reductionPct, safeForActive };
  }), [currentAQI]);

  const savingsMix = rows.map((row, i) => ({
    name: row.choice.activity.replace(/\s*\(.*\)/, ''),
    value: row.choice.calculatedKgCo2SavedPerYear,
    color: SWAP_COLORS[i % SWAP_COLORS.length]
  }));
  const totalSavings = savingsMix.reduce((sum, item) => sum + item.value, 0);

  const habitCards = [
    { icon: Fuel, title: 'Engine off at signals', detail: 'Above 15 seconds of idling burns fuel without moving you.' },
    { icon: Car, title: 'Batch your errands', detail: 'One warm loop instead of three cold starts.' },
    { icon: Footprints, title: 'Short trips on foot', detail: 'Anything under 2 km is usually faster walked.' },
    { icon: Bus, title: 'Carpool or shuttle', detail: 'Two colleagues fewer means two cars fewer at the bottleneck.' }
  ];

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-forest-800 text-[11px] font-bold uppercase tracking-wider">
          <Bike className="w-4 h-4 text-emerald-600" />
          <span>Sustainable alternatives</span>
        </div>
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight mt-1">
          Swap one habit, see the yearly difference
        </h2>
        <p className="text-xs text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
          Each card compares your habitual trip with a cleaner one over a full year, in kilograms of CO₂e and trees.
        </p>

        {isHighSmog && (
          <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-[11px] text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Health-first constraint:</strong> outdoor AQI is {currentAQI} ({airQuality.aqiCategory}). Cycling or brisk walking
              is not recommended today — choose enclosed metro or AC bus instead.
            </span>
          </div>
        )}
        {currentAQI === undefined && (
          <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
            Outdoor AQI is unavailable right now, so the health check below is paused. Emission savings are unaffected.
          </div>
        )}
      </div>

      {/* Savings split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Your yearly CO₂ savings by swap</h3>
          <p className="text-[11px] text-slate-500 mt-0.5 mb-3">Share of the total if you adopt all three.</p>
          <DonutChart
            data={savingsMix}
            centerValue={`${totalSavings.toLocaleString()}`}
            centerLabel="kg CO₂e / year"
            unit=" kg"
            size={150}
          />
        </div>

        <div className="lg:col-span-5 bg-forest-950 text-white rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">All three swaps</span>
            <div className="text-4xl font-extrabold mt-2 leading-none">{totalSavings.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-100/80 mt-1">kg CO₂e avoided every year</div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="bg-white/10 rounded-lg p-2.5">
              <Trees className="w-3.5 h-3.5 text-emerald-300" />
              <div className="text-lg font-bold mt-1">~{Math.round(totalSavings / 22)}</div>
              <div className="text-[9px] text-emerald-100/80">trees / year</div>
            </div>
            <div className="bg-white/10 rounded-lg p-2.5">
              <Leaf className="w-3.5 h-3.5 text-emerald-300" />
              <div className="text-lg font-bold mt-1">{(totalSavings / 1000).toFixed(1)}</div>
              <div className="text-[9px] text-emerald-100/80">tonnes CO₂e</div>
            </div>
          </div>
        </div>
      </div>

      {/* Swap cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rows.map(({ choice, habitualAnnual, cleanerAnnual, reductionPct, safeForActive }) => (
          <div
            key={choice.id}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col hover:border-forest-500/50 transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Trip type</span>
                <h3 className="font-bold text-slate-900 text-[13px] leading-snug mt-0.5">{choice.activity}</h3>
              </div>
              <span className="shrink-0 px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-extrabold">
                −{reductionPct}%
              </span>
            </div>

            {/* Habitual vs cleaner bars */}
            <div className="mt-4 space-y-2.5">
              <div>
                <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500 mb-0.5">
                  <span className="truncate">Now: {choice.habitualChoice.label}</span>
                  <span className="shrink-0 font-mono">{habitualAnnual.toLocaleString()} kg</span>
                </div>
                <div className="h-2.5 bg-rose-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500 mb-0.5">
                  <span className="truncate">Swap: {choice.cleanerAlternative.label}</span>
                  <span className="shrink-0 font-mono">{cleanerAnnual.toLocaleString()} kg</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.max(2, Math.round((cleanerAnnual / Math.max(1, habitualAnnual)) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase text-slate-400 block">Saved / year</span>
                <span className="font-extrabold text-forest-800 text-sm">{choice.calculatedKgCo2SavedPerYear.toLocaleString()} kg</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase text-slate-400 block">Trees</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1 text-sm justify-end">
                  <Trees className="w-3.5 h-3.5" /> {choice.treesEquivalent}
                </span>
              </div>
            </div>

            <div className="mt-3">
              {safeForActive ? (
                <span className="text-[10px] font-medium text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  Safe today
                </span>
              ) : (
                <span className="text-[10px] font-medium text-amber-700 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  Defer today — high AQI
                </span>
              )}
            </div>

            <button
              onClick={() => onSelectAction?.(choice.activity)}
              className="mt-3 flex items-center justify-center gap-1.5 w-full px-3 py-2 bg-forest-50 hover:bg-forest-100 text-forest-900 rounded-xl text-[11px] font-bold transition-colors"
            >
              Calculate my impact
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Habits */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Four habits that cost nothing</h3>
          <span className="text-[10px] text-slate-400">No purchase, no app</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
          {habitCards.map(({ icon: Icon, title, detail }) => (
            <div key={title} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <Icon className="w-4 h-4 text-forest-700" />
              <strong className="text-slate-900 block font-bold text-[11px] mt-1.5">{title}</strong>
              <p className="text-slate-600 mt-0.5 text-[10px] leading-relaxed">{detail}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
