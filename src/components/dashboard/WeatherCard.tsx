import React from 'react';
import { WeatherContext } from '../../types/weather.ts';
import { Thermometer, Droplets, Wind, Compass, AlertTriangle, Eye } from 'lucide-react';

interface Props {
  weather?: WeatherContext;
}

export const WeatherCard: React.FC<Props> = ({ weather }) => {
  if (!weather) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 text-xs">
        Weather telemetry currently loading...
      </div>
    );
  }

  const { temperatureC, humidityPercent, windSpeedKmh, windDirectionDeg, weatherDescription, isStagnant, ventilationIndex } = weather;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <Wind className="w-4 h-4 text-sky-600" />
            <span>Atmospheric Dispersion</span>
          </div>
          <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
            ventilationIndex === 'Good' 
              ? 'bg-emerald-100 text-emerald-800' 
              : ventilationIndex === 'Moderate'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-rose-100 text-rose-800'
          }`}>
            {ventilationIndex} Ventilation
          </span>
        </div>

        {/* Current Weather Line */}
        <div className="mt-4 flex items-center justify-between">
          <div>
            <div className="text-3xl font-extrabold text-slate-900">{temperatureC}°C</div>
            <div className="text-xs text-slate-500 capitalize mt-0.5">{weatherDescription}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-slate-800">{windSpeedKmh} km/h</div>
            <div className="text-xs text-slate-500">Surface Wind</div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Droplets className="w-4 h-4 text-blue-500 shrink-0" />
            <span>Humidity: <strong className="text-slate-900">{humidityPercent}%</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Compass className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Direction: <strong className="text-slate-900">{windDirectionDeg}°</strong></span>
          </div>
        </div>

        {/* Stagnation Alert */}
        {isStagnant && (
          <div className="mt-4 p-2.5 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span><strong>Atmospheric Inversion Warning:</strong> Low wind speed (&lt; 6 km/h) prevents vertical pollutant lofting, trapping exhaust near street level.</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Provider: Open-Meteo Meteorology</span>
        <span>Dispersion Cycle: 24h</span>
      </div>
    </div>
  );
};
