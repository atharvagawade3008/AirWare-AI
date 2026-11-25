# AirAware AI — Breathe Smarter. Live Healthier.

> **Competition Track:** Three-Day Intensive Build | Hybrid GenAI | India-First Decision Intelligence  
> **Tagline:** *Breathe smarter. Live healthier. Make every action count.*  
> **Architecture:** Zero-Cost Serverless + Deterministic CPCB NAQI Engine  
> **Pre-Submission Engineering Audit Status:** PASSED (35/35 Automated Tests • 0 Vulnerabilities • Strict Data Classification)

---

## 1. Problem Statement
Urban air pollution is an escalating public health crisis across Indian metropolitan and tier-2 regions (Delhi-NCR, Mumbai, Kolkata, Pune, Bengaluru). However, existing applications treat environmental data as **passive dashboards**: displaying raw numbers without answering what citizens should actually *do*. 

Two families in the same neighbourhood with an AQI of 180 require fundamentally different action paths:
- A family with toddlers needs playtime reschedule windows away from morning inversion hours and school commute protection.
- A senior citizen with hypertension needs warnings against ground-level particulate accumulation during morning walks.
- A daily two-wheeler commuter needs tailpipe exposure mitigation and transit alternatives.

**AirAware AI transforms raw air quality metrics into personalized daily decisions and actionable, low-emission lifestyle choices.**

---

## 2. Environmental Data Integrity & Sourcing

AirAware AI enforces strict scientific honesty and **never misrepresents model forecasts as rooftop sensor observations**:

```
                      DATA INGESTION PATHWAYS
                                 │
         ┌───────────────────────┴───────────────────────┐
         ▼                                               ▼
  GROUND MONITORING                               ATMOSPHERIC MODEL
(CPCB CAAQMS / OpenAQ)                         (CAMS / Open-Meteo)
         │                                               │
         ▼                                               ▼
  Physical Ground Sensor                          Satellite & Numerical Model
  • Fixed Lat/Lon Coordinates                     • Regional Grid Cell (~11 km)
  • Direct Micro-environment                      • Atmospheric Boundary Layer
  • Real-time Physical Telemetry                  • Hourly Numerical Forecast
         │                                               │
         ▼                                               ▼
  [Official CPCB NAQI]                    [Indicative Derived Index]
  "Official CPCB Station Observation"     "Modelled Atmospheric Estimate"
```

### Data Pathway Rules
1. **Modelled Air-Quality Estimates (CAMS via Open-Meteo):**
   - Derived from the Copernicus Atmosphere Monitoring Service (CAMS) global/European atmospheric model.
   - Sourced via Open-Meteo Air Quality API (~11 km regional grid resolution).
   - Labelled as **"Modelled Air-Quality Estimate"**.
   - Derived index: **"Indicative Derived Index (CPCB Breakpoints on Atmospheric Model)"**.
   - Clear disclosure: Does not represent the micro-local air outside a user's building.
2. **Official Station Observations (CPCB / CAAQMS / OpenAQ):**
   - Sourced from continuous ambient air monitoring stations.
   - Sourced via OpenAQ v3 (Netlify serverless proxy with `X-API-Key`) or CPCB portal feeds.
   - Labeled as **"Physical Monitoring Station Observation"**.
   - Calculated as **"Official CPCB NAQI"** only when CPCB validity requirements (≥3 criteria pollutants, $\text{PM}_{2.5}$ or $\text{PM}_{10}$ mandatory) are satisfied.
3. **Data Absence Transparency:**
   - If a rural or semi-urban area has no continuous monitoring station within range, AirAware AI displays **"Insufficient Validated Data to Calculate CPCB AQI"**. It *never* fabricates a fake number.

---

## 3. Key Features

### 🌟 1. CPCB-Standard Mathematical Engine
- Implements the official Central Pollution Control Board (CPCB 2014) piecewise linear interpolation formula:
  $$I_p = \frac{I_{hi} - I_{lo}}{B_{hi} - B_{lo}} \times (C_p - B_{lo}) + I_{lo}$$
  identifies the *Prominent Pollutant*, and enforces CPCB validity criteria across $\text{PM}_{2.5}, \text{PM}_{10}, \text{NO}_2, \text{SO}_2, \text{CO}, \text{O}_3$.
- Data Freshness Tracker: Strict states (`fresh`, `delayed`, `stale`, `unavailable`) with explicit timestamping and grid attribution.

### 🏠 2. Household Profile & Personalization ("My Family")
- Tailors advice based on vulnerable family members: infants/children, senior citizens, respiratory patients (asthma/COPD).
- Adapts to commute habits (open two-wheeler, solo car, public transit, walk), commute distance, outdoor workout hours, indoor cooking fuel, and air purifier availability.

