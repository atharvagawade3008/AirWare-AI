import React, { useMemo } from 'react';
import { AirQualityContext } from '../../types/air-quality.ts';
import { HouseholdProfile } from '../../types/profile.ts';
import { ExposurePlannerSlot } from '../../types/recommendation.ts';
import { EMISSION_FACTORS, calculateWhatIfSavings } from '../../intelligence/impact/emissions-calculator.ts';
import { assessIndoorAir } from '../../intelligence/indoor/indoor-engine.ts';
import { DonutChart } from '../visuals/DonutChart.tsx';
import { ActiveTab } from '../layout/Navigation.tsx';
import {
  Clock, Home, Bike, ArrowRight, Sunrise, Sun, Sunset, Moon, TrendingDown, Trees, IndianRupee, Leaf, Route
} from 'lucide-react';

interface Props {
  airQuality: AirQualityContext;
  profile: HouseholdProfile;
  slots: ExposurePlannerSlot[];
  onNavigate: (tab: ActiveTab) => void;
}

const RISK_WEIGHT: Record<string, number> = { Low: 1, Moderate: 2, High: 3, Severe: 4 };
const SLOT_SHORT: Record<string, string> = {
  morning: '6–11',
  afternoon: '12–4',
  evening: '5–8',
  night: '9–6'
};
const RISK_COLOR: Record<string, string> = {
  Low: '#10B981',
  Moderate: '#F59E0B',
  High: '#F97316',
  Severe: '#DC2626'
};

const MODE_LABELS: { label: string; factor: number }[] = [
  { label: 'Solo cab', factor: EMISSION_FACTORS.cabSoloKgCo2PerKm },
  { label: 'Diesel car', factor: EMISSION_FACTORS.dieselCarKgCo2PerKm },
  { label: 'Petrol car', factor: EMISSION_FACTORS.petrolCarKgCo2PerKm },
  { label: 'Carpool (3)', factor: EMISSION_FACTORS.carpoolKgCo2PerKm },
  { label: 'Two-wheeler', factor: EMISSION_FACTORS.twoWheelerPetrolKgCo2PerKm },
  { label: 'Metro / e-bus', factor: EMISSION_FACTORS.metroElectricBusKgCo2PerKm },
  { label: 'Bicycle / walk', factor: EMISSION_FACTORS.bicycleWalkKgCo2PerKm }
];

/**
 * The three required capability pillars, presented visually and side by side,
 * each with the concrete impact of the choice next to it.
 */
