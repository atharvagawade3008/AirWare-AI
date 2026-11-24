# Integrating Indoor Air Doctor into AirAware AI

This guide is written for the engineer merging this module into the main
React + Vite + TypeScript AirAware application.

**The module is self-contained.** It requires no changes to routing, global CSS,
authentication, database, API configuration or environment variables in the main
app. It renders as a normal React component inside an existing page.

---

## 1. Compatibility assumptions

- React 18+ and a bundler that supports **CSS Modules** (Vite does out of the box).
- TypeScript with `moduleResolution: "bundler"` (or equivalent) and `jsx: react-jsx`.
- `lucide-react` is either already installed or may be added — it is the module's
  only runtime dependency beyond React.
- The host app is responsible for obtaining outdoor air quality. This module never
  calls an API and never invents an outdoor value.

If any of these differ, see §10.

---

## 2. Files to copy

Copy the module's `src` folder into a feature folder in the main app. Keeping the
relative structure means **no import edits are needed inside the module**.

```text
YourApp/
└── src/
    └── features/
        └── indoor-air-doctor/
            ├── components/
            │   ├── AssessmentIntro.tsx
            │   ├── Questionnaire.tsx
            │   ├── QuestionStep.tsx
            │   ├── AssessmentResults.tsx
            │   ├── RiskFactorCard.tsx
            │   └── RecommendationCard.tsx
            ├── data/
            │   └── questions.ts
            ├── engine/
            │   ├── scoring.ts
            │   ├── recommendations.ts
            │   └── ventilation.ts
            ├── styles/
            │   └── indoor.module.css
            ├── types/
            │   └── indoor.ts
            ├── IndoorAirDoctor.tsx
            └── index.ts
```

### Do copy

- everything under `src/components/`, `src/engine/`, `src/data/`, `src/styles/`, `src/types/`
- `src/IndoorAirDoctor.tsx`
- `src/index.ts`

### Do not copy (sandbox only)

- `src/main.tsx`, `src/demo.css`, `src/vite-env.d.ts`, `index.html`, `vite.config.ts`
- `node_modules/`, `dist/`

### Optional

- `tests/` — copy the tests if you want them in the main app's suite. They import
  from `../src`, so either keep the same layout or update those import paths.

> **Important:** the AirAware repository already contains `src/types/indoor.ts`
> with a different shape. Do **not** overwrite it. Copy this module's types into
> the feature folder as shown (imports are relative, so there is no collision),
> and use the adapter in §9 if the main app needs its existing type.

---

## 3. Dependencies

Add only if missing in the main app:

```bash
npm install lucide-react
```

- `react` / `react-dom` ≥ 18 — already present.
- `lucide-react` — present in the current AirAware `package.json` (`^0.469.0`);
  reuse it and do not add a second icon library.
- **No** Tailwind configuration changes, **no** PostCSS changes, **no** router,
  state, auth, database or HTTP dependency.
- No environment variables, API keys, base URLs or secrets.

The module's CSS is a CSS Module: Vite hashes every class name, so host styles
cannot leak in and module styles cannot leak out. `src/demo.css` is sandbox-only
and must not be copied.

---

## 4. Render the component

```tsx
// src/pages/IndoorAirDoctorPage.tsx  (example placement)
import { IndoorAirDoctor } from '../features/indoor-air-doctor';
import type { IndoorAssessment, OutdoorAirContext } from '../features/indoor-air-doctor';

export default function IndoorAirDoctorPage({
  outdoorContext,
}: {
  outdoorContext?: OutdoorAirContext;
}) {
  const handleComplete = (result: IndoorAssessment) => {
    // Optional: log, analytics, or pass to the app's own store.
    console.info('Indoor assessment', result.overallRisk, result.riskScore);
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <IndoorAirDoctor
        outdoorContext={outdoorContext}
        onAssessmentComplete={handleComplete}
      />
    </main>
  );
}
```

The module supplies its own background, typography and spacing for a complete
feature surface. It does not read the host's theme or Tailwind config. If you
want it inside a narrower column, wrap it in your own container — the internal
shell is capped at 1060 px.

### Props

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `outdoorContext` | `OutdoorAirContext` | No | Parent-supplied outdoor data. Omit and the assessment uses general ventilation guidance. |
| `onAssessmentComplete` | `(result: IndoorAssessment) => void` | No | Called once per completed assessment, including retakes. Fires after results are rendered. |
| `initialAnswers` | `QuestionnaireAnswers` | No | Restores a saved session. Invalid/unknown values are dropped safely. |
| `className` | `string` | No | Appended to the module's root element for host-side layout hooks. |