### ⏰ 3. 24-Hour Time-Based Exposure Planner
- Segments the day into dynamic dispersion windows: **Morning (6–11 AM)**, **Afternoon (12–4 PM)**, **Evening Commute (5–8:30 PM)**, and **Night/Sleep (9 PM–6 AM)**.
- Explains atmospheric dynamics (boundary layer compression vs. midday solar convection) and prescribes concrete **Do's and Don'ts**.

### 🩺 4. "Indoor Air Doctor" — Living Environment Audit
- Structured hazard assessment covering cooking ventilation, mosquito coils, agarbatti/dhoop combustion, wall dampness/mould, cleaning dust re-suspension, and smoking.
- Computes an **Indoor Hazard Score (0–100)** and outputs zero-cost immediate fixes.
- **Scientific Honesty:** Busts myths (clarifies why potted plants cannot replace HEPA filters) and issues strict warnings against lung-damaging ozone generators. Explicitly discloses that it is a lifestyle assessment, not a hardware sensor.

### 🚲 5. "Cleaner Choices" — Lifestyle Decision Planner
- Evaluates everyday habits: solo driving vs. carpooling/transit, multi-errand batching, and eliminating engine idling.
- **AQI Safety Gating:** AirAware AI *never* indiscriminately recommends outdoor cycling or walking in elevated smog ($AQI > 150$), preventing users from heavily inhaling toxic particulates during intense cardio.

### 📊 6. "What-If" Impact Calculator
- Interactive simulator estimating annual avoided greenhouse gas emissions ($\text{kg CO}_2\text{e}$), fuel expenditure savings (₹), and equivalent car-km eliminated.
- Documented emission factors from Automotive Research Association of India (ARAI) and Central Electricity Authority (CEA).
- Transparent boundary note: personal greenhouse gas mitigation does not substitute for personal exposure protection during high-smog episodes.

### 🤝 7. Community Impact Collective
- Demonstrates collective action through citizen pledges (zero-idling school zones, transit switches, smoke-free homes).

### 🤖 8. Gemini Cloud AI Assistant
- **Instant, zero-download chat:** Answers come from Google Gemini through a secure Netlify Function, so the assistant opens immediately on any device — no model download, no WebGPU, no GPU requirement.
- **Grounded in real telemetry:** Every request carries the current AQI, pollutant readings, station metadata, freshness, weather and household flags, with a system instruction that forbids inventing readings or diagnosing illness.
- **Deterministic CPCB Engine fallback:** If Gemini is slow, rate-limited or unavailable, verified rule-based guidance answers instead and is clearly labelled as such.
- Injects verified data type into AI system context so the assistant never claims a model forecast is a local rooftop sensor.

### 🧪 9. Interactive Evaluator Scenarios (6 Test Fixtures)
1. **Mumbai Family:** School children, outdoor playtime, commute mask advisory.
2. **Delhi Professional:** High smog (AQI 342), asthma sensitivity, morning jog shift, metro switch.
3. **Senior Citizen Household:** Inversion avoidance, cardiovascular protection.
4. **Missing Monitoring Station:** Rural/remote location; transparently states station absence with zero fabricated data.
5. **API Outage / Network Offline:** Demonstrates graceful degradation, stale caching, and error resilience.
6. **Offline / Low-End Device:** Answers instantly through the deterministic CPCB engine with no cloud AI, GPU, or model download.

---

## 4. Technology Stack
- **Frontend Framework:** React 18 + Vite + TypeScript
- **Styling & UI:** Tailwind CSS, Lucide React, Recharts
- **Cloud AI:** Google Gemini through the official `@google/genai` SDK (`gemini-3.8-flash`, configurable), called only from the server
- **Serverless Backend:** Netlify Functions (Node.js/TypeScript) with full CORS preflight handling
- **APIs:** Open-Meteo Air Quality (CAMS Atmospheric Model) & Weather API, Open-Meteo Geocoding, OpenAQ v3 (optional proxy), Google Gemini 1.5 Flash (optional fallback)

---

## 5. Getting Started (Local Setup)

### Prerequisites
- Node.js v18+ (tested on Node v24.14)
- npm v9+

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/airaware-ai.git
cd airaware-ai

# Install dependencies
npm install

# Run the automated tests
npx tsx tests/intelligence.test.ts

# Start the full app + Netlify Functions (Gemini chat works here)
npx netlify dev

# Frontend only: no AI endpoint, chat falls back to the CPCB engine
npm run dev
```

### Environment Variables
```bash
cp .env.example .env
```
```env
# Required for the AI assistant. Server-side only — never VITE_ prefixed.
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-3.8-flash
GEMINI_FALLBACK_MODEL=gemini-3.5-flash
GEMINI_MAX_OUTPUT_TOKENS=1024

