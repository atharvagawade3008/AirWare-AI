import React from 'react';
import { AirQualityContext } from '../../types/air-quality.ts';
import { PRESET_CHOICE_COMPARISONS } from '../../intelligence/impact/emissions-calculator.ts';
import { Bike, Car, ShieldAlert, ArrowRight, CheckCircle2, Trees, Sparkles } from 'lucide-react';

interface Props {
  airQuality: AirQualityContext;
  onSelectAction?: (actionTitle: string) => void;
}

export const CleanerChoices: React.FC<Props> = ({ airQuality, onSelectAction }) => {
  const currentAQI = airQuality.aqi || 120;
  const isHighSmog = currentAQI > 150;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-forest-800 text-xs font-bold uppercase tracking-wider">
          <Bike className="w-4 h-4 text-emerald-600" />
          <span>Cleaner Choices — Practical Everyday Lifestyle Adjustments</span>
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-sans mt-1">
          Make Everyday Decisions Better for Your Health & City
        </h2>
        <p className="text-xs text-slate-600 mt-2 max-w-3xl leading-relaxed">
          Small shifts in routine transportation and daily errands reduce personal greenhouse gas footprint while shielding you from street-level tailpipe exhaust.
        </p>

        {/* Dynamic Air Quality Gating Alert */}
        {isHighSmog && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Health-First Constraint Active:</strong> Current ambient AQI is elevated ({currentAQI} — {airQuality.aqiCategory}). AirAware AI <em>never</em> indiscriminately recommends outdoor cycling or brisk walking in heavy smog, because intense cardio respiration triples particulate inhalation into the lungs. Opt for enclosed mass transit (Metro/AC Bus) instead.
            </div>
          </div>
        )}
      </div>

      {/* Preset Habit Comparisons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PRESET_CHOICE_COMPARISONS.map((choice) => {
          const isSafeForActive = currentAQI <= choice.outdoorAqiSafeThreshold;
          return (
            <div 
              key={choice.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-forest-500/50 transition-all"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Activity</span>
                <h3 className="font-bold text-slate-900 text-sm mt-0.5">{choice.activity}</h3>

                {/* Habitual vs Cleaner */}
                <div className="mt-4 space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <span className="font-semibold text-slate-500 block text-[10px] uppercase">Habitual Choice</span>
                    <strong className="text-slate-800">{choice.habitualChoice.label}</strong>
                    <p className="text-slate-500 text-[11px] mt-1">{choice.habitualChoice.description}</p>
                  </div>

                  <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 text-xs">
                    <span className="font-semibold text-emerald-700 block text-[10px] uppercase">Cleaner Alternative</span>
                    <strong className="text-emerald-950">{choice.cleanerAlternative.label}</strong>
                    <p className="text-emerald-900/80 text-[11px] mt-1">{choice.cleanerAlternative.description}</p>
                  </div>
                </div>

                {/* Savings Metrics */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Annual Avoided</span>
                    <span className="font-extrabold text-forest-800 text-sm">~{choice.calculatedKgCo2SavedPerYear} kg CO₂e</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Tree Equivalent</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1 text-sm justify-end">
                      <Trees className="w-3.5 h-3.5" /> {choice.treesEquivalent} trees
                    </span>
                  </div>
                </div>
              </div>

              {/* Status footer */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                {!isSafeForActive ? (
                  <span className="text-[11px] font-medium text-amber-700 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    <span>Defer active option today due to high AQI</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Safe & Recommended in current weather</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sustainable Lifestyle Habits Checklist */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500">
          High-Leverage Low-Emission Habits for Urban Commuters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <strong className="text-slate-900 block font-bold">1. Switch Off Vehicle Engine at Signals (&gt;15s)</strong>
            <p className="text-slate-600 mt-1">Vehicle idling consumes 0.8L to 1.5L of fuel per hour without moving, generating concentrated hot exhaust clouds at pedestrian breathing height.</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <strong className="text-slate-900 block font-bold">2. Consolidate Multiple Errands into One Trip</strong>
            <p className="text-slate-600 mt-1">Cold engine starts burn 30% more fuel and produce quadruple hydrocarbon emissions. Batch grocery, pharmacy, and bank trips into a single warm loop.</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <strong className="text-slate-900 block font-bold">3. Maintain Proper Tyre Inflation</strong>
            <p className="text-slate-600 mt-1">Under-inflated tyres increase rolling friction by 10%, unnecessarily burning extra fuel and dispersing micro-rubber particulate dust into urban air.</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <strong className="text-slate-900 block font-bold">4. Adopt Carpooling / Office Shuttles</strong>
            <p className="text-slate-600 mt-1">Sharing your daily commute with just two colleagues immediately removes two cars from arterial road bottlenecks, mitigating corridor traffic congestion.</p>
          </div>
        </div>
      </div>

    </div>
  );
};
