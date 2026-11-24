import React from 'react';
import { DataFreshness } from '../../types/air-quality.ts';
import { CheckCircle2, Clock, AlertTriangle, XCircle } from 'lucide-react';

interface Props {
  freshness: DataFreshness;
  lastUpdated?: string;
  explanation?: string;
}

export const FreshnessBadge: React.FC<Props> = ({ freshness, lastUpdated, explanation }) => {
  const getBadgeConfig = () => {
    switch (freshness) {
      case 'fresh':
        return {
          icon: CheckCircle2,
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          label: 'Live & Fresh Telemetry'
        };
      case 'delayed':
        return {
          icon: Clock,
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          label: 'Telemetry Delayed'
        };
      case 'stale':
        return {
          icon: AlertTriangle,
          bg: 'bg-orange-50 text-orange-700 border-orange-200',
          dot: 'bg-orange-500',
          label: 'Stale Data (Older than 6h)'
        };
      case 'unavailable':
      default:
        return {
          icon: XCircle,
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
          label: 'Monitoring Unavailable'
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  const formattedTime = lastUpdated ? (() => {
    try {
      return new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return undefined;
    }
  })() : undefined;

  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} shadow-sm transition-all`}
      title={explanation || config.label}
    >
      <span className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`} />
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
      {formattedTime && <span className="opacity-75 font-mono">({formattedTime})</span>}
    </div>
  );
};