export const ActionPlan: React.FC<Props> = ({ airQuality, profile, slots, onNavigate }) => {
  const bestSlot = useMemo(() => {
    return slots.reduce((best, slot) =>
      (RISK_WEIGHT[slot.expectedRisk] ?? 2) < (RISK_WEIGHT[best.expectedRisk] ?? 2) ? slot : best
    , slots[0]);
  }, [slots]);

  const worstSlot = useMemo(() => {
    return slots.reduce((worst, slot) =>
      (RISK_WEIGHT[slot.expectedRisk] ?? 2) > (RISK_WEIGHT[worst.expectedRisk] ?? 2) ? slot : worst
    , slots[0]);
  }, [slots]);

  const indoor = useMemo(() => assessIndoorAir({
    cookingFuel: profile.indoorCookingFuel,
    kitchenExhaust: 'exhaust_fan',
    windowHabits: 'ventilate_when_clean',
    dustAccumulation: 'moderate',
    indoorSmoking: 'none',
    incenseOrCoils: 'daily_agarbatti',
    dampnessOrMould: 'none',
    pets: false,
    hasAirPurifier: profile.hasAirPurifier,
    vacuumHabits: 'regular_sweep_mop'
  }, airQuality.aqi), [profile.indoorCookingFuel, profile.hasAirPurifier, airQuality.aqi]);

  const topHazards = useMemo(() => {
    const list = (indoor.breakdown ?? []).filter((b) => b.points > 0);
    const sorted = [...list].sort((a, b) => b.points - a.points).slice(0, 4);
    const rest = list.reduce((sum, b) => sum + b.points, 0) - sorted.reduce((sum, b) => sum + b.points, 0);
    const colors = ['#DC2626', '#F97316', '#F59E0B', '#0EA5E9', '#94A3B8'];
    const data = sorted.map((b, i) => ({ name: b.label, value: b.points, color: colors[i] }));
    if (rest > 0) data.push({ name: 'Other sources', value: rest, color: '#94A3B8' });
    return data;
  }, [indoor]);

  const impact = useMemo(() => calculateWhatIfSavings({
    baseTransport: 'petrol_car',
    targetTransport: 'electric_bus_metro',
    dailyRoundTripKm: 24,
    commuteDaysPerWeek: 5,
    errandTripBatching: true,
    noIdlingHabit: true
  }), []);

  const metroVsCar = Math.round((1 - EMISSION_FACTORS.metroElectricBusKgCo2PerKm / EMISSION_FACTORS.petrolCarKgCo2PerKm) * 100);

  // Donut of where the avoided annual carbon comes from.
  const weeklyKm = 24 * 5;
  const baselineAnnual = weeklyKm * EMISSION_FACTORS.petrolCarKgCo2PerKm * 50;
  const avoided = impact.annualKgCo2eAvoided;
  const remaining = Math.max(0, Math.round(baselineAnnual - avoided));
  const carbonMix = [
    { name: 'Avoided by switching', value: avoided, color: '#10B981' },
    { name: 'Still emitted (metro trips)', value: remaining, color: '#CBD5E1' }
  ];

  const slotIcon = (timeOfDay: string) =>
    timeOfDay === 'morning' ? Sunrise : timeOfDay === 'afternoon' ? Sun : timeOfDay === 'evening' ? Sunset : Moon;

  return (
    <section className="space-y-4">
      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-forest-900 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
            <Leaf className="w-3 h-3" /> Your clean-air plan
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1.5">
            Three things that change your exposure today
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tailored to {profile.name} · {airQuality.location} · commute by {profile.commuteType.replace(/_/g, ' ')}
          </p>
        </div>
        <span className="hidden sm:inline text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Tap any card to open it</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* PILLAR 1 — low-emission daily routine */}
        <button
          onClick={() => onNavigate('planner')}
          className="group text-left bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-forest-500 dark:hover:border-emerald-600 hover:shadow-md transition-all p-5 flex flex-col"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
              <span className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600" />
              </span>
              Low-emission routine
            </span>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-forest-700 transition-colors" />
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">When to go out, when to stay in.</p>

          {/* Time-of-day risk bars */}
          <div className="flex items-end justify-between gap-2 h-24 mt-4">
            {slots.map((slot) => {
              const weight = RISK_WEIGHT[slot.expectedRisk] ?? 2;
              const Icon = slotIcon(slot.timeOfDay);
              return (
                <div key={slot.timeOfDay} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                  <span className="text-[9px] font-bold" style={{ color: RISK_COLOR[slot.expectedRisk] }}>
                    {slot.expectedRisk}
                  </span>
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${(weight / 4) * 100}%`,
                      backgroundColor: RISK_COLOR[slot.expectedRisk],
                      opacity: slot.timeOfDay === bestSlot.timeOfDay ? 1 : 0.45
                    }}
                  />
                  <Icon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span className="text-[9px] text-slate-400 dark:text-slate-500">{SLOT_SHORT[slot.timeOfDay] ?? slot.timeOfDay}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px]">
            <div className="flex items-start gap-1.5 text-emerald-800">
              <span className="font-bold shrink-0">Best:</span>
              <span>{bestSlot.title} · {bestSlot.hours}</span>
            </div>
            <div className="flex items-start gap-1.5 text-rose-800">
              <span className="font-bold shrink-0">Avoid:</span>
              <span>{worstSlot.title} · {worstSlot.hours}</span>
            </div>
          </div>

          <div className="mt-auto pt-3 text-[10px] font-bold text-forest-700 dark:text-emerald-400 uppercase tracking-wider">
            Open 24h plan →
          </div>
        </button>

        {/* PILLAR 2 — indoor air hacks */}
        <button
          onClick={() => onNavigate('indoor')}
          className="group text-left bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-forest-500 dark:hover:border-emerald-600 hover:shadow-md transition-all p-5 flex flex-col"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
              <span className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <Home className="w-4 h-4 text-emerald-600" />
              </span>
              Indoor air hacks
            </span>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-forest-700 transition-colors" />
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">What's polluting your home, and the free fix.</p>

          <div className="mt-3">
            <DonutChart
              data={topHazards}
              centerValue={`${indoor.score}`}
              centerLabel="hazard score"
              unit=" pts"
              size={120}
            />
          </div>

          <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-rose-700 shrink-0">Top risk:</span>
                                <span className="truncate">
                    {(indoor.breakdown ?? [])
                      .filter((b) => b.label !== 'Baseline household load')
                      .slice()
                      .sort((a, b) => b.points - a.points)[0]?.label ?? 'No major source detected'}
                  </span>
            </div>
            <div className="mt-1 text-[10px] font-bold text-forest-700 dark:text-emerald-400 uppercase tracking-wider">Open indoor checks →</div>
          </div>
        </button>

        {/* PILLAR 3 — sustainable alternatives */}
        <button
          onClick={() => onNavigate('choices')}
          className="group text-left bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-forest-500 dark:hover:border-emerald-600 hover:shadow-md transition-all p-5 flex flex-col"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
              <span className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                <Bike className="w-4 h-4 text-blue-600" />
              </span>
              Sustainable alternatives
            </span>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-forest-700 transition-colors" />
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">CO₂ per km, lowest first. Pick your swap.</p>

          <div className="mt-4 space-y-1.5">
            {MODE_LABELS.map((mode) => {
              const pct = (mode.factor / EMISSION_FACTORS.cabSoloKgCo2PerKm) * 100;
              const isLow = mode.factor <= EMISSION_FACTORS.metroElectricBusKgCo2PerKm;
              return (
                <div key={mode.label} className="flex items-center gap-2">
                  <span className="w-16 sm:w-20 text-[10px] text-slate-600 dark:text-slate-300 truncate">{mode.label}</span>
                  <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(2, pct)}%`,
                        backgroundColor: isLow ? '#10B981' : '#F97316'
                      }}
                    />
                  </div>
                  <span className="w-9 text-right text-[10px] font-mono text-slate-500 dark:text-slate-400">{mode.factor.toFixed(3)}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Metro emits {metroVsCar}% less CO₂ per km than a petrol car</span>
            </div>
            <div className="mt-1 text-[10px] font-bold text-forest-700 dark:text-emerald-400 uppercase tracking-wider">Open cleaner swaps →</div>
          </div>
        </button>
      </div>

      {/* DIRECT IMPACT OF THESE CHOICES */}
      <div className="bg-forest-950 rounded-2xl p-4 sm:p-6 text-white shadow-sm">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-2/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Direct impact of these choices</span>
            <h3 className="text-lg font-extrabold mt-1 leading-snug">
              What changes if you actually do them
            </h3>
            <p className="text-[11px] text-emerald-100/80 mt-1.5 leading-relaxed">
              Based on a 24 km daily commute, 5 days a week, switched from a solo petrol car to metro. Avoided CO₂ cuts regional
              greenhouse emissions — it does not instantly clean the air at your gate. Exposure protection and emissions are separate.
            </p>
            <div className="mt-3">
              <DonutChart
                data={carbonMix}
                centerValue={`${Math.round((avoided / Math.max(1, baselineAnnual)) * 100)}%`}
                centerLabel="commute carbon avoided"
                unit=" kg"
                size={124}
                dark
              />
            </div>
          </div>

          <div className="lg:w-3/5 grid grid-cols-2 gap-2 sm:gap-3 self-center">
            <div className="bg-white/10 rounded-xl p-3.5 border border-white/10">
              <TrendingDown className="w-4 h-4 text-emerald-300" />
              <div className="text-xl sm:text-2xl font-extrabold mt-1.5 break-words">{avoided.toLocaleString()}</div>
              <div className="text-[10px] text-emerald-100/80">kg CO₂e avoided / year</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3.5 border border-white/10">
              <Trees className="w-4 h-4 text-emerald-300" />
              <div className="text-xl sm:text-2xl font-extrabold mt-1.5 break-words">~{Math.round(avoided / 22)}</div>
              <div className="text-[10px] text-emerald-100/80">mature trees equivalent</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3.5 border border-white/10">
              <IndianRupee className="w-4 h-4 text-emerald-300" />
              <div className="text-xl sm:text-2xl font-extrabold mt-1.5 break-words">{impact.fuelCostSavedInrAnnual.toLocaleString()}</div>
              <div className="text-[10px] text-emerald-100/80">fuel saved / year (₹)</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3.5 border border-white/10">
              <Route className="w-4 h-4 text-emerald-300" />
              <div className="text-xl sm:text-2xl font-extrabold mt-1.5 break-words">{impact.co2EquivalentKmDriven.toLocaleString()}</div>
              <div className="text-[10px] text-emerald-100/80">car km avoided / year</div>
            </div>
            <button
              onClick={() => onNavigate('impact')}
              className="col-span-2 mt-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-400 text-forest-950 rounded-xl text-xs font-bold hover:bg-emerald-300 transition-colors"
            >
              Change the numbers for my commute
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
