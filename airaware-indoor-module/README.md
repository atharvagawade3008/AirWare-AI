# Indoor Air Doctor

**Module of the AirAware AI project — built independently for later integration.**

Indoor Air Doctor is a self-contained React module that turns a short household
questionnaire into an **Indoor Air Risk Assessment** and a personalised action
plan. It is designed for homes **without indoor air-quality sensors**.

> **This module never measures indoor air.** It does not produce an indoor AQI,
> a PM2.5 concentration, a health prediction or a medical diagnosis. Every value
> it reports is an *indicative* index derived from the answers a household gives.
> The phrase used throughout the UI and engine is **Indoor Air Risk Assessment**.

---

## 1. What it does

| Stage | What the user gets |
| --- | --- |
| **1. Household assessment** | 20 short questions across 6 sections: cooking & kitchen ventilation, indoor activities/combustion, dust & cleanliness, moisture & dampness, air circulation, filtration & maintenance. Every question is optional. |
| **2. Risk assessment** | A deterministic engine groups the answers into six weighted risk factors, scores each one, shows the evidence behind it, and gives an overall band: low / moderate / high. |
| **3. Personalised action plan** | Recommendations grouped into **Immediate actions**, **Free or low-cost improvements**, **Long-term improvements** and **Habits to avoid**. Ventilation advice adapts to an outdoor AQI context supplied by the parent app. |

The component also includes retake (keeps answers for editing) and start-over
(clears everything) flows, a progress indicator, and a visible completeness and
confidence indicator when questions are skipped.

---

## 2. What it explicitly does **not** do

- It does **not** read sensors or estimate indoor pollutant concentrations.
- It does **not** fetch outdoor air quality, or invent one when none is supplied.
- It does **not** diagnose, predict illness, or claim any medical benefit.
- It does **not** recommend ozone generators (the opposite — it advises against them).
- It does **not** claim houseplants replace filtration.
- It does **not** depend on the parent app's router, global state, auth, database,
  CSS, or API configuration.

---

## 3. Quick start (standalone workspace)

```bash
cd airaware-indoor-module
npm install
npm run dev        # http://127.0.0.1:5174
```

The dev page is a sandbox: a small control bar lets you simulate the outdoor
context the parent app would pass in (**all values there are demo fixtures, not
live readings**).

Other commands:

```bash
npm test           # Vitest + Testing Library suite
npm run typecheck  # tsc --noEmit
npm run build      # typecheck + production build of the sandbox
```

---

## 4. Project structure

```text
airaware-indoor-module/
├── src/
│   ├── components/
│   │   ├── AssessmentIntro.tsx      # introduction + context summary
│   │   ├── Questionnaire.tsx        # multi-step flow, progress, navigation
│   │   ├── QuestionStep.tsx         # accessible radio groups per section
│   │   ├── AssessmentResults.tsx    # score, ventilation, factors, action plan
│   │   ├── RiskFactorCard.tsx       # factor explanation + evidence
│   │   └── RecommendationCard.tsx   # action card + impact/effort chips
│   ├── engine/
│   │   ├── scoring.ts               # deterministic index, bands, escalation
│   │   ├── recommendations.ts       # rule-based action selection
│   │   └── ventilation.ts           # outdoor context → ventilation advice
│   ├── data/
│   │   └── questions.ts             # questionnaire + option risk values
│   ├── styles/
│   │   └── indoor.module.css        # namespaced CSS (CSS Modules)
│   ├── types/
│   │   └── indoor.ts                # all public types
│   ├── IndoorAirDoctor.tsx          # exported component
│   ├── index.ts                     # public entry point
│   ├── main.tsx                     # sandbox only (not part of the module)
│   ├── demo.css                     # sandbox only
│   └── vite-env.d.ts
├── tests/
│   ├── fixtures.ts                  # household scenarios A–E
│   ├── scoring.test.ts
│   ├── ventilation.test.ts
│   ├── recommendations.test.ts
│   ├── ui.test.tsx
│   └── setup.ts
├── index.html                       # sandbox only
├── INTEGRATION.md                   # how to merge into the AirAware app
├── README.md
└── package.json
```

---

## 5. Scoring model and assumptions

The engine is pure TypeScript with no network access, no randomness and no
clock dependence except the ISO timestamp (inject it with `now` for tests).

### 5.1 Formula

Each answer option carries a **relative risk contribution** (`risk`, 0–1) in
`src/data/questions.ts`. These values rank known indoor pollution pathways
against one another; they are **not** probabilities or clinical risk.

1. Within each factor, answered questions are averaged by the factor's own
   question weights.
2. A factor with **no answers** receives a neutral baseline of `0.32`. Skipped
   questions are therefore never treated as clean air, and they never inflate
   the score either.
3. The overall index is the weighted average of the six factor ratios:

```text
riskScore = round(100 × Σ(weight_f × ratio_f))       (Σ weight = 1)
```

### 5.2 Factors and weights

