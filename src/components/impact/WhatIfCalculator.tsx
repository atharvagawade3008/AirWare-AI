import React, { useState } from 'react';
import { WhatIfScenarioInput } from '../../types/calculator.ts';
import { calculateWhatIfSavings } from '../../intelligence/impact/emissions-calculator.ts';
import { Calculator, ArrowRight, Fuel, Trees, Car, Leaf, Info } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-forest-800 text-xs font-bold uppercase tracking-wider">
          <Calculator className="w-4 h-4 text-emerald-600" />
          <span>What-If Personal Impact Calculator</span>
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-sans mt-1">
          Estimate Your Avoided Emissions & Fuel Cost Savings
        </h2>
        <p className="text-xs text-slate-600 mt-2 max-w-3xl leading-relaxed">
          Simulate how adopting cleaner commute alternatives, batching errands, and cutting engine idling adds up over a typical year.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Input Parameters (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5 text-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
            Configure Your Commute Scenario
          </h3>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Current Habitual Transport</label>
            <select
              value={input.baseTransport}
              onChange={(e) => setInput({ ...input, baseTransport: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-forest-500 bg-white"
            >
              <option value="petrol_car">Solo Petrol Car (1.2L - 1.5L)</option>
              <option value="diesel_car">Solo Diesel SUV / Sedan</option>
              <option value="two_wheeler_petrol">Petrol Two-Wheeler (125cc)</option>
              <option value="cab">Solo Ride-Hail Cab</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Cleaner Alternative to Compare</label>
            <select
              value={input.targetTransport}
              onChange={(e) => setInput({ ...input, targetTransport: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-forest-500 bg-white"
            >
              <option value="electric_bus_metro">Metro Rail / Electric City Bus</option>
              <option value="carpool">Shared Carpool (3 Occupants)</option>
              <option value="electric_two_wheeler">Electric Scooter / EV Bike</option>
              <option value="bicycle_walk">Bicycle / Walking (Zero Tailpipe)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-700">Daily Round-Trip Distance</label>
              <span className="font-bold text-forest-900 font-mono text-sm">{input.dailyRoundTripKm} km</span>
            </div>
            <input
              type="range"
              min="2"
              max="80"
              step="2"
              value={input.dailyRoundTripKm}
              onChange={(e) => setInput({ ...input, dailyRoundTripKm: parseInt(e.target.value) || 2 })}
              className="w-full accent-forest-700"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-700">Commute Days per Week</label>
              <span className="font-bold text-forest-900 font-mono text-sm">{input.commuteDaysPerWeek} days</span>
            </div>
            <input
              type="range"
              min="1"
              max="7"
              value={input.commuteDaysPerWeek}
              onChange={(e) => setInput({ ...input, commuteDaysPerWeek: parseInt(e.target.value) || 1 })}
              className="w-full accent-forest-700"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={input.errandTripBatching}
                onChange={(e) => setInput({ ...input, errandTripBatching: e.target.checked })}
                className="w-4 h-4 text-forest-600 rounded focus:ring-forest-500"
              />
              <span className="text-slate-700 font-medium">Batch multiple weekly errands into 1 combined loop (~15% fewer km)</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={input.noIdlingHabit}
                onChange={(e) => setInput({ ...input, noIdlingHabit: e.target.checked })}
                className="w-4 h-4 text-forest-600 rounded focus:ring-forest-500"
              />
              <span className="text-slate-700 font-medium">Cut engine idling at signals & bottlenecks (&gt;15 seconds)</span>
            </label>
          </div>
        </div>

        {/* Output Metrics (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              Calculated Avoided Impact (Annual Projection)
            </h3>

            {/* Big Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              
              {/* Avoided Carbon */}
              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Avoided GHG Emissions</span>
                  <div className="text-3xl font-extrabold text-emerald-950 mt-1 font-sans">
                    {result.annualKgCo2eAvoided.toLocaleString()} <span className="text-xs font-semibold">kg CO₂e</span>
                  </div>
                </div>
                <div className="text-[11px] text-emerald-800 mt-2">
                  Equals <strong>{result.weeklyKgCo2eAvoided} kg</strong> avoided every single week.
                </div>
              </div>

              {/* Fuel Cost Savings */}
              <div className="p-4 bg-forest-50/70 rounded-2xl border border-forest-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-forest-800">Estimated Fuel Savings</span>
                  <div className="text-3xl font-extrabold text-forest-950 mt-1 font-sans">
                    ₹{result.fuelCostSavedInrAnnual.toLocaleString()} <span className="text-xs font-semibold">/ yr</span>
                  </div>
                </div>
                <div className="text-[11px] text-forest-800 mt-2">
                  Direct net financial savings after accounting for transit fares.
                </div>
              </div>

              {/* Trees Equivalent */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tree Carbon Absorption</span>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1 font-sans flex items-center gap-2">
                    <Trees className="w-5 h-5 text-emerald-600" />
                    <span>~{treesEquivalent} Mature Trees</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 mt-2">
                  Equivalent annual CO₂ absorbed by urban tree canopy.
                </div>
              </div>

              {/* Passenger Car Km Avoided */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Equivalent Road Mileage Avoided</span>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1 font-sans flex items-center gap-2">
                    <Car className="w-5 h-5 text-forest-700" />
                    <span>{result.co2EquivalentKmDriven.toLocaleString()} km</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 mt-2">
                  Equivalent driving avoided from arterial road congestion.
                </div>
              </div>

            </div>
          </div>

          {/* Scientific Disclaimer & Transparency */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Info className="w-3.5 h-3.5" />
              <span>Scientific Methodology & Boundary Transparency</span>
            </div>
            <p className="leading-relaxed">
              Emission factors are derived from Automotive Research Association of India (ARAI) vehicle testing averages and Central Electricity Authority grid carbon intensity. 
              <strong> Crucial Distinction:</strong> An individual's avoided CO₂ emissions mitigates regional greenhouse footprint, but does <em>not</em> directly translate into a sudden drop in their immediate neighbourhood PM2.5 or local AQI. Exposure protection and emissions mitigation remain distinct scientific disciplines.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