# Optional: OpenAQ v3 API Key for the ground-station proxy.
OPENAQ_API_KEY=
```
*Get a free key at <https://aistudio.google.com/apikey>. Without `GEMINI_API_KEY` the app still works at 100% functionality using verified Open-Meteo telemetry and the deterministic CPCB engine; only the conversational AI is disabled.*

### How the AI is called (server-side only)
```
Browser  ──POST──▶  /api/airaware-chat  (Vercel)
                    /.netlify/functions/airaware-chat  (Netlify)  ──@google/genai──▶  Gemini API
(AirAwareContext)   (validates, rate-limits, maps errors)                   (system instruction + app data)
```
- The browser never sees the key and never calls Google directly.
- The function validates the message (≤1500 chars), caps history at 6 turns, limits output tokens, applies a 12s per-model deadline inside a 20s total budget and a best-effort 8 requests/minute per IP limiter, and returns typed errors (`quota_exhausted`, `rate_limited`, `timeout`, `misconfigured`, `upstream_unavailable`).
- If Gemini fails, the frontend answers from the deterministic CPCB engine and labels the message and reason honestly.

---

## 6. Build and Production Deployment
```bash
# Production TypeScript check & Vite build
npm run build

# Preview build locally
npm run preview
```

Deployable to Netlify with zero configuration via included `netlify.toml`:
- Build Command: `npm run build`
- Publish Directory: `dist`
- Functions Directory: `netlify/functions`

---

## 7. Gemini Cloud AI & Product Tour

### Required secrets
| Variable | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | Yes (for AI chat) | Server-side Gemini Developer API key |
| `GEMINI_MODEL` | No (default `gemini-3.8-flash`) | Primary model |
| `GEMINI_FALLBACK_MODEL` | No (default `gemini-3.5-flash`) | Used when the primary model returns 503 UNAVAILABLE or 429 (that model's daily quota is spent) |
| `GEMINI_MAX_OUTPUT_TOKENS` | No (default `1024`) | Output cap per answer. Flash models spend thinking tokens from this cap, so keep room for the reply |
| `GEMINI_TIMEOUT_MS` | No (default `12000`, minimum `10000`) | Per-model request deadline; Gemini rejects anything shorter |
| `GEMINI_TOTAL_BUDGET_MS` | No (default `20000`) | Total budget across primary + fallback, kept under the host function limit |

### Local development
```bash
cp .env.example .env      # paste the real key into .env, never into tracked files
npx netlify dev           # serves the app and /.netlify/functions/*
```
`npm run dev` alone serves no functions, so the chat shows a labelled fallback answer instead.

### Netlify deployment
1. Netlify → **Site settings → Environment variables** → add `GEMINI_API_KEY` (and optionally the model variables).
2. Keep the key out of `netlify.toml`, `.env.example` and the repository.
3. Redeploy (**Deploys → Trigger deploy → Deploy site**) so the function picks up the new secret.
4. Verify the endpoint:
```bash
curl -s -X POST https://YOUR-SITE.netlify.app/.netlify/functions/airaware-chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"Is it safe to walk outside today?","history":[],"context":{"location":"Mumbai","standard":"CPCB","aqi":132,"aqiCategory":"Moderately Polluted","indexClassification":"indicative_model_index","dataType":"modelled_estimate","pollutants":[],"freshness":"fresh","household":{"householdSize":4,"children":true,"elderly":false,"respiratorySensitive":false,"hasAirPurifier":false,"cookingFuel":"piped_gas","commuteType":"public_transit","commuteDistanceKm":12,"outdoorExerciseTime":"morning"}}}'
```
5. Confirm no key reached the browser:
```bash
npm run build
grep -r "AIza" dist/ || echo "No API key in frontend bundle"
```

### Free-tier and failure behaviour
- Requests are validated, capped and throttled; ordinary dashboard interactions never call Gemini.
- **429 quota:** the user sees a temporary usage-limit message plus the verified CPCB guidance; the app does not switch to a paid model.
- **401/403:** logged as a safe configuration error with no secret in the response.
- **500/503 (after one retry and the configured fallback model):** temporary-unavailability message.
- **Timeout:** the user is offered a retry.

### Product tour
The first visit opens an 8-step spotlight tour (Welcome → AQI → Daily routine → Indoor air → Cleaner swaps → AI assistant → Impact → Ready). It dims the page with a real cutout and glow around each live component, switches tabs automatically, and always offers **Skip Tour**. Completion or skip status is stored in `localStorage` (`airaware_tour_status`), and the footer **Take a Tour** link replays it from step 1.

---

## 8. License
MIT License. Open for educational, public health, and non-commercial climate intelligence initiatives.
