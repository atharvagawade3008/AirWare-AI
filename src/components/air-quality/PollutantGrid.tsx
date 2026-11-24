import React from 'react';
import { AirQualityContext, HourlyForecastPoint } from '../../types/air-quality.ts';
import { PollutantCard } from '../dashboard/PollutantCard.tsx';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { MapPin, Calendar, Database, ShieldAlert } from 'lucide-react';

interface Props {
  airQuality: AirQualityContext;
  hourlyTrends: HourlyForecastPoint[];
}

export const PollutantGrid: React.FC<Props> = ({ airQuality, hourlyTrends }) => {
  const { pollutants, location, provider, stationName, stationDistanceKm, lastUpdated, freshness, freshnessExplanation } = airQuality;

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
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-sans">
            Comprehensive Pollutant Telemetry — {location}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Standard 6-parameter monitoring per Central Pollution Control Board (CPCB) NAQI protocol.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-forest-700" />
            <span>Feed: <strong>{provider}</strong></span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-forest-700" />
            <span>{stationName} {stationDistanceKm ? `(${stationDistanceKm} km)` : ''}</span>
          </div>
        </div>
      </div>

      {/* 6 Pollutant Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pollutants.map((p) => (
          <PollutantCard key={p.code} pollutant={p} />
        ))}
      </div>

      {/* 24-Hour Particulate Concentration Trend */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">24-Hour Particulate Trend (PM2.5 vs PM10)</h3>
              <p className="text-xs text-slate-500">Hourly concentration profile in µg/m³</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-slate-700">PM2.5 (Fine)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-slate-700">PM10 (Coarse)</span>
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748B' }} stroke="#CBD5E1" />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} stroke="#CBD5E1" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '0.75rem', border: 'none', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="PM10" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorPm10)" />
                <Area type="monotone" dataKey="PM2.5" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorPm25)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 text-right">
            Values sourced from regional monitoring telemetry. Peak spikes typically align with nocturnal boundary layer compression.
          </p>
        </div>
      )}

      {/* Methodology & Health Impact Standard Reference */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-xs text-slate-600 space-y-3">
        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-emerald-700" />
          <span>CPCB NAQI Standard & Calculation Methodology</span>
        </h4>
        <p className="leading-relaxed">
          The National Air Quality Index (NAQI) in India is computed using piecewise linear interpolation across official CPCB break-point concentrations for 6 primary pollutants: PM2.5, PM10, NO₂, SO₂, CO, and O₃. 
          To be officially valid, a reading must monitor at least three pollutants, of which one MUST be particulate matter (PM2.5 or PM10). The overall AQI corresponds to the highest calculated sub-index, and that specific pollutant is declared the <em>Prominent Pollutant</em>.
        </p>
      </div>

    </div>
  );
};
