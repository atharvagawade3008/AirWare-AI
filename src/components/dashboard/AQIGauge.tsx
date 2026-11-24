import React from 'react';
import { AirQualityContext, AQICategory } from '../../types/air-quality.ts';
import { getAQIColor } from '../../intelligence/aqi/cpcb-calculator.ts';
import { ShieldAlert, Info, MapPin, Activity, Globe, Compass, Building2 } from 'lucide-react';

interface Props {
  airQuality: AirQualityContext;
}

export const AQIGauge: React.FC<Props> = ({ airQuality }) => {
  const { 
    aqi, 
    aqiCategory, 
    prominentPollutant, 
    stationName, 
    stationDistanceKm, 
    provider, 
    dataType, 
    indexClassification, 
    gridCoordinates, 
    gridResolutionKm, 
    spatialResolutionNote,
    scientificDisclaimer 
  } = airQuality;

  // Handle case where AQI cannot be calculated or station is missing
  if (aqi === undefined || indexClassification === 'insufficient_data') {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <Activity className="w-4 h-4 text-slate-400" />
            <span>Air Quality Index</span>
          </div>
          <span className="px-2 py-0.5 text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 rounded">
            Insufficient Validated Data
          </span>
        </div>

        <div className="my-6 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500 mb-3">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">No Verified AQI Available</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
            {stationName || 'No continuous air quality monitoring station within immediate vicinity satisfying CPCB validity criteria.'}
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-xs rounded-lg">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>AirAware AI strictly avoids fabricating environmental readings.</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between">
          <span>Source: {provider}</span>
          <span>{stationDistanceKm ? `Distance: ${stationDistanceKm} km` : 'No station in range'}</span>
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

  // Honest label based on data pathway
  const getIndexBadge = () => {
    if (indexClassification === 'official_cpcb_naqi') {
      return {
        label: 'Official CPCB NAQI (Ground Station)',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        subtitle: 'National Air Quality Index (Ground Station)'
      };
    } else if (dataType === 'simulated_fixture') {
      return {
        label: 'Demonstration Test Fixture',
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
        subtitle: 'Simulated Evaluation Scenario'
      };
    } else {
      return {
        label: 'Indicative Derived Index (CAMS Model)',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
        subtitle: 'Indicative CPCB-derived Index (Atmospheric Model)'
      };
    }
  };

  const badge = getIndexBadge();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-black/40 flex flex-col justify-between transition-colors">
      <div>
        {/* Header Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold">
            {dataType === 'modelled_estimate' ? (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-slate-200 border border-blue-200 dark:border-slate-700 text-[11px]">
                <Globe className="w-3.5 h-3.5" />
                <span>Modelled Atmospheric Estimate</span>
              </span>
            ) : dataType === 'station_observation' ? (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-slate-700 text-[11px]">
                <Building2 className="w-3.5 h-3.5" />
                <span>Physical Station Observation</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-slate-800 text-amber-700 dark:text-amber-200 border border-amber-200 dark:border-slate-700 text-[11px]">
                <span>Demonstration Scenario Fixture</span>
              </span>
            )}
          </div>

          <span 
            className="px-2.5 py-0.5 text-xs font-bold rounded-full text-white shadow-sm"
            style={{ backgroundColor: color }}
          >
            {aqiCategory}
          </span>
        </div>

        {/* Big AQI Number */}
        <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="text-5xl sm:text-6xl font-extrabold tracking-tight font-sans" style={{ color }}>
            {aqi}
          </span>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">{badge.subtitle}</div>
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Prominent: <span className="font-bold text-slate-900 dark:text-slate-100">{prominentPollutant || 'PM2.5'}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
            <div 
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${percentage}%`, backgroundColor: color }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
            <span>0 Good</span>
            <span>100 Mod</span>
            <span>200 Poor</span>
            <span>300 V.Poor</span>
            <span>500 Severe</span>
          </div>
        </div>

        {/* Category Description */}
        <p className="mt-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
          {getCategoryDescription(aqiCategory)}
        </p>

        {/* Spatial Resolution Warning for Modelled Data */}
        {dataType === 'modelled_estimate' && spatialResolutionNote && (
          <div className="mt-3 p-2 bg-blue-50/70 dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700 rounded-lg text-[11px] text-blue-900 dark:text-slate-300 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-600 dark:text-slate-400 shrink-0 mt-0.5" />
            <span>{spatialResolutionNote}</span>
          </div>
        )}
      </div>

      {/* Attribution footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-1.5 truncate">
          {dataType === 'modelled_estimate' ? (
            <>
              <Compass className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Grid: {gridCoordinates ? `${gridCoordinates.latitude}°N, ${gridCoordinates.longitude}°E` : 'Regional Grid'} (~{gridResolutionKm || 11}km cell)</span>
            </>
          ) : (
            <>
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{stationName}</span>
              {stationDistanceKm && <span className="text-slate-400">({stationDistanceKm} km)</span>}
            </>
          )}
        </div>
        <span className="font-medium text-slate-600 dark:text-slate-300">
          {provider}
        </span>
      </div>
    </div>
  );
};
