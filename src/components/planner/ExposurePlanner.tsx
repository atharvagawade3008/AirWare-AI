import React, { useMemo } from 'react';
import { ExposurePlannerSlot } from '../../types/recommendation.ts';
import { HouseholdProfile } from '../../types/profile.ts';
import { Sunrise, Sun, Sunset, Moon, CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  slots: ExposurePlannerSlot[];
  profile: HouseholdProfile;
}

const RISK_WEIGHT: Record<string, number> = { Low: 1, Moderate: 2, High: 3, Severe: 4 };
const RISK_COLOR: Record<string, string> = {
  Low: '#10B981',
  Moderate: '#F59E0B',
  High: '#F97316',
  Severe: '#DC2626'
};

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
      case 'Severe': return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Moderate': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Low':
      default: return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
  };

  const bestSlot = useMemo(() => slots.reduce((best, slot) =>
    (RISK_WEIGHT[slot.expectedRisk] ?? 2) < (RISK_WEIGHT[best.expectedRisk] ?? 2) ? slot : best
  , slots[0]), [slots]);

  return (
    <div className="space-y-5">

      {/* Header + risk timeline */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
          Your 24-hour routine, hour by hour
        </h2>
        <p className="text-xs text-slate-600 mt-1 max-w-2xl">
          Pollution is not flat across the day. The bars below show which windows are safest for{' '}
          <strong>{profile.name}</strong>.
        </p>

        {/* Timeline */}
        <div className="mt-5 grid grid-cols-4 gap-2">
          {slots.map((slot) => {
            const weight = RISK_WEIGHT[slot.expectedRisk] ?? 2;
            const Icon = getSlotIcon(slot.timeOfDay);
            const isBest = slot.timeOfDay === bestSlot.timeOfDay;
            return (
              <div key={slot.timeOfDay} className="flex flex-col items-center">
                <span className="text-[9px] sm:text-[10px] font-bold mb-1" style={{ color: RISK_COLOR[slot.expectedRisk] }}>
                  {slot.expectedRisk}
                </span>
                <div className="w-full h-24 sm:h-28 bg-slate-50 rounded-lg flex items-end overflow-hidden border border-slate-100">
                  <div
                    className="w-full rounded-t-md transition-all duration-500"
                    style={{ height: `${(weight / 4) * 100}%`, backgroundColor: RISK_COLOR[slot.expectedRisk], opacity: isBest ? 1 : 0.55 }}
                  />
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-semibold text-slate-700 capitalize">{slot.timeOfDay}</span>
                </div>
                {isBest && <span className="text-[9px] font-bold text-emerald-700 uppercase">best</span>}
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900">
          <strong>Go out here:</strong> {bestSlot.title} ({bestSlot.hours}). {bestSlot.suggestedAction}
        </div>
      </div>

      {/* Slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {slots.map((slot) => {
          const Icon = getSlotIcon(slot.timeOfDay);
          const isBest = slot.timeOfDay === bestSlot.timeOfDay;
          return (
            <div
              key={slot.timeOfDay}
              className={`bg-white rounded-2xl p-5 border shadow-sm flex flex-col justify-between ${
                isBest ? 'border-emerald-300 ring-1 ring-emerald-100' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-forest-50 text-forest-800 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{slot.title}</h3>
                      <span className="text-[11px] font-mono text-slate-500">{slot.hours}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-[10px] font-bold rounded-lg border ${getRiskBadge(slot.expectedRisk)}`}>
                    {slot.expectedRisk}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Why</span>
                    <p className="text-[11px] text-slate-700 mt-0.5 leading-relaxed">{slot.generalGuidance}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-forest-800 uppercase tracking-wider">For your household</span>
                    <ul className="mt-0.5 space-y-1">
                      {slot.householdTailoredGuidance.map((item, idx) => (
                        <li key={idx} className="text-[11px] text-slate-800 flex items-start gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-forest-600 mt-1.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                <div className="flex items-start gap-1.5 text-[11px] text-emerald-900 bg-emerald-50/80 p-2 rounded-lg border border-emerald-100">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Do:</strong> {slot.suggestedAction}</span>
                </div>
                <div className="flex items-start gap-1.5 text-[11px] text-rose-900 bg-rose-50/80 p-2 rounded-lg border border-rose-100">
                  <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
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
