import React from 'react';
import { DailyGuidanceSummary } from '../../types/recommendation.ts';
import { HouseholdProfile } from '../../types/profile.ts';
import { ShieldCheck, AlertCircle, Baby, HeartPulse, Sparkles, ArrowRight } from 'lucide-react';

interface Props {
  guidance: DailyGuidanceSummary;
  profile: HouseholdProfile;
  onOpenProfile: () => void;
  onNavigateToPlanner: () => void;
}

export const GuidanceBanner: React.FC<Props> = ({ guidance, profile, onOpenProfile, onNavigateToPlanner }) => {
  const { headline, summary, riskSeverity, topActionItems } = guidance;

  const getBorderColor = () => {
    switch (riskSeverity) {
      case 'critical': return 'border-rose-300 bg-rose-50/70 dark:border-rose-800 dark:bg-rose-950/40';
      case 'elevated': return 'border-orange-300 bg-orange-50/70 dark:border-orange-800 dark:bg-orange-950/40';
      case 'moderate': return 'border-amber-300 bg-amber-50/70 dark:border-amber-800 dark:bg-amber-950/40';
      case 'low': default: return 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30';
    }
  };

  return (
    <div className={`rounded-2xl p-5 sm:p-6 border ${getBorderColor()} shadow-sm transition-all`}>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        
        {/* Left Headline */}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 text-[11px] font-bold uppercase rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-xs">
              Tailored For {profile.name}
            </span>
            {profile.hasChildren && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                <Baby className="w-3 h-3" /> Children Active
              </span>
            )}
            {profile.hasElderly && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-purple-800 dark:text-slate-200 bg-purple-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                <HeartPulse className="w-3 h-3" /> Senior Care
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-2">
            {headline}
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-2 leading-relaxed max-w-3xl">
            {summary}
          </p>
        </div>

        {/* Right CTA */}
        <div className="flex w-full sm:w-auto items-center gap-2 shrink-0">
          <button
            onClick={onNavigateToPlanner}
            className="flex w-full sm:w-auto items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-forest-900 text-white rounded-xl hover:bg-forest-800 transition-colors shadow-sm"
          >
            <span>View 24h Planner</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Top Action Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
        {topActionItems.slice(0, 2).map((item) => (
          <div key={item.id} className="bg-white/95 dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.title}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                item.priority === 'urgent' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200' : 'bg-forest-100 text-forest-800 dark:bg-forest-900/60 dark:text-emerald-200'
              }`}>
                {item.priority.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-normal">{item.actionableStep}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
