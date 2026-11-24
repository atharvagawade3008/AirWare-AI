# 🌬️ AirAware AI — LinkedIn Submission Post Copy

**Title:** Beyond Passive Dashboards: Why We Built AirAware AI for India's Clean Air Decisions

---

Air pollution across Indian cities isn't just an abstract number on an environmental dashboard — it is a daily public health negotiation. 

Whether in Delhi-NCR during winter inversion peaks, Mumbai along coastal humidity corridors, or Bengaluru’s traffic choke points, millions of citizens check their phones every morning and see "AQI: 195".

**But what should a citizen actually DO with that number?**

Two families living in the same pin-code experiencing the same ambient AQI need completely different decisions:
👶 A household with school-going toddlers needs to know whether school playground sports should be substituted with indoor games, and which commute hours carry severe ground inversion.
🧓 A household with elderly members needs urgent warnings that early-morning walks during low boundary-layer hours dramatically spike cardiovascular strain.
🏍️ A daily two-wheeler commuter needs to understand why an N95 respirator is essential over cloth masks against sub-micron PM2.5, and when to switch to the Metro.

That is why we built **AirAware AI** — an India-first, GenAI-powered environmental decision intelligence platform.

---

### 💡 What Makes AirAware AI Different?

1. **Scientific Honesty & Data Pathway Separation:**
   Most air quality platforms misrepresent atmospheric model forecasts as local ground sensors. AirAware AI separates data pathways:
   - **Ground Monitoring Stations (CAAQMS):** Physical sensor readings delivering official CPCB NAQI when validity rules (≥3 pollutants, PM mandatory) are met.
   - **Atmospheric Model Estimates (CAMS via Open-Meteo):** Regional 11 km numerical forecasts clearly labeled as *Indicative Derived Indices*, with honest micro-climate disclaimers.
   - **Data Absence Transparency:** In remote areas with no station in range, AirAware AI displays *"Insufficient Validated Data to Calculate CPCB AQI"*. We never fabricate fake numbers.

2. **24-Hour Time-Based Exposure Planner:**
   Pollution is not static. Solar radiation lifts the atmospheric boundary layer between 1 PM and 4 PM, whereas nocturnal cooling and morning rush-hour traffic trap tailpipe soot near the pavement. AirAware AI segments the day into dynamic exposure windows with tailored Do’s and Don'ts.

3. **Indoor Air Doctor (Zero Sensor Hallucination):**
   Most apps claim to know your indoor air without sensors. AirAware AI takes a rigorous, honest approach: an evidence-based hazard questionnaire assessing cooking fuels, kitchen exhaust, mosquito coils (which can emit particulate matter equal to 75–100 cigarettes), and wall mould. It prescribes zero-cost immediate fixes and busts myths (explaining why potted plants cannot replace certified HEPA H13 filtration).

4. **Cleaner Choices & What-If Impact Calculator:**
   Allows commuters to calculate avoided greenhouse gas emissions (kg CO₂e) and annual fuel savings using ARAI and Central Electricity Authority carbon-intensity factors. Crucially, it features an **AQI safety gate**: AirAware AI *never* indiscriminately recommends outdoor cycling or walking when AQI > 150, prioritizing pulmonary safety over generic fitness advice.

5. **Hybrid Edge AI Architecture (₹0 Recurring Cost):**
   - **Local Browser Inference:** Runs open-weight language models (`Qwen2.5-0.5B`) directly inside the user's browser via **WebGPU WebLLM**, ensuring 100% data privacy and offline edge capability.
   - **Protected Cloud AI:** Serverless Gemini 1.5 Flash proxied through Netlify Functions with strict rate-limiting and CORS preflight handling.
   - **Deterministic Fallback:** A high-precision CPCB rule engine that ensures zero downtime, zero cost, and zero hallucination if WebGPU or cloud AI is unavailable.

---

### 🛠️ Built with Antigravity & Modern Web Stack
- **Frontend:** React 18 + TypeScript + Tailwind CSS + Lucide Icons + Recharts
- **Telemetry & Models:** Open-Meteo Air Quality (CAMS Atmospheric Model) & Weather API + Open-Meteo Geocoding
- **AI Layer:** WebLLM (`@mlc-ai/web-llm`) + Gemini API Serverless Proxy
- **Evaluator Scenarios:** 6 built-in test fixtures verifying Mumbai families, Delhi professionals, senior citizens, missing monitoring stations, API outages, and AI fallbacks in 1-click.
- **Verification:** 35/35 passing automated test assertions covering CPCB boundary calculations, validity rules, and safety gating.

Check out the project repository: https://github.com/your-username/airaware-ai

*#AirQuality #GenAI #Sustainability #ClimateTech #CPCB #CleanAir #WebGPU #BuildInPublic #India*
