# AirAware AI — Breathe Smarter. Live Healthier.

> **Competition Track:** Three-Day Intensive Build | Hybrid GenAI | India-First Decision Intelligence  
> **Tagline:** *Breathe smarter. Live healthier. Make every action count.*  
> **Architecture:** Zero-Cost Serverless + Browser WebLLM (WebGPU) + Deterministic CPCB NAQI Engine  
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

### 🤖 8. Hybrid GenAI Orchestration
- **Local Browser Inference (WebLLM):** Runs open-weight LLMs (`Qwen2.5-0.5B`) directly in-browser via WebGPU with progress tracking.
- **Protected Cloud AI Fallback (Gemini 1.5 Flash):** Proxied securely through Netlify Serverless Functions without exposing API keys.
- **Deterministic CPCB Engine:** 100% reliable rule-based fallback that answers questions instantly with zero hallucination and zero downtime.
- Injects verified data type into AI system context so the assistant never claims a model forecast is a local rooftop sensor.

### 🧪 9. Interactive Evaluator Scenarios (6 Test Fixtures)
1. **Mumbai Family:** School children, outdoor playtime, commute mask advisory.
2. **Delhi Professional:** High smog (AQI 342), asthma sensitivity, morning jog shift, metro switch.
3. **Senior Citizen Household:** Inversion avoidance, cardiovascular protection.
4. **Missing Monitoring Station:** Rural/remote location; transparently states station absence with zero fabricated data.
5. **API Outage / Network Offline:** Demonstrates graceful degradation, stale caching, and error resilience.
6. **AI Fallback:** Operates seamlessly when cloud AI is unconfigured and WebGPU is unavailable.

---

## 4. Technology Stack
- **Frontend Framework:** React 18 + Vite + TypeScript
- **Styling & UI:** Tailwind CSS, Lucide React, Recharts
- **Local AI:** WebLLM (`@mlc-ai/web-llm`) with WebGPU acceleration
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

# Run the 35 automated tests
npx tsx tests/intelligence.test.ts

# Start local development server
npm run dev
```

### Environment Variables (Optional)
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
```env
# Optional: Google Gemini API key for Cloud AI fallback.
# Kept server-side in Netlify Functions. Never exposed to browser.
GEMINI_API_KEY=

# Optional: OpenAQ v3 API Key for ground station proxy.
OPENAQ_API_KEY=
```
*Note: AirAware AI operates at 100% functionality even when both keys are empty, using verified Open-Meteo telemetry and the deterministic CPCB intelligence engine.*

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

## 7. License
MIT License. Open for educational, public health, and non-commercial climate intelligence initiatives.
