import React, { useState } from 'react';
import { IndoorQuestionnaireAnswers, IndoorAssessmentResult } from '../../types/indoor.ts';
import { ShieldCheck, AlertTriangle, CheckCircle2, Info, Sparkles, Wind, Flame, Home, Stethoscope } from 'lucide-react';

export const IndoorAirDoctor: React.FC = () => {
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

  const [assessment, setAssessment] = useState<IndoorAssessmentResult | null>(null);

  const calculateAssessment = () => {
    let score = 20; // baseline
    const hazards: IndoorAssessmentResult['primaryHazards'] = [];
    const zeroCost: string[] = [];
    const mediumTerm: string[] = [];
    const equipment: string[] = [];

    // 1. Incense / Mosquito Coils
    if (answers.incenseOrCoils === 'mosquito_coils') {
      score += 35;
      hazards.push({
        title: 'Mosquito Coil Combustion (High Particulate Hazard)',
        description: 'Burning a single mosquito coil inside an enclosed room emits particulate matter equivalent to smoking 75–100 cigarettes, releasing toxic heavy polycyclic aromatic hydrocarbons (PAHs).',
        severity: 'high'
      });
      zeroCost.push('Immediately replace smouldering mosquito coils with mosquito nets, window mesh screens, or electric liquid vaporizers.');
    } else if (answers.incenseOrCoils === 'daily_agarbatti') {
      score += 20;
      hazards.push({
        title: 'Daily Incense Smoke (Agarbatti / Dhoop)',
        description: 'Incense combustion produces dense sub-micron carbon particles, benzene, and formaldehyde that linger in indoor air for up to 6 hours.',
        severity: 'medium'
      });
      zeroCost.push('Ventilate the prayer area directly or switch to electric LED diyas and smokeless alternatives.');
    }

    // 2. Kitchen Exhaust & Fuel
    if (answers.kitchenExhaust === 'poor_ventilation' || answers.kitchenExhaust === 'open_window') {
      score += 25;
      hazards.push({
        title: 'Inadequate Cooking Fume Exhaust',
        description: 'High-heat frying, tadka, and fuel combustion without an active mechanical exhaust fan trap ultrafine oil droplets, CO, and NO₂ inside the living quarters.',
        severity: 'high'
      });
      zeroCost.push('Turn on the kitchen exhaust fan 2 minutes BEFORE lighting the stove and keep it running for 5 minutes after cooking completes.');
      mediumTerm.push('Install a ducted kitchen chimney with a minimum airflow rating of 1000–1200 m³/hr.');
    }

    if (answers.cookingFuel === 'biomass' || answers.cookingFuel === 'kerosene') {
      score += 40;
      hazards.push({
        title: 'Solid Fuel / Biomass Combustion',
        description: 'Unvented biomass or kerosene produces extreme carbon monoxide and black carbon concentrations indoors.',
        severity: 'high'
      });
      mediumTerm.push('Switch cooking entirely to clean electric induction or piped LPG/PNG.');
    }

    // 3. Indoor Smoking
    if (answers.indoorSmoking === 'regular') {
      score += 40;
      hazards.push({
        title: 'Secondhand Tobacco Smoke',
        description: 'Tobacco smoke creates persistent thirdhand toxic residue on upholstery, curtains, and flooring, emitting volatile organic compounds for weeks.',
        severity: 'high'
      });
      zeroCost.push('Designate the entire home as a 100% smoke-free zone. Smoking on balconies still drifts back through doorways.');
    }

    // 4. Dampness & Mould
    if (answers.dampnessOrMould === 'visible_spots' || answers.dampnessOrMould === 'extensive') {
      score += 25;
      hazards.push({
        title: 'Fungal Spores & Mould Bio-Aerosols',
        description: 'Visible mould patches release millions of airborne mycotoxins and allergens, exacerbating chronic asthma, sinusitis, and persistent nighttime coughing.',
        severity: 'high'
      });
      mediumTerm.push('Scrub mould-affected walls using dilute hydrogen peroxide or antifungal wash, and repair structural water seepage.');
    }

    // 5. Cleaning & Dust Re-suspension
    if (answers.vacuumHabits === 'dry_sweep_only') {
      score += 15;
      hazards.push({
        title: 'Dry Broom Dust Re-suspension',
        description: 'Traditional dry broom sweeping kicks settled coarse and fine PM10 back into human breathing zones for 2 to 3 hours.',
        severity: 'medium'
      });
      zeroCost.push('Switch to two-bucket wet mopping with a damp microfiber cloth instead of dry sweeping.');
    }

    // 6. Air Purifier
    if (!answers.hasAirPurifier) {
      score += 10;
      equipment.push('Invest in an air purifier with a True HEPA H13 filter and Clean Air Delivery Rate (CADR) sized to your room volume (approx. 250–350 m³/hr for standard bedrooms).');
    }

    score = Math.min(100, Math.max(10, score));

    let riskLevel: IndoorAssessmentResult['riskLevel'] = 'Low Hazard';
    if (score > 70) riskLevel = 'Critical Hazard';
    else if (score > 50) riskLevel = 'High Hazard';
    else if (score > 30) riskLevel = 'Moderate Hazard';

    setAssessment({
      score,
      riskLevel,
      primaryHazards: hazards,
      immediateZeroCostActions: zeroCost.length > 0 ? zeroCost : ['Maintain current good practices: keep kitchen ventilated and continue wet-mopping.'],
      mediumTermImprovements: mediumTerm,
      equipmentRecommendations: equipment,
      scientificClarifications: [
        'Houseplants Reality: Potted plants (Snake plant, Areca palm) cannot meaningfully filter real-world room air volume against particulate pollution. Mechanical HEPA filtration is required.',
        'Strict Ozone Warning: Never purchase ozone generators or uncertified negative ionizers; ozone is an aggressive lung irritant banned in healthcare standards.'
      ]
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Feature Title */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-forest-800 text-xs font-bold uppercase tracking-wider">
          <Home className="w-4 h-4 text-emerald-600" />
          <span>Indoor Air Doctor — Comprehensive Risk Assessment</span>
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-sans mt-1">
          Evaluate & Protect Your Indoor Living Sanctuary
        </h2>
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <strong>Transparency Notice:</strong> This is a lifestyle and environmental hazard assessment tool, <em>not</em> an indoor sensor. AirAware AI never fabricates indoor AQI numbers without a verified, connected hardware monitor.
          </div>
        </div>
      </div>

      {/* Assessment Questionnaire Form */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
          Household Habits & Living Environment Audit
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          
          {/* Question 1: Cooking Exhaust */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1.5">Kitchen Ventilation & Exhaust</label>
            <select
              value={answers.kitchenExhaust}
              onChange={(e) => setAnswers({ ...answers, kitchenExhaust: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-forest-500 bg-white"
            >
              <option value="chimney_hepa">Ducted Electric Chimney (High extraction)</option>
              <option value="exhaust_fan">Wall Exhaust Fan</option>
              <option value="open_window">Open Kitchen Window Only</option>
              <option value="poor_ventilation">No active exhaust / poor airflow</option>
            </select>
          </div>

          {/* Question 2: Incense or Coils */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1.5">Incense (Agarbatti) & Mosquito Coils</label>
            <select
              value={answers.incenseOrCoils}
              onChange={(e) => setAnswers({ ...answers, incenseOrCoils: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-forest-500 bg-white"
            >
              <option value="none">None used indoors</option>
              <option value="festivals_only">Festivals / occasional only</option>
              <option value="daily_agarbatti">Daily incense / dhoop sticks</option>
              <option value="mosquito_coils">Mosquito coils burned at night</option>
            </select>
          </div>

          {/* Question 3: Dampness / Mould */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1.5">Dampness & Wall Mould</label>
            <select
              value={answers.dampnessOrMould}
              onChange={(e) => setAnswers({ ...answers, dampnessOrMould: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-forest-500 bg-white"
            >
              <option value="none">No dampness or smells</option>
              <option value="musty_smell">Musty smell in monsoon/winter</option>
              <option value="visible_spots">Visible black/grey mould patches</option>
              <option value="extensive">Extensive water seepage</option>
            </select>
          </div>

          {/* Question 4: Cleaning Technique */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1.5">Daily Floor Cleaning Habit</label>
            <select
              value={answers.vacuumHabits}
              onChange={(e) => setAnswers({ ...answers, vacuumHabits: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-forest-500 bg-white"
            >
              <option value="regular_sweep_mop">Dry broom followed by wet mopping</option>
              <option value="hepa_vacuum">HEPA vacuum cleaner</option>
              <option value="dry_sweep_only">Dry broom sweeping only</option>
            </select>
          </div>

          {/* Question 5: Indoor Smoking */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1.5">Indoor Tobacco Smoking</label>
            <select
              value={answers.indoorSmoking}
              onChange={(e) => setAnswers({ ...answers, indoorSmoking: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-forest-500 bg-white"
            >
              <option value="none">Completely smoke-free home</option>
              <option value="occasional">Occasional on balcony / window</option>
              <option value="regular">Regular indoor smoking</option>
            </select>
          </div>

          {/* Question 6: Window Habits */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1.5">Window Ventilation Routine</label>
            <select
              value={answers.windowHabits}
              onChange={(e) => setAnswers({ ...answers, windowHabits: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-forest-500 bg-white"
            >
              <option value="ventilate_when_clean">Timed ventilation during clean afternoon hours</option>
              <option value="always_open">Windows kept open all day and night</option>
              <option value="rarely_open">Kept closed most of the day</option>
              <option value="sealed_ac">Sealed air-conditioned rooms</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={calculateAssessment}
            className="flex items-center gap-2 px-6 py-2.5 bg-forest-900 hover:bg-forest-800 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Generate Indoor Risk Audit</span>
          </button>
        </div>
      </div>

      {/* Assessment Results Section */}
      {assessment && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          
          {/* Header Score Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-200 gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Indoor Exposure Hazard Index</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-1 font-sans">
                {assessment.score} <span className="text-xs font-semibold text-slate-400">/ 100</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Lower is healthier. Evaluates combustion sources, particulate re-suspension, and ventilation adequacy.
              </p>
            </div>

            <div className="shrink-0">
              <span className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs ${
                assessment.riskLevel === 'Critical Hazard' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                assessment.riskLevel === 'High Hazard' ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                assessment.riskLevel === 'Moderate Hazard' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {assessment.riskLevel}
              </span>
            </div>
          </div>

          {/* Identified Hazards */}
          {assessment.primaryHazards.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Identified Indoor Hazard Sources
              </h4>
              <div className="space-y-3">
                {assessment.primaryHazards.map((h, i) => (
                  <div key={i} className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl text-xs">
                    <div className="font-bold text-rose-950 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>{h.title}</span>
                    </div>
                    <p className="text-rose-900/80 mt-1 leading-relaxed">{h.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Zero-Cost Immediate Fixes */}
          <div>
            <h4 className="text-xs font-bold text-forest-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Immediate Zero-Cost Actions (Do Today)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {assessment.immediateZeroCostActions.map((action, idx) => (
                <div key={idx} className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs text-slate-800 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <span>{action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scientific Clarifications & Busting Myths */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-emerald-700" />
              <span>Evidence-Conscious Scientific Clarifications</span>
            </div>
            {assessment.scientificClarifications.map((item, idx) => (
              <p key={idx} className="leading-relaxed">• {item}</p>
            ))}
          </div>

        </div>
      )}

    </div>
  );
};
