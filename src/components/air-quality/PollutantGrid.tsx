import React from 'react';
import { AirQualityContext, HourlyForecastPoint } from '../../types/air-quality.ts';
import { PollutantCard } from '../dashboard/PollutantCard.tsx';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { MapPin, Calendar, Database, ShieldAlert, Globe, Info } from 'lucide-react';
import { getAQIColor } from '../../intelligence/aqi/cpcb-calculator.ts';

interface Props {
  airQuality: AirQualityContext;
  hourlyTrends: HourlyForecastPoint[];
}

export const PollutantGrid: React.FC<Props> = ({ airQuality, hourlyTrends }) => {
  const { 
    pollutants, 
    location, 
    provider, 
    stationName, 
    stationDistanceKm, 
    dataType, 
    gridCoordinates, 
    gridResolutionKm, 
    scientificDisclaimer 
  } = airQuality;

  const maxSubIndex = Math.max(0, ...pollutants.map(p => p.subIndex ?? 0));
  const aqiDrivers = pollutants
    .filter(p => p.available && p.subIndex !== undefined)
    .map(p => ({
      code: p.chemicalFormula,
      subIndex: p.subIndex as number,
      category: p.category ?? '',
      color: getAQIColor(p.category ?? 'Satisfactory'),
      isMax: (p.subIndex as number) === maxSubIndex
    }))
    .sort((a, b) => b.subIndex - a.subIndex);

  const chartData = hourlyTrends.map(item => {
    let hourLabel = item.time;
    try {
      hourLabel = new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      // fallback
    }
    return {
      time: hourLabel,
      'PM2.5': item.pm25,
      'PM10': item.pm10
    };
  });

  return (
    <div className="space-y-6">
      
      {/* Title & Attribution Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
              dataType === 'modelled_estimate' ? 'bg-blue-100 text-blue-800 dark:bg-slate-800 dark:text-slate-200' : 'bg-emerald-100 text-emerald-800 dark:bg-slate-800 dark:text-emerald-300'
            }`}>
              {dataType === 'modelled_estimate' ? 'Atmospheric Model Estimates' : 'Station Observations'}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-sans">
            Pollutant Concentration Telemetry — {location}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {dataType === 'modelled_estimate' 
              ? 'Modelled concentration estimates from Copernicus Atmosphere Monitoring Service (CAMS) across standard CPCB criteria parameters.'
              : 'Continuous ambient air monitoring data from validated ground monitoring sensors.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-forest-700" />
            <span>Feed: <strong>{provider}</strong></span>
          </div>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <div className="flex items-center gap-1.5">
            {dataType === 'modelled_estimate' ? (
              <>
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>Grid: {gridCoordinates ? `${gridCoordinates.latitude}°N, ${gridCoordinates.longitude}°E` : 'Regional model grid'}</span>
              </>
            ) : (
              <>
                <MapPin className="w-3.5 h-3.5 text-forest-700" />
                <span>{stationName} {stationDistanceKm ? `(${stationDistanceKm} km)` : ''}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* What drives the AQI — one glance */}
      {aqiDrivers.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">What is driving today's AQI</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Each bar is one pollutant's CPCB sub-index. Your AQI equals the <strong>highest</strong> bar.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 block">AQI</span>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{airQuality.aqi ?? '—'}</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {aqiDrivers.map((d) => (
              <div key={d.code} className="flex items-center gap-2">
                <span className="w-12 sm:w-14 shrink-0 text-[11px] font-bold text-slate-700 dark:text-slate-200">{d.code}</span>
                <div className="flex-1 min-w-0">
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, (d.subIndex / 500) * 100)}%`, backgroundColor: d.color }}
                    />
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2 text-[9px] font-bold uppercase sm:hidden">
                    <span className="truncate text-slate-400 dark:text-slate-500">{d.category}</span>
                    {d.isMax && <span className="shrink-0 text-rose-700">drives AQI</span>}
                  </div>
                </div>
                <span className="w-9 shrink-0 text-right text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200">{d.subIndex}</span>
                <span className={`hidden sm:block w-16 shrink-0 truncate text-[9px] font-bold uppercase ${d.isMax ? 'text-rose-700 dark:text-rose-300' : 'text-slate-400 dark:text-slate-500'}`}>
                  {d.isMax ? 'drives AQI' : d.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6 Pollutant Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pollutants.map((p) => (
          <PollutantCard key={p.code} pollutant={p} />
        ))}
      </div>

      {/* 24-Hour Particulate Concentration Trend */}
      {chartData.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">24-Hour Particulate Profile (PM2.5 vs PM10)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Hourly concentration profile in µg/m³ (Modelled Forecast Series)</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-slate-700 dark:text-slate-300">PM2.5 (Fine)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-slate-700 dark:text-slate-300">PM10 (Coarse)</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPm25" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPm10" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--chart-axis)' }} stroke="var(--chart-grid)" />
                <YAxis tick={{ fontSize: 10, fill: 'var(--chart-axis)' }} stroke="var(--chart-grid)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--chart-tooltip-bg)', 
                    borderRadius: '0.75rem', 
                    border: '1px solid var(--chart-tooltip-border)', 
                    color: 'var(--chart-tooltip-text)', 
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)'
                  }}
                  itemStyle={{ color: 'var(--chart-tooltip-text)' }}
                />
                <Area type="monotone" dataKey="PM10" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorPm10)" />
                <Area type="monotone" dataKey="PM2.5" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorPm25)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3 text-right">
            Values sourced from regional atmospheric model forecast grid. Nocturnal boundary layer compression causes typical late-evening particulate surges.
          </p>
        </div>
      )}

      {/* Methodology & Health Impact Standard Reference */}
      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-3">
        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-emerald-700" />
          <span>CPCB NAQI Methodology & Data Integrity Standard</span>
        </h4>
        <p className="leading-relaxed">
          The National Air Quality Index (NAQI) established by the Central Pollution Control Board (CPCB) calculates piecewise sub-indices across 6 core criteria pollutants.
          To maintain strict scientific integrity, AirAware AI distinguishes between <strong>Physical Ground Station Observations</strong> (direct physical measurements from CAAQMS) and <strong>Modelled Atmospheric Estimates</strong> (regional 11 km grid forecasts from CAMS/Open-Meteo). 
          Indices derived from atmospheric models are clearly identified as <em>Indicative Derived Indices</em> rather than official government station reports.
        </p>
      </div>

    </div>
  );
};