Types are exported from `index.ts`:

```ts
import type {
  IndoorAssessment,
  IndoorAirDoctorProps,
  OutdoorAirContext,
  RiskFactor,
  IndoorRecommendation,
  QuestionnaireAnswers,
} from '../features/indoor-air-doctor';
```

The engine is also exported for reuse in reports or other screens:
`buildAssessment`, `computeRiskScore`, `buildRiskFactors`,
`getVentilationGuidance`, `buildRecommendations`, `QUESTIONS`, `SECTIONS`.

---

## 5. Provide outdoor AQI context

Map whatever the parent already has into `OutdoorAirContext`. The current
AirAware `src/types/air-quality.ts` exposes an `AirQualityContext` with
`aqi`, `aqiCategory`, `provider`, `freshness` and `lastUpdated`. A suitable
adapter, kept in the host app, looks like this (adjust names to the final
AirAware API — this module deliberately does not import the host types):

```ts
import type { OutdoorAirContext } from '../features/indoor-air-doctor';
import type { AirQualityContext } from '../types/air-quality';

export function toOutdoorAirContext(
  context?: AirQualityContext,
): OutdoorAirContext | undefined {
  if (!context) return undefined;

  return {
    aqi: context.aqi,                       // pass through only if genuinely available
    category: context.aqiCategory,          // e.g. "Good", "Poor"
    source: context.provider,               // e.g. "CPCB NAQI", "Open-Meteo Telemetry"
    freshness: context.freshness,           // "fresh" | "delayed" | "stale" | "unavailable"
    lastUpdated: context.lastUpdated,
  };
}
```

Usage:

```tsx
const outdoor = toOutdoorAirContext(airQuality);

<IndoorAirDoctor
  outdoorContext={outdoor}
  onAssessmentComplete={handleAssessmentComplete}
/>
```

Rules the module enforces, so the host does not need to:

- no context → `posture: 'unknown'`, general guidance, explicit limitation;
- `freshness: 'unavailable'` → no outdoor AQI is used, even if a number is present;
- `stale` → advice downgraded and labelled stale;
- `delayed` → advice labelled delayed;
- category without `aqi` → category used with a "no numeric AQI" limitation;
- outdoor AQI ≥ 151 → "keep windows closed / filter" instead of ventilation advice.

Do **not** synthesise an AQI, and do not relabel a questionnaire score as AQI.

---

## 6. Receive assessment results

```tsx
import { useState } from 'react';
import type { IndoorAssessment } from '../features/indoor-air-doctor';

const [assessment, setAssessment] = useState<IndoorAssessment | null>(null);

<IndoorAirDoctor
  outdoorContext={outdoor}
  onAssessmentComplete={setAssessment}
/>;
```

`IndoorAssessment` contains:

```ts
interface IndoorAssessment {
  overallRisk: 'low' | 'moderate' | 'high';
  riskScore: number;                 // 0–100 indicative index (not AQI)
  identifiedFactors: RiskFactor[];   // assessed factors, highest first
  recommendations: IndoorRecommendation[];
  assessmentTimestamp: string;       // ISO 8601
  disclaimer: string;

  // additive, documented fields
  scoreBand: 'low' | 'moderate' | 'high';
  completeness: number;              // 0–1
  confidence: 'high' | 'medium' | 'low';
  answeredQuestions: number;
  totalQuestions: number;
  escalation?: { applied: boolean; reason: string };
  ventilationGuidance: VentilationGuidance;
  outdoorContext?: OutdoorAirContext;
}
```

Implementation notes:

- The callback fires **once per completed assessment**. A retake produces a new
  result; do not cache the first one as final.
- Recommendations are already ordered: immediate → low-cost → long-term → avoid.
  `relatedFactors` uses factor ids, `outdoorSensitive` flags advice that follows
  the outdoor context.
- If you persist results, store the questionnaire answers alongside the
  assessment (not just the score) so the result can be reproduced. The engine is
  deterministic: same answers + same outdoor context = same score and band.
- If your UI renders the disclaimer, render `assessment.disclaimer` verbatim or
  keep its meaning: **not a measurement, not a medical diagnosis**.

---

## 7. Routing and placement (no module dependency)

Mount it on any existing page. Example with React Router, purely host-side:

```tsx
import { Route } from 'react-router-dom';
import IndoorAirDoctorPage from './pages/IndoorAirDoctorPage';

<Route path="/indoor-air-doctor" element={<IndoorAirDoctorPage />} />
```

