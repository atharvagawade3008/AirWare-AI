import React, { useState } from 'react';
import { UsersRound, CheckCircle2, HeartHandshake, ShieldCheck, Sparkles, Award } from 'lucide-react';

interface Pledge {
  id: string;
  title: string;
  category: string;
  description: string;
  participantsCount: number;
}

const INITIAL_PLEDGES: Pledge[] = [
  {
    id: 'anti-idling',
    title: 'Zero-Idling School & Market Zone Pledge',
    category: 'Traffic Exhaust',
    description: 'Switch off vehicle ignition during school pick-up queues and traffic signals exceeding 15 seconds.',
    participantsCount: 1420
  },
  {
    id: 'metro-commute',
    title: 'Twice-a-Week Public Transit Challenge',
    category: 'Commute',
    description: 'Replace solo personal car/cab commutes with Metro or electric bus on Tuesdays and Thursdays.',
    participantsCount: 890
  },
  {
    id: 'smoke-free-home',
    title: 'Combustion-Free Living Pledge',
    category: 'Indoor Health',
    description: 'Eliminate indoor mosquito coils and incense sticks in favour of mechanical filtration and electric nets.',
    participantsCount: 2310
  },
  {
    id: 'errand-batching',
    title: 'Neighbourhood Errand Batching Collective',
    category: 'Efficiency',
    description: 'Combine multiple grocery and hardware runs into a single consolidated trip each weekend.',
    participantsCount: 670
  }
];

export const CommunityImpact: React.FC = () => {
  const [pledges, setPledges] = useState<Pledge[]>(INITIAL_PLEDGES);
  const [pledgedIds, setPledgedIds] = useState<Set<string>>(new Set());

  const handlePledge = (id: string) => {
    if (pledgedIds.has(id)) return;
    
    setPledgedIds(new Set([...pledgedIds, id]));
    setPledges(pledges.map(p => p.id === id ? { ...p, participantsCount: p.participantsCount + 1 } : p));
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-forest-800 text-xs font-bold uppercase tracking-wider">
          <UsersRound className="w-4 h-4 text-emerald-600" />
          <span>Community Impact — Collective Environmental Responsibility</span>
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-sans mt-1">
          Collective Action Powers Cleaner Urban Air
        </h2>
        <p className="text-xs text-slate-600 mt-2 max-w-3xl leading-relaxed">
          While individual actions protect personal health, collective community adoption of cleaner habits reduces overall urban particulate generation.
        </p>
      </div>

      {/* Community Pledges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {pledges.map((pledge) => {
          const isPledged = pledgedIds.has(pledge.id);
          return (
            <div 
              key={pledge.id}
              className={`rounded-2xl p-6 border transition-all flex flex-col justify-between ${
                isPledged ? 'bg-forest-50/70 border-forest-300 shadow-sm' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {pledge.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-forest-800">
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{pledge.participantsCount.toLocaleString()} Pledged</span>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-base mt-3">{pledge.title}</h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{pledge.description}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                {isPledged ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-forest-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Pledge Recorded for Your Household</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handlePledge(pledge.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-forest-900 hover:bg-forest-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                  >
                    <HeartHandshake className="w-4 h-4 text-emerald-400" />
                    <span>Take This Pledge</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Community Education Note */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="font-bold text-slate-800 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>Evidence-Based Community Engagement</span>
        </div>
        <p className="leading-relaxed">
          AirAware AI showcases demonstrative community participation numbers to encourage collective social norming. Every vehicle shut off at a red light prevents localized benzene spikes in street air, directly protecting passing cyclists and children on sidewalks.
        </p>
      </div>

    </div>
  );
};
