import React, { useMemo, useState } from 'react';
import { WhatIfScenarioInput } from '../../types/calculator.ts';
import { calculateWhatIfSavings, EMISSION_FACTORS } from '../../intelligence/impact/emissions-calculator.ts';
import { DonutChart } from '../visuals/DonutChart.tsx';
import { Calculator, Trees, Car, Info, TrendingDown, IndianRupee } from 'lucide-react';

const BASE_FACTOR: Record<WhatIfScenarioInput['baseTransport'], number> = {
  petrol_car: EMISSION_FACTORS.petrolCarKgCo2PerKm,
  diesel_car: EMISSION_FACTORS.dieselCarKgCo2PerKm,
  two_wheeler_petrol: EMISSION_FACTORS.twoWheelerPetrolKgCo2PerKm,
  cab: EMISSION_FACTORS.cabSoloKgCo2PerKm
};

const TARGET_FACTOR: Record<WhatIfScenarioInput['targetTransport'], number> = {
  electric_bus_metro: EMISSION_FACTORS.metroElectricBusKgCo2PerKm,
  carpool: EMISSION_FACTORS.carpoolKgCo2PerKm,
  electric_two_wheeler: EMISSION_FACTORS.electricTwoWheelerKgCo2PerKm,
  bicycle_walk: EMISSION_FACTORS.bicycleWalkKgCo2PerKm
};