| Factor | Weight | Questions used |
| --- | --- | --- |
| Cooking emissions | 0.26 | fuel, kitchen exhaust, smoke spread, kitchen ventilation |
| Indoor combustion & smoke | 0.20 | indoor smoking, incense/coils, candles |
| Limited fresh-air exchange | 0.14 | window opening, window safety, AC/sealed reliance |
| Dust accumulation | 0.15 | cleaning frequency, visible dust, soft furnishings, pets |
| Dampness & mould | 0.15 | dampness, mould, leakage |
| Filtration & maintenance gaps | 0.10 | purifier type, filter maintenance |

### 5.3 Bands

| Overall index | Band |
| --- | --- |
| 0–29 | low |
| 30–54 | moderate |
| 55–100 | high |

Factor severity uses its own thresholds: `< 30` low, `30–59` moderate, `≥ 60` high.

### 5.4 Compounding rules (raise one band, capped at high)

1. **Unvented combustion** — a strong indoor combustion source (solid/kerosene
   fuel, frequent coils/incense, frequent candles, heavy smoke spread or daily
   smoking) combined with no effective cooking exhaust capture.
2. **Trapped dampness** — significant dampness, widespread mould or persistent
   leakage combined with windows rarely/never opened or a mostly sealed home.

These rules exist so that one severe pathway is not diluted by a good answer
elsewhere. The assessment records `escalation.applied` and a plain-language
reason, and the results screen shows it.

### 5.5 Completeness and confidence

`completeness` is the share of the 20 questions answered. Confidence is high at
≥ 85%, medium at ≥ 60%, low below that. The results screen states how many
questions were answered and warns that skipped areas are unknown, not safe.

### 5.6 Ordinal, not precise

The index is ordinal: 40 and 45 should be read as broadly similar. It is not a
standards-based AQI, is not comparable to CPCB/WHO thresholds, and does not
estimate concentrations.

---

## 6. Outdoor context

The module accepts an optional context from the parent app:

```ts
interface OutdoorAirContext {
  aqi?: number;
  category?: string;
  source?: string;
  freshness: 'fresh' | 'delayed' | 'stale' | 'unavailable';
  lastUpdated?: string;
}
```

Behaviour:

| Context | Ventilation posture |
| --- | --- |
| No context | `unknown` — general guidance; says timing depends on local outdoor conditions |
| `unavailable` | `unknown` — the limitation is shown; no AQI is invented |
| `fresh`, AQI ≤ 50 | `ventilate` |
| `fresh`, 51–100 | `ventilate` (short bursts recommended) |
| `fresh`, 101–150 | `ventilate-with-caution` |
| `fresh`, ≥ 151 | `keep-closed-filter` — do not open windows wide; filter and control sources |
| `delayed` | Same band, with a visible "data is delayed" limitation |
| `stale` | Posture downgraded one level, with a visible "stale" limitation |
| Category only (no numeric AQI) | Posture derived from the category, with a limitation stating no numeric AQI was provided |
| Unrecognised/unusable context | `unknown` + general guidance |

The results screen always shows the reported AQI (if any), category, source and
freshness, and lists every limitation. Recommendations marked
`outdoorSensitive: true` follow the same posture; when outdoor air is polluted
the plan replaces "ventilate now" with "keep windows closed and filter".

---

## 7. Dependencies

Runtime (the only additions to the parent app):

- `react` ≥ 18 and `react-dom` ≥ 18 (peer)
- `lucide-react` — icons only

No Tailwind, PostCSS, router, state library, HTTP client, database or env var is
required. Styling is a single **CSS Module**, so class names are hashed and
cannot collide with the host app.

Development-only: `vite`, `@vitejs/plugin-react`, `typescript`, `vitest`, `jsdom`,
`@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`.

---

## 8. Tests

`npm test` covers:

- scoring determinism, index bounds, factor weights and thresholds;
- risk categorisation and compounding escalation;
- **Scenario A** – gas cooking, poor kitchen ventilation, frequent mosquito coils → high (escalated);
- **Scenario B** – good ventilation, no smoking, regular cleaning, no dampness → low;
- **Scenario C** – dampness, mould, dust and poor ventilation → high;
- **Scenario D** – high outdoor AQI changes ventilation advice and actions;
- **Scenario E** – outdoor data unavailable → general guidance with visible limitation;
- skipped and missing answers, invalid restored answers, partial factor answering;
- recommendation ordering, deduplication and avoidance of confident guidance for skipped sections;
- safety copy: no ozone generators, no plant-filter claims, no medical claims;
- full UI flow, progress, results, polluted-context adaptation, retake and start-over.

The dev sandbox's outdoor presets are clearly labelled fixtures; no live or fake
environmental readings are produced by the module.

---

## 9. Known limitations

- The risk values are documented heuristics, not epidemiological coefficients.
- The index is ordinal and is not comparable with AQI standards.
- The questionnaire is English-only and static; there is no per-room modelling.
- Ventilation advice uses one outdoor reading for the whole home.
- No persistence: the module holds answers in React state. The host app may pass
  `initialAnswers` to restore a saved session, but the module itself never stores
  or transmits anything.
- `assessmentTimestamp` uses the browser clock, so it reflects the device time.
- Recommendations are general household guidance, not medical advice, and they
  do not account for individual health conditions.

---

## 10. Integrating into AirAware AI

See **[INTEGRATION.md](./INTEGRATION.md)** for the copy list, dependency notes,
import example, outdoor-context adapter, result handling and a post-merge
verification checklist.
