import React, { useState } from 'react';
import { HouseholdProfile, CommuteType, OutdoorExerciseTime, IndoorCookingFuel } from '../../types/profile.ts';
import { X, Users, Baby, HeartPulse, Stethoscope, Briefcase, GraduationCap, Car, Flame, Wind, Clock } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: HouseholdProfile;
  onSave: (updated: HouseholdProfile) => void;
}

export const FamilyProfileModal: React.FC<Props> = ({ isOpen, onClose, profile, onSave }) => {
  const [formData, setFormData] = useState<HouseholdProfile>(profile);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-forest-100 dark:bg-forest-900/60 text-forest-800 dark:text-emerald-300 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Household Exposure Profile</h3>
              <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400">Recommendations dynamically adapt to these characteristics</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          
          {/* General Household Info */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Family Basics</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-100 mb-1">Household Label</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500 bg-white dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                  placeholder="e.g. Sharma Family"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-100 mb-1">Household Members Count</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.householdSize}
                  onChange={(e) => setFormData({ ...formData, householdSize: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500 bg-white dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Vulnerability Switches */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Vulnerable Groups in Home</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Children */}
              <label className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                formData.hasChildren ? 'bg-forest-50/80 border-forest-400 text-forest-950 dark:bg-forest-900/30 dark:border-forest-800 dark:text-emerald-200' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                <div className="flex items-center justify-between">
                  <Baby className="w-5 h-5 text-emerald-600" />
                  <input
                    type="checkbox"
                    checked={formData.hasChildren}
                    onChange={(e) => setFormData({ ...formData, hasChildren: e.target.checked })}
                    className="rounded text-forest-600 focus:ring-forest-500 dark:focus:ring-emerald-500"
                  />
                </div>
                <div className="mt-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Children (Under 14)</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">High respiration rate</div>
                </div>
              </label>

              {/* Elderly */}
              <label className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                formData.hasElderly ? 'bg-forest-50/80 border-forest-400 text-forest-950 dark:bg-forest-900/30 dark:border-forest-800 dark:text-emerald-200' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                <div className="flex items-center justify-between">
                  <HeartPulse className="w-5 h-5 text-purple-600" />
                  <input
                    type="checkbox"
                    checked={formData.hasElderly}
                    onChange={(e) => setFormData({ ...formData, hasElderly: e.target.checked })}
                    className="rounded text-forest-600 focus:ring-forest-500 dark:focus:ring-emerald-500"
                  />
                </div>
                <div className="mt-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Senior Citizens (65+)</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Cardiovascular vulnerability</div>
                </div>
              </label>

              {/* Respiratory Sensitivities */}
              <label className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                formData.hasRespiratorySensitive ? 'bg-forest-50/80 border-forest-400 text-forest-950 dark:bg-forest-900/30 dark:border-forest-800 dark:text-emerald-200' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                <div className="flex items-center justify-between">
                  <Stethoscope className="w-5 h-5 text-rose-600" />
                  <input
                    type="checkbox"
                    checked={formData.hasRespiratorySensitive}
                    onChange={(e) => setFormData({ ...formData, hasRespiratorySensitive: e.target.checked })}
                    className="rounded text-forest-600 focus:ring-forest-500 dark:focus:ring-emerald-500"
                  />
                </div>
                <div className="mt-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Asthma / Allergies</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Airway hyper-reactivity</div>
                </div>
              </label>
            </div>
          </div>

          {/* Commute and Habits */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Commute & Daily Exposure Habits</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Commute Mode</label>
                <select
                  value={formData.commuteType}
                  onChange={(e) => setFormData({ ...formData, commuteType: e.target.value as CommuteType })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500 bg-white dark:bg-slate-800 dark:text-slate-100 dark:option:text-slate-200"
                >
                  <option value="public_transit">Public Transit (Metro / Bus)</option>
                  <option value="two_wheeler">Two-Wheeler (Motorcycle / Scooter)</option>
                  <option value="car_solo">Solo Car Driving</option>
                  <option value="carpool">Shared Carpool</option>
                  <option value="bicycle">Bicycle</option>
                  <option value="walk">Walking</option>
                  <option value="work_from_home">Work From Home / Remote</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-100 mb-1">One-Way Commute Distance (km)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.commuteDistanceKm}
                  onChange={(e) => setFormData({ ...formData, commuteDistanceKm: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500 bg-white dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-100 mb-1">Outdoor Exercise Habit</label>
                <select
                  value={formData.outdoorExerciseTime}
                  onChange={(e) => setFormData({ ...formData, outdoorExerciseTime: e.target.value as OutdoorExerciseTime })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500 bg-white dark:bg-slate-800 dark:text-slate-100 dark:option:text-slate-200"
                >
                  <option value="early_morning">Early Morning (6 AM - 8 AM)</option>
                  <option value="morning">Morning (8 AM - 10 AM)</option>
                  <option value="afternoon">Afternoon (1 PM - 4 PM)</option>
                  <option value="evening">Evening (6 PM - 8 PM)</option>
                  <option value="night">Night (8 PM - 10 PM)</option>
                  <option value="none">No outdoor workouts</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-100 mb-1">Indoor Cooking Fuel</label>
                <select
                  value={formData.indoorCookingFuel}
                  onChange={(e) => setFormData({ ...formData, indoorCookingFuel: e.target.value as IndoorCookingFuel })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500 bg-white dark:bg-slate-800 dark:text-slate-100 dark:option:text-slate-200"
                >
                  <option value="piped_gas">Piped Natural Gas (PNG)</option>
                  <option value="lpg">LPG Cylinder</option>
                  <option value="induction">Induction / Electric Cooktop</option>
                  <option value="biomass">Biomass / Firewood</option>
                  <option value="kerosene">Kerosene</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mechanical Equipment */}
          <div>
            <label className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasAirPurifier}
                onChange={(e) => setFormData({ ...formData, hasAirPurifier: e.target.checked })}
                className="w-4 h-4 text-forest-600 rounded focus:ring-forest-500 dark:focus:ring-emerald-500"
              />
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100">Air Purifier Installed in Home</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Adjusts indoor sealing vs ventilation advice</div>
              </div>
            </label>
          </div>

          {/* Footer Action */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-forest-900 hover:bg-forest-800 rounded-xl shadow-md transition-all"
            >
              Save & Recalculate Guidance
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
