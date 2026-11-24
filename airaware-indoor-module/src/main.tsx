import { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FlaskConical, Info } from 'lucide-react';
import { IndoorAirDoctor } from './index';
import type { IndoorAssessment, OutdoorAirContext } from './types/indoor';
import './demo.css';

/**
 * Sandbox page only — not part of the shipped module.
 * The outdoor values below are clearly-labelled demo fixtures, never live data.
 */

interface Preset {
  id: string;
  label: string;
  detail: string;
  context?: OutdoorAirContext;
}

const NOW = new Date().toISOString();

const PRESETS: Preset[] = [
  {
    id: 'none',
    label: 'No outdoor context',
    detail: 'General ventilation guidance',
  },
  {
    id: 'clean',
    label: 'Fresh · AQI 42',
    detail: 'Good outdoor air',
    context: {
      aqi: 42,
      category: 'Good',
      source: 'Demo fixture (not live)',
      freshness: 'fresh',
      lastUpdated: NOW,
    },
  },
  {
    id: 'polluted',
    label: 'Fresh · AQI 186',
    detail: 'Poor outdoor air',
    context: {
      aqi: 186,
      category: 'Poor',
      source: 'Demo fixture (not live)',
      freshness: 'fresh',
      lastUpdated: NOW,
    },
  },
  {
    id: 'stale',
    label: 'Stale · AQI 178',
    detail: 'Old reading, must be labelled',
    context: {
      aqi: 178,
      category: 'Poor',
      source: 'Demo fixture (not live)',
      freshness: 'stale',
      lastUpdated: NOW,
    },
  },
  {
    id: 'delayed',
    label: 'Delayed · AQI 96',
    detail: 'Satisfactory, slight lag',
    context: {
      aqi: 96,
      category: 'Satisfactory',
      source: 'Demo fixture (not live)',
      freshness: 'delayed',
      lastUpdated: NOW,
    },
  },
  {
    id: 'unavailable',
    label: 'Unavailable',
    detail: 'Parent has no reading',
    context: {
      source: 'Demo fixture (not live)',
      freshness: 'unavailable',
    },
  },
];

function Demo() {
  const [presetId, setPresetId] = useState<string>('none');
  const [lastResult, setLastResult] = useState<IndoorAssessment | null>(null);
  const preset = useMemo(
    () => PRESETS.find((candidate) => candidate.id === presetId) ?? PRESETS[0],
    [presetId],
  );

  return (
    <div className="demo">
      <div className="demo-bar">
        <div className="demo-bar-head">
          <strong>
            <FlaskConical size={14} aria-hidden="true" /> Standalone sandbox
          </strong>
          <span>
            Simulates the outdoor context the parent AirAware app would pass in. Values are
            demo fixtures, not live readings.
          </span>
        </div>
        <div className="demo-tabs" role="group" aria-label="Outdoor context fixture">
          {PRESETS.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              className={`demo-tab ${candidate.id === presetId ? 'demo-tab-active' : ''}`}
              onClick={() => setPresetId(candidate.id)}
              aria-pressed={candidate.id === presetId}
              title={candidate.detail}
            >
              {candidate.label}
            </button>
          ))}
        </div>
        <p className="demo-hint">
          <Info size={12} aria-hidden="true" /> Selected: {preset.label} — {preset.detail}
        </p>
      </div>

      <IndoorAirDoctor
        outdoorContext={preset.context}
        onAssessmentComplete={setLastResult}
      />

      {lastResult ? (
        <aside className="demo-result" aria-live="polite">
          <strong>onAssessmentComplete received</strong>
          <span>
            band: {lastResult.overallRisk} · index: {lastResult.riskScore} · factors:{' '}
            {lastResult.identifiedFactors.length} · actions: {lastResult.recommendations.length} ·
            ventilation: {lastResult.ventilationGuidance.posture}
          </span>
          <span>
            timestamp: {lastResult.assessmentTimestamp} · completeness:{' '}
            {Math.round(lastResult.completeness * 100)}%
          </span>
        </aside>
      ) : null}
    </div>
  );
}

const container = document.getElementById('root');
if (!container) throw new Error('Root container missing');

createRoot(container).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
);
