import React from 'react';
import { 
  LayoutDashboard, 
  Wind, 
  Clock, 
  Home, 
  Bike, 
  Calculator, 
  UsersRound, 
  MessageSquare 
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

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'air-quality', label: 'Air Quality', icon: Wind },
    { id: 'planner', label: 'Daily Planner', icon: Clock },
    { id: 'indoor', label: 'Indoor Doctor', icon: Home },
    { id: 'choices', label: 'Cleaner Choices', icon: Bike },
    { id: 'impact', label: 'What-If Impact', icon: Calculator },
    { id: 'community', label: 'Community', icon: UsersRound },
  ];

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as ActiveTab)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-forest-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-forest-900 hover:bg-forest-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
