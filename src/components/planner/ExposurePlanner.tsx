import React from 'react';
import { ExposurePlannerSlot } from '../../types/recommendation.ts';
import { HouseholdProfile } from '../../types/profile.ts';
import { Sunrise, Sun, Sunset, Moon, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface Props {
  slots: ExposurePlannerSlot[];
  profile: HouseholdProfile;
}

export const ExposurePlanner: React.FC<Props> = ({ slots, profile }) => {
  const getSlotIcon = (timeOfDay: string) => {
    switch (timeOfDay) {
      case 'morning': return Sunrise;
      case 'afternoon': return Sun;
      case 'evening': return Sunset;
      case 'night': return Moon;
      default: return Sun;
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'Severe':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Moderate':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Low':
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-sans">
          24-Hour Personalized Exposure Planner
        </h2>
        <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
          Pollution does not stay static throughout the day. Ground temperature inversions, sunlight photochemistry, and traffic surges create distinct exposure windows. 
          Below is your household's dynamic action plan tailored for <strong>{profile.name}</strong>.
        </p>
      </div>

      {/* 4 Time Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {slots.map((slot) => {
          const Icon = getSlotIcon(slot.timeOfDay);
          return (
            <div 
              key={slot.timeOfDay}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-forest-500/50 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-800 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{slot.title}</h3>
                      <span className="text-xs font-mono text-slate-500">{slot.hours}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${getRiskBadge(slot.expectedRisk)}`}>
                    {slot.expectedRisk} Risk
                  </span>
                </div>

                {/* Atmospheric Reality */}
                <div className="mt-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Atmospheric Dynamics</span>
                  <p className="text-xs text-slate-700 mt-0.5 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {slot.generalGuidance}
                  </p>
                </div>

                {/* Household Specific Advice */}
                <div className="mt-4">
                  <span className="text-[10px] font-bold text-forest-800 uppercase tracking-wider">Tailored for Your Profile</span>
                  <ul className="mt-1.5 space-y-1.5">
                    {slot.householdTailoredGuidance.map((item, idx) => (
                      <li key={idx} className="text-xs text-slate-800 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-forest-600 mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Do & Avoid Guidance */}
              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                <div className="flex items-start gap-2 text-xs text-emerald-900 bg-emerald-50/80 p-2 rounded-lg border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Do:</strong> {slot.suggestedAction}</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-rose-900 bg-rose-50/80 p-2 rounded-lg border border-rose-100">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>Avoid:</strong> {slot.avoidAction}</span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
