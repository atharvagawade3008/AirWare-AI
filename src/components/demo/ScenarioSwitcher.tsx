import React from 'react';
import { DemoScenario } from '../../types/demo.ts';
import { DEMO_SCENARIOS } from '../../services/demo/demo-scenarios.ts';
import { X, Sparkles, CheckCircle2, ShieldAlert, WifiOff, Users, Briefcase, HeartPulse } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (scenario: DemoScenario) => void;
  activeScenarioId?: string;
  onResetToLive: () => void;
}

export const ScenarioSwitcher: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelectScenario,
  activeScenarioId,
  onResetToLive
}) => {
  if (!isOpen) return null;

  const getScenarioIcon = (id: string) => {
    switch (id) {
      case 'mumbai-family': return Users;
      case 'delhi-professional': return Briefcase;
      case 'senior-household': return HeartPulse;
      case 'missing-station': return ShieldAlert;
      case 'api-unavailable': return WifiOff;
      case 'ai-unavailable': default: return Sparkles;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Evaluator Demonstration Scenarios</h3>
              <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400">Six test fixtures specified in Section 14 to verify edge cases</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Reset Button Banner */}
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs text-emerald-950 dark:text-emerald-200 font-medium">
            Currently running in <strong>{activeScenarioId ? 'Demo Scenario Mode' : 'Live Real-Time Telemetry Mode'}</strong>
          </span>
          {activeScenarioId && (
            <button
              onClick={() => {
                onResetToLive();
                onClose();
              }}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              Reset to Live Telemetry
            </button>
          )}
        </div>

        {/* Scenarios Grid */}
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEMO_SCENARIOS.map((sc) => {
            const Icon = getScenarioIcon(sc.id);
            const isSelected = activeScenarioId === sc.id;
            return (
              <div
                key={sc.id}
                onClick={() => {
                  onSelectScenario(sc);
                  onClose();
                }}
                className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected 
                    ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 dark:border-amber-800 shadow-md ring-2 ring-amber-300 dark:ring-amber-800' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                      {sc.badge}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-3">{sc.name}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{sc.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Expected Evaluator Validation</span>
                  <p className="text-[11px] text-forest-900 dark:text-emerald-300 font-medium mt-0.5">{sc.expectedOutcome}</p>
                  
                  <div className="mt-3 flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-200">
                    <span>{isSelected ? 'Active Test Scenario' : 'Activate Scenario'}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Notice */}
        <div className="px-4 sm:px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
          * These fixtures test personalization, API timeouts, missing stations, and hybrid AI fallbacks without altering the live telemetry engine.
        </div>

      </div>
    </div>
  );
};
