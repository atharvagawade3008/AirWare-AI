import React from 'react';
import { AirQualityContext, AQICategory } from '../../types/air-quality.ts';
import { getAQIColor } from '../../intelligence/aqi/cpcb-calculator.ts';
import { ShieldAlert, Info, MapPin, Activity } from 'lucide-react';

interface Props {
  airQuality: AirQualityContext;
}

export const AQIGauge: React.FC<Props> = ({ airQuality }) => {
  const { aqi, aqiCategory, prominentPollutant, stationName, stationDistanceKm, provider, isCalculatedNAQI, freshness } = airQuality;

  if (aqi === undefined) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <Activity className="w-4 h-4 text-slate-400" />
            <span>Air Quality Index</span>
          </div>
          <span className="px-2 py-0.5 text-xs font-semibold bg-rose-100 text-rose-800 rounded">
            Station Unavailable
          </span>
        </div>

        <div className="my-6 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No Verified AQI Available</h3>
          <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
            {stationName || 'No continuous air quality monitoring station within immediate vicinity.'}
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>AirAware AI strictly avoids fabricating environmental readings.</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-3 flex justify-between">
          <span>Source: {provider}</span>
          <span>Distance: {stationDistanceKm ? `${stationDistanceKm} km` : 'N/A'}</span>
        </div>
      </div>
    );
  }

  const color = getAQIColor(aqiCategory || 'Satisfactory');
  const percentage = Math.min(100, Math.max(0, (aqi / 500) * 100));

  const getCategoryDescription = (cat?: AQICategory) => {
    switch (cat) {
      case 'Good':
        return 'Minimal health impact; clean and crisp air.';
      case 'Satisfactory':
        return 'Minor breathing discomfort to sensitive people.';
      case 'Moderately Polluted':
        return 'Breathing discomfort to asthma and lung patients.';
      case 'Poor':
        return 'Breathing discomfort to most people on prolonged exposure.';
      case 'Very Poor':
        return 'Respiratory illness on prolonged exposure; avoid morning cardio.';
      case 'Severe':
        return 'Health emergency; affects healthy people and seriously impacts vulnerable groups.';
      default:
        return 'Ambient concentration recorded.';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>Indian CPCB NAQI Standard</span>
          </div>
          <span 
            className="px-2.5 py-0.5 text-xs font-bold rounded-full text-white shadow-sm"
            style={{ backgroundColor: color }}
          >
            {aqiCategory}
          </span>
        </div>

        {/* Big AQI Number */}
        <div className="mt-5 flex items-baseline gap-4">
          <span className="text-6xl font-extrabold tracking-tight font-sans" style={{ color }}>
            {aqi}
          </span>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase">National AQI</div>
            <div className="text-sm font-medium text-slate-700">
              Prominent: <span className="font-bold text-slate-900">{prominentPollutant || 'PM2.5'}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
            <div 
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${percentage}%`, backgroundColor: color }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>0 Good</span>
            <span>100 Mod</span>
            <span>200 Poor</span>
            <span>300 V.Poor</span>
            <span>500 Severe</span>
          </div>
        </div>

        {/* Category Description */}
        <p className="mt-4 text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          {getCategoryDescription(aqiCategory)}
        </p>
      </div>

      {/* Attribution footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate">{stationName}</span>
          {stationDistanceKm && <span className="text-slate-400">({stationDistanceKm} km)</span>}
        </div>
        <span className="font-medium text-slate-500">
          {isCalculatedNAQI ? 'Calculated via CPCB Breakpoints' : 'Direct CPCB Feed'}
        </span>
      </div>
    </div>
  );
};