export const WhatIfCalculator: React.FC = () => {
  const [input, setInput] = useState<WhatIfScenarioInput>({
    baseTransport: 'petrol_car',
    targetTransport: 'electric_bus_metro',
    dailyRoundTripKm: 24,
    commuteDaysPerWeek: 5,
    errandTripBatching: true,
    noIdlingHabit: true
  });

  const result = calculateWhatIfSavings(input);
  const treesEquivalent = Math.round(result.annualKgCo2eAvoided / 22);

  const weeklyKm = input.dailyRoundTripKm * input.commuteDaysPerWeek;
  const baseWeekly = weeklyKm * BASE_FACTOR[input.baseTransport];
  const targetWeekly = weeklyKm * TARGET_FACTOR[input.targetTransport] * (input.errandTripBatching ? 0.85 : 1);
  const baselineAnnual = Math.round(baseWeekly * 50);
  const targetAnnual = Math.round(targetWeekly * 50);
  const reductionPct = baselineAnnual > 0 ? Math.round(((baselineAnnual - targetAnnual) / baselineAnnual) * 100) : 0;

  const mix = useMemo(() => [
    { name: 'Avoided by the swap', value: result.annualKgCo2eAvoided, color: '#10B981' },
    { name: 'Still emitted', value: Math.max(0, baselineAnnual - result.annualKgCo2eAvoided), color: '#CBD5E1' }
  ], [result.annualKgCo2eAvoided, baselineAnnual]);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 text-forest-800 dark:text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
          <Calculator className="w-4 h-4 text-emerald-600" />
          <span>My impact</span>
        </div>
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
          Move the sliders, watch your yearly impact change
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 max-w-2xl">
          Every number below updates instantly. Colours show what you avoid and what is left.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Inputs */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">
            Your commute today
          </h3>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-100 mb-1">Now</label>
            <select
              value={input.baseTransport}
              onChange={(e) => setInput({ ...input, baseTransport: e.target.value as any })}
              className="w-full max-w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-forest-500 bg-white dark:bg-slate-800 dark:text-slate-100 dark:option:text-slate-200"
            >
              <option value="petrol_car">Solo petrol car</option>
              <option value="diesel_car">Solo diesel SUV / sedan</option>
              <option value="two_wheeler_petrol">Petrol two-wheeler</option>
              <option value="cab">Solo ride-hail cab</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-100 mb-1">Swap to</label>
            <select
              value={input.targetTransport}
              onChange={(e) => setInput({ ...input, targetTransport: e.target.value as any })}
              className="w-full max-w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-forest-500 bg-white dark:bg-slate-800 dark:text-slate-100 dark:option:text-slate-200"
            >
              <option value="electric_bus_metro">Metro / electric city bus</option>
              <option value="carpool">Carpool (3 occupants)</option>
              <option value="electric_two_wheeler">Electric scooter</option>
              <option value="bicycle_walk">Bicycle / walking</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-100">Round trip</label>
              <span className="font-bold text-forest-900 dark:text-emerald-300 font-mono text-sm">{input.dailyRoundTripKm} km</span>
            </div>
            <input
              type="range" min="2" max="80" step="2"
              value={input.dailyRoundTripKm}
              onChange={(e) => setInput({ ...input, dailyRoundTripKm: parseInt(e.target.value) || 2 })}
              className="w-full accent-forest-700"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-100">Days per week</label>
              <span className="font-bold text-forest-900 dark:text-emerald-300 font-mono text-sm">{input.commuteDaysPerWeek}</span>
            </div>
            <input
              type="range" min="1" max="7"
              value={input.commuteDaysPerWeek}
              onChange={(e) => setInput({ ...input, commuteDaysPerWeek: parseInt(e.target.value) || 1 })}
              className="w-full accent-forest-700"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox" checked={input.errandTripBatching}
                onChange={(e) => setInput({ ...input, errandTripBatching: e.target.checked })}
                className="w-4 h-4 rounded text-forest-600 focus:ring-forest-500 dark:focus:ring-emerald-500"
              />
              <span className="text-slate-700 dark:text-slate-200">Batch errands into one loop (−15% km)</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox" checked={input.noIdlingHabit}
                onChange={(e) => setInput({ ...input, noIdlingHabit: e.target.checked })}
                className="w-4 h-4 rounded text-forest-600 focus:ring-forest-500 dark:focus:ring-emerald-500"
              />
              <span className="text-slate-700 dark:text-slate-200">Engine off at signals (&gt;15s)</span>
            </label>
          </div>
        </div>

        {/* Output */}
        <div className="lg:col-span-7 space-y-4">

          {/* Before / after */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Yearly commute carbon</h3>
              <span className="px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[11px] font-extrabold">
                −{reductionPct}%
              </span>
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 mb-1">
                  <span>Your habit now</span>
                  <span className="font-mono font-bold dark:font-white">{baselineAnnual.toLocaleString()} kg</span>
                </div>
                <div className="h-4 bg-rose-100 dark:bg-rose-900/60 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 mb-1">
                  <span>After the swap</span>
                  <span className="font-mono font-bold dark:font-white">{targetAnnual.toLocaleString()} kg</span>
                </div>
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(2, Math.round((targetAnnual / Math.max(1, baselineAnnual)) * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Donut + stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Where the carbon goes</h3>
              <DonutChart
                data={mix}
                centerValue={`${result.annualKgCo2eAvoided.toLocaleString()}`}
                centerLabel="kg avoided / yr"
                unit=" kg"
                size={120}
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-xl p-3.5 border border-emerald-200 dark:border-emerald-900">
                <Trees className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                <div className="text-2xl font-extrabold text-emerald-950 dark:text-emerald-100 mt-1 flex items-baseline gap-1">
                  {treesEquivalent}
                  <span className="text-[10px] font-semibold">trees</span>
                </div>
                <div className="text-[10px] text-emerald-800 dark:text-emerald-200">Annual carbon absorbed equivalent</div>
              </div>
              <div className="bg-forest-50 dark:bg-forest-900/50 rounded-xl p-3.5 border border-forest-200 dark:border-forest-800">
                <IndianRupee className="w-4 h-4 text-forest-700 dark:text-emerald-300" />
                <div className="text-2xl font-extrabold text-forest-950 dark:text-emerald-100 mt-1">{result.fuelCostSavedInrAnnual.toLocaleString()}</div>
                <div className="text-[10px] text-forest-800 dark:text-emerald-200">Saved per year, after transit costs</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800">
                <Car className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                  {result.co2EquivalentKmDriven.toLocaleString()} <span className="text-[10px] font-semibold">km</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Car driving avoided this year</div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-[11px] text-amber-900 dark:text-amber-200">
            <TrendingDown className="w-4 h-4 text-amber-600 dark:text-amber-300 shrink-0 mt-0.5" />
            <span>
              <strong>Honest boundary:</strong> avoided CO₂ slows regional warming but will not drop the PM2.5 reading at your gate.
              Keep using masks and the routine planner for personal exposure.
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-100 text-[11px]">
              <Info className="w-3.5 h-3.5" />
              <span>Method</span>
            </div>
            <p className="mt-1 leading-relaxed">
              Emission factors from ARAI vehicle testing averages and Central Electricity Authority grid carbon intensity. Annualised over 50 working weeks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
