import React, { useMemo, useState } from 'react';
import { IndoorQuestionnaireAnswers } from '../../types/indoor.ts';
import { AirQualityContext } from '../../types/air-quality.ts';
import { assessIndoorAir } from '../../intelligence/indoor/indoor-engine.ts';
import { DonutChart } from '../visuals/DonutChart.tsx';
import { AlertTriangle, CheckCircle2, Info, Wind, Home, Stethoscope, ArrowLeft } from 'lucide-react';

interface Props {
  airQuality?: AirQualityContext;
  onBackToPlan?: () => void;
}

const HAZARD_COLORS = ['#94A3B8', '#F97316', '#DC2626', '#7C3AED', '#0EA5E9', '#F59E0B', '#10B981', '#64748B'];

export const IndoorAirDoctor: React.FC<Props> = ({ airQuality, onBackToPlan }) => {
  const [answers, setAnswers] = useState<IndoorQuestionnaireAnswers>({
    cookingFuel: 'piped_gas',
    kitchenExhaust: 'exhaust_fan',
    windowHabits: 'ventilate_when_clean',
    dustAccumulation: 'moderate',
    indoorSmoking: 'none',
    incenseOrCoils: 'daily_agarbatti',
    dampnessOrMould: 'none',
    pets: false,
    hasAirPurifier: false,
    vacuumHabits: 'regular_sweep_mop'
  });

  // Recomputed live so every answer visibly moves the charts below.
  const assessment = useMemo(
    () => assessIndoorAir(answers, airQuality?.aqi),
    [answers, airQuality?.aqi]
  );

  const breakdown = assessment.breakdown ?? [];
  const chartData = breakdown.map((item, i) => ({
    name: item.label,
    value: item.points,
    color: HAZARD_COLORS[i % HAZARD_COLORS.length]
  }));

  const scoreColor =
    assessment.score > 70 ? '#DC2626' : assessment.score > 50 ? '#F97316' : assessment.score > 30 ? '#F59E0B' : '#10B981';

  const riskBadgeClass =
    assessment.riskLevel === 'Critical Hazard' ? 'bg-rose-100 text-rose-800 border-rose-300' :
    assessment.riskLevel === 'High Hazard' ? 'bg-orange-100 text-orange-800 border-orange-300' :
    assessment.riskLevel === 'Moderate Hazard' ? 'bg-amber-100 text-amber-800 border-amber-300' :
    'bg-emerald-100 text-emerald-800 border-emerald-300';

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-forest-800 text-[11px] font-bold uppercase tracking-wider">
              <Home className="w-4 h-4 text-emerald-600" />
              <span>Indoor Air Hacks</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight mt-1">
              Find what pollutes your home — then fix it today
            </h2>
            <p className="text-xs text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
              Answer 6 quick questions. The charts update instantly, ranked by how much each source adds to your indoor risk.
            </p>
          </div>
          {onBackToPlan && (
            <button
              onClick={onBackToPlan}
              className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-forest-800 hover:text-forest-950 shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Action plan</span>
            </button>
          )}
        </div>
        <div className="mt-3 p-2.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2 text-[11px] text-blue-900">
          <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
          <span>This is a hazard assessment, not an indoor sensor. AirAware AI never fabricates an indoor AQI number.</span>
        </div>
      </div>

      {/* Visual summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Indoor hazard score</span>
            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${riskBadgeClass}`}>
              {assessment.riskLevel}
            </span>
          </div>

          <div className="mt-3 flex items-end gap-2">
            <span className="text-5xl font-extrabold leading-none" style={{ color: scoreColor }}>
              {assessment.score}
            </span>
            <span className="text-xs font-semibold text-slate-400 mb-1">/ 100</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Lower is healthier.</p>

          {/* Score bar with thresholds */}
          <div className="mt-3">
            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200 p-0.5">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${assessment.score}%`, backgroundColor: scoreColor }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-1">
              <span>0 Clean</span>
              <span>30</span>
              <span>50</span>
              <span>70</span>
              <span>100 Severe</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 leading-relaxed">
            <strong className="text-slate-800">Today's outdoor context:</strong>{' '}
            {airQuality?.aqi !== undefined
              ? `${airQuality.location} is at AQI ${airQuality.aqi} (${airQuality.aqiCategory}). Open-window habits are weighted against this.`
              : 'Outdoor AQI unavailable — window habits are weighted on general guidance only.'}
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            What is adding to your indoor risk
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5 mb-3">Each slice is the share of your hazard points.</p>
          <DonutChart
            data={chartData}
            centerValue={`${assessment.score}`}
            centerLabel="hazard points"
            unit=" pts"
            size={148}
          />
        </div>
      </div>

      {/* Questionnaire */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
          Your home in 6 questions
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-4">
          <div>
            <label className="block font-semibold text-slate-800 mb-1">Kitchen exhaust</label>
            <select
              value={answers.kitchenExhaust}
              onChange={(e) => setAnswers({ ...answers, kitchenExhaust: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-forest-500 bg-white"
            >
              <option value="chimney_hepa">Ducted chimney (strong extraction)</option>
              <option value="exhaust_fan">Wall exhaust fan</option>
              <option value="open_window">Open window only</option>
              <option value="poor_ventilation">No exhaust / poor airflow</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Incense &amp; mosquito coils</label>
            <select
              value={answers.incenseOrCoils}
              onChange={(e) => setAnswers({ ...answers, incenseOrCoils: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-forest-500 bg-white"
            >
              <option value="none">None indoors</option>
              <option value="festivals_only">Festivals only</option>
              <option value="daily_agarbatti">Daily agarbatti / dhoop</option>
              <option value="mosquito_coils">Mosquito coils at night</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Dampness &amp; mould</label>
            <select
              value={answers.dampnessOrMould}
              onChange={(e) => setAnswers({ ...answers, dampnessOrMould: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-forest-500 bg-white"
            >
              <option value="none">None</option>
              <option value="musty_smell">Musty smell in monsoon</option>
              <option value="visible_spots">Visible mould patches</option>
              <option value="extensive">Extensive seepage</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Floor cleaning</label>
            <select
              value={answers.vacuumHabits}
              onChange={(e) => setAnswers({ ...answers, vacuumHabits: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-forest-500 bg-white"
            >
              <option value="hepa_vacuum">HEPA vacuum</option>
              <option value="regular_sweep_mop">Broom + wet mop</option>
              <option value="dry_sweep_only">Dry broom only</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Indoor smoking</label>
            <select
              value={answers.indoorSmoking}
              onChange={(e) => setAnswers({ ...answers, indoorSmoking: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-forest-500 bg-white"
            >
              <option value="none">Smoke-free home</option>
              <option value="occasional">Occasional, on balcony</option>
              <option value="regular">Regular indoor smoking</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Window routine</label>
            <select
              value={answers.windowHabits}
              onChange={(e) => setAnswers({ ...answers, windowHabits: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-forest-500 bg-white"
            >
              <option value="ventilate_when_clean">Timed, during clean hours</option>
              <option value="always_open">Open all day and night</option>
              <option value="rarely_open">Closed most of the day</option>
              <option value="sealed_ac">Sealed, air-conditioned</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-slate-600">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={answers.hasAirPurifier}
              onChange={(e) => setAnswers({ ...answers, hasAirPurifier: e.target.checked })}
              className="w-4 h-4 rounded text-forest-600 focus:ring-forest-500"
            />
            <span>I have a HEPA air purifier</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={answers.pets}
              onChange={(e) => setAnswers({ ...answers, pets: e.target.checked })}
              className="w-4 h-4 rounded text-forest-600 focus:ring-forest-500"
            />
            <span>Pets at home</span>
          </label>
          <span className="ml-auto flex items-center gap-1 text-emerald-700 font-semibold">
            <Wind className="w-3.5 h-3.5" /> Results update live
          </span>
        </div>
      </div>

      {/* Hacks */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
        <h4 className="text-xs font-bold text-forest-900 uppercase tracking-wider flex items-center gap-1.5 mb-1">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Free hacks — do these today</span>
        </h4>
        <p className="text-[11px] text-slate-500 mb-3">No purchase needed.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {assessment.immediateZeroCostActions.map((action, idx) => (
            <div key={idx} className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-[11px] text-slate-800 flex items-start gap-2">
              <span className="w-5 h-5 shrink-0 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                {idx + 1}
              </span>
              <span className="leading-relaxed">{action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hazards found */}
      {assessment.primaryHazards.length > 0 && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Sources detected</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {assessment.primaryHazards.map((h, i) => (
              <div key={i} className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-[11px]">
                <div className="font-bold text-rose-950 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>{h.title}</span>
                </div>
                <p className="text-rose-900/80 mt-1 leading-relaxed">{h.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medium term + equipment */}
      {(assessment.mediumTermImprovements.length > 0 || assessment.equipmentRecommendations.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assessment.mediumTermImprovements.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Worth fixing this month</h4>
              <ul className="space-y-1.5 text-[11px] text-slate-700">
                {assessment.mediumTermImprovements.map((item, i) => (
                  <li key={i} className="flex gap-2"><span className="text-slate-400">•</span><span>{item}</span></li>
                ))}
              </ul>
            </div>
          )}
          {assessment.equipmentRecommendations.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">If you buy one thing</h4>
              <ul className="space-y-1.5 text-[11px] text-slate-700">
                {assessment.equipmentRecommendations.map((item, i) => (
                  <li key={i} className="flex gap-2"><span className="text-slate-400">•</span><span>{item}</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Myth busting */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-600 space-y-1.5">
        <div className="font-bold text-slate-800 flex items-center gap-2 text-xs">
          <Stethoscope className="w-4 h-4 text-emerald-700" />
          <span>Two myths worth knowing</span>
        </div>
        {assessment.scientificClarifications.map((item, idx) => (
          <p key={idx} className="leading-relaxed">• {item}</p>
        ))}
      </div>

    </div>
  );
};
