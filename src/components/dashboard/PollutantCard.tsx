import React from 'react';
import { PollutantReading } from '../../types/air-quality.ts';
import { getAQIColor, getAQICategory } from '../../intelligence/aqi/cpcb-calculator.ts';

interface Props {
  pollutant: PollutantReading;
}

export const PollutantCard: React.FC<Props> = ({ pollutant }) => {
  const { code, name, chemicalFormula, value, unit, subIndex, available } = pollutant;

  if (!available) {
    return (
      <div className="bg-slate-50/70 rounded-xl p-4 border border-dashed border-slate-200 text-slate-400">
        <div className="text-xs font-semibold">{chemicalFormula}</div>
        <div className="text-sm font-bold text-slate-500 truncate">{name}</div>
        <div className="mt-3 text-xs italic">Sensor offline / unavailable</div>
      </div>
    );
  }

  const category = subIndex !== undefined ? getAQICategory(subIndex) : undefined;
  const color = category ? getAQIColor(category) : '#64748B';

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 tracking-wide">{chemicalFormula}</span>
          {subIndex !== undefined && (
            <span 
              className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: color }}
            >
              Sub-index {subIndex}
            </span>
          )}
        </div>
        <div className="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
          {value} <span className="text-xs font-medium text-slate-500">{unit}</span>
        </div>
        <div className="text-xs text-slate-600 mt-1 truncate">{name}</div>
      </div>

      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>24h Avg Target</span>
        <span className="font-medium text-slate-600">
          {code === 'pm25' ? '≤ 30 µg/m³' : code === 'pm10' ? '≤ 50 µg/m³' : code === 'no2' ? '≤ 40 µg/m³' : 'Standard'}
        </span>
      </div>
    </div>
  );
};
