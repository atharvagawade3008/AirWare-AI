import React from 'react';
import {
  LayoutDashboard,
  Wind,
  Clock,
  Home,
  Bike,
  Calculator,
  UsersRound
} from 'lucide-react';

export type ActiveTab =
  | 'overview'
  | 'air-quality'
  | 'planner'
  | 'indoor'
  | 'choices'
  | 'impact'
  | 'community'
  | 'assistant';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

const TABS: { id: ActiveTab; label: string; short: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', short: 'Home', icon: LayoutDashboard },
  { id: 'air-quality', label: 'Air Data', short: 'Air', icon: Wind },
  { id: 'planner', label: 'Daily Routine', short: 'Routine', icon: Clock },
  { id: 'indoor', label: 'Indoor Hacks', short: 'Indoor', icon: Home },
  { id: 'choices', label: 'Cleaner Swaps', short: 'Swaps', icon: Bike },
  { id: 'impact', label: 'My Impact', short: 'Impact', icon: Calculator },
  { id: 'community', label: 'Community', short: 'Together', icon: UsersRound }
];

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <>
      {/* Desktop / tablet tabs */}
      <nav className="hidden sm:block bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto py-2 no-scrollbar">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-forest-900 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-forest-900 dark:hover:text-emerald-200 hover:bg-forest-50 dark:hover:bg-forest-900/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile bottom bar — every feature one thumb-tap away */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-7">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
                  isActive ? 'text-forest-900 dark:text-emerald-300' : 'text-slate-400 dark:text-slate-500'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className={`w-8 h-6 rounded-md flex items-center justify-center ${isActive ? 'bg-forest-100 dark:bg-forest-900/70' : ''}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className={`text-[9px] leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>{tab.short}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