The module does not import a router, read URL parameters, or use global state.
If the page needs the selected city, pass the derived `outdoorContext` as a prop.

---

## 8. Styling and isolation

- All class names live in `src/styles/indoor.module.css`; Vite scopes them.
- No global CSS files, no Tailwind directives, no CSS resets are injected.
- The root wrapper sets its own colour tokens as CSS custom properties local to
  the component.
- Font family prefers `'Plus Jakarta Sans'` (already loaded by the main app),
  then `Inter`, then the system stack. No font import is added.
- Icons come from `lucide-react`.
- Motion respects `prefers-reduced-motion`.

If the host stylesheet sets aggressive global rules such as
`button { ... }` or `* { box-sizing: content-box }`, the module's own selectors
still win where it matters because they are explicit classes; verify visually if
the host has unusual global overrides.

---

## 9. If the main app needs its existing indoor type

The repository currently defines `IndoorAssessmentResult` in
`src/types/indoor.ts`. This module does not edit or import that file. If the main
app's existing screens must consume the module's result, keep the mapping in the
host (not in the module), for example:

```ts
import type { IndoorAssessment } from '../features/indoor-air-doctor';
import type { IndoorAssessmentResult } from '../types/indoor';

const RISK_LEVEL_COPY = {
  low: 'Low Hazard',
  moderate: 'Moderate Hazard',
  high: 'High Hazard',
} as const;

export function toLegacyResult(result: IndoorAssessment): IndoorAssessmentResult {
  return {
    score: result.riskScore,
    riskLevel: RISK_LEVEL_COPY[result.overallRisk],
    primaryHazards: result.identifiedFactors
      .filter((factor) => factor.severity !== 'low')
      .map((factor) => ({
        title: factor.title,
        description: factor.explanation,
        severity:
          factor.severity === 'high'
            ? 'high'
            : factor.severity === 'moderate'
              ? 'medium'
              : 'low',
      })),
    immediateZeroCostActions: result.recommendations
      .filter((item) => item.category === 'immediate' || item.category === 'low-cost')
      .map((item) => item.title),
    mediumTermImprovements: result.recommendations
      .filter((item) => item.category === 'long-term')
      .map((item) => item.title),
    equipmentRecommendations: result.recommendations
      .filter((item) => item.id === 'choose-hepa-purifier' || item.id === 'maintain-filters')
      .map((item) => item.title),
    scientificClarifications: result.recommendations
      .filter((item) => item.category === 'avoid')
      .map((item) => item.description),
  };
}
```

This is optional. The module's own types are complete and can be used directly.

---

## 10. Bundler / TypeScript notes

- **Vite:** works as-is; CSS Modules are built in.
- **Other bundlers:** enable CSS Modules for `*.module.css` (Webpack:
  `css-loader` with `modules`; Parcel and Next.js support it natively).
- **TypeScript:** CSS module imports are typed by `vite/client`. If the host does
  not include Vite client types, add a declaration:

  ```ts
  // src/types/css-modules.d.ts
  declare module '*.module.css' {
    const classes: { readonly [key: string]: string };
    export default classes;
  }
  ```

- No path aliases are required; all module imports are relative.

---

## 11. Post-merge verification checklist

1. `npm run typecheck` (or `tsc --noEmit`) passes with the module copied in.
2. The page renders at mobile and desktop widths; the questionnaire advances and
   the progress bar moves.
3. Completing all sections shows results, factors and the four action groups.
4. `onAssessmentComplete` receives one result per completion; retake keeps the
   previous answers; start-over clears them.
5. With no `outdoorContext`, the results show general ventilation guidance and a
   visible limitation — not an invented AQI.
6. With a fresh high AQI context, the results advise keeping windows closed and
   the plan contains the filtration/source-control items.
7. With `freshness: 'stale'`, the stale limitation is visible.
8. Skipping every question produces the "unknown, not clean air" notice and
   limited confidence.
9. No console errors, no network requests from the module, and no new entries in
   `package.json` beyond `lucide-react` if it was missing.

---

## 12. Known integration limitations

- The questionnaire is English-only and is not localised.
- Only one outdoor context is accepted for the whole household; there is no
  room-level or hourly modelling.
- The score is an ordinal indicative index — do not surface it as AQI, compare it
  with CPCB/WHO thresholds, or show it to users as a pollutant measurement.
- The module does not persist anything. Saving assessments, associating them with
  a user profile, or syncing across devices is the host application's job; the
  module accepts `initialAnswers` for restoring a session.
- The module makes no medical claims and should not be presented as health
  screening or diagnosis.
