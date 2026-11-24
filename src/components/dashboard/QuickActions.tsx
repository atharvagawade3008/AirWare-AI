import React from 'react';
import { ActiveTab } from '../layout/Navigation.tsx';
import { Clock, Home, Bike, Calculator, Bot, ArrowUpRight } from 'lucide-react';

interface Props {
  onNavigate: (tab: ActiveTab) => void;
  onOpenAI: () => void;
}

export const QuickActions: React.FC<Props> = ({ onNavigate, onOpenAI }) => {
  const cards = [
    {
      title: 'Time-Based Exposure Planner',
      subtitle: 'Morning, afternoon & night routines',
      icon: Clock,
      action: () => onNavigate('planner'),
      badge: 'Daily Routines',
      accent: 'text-amber-600 bg-amber-50 border-amber-200'
    },
    {
      title: 'Indoor Air Doctor',
      subtitle: 'Questionnaire & hazard mitigation',
      icon: Home,
      action: () => onNavigate('indoor'),
      badge: 'Home Health',
      accent: 'text-emerald-600 bg-emerald-50 border-emerald-200'
    },
    {
      title: 'Cleaner Choices Planner',
      subtitle: 'Commute & trip alternatives',
      icon: Bike,
      action: () => onNavigate('choices'),
      badge: 'Lifestyle',
      accent: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    {
      title: 'What-If Impact Calculator',
      subtitle: 'Estimate avoided CO2e & fuel savings',
      icon: Calculator,
      action: () => onNavigate('impact'),
      badge: 'Emissions',
      accent: 'text-purple-600 bg-purple-50 border-purple-200'
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <button
            key={c.title}
            onClick={c.action}
            className="group bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-forest-500 dark:hover:border-emerald-600 hover:shadow-md transition-all text-left flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center border ${c.accent}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide group-hover:text-forest-700 dark:group-hover:text-emerald-400 transition-colors">
                  {c.badge}
                </span>
              </div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-3 group-hover:text-forest-900 dark:group-hover:text-emerald-300 transition-colors">
                {c.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {c.subtitle}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-forest-700 dark:text-emerald-400">
              <span>Open Feature</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </button>
        );
      })}
    </div>
  );
};
