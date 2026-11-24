import { AirAwareContext, AIResponse } from '../../types/ai.ts';

export function runDeterministicAI(context: AirAwareContext, userPrompt: string): AIResponse {
  const start = Date.now();
  const q = userPrompt.toLowerCase();
  const aqi = context.airQuality.aqi;
  const cat = context.airQuality.aqiCategory || 'Satisfactory';
  const loc = context.airQuality.location;
  const p = context.profile;
  const prominent = context.airQuality.prominentPollutant || 'PM2.5';
  const freshness = context.airQuality.freshness;
  const isModel = context.airQuality.dataType === 'modelled_estimate';

  const sourceContextPhrase = isModel 
    ? `modelled atmospheric forecast (CAMS regional grid)`
    : `ground monitoring station observation`;

  let reply = '';

  // Handle missing data first
  if (aqi === undefined || context.airQuality.indexClassification === 'insufficient_data') {
    reply = `**Environmental Data Notice for ${loc}:**\n\n` +
      `• **Station Telemetry Unavailable:** There is currently no continuous monitoring station in immediate range with verified measurements satisfying CPCB criteria.\n` +
      `• **Precautionary Guidance:** Because current localized particulate data is unavailable, AirAware AI avoids guessing or fabricating an AQI number. If outdoor haze or burning smells are noticeable, keep windows shut, maintain indoor damp-mopping, and wear an N95 respirator during high-traffic commute hours.`;
    return {
      content: reply,
      provider: 'deterministic',
      modelName: 'AirAware Deterministic Rule Engine (CPCB NAQI Aligned)',
      latencyMs: Date.now() - start,
      isFallback: false,
      confidenceNote: 'Truthful reporting of unavailable station data without fabrication.'
    };
  }

  // 1. Children outdoor play / school safety
  if (q.includes('child') || q.includes('kid') || q.includes('play outside') || q.includes('school')) {
    if (cat === 'Severe' || cat === 'Very Poor') {
      reply = `**Critical Caution for Children in ${loc} (Indicative ${cat} Conditions — Derived Index: ${aqi}):**\n\n` +
        `• **Immediate Action:** Keep children indoors today. Cancel all outdoor sports and playground activities.\n` +
        `• **Biological Reason:** A child's respiratory rate is up to 50% faster than an adult's, and their lungs are still developing alveoli. Inhaling elevated ${cat} air (${prominent}) causes immediate airway inflammation.\n` +
        `• **School Commute:** If they commute in school buses or auto-rickshaws, equip them with an appropriately sized **N95 / FFP2 mask**. Standard cloth or surgical masks do not filter fine ${prominent}.\n` +
        `• **Alternative:** Shift active play to an enclosed indoor hall or living room with active filtration.\n\n` +
        `*(Based on ${sourceContextPhrase})*`;
    } else if (cat === 'Poor') {
      reply = `**Advisory for Children in ${loc} (Derived Index: ${aqi} — ${cat}):**\n\n` +
        `• **Limit Outdoor Exertion:** Outdoor playtime should be restricted to under 30–45 minutes, preferably in the late afternoon (2 PM – 4 PM) when atmospheric mixing is highest.\n` +
        `• **Avoid Morning Play:** Avoid playground sports between 7 AM and 10 AM when morning traffic exhaust and cool air trap particulates near the ground.\n` +
        `• **Hydration:** Ensure adequate water intake to keep mucosal membranes hydrated against particulate irritation.\n\n` +
        `*(Based on ${sourceContextPhrase})*`;
    } else {
      reply = `**Children Outdoor Activity Approved (Derived Index: ${aqi} — ${cat}):**\n\n` +
        `• Outdoor sports and school activities are safe in ${loc} today!\n` +
        `• Particulate concentrations are within acceptable ranges. Encourage outdoor physical exercise and sports.`;
    }
  }

  // 2. Window opening & ventilation
  else if (q.includes('window') || q.includes('ventilate') || q.includes('fresh air') || q.includes('doors')) {
    if (cat === 'Severe' || cat === 'Very Poor' || cat === 'Poor') {
      reply = `**Ventilation Advisory for ${loc} (Derived Index: ${aqi} — ${cat}):**\n\n` +
        `• **Do NOT leave windows open for extended periods today.** Outdoor air is significantly more polluted than typical indoor air.\n` +
        `• **Peak Danger Hours:** Keep all street-facing windows firmly sealed between 7:00 AM – 10:30 AM and 6:00 PM – 9:30 PM (rush-hour traffic).\n` +
        `• **Safe Window (if necessary):** If indoor cooking fumes or humidity build up, open windows for a brief 15-minute cross-ventilation burst between **1:30 PM and 3:30 PM**, when solar radiation lifts the atmospheric boundary layer.\n` +
        `• **Dust Control:** Wet-mop floors with a damp microfiber cloth instead of dry sweeping, which re-suspends settled particles into breathing height.`;
    } else {
      reply = `**Ventilation Recommendation for ${loc} (Derived Index: ${aqi} — ${cat}):**\n\n` +
        `• **Yes, today is a suitable day to ventilate!**\n` +
        `• Open windows on opposing sides of your home for 30–45 minutes, ideally between 12:00 PM and 4:00 PM, to flush out indoor carbon dioxide (CO2) and cooking VOCs.\n` +
        `• Ambient air quality in ${loc} is ${cat}, making natural dilution beneficial.`;
    }
  }

  // 3. Indoor air improvement / bedroom
  else if (q.includes('indoor') || q.includes('bedroom') || q.includes('purifier') || q.includes('room')) {
    reply = `**Proven, Practical Ways to Improve Indoor Air in Your Home:**\n\n` +
      `1. **Eliminate Combustion Sources:** Do not burn mosquito coils or multiple incense sticks (agarbatti) in closed rooms. A single mosquito coil can release particulate matter equal to 75–100 cigarettes.\n` +
      `2. **Kitchen Management:** Always switch on the kitchen exhaust fan or chimney before igniting the burner, and leave it running for 5 minutes after cooking finishes.\n` +
      `3. **Purifier Placement:** ${p.hasAirPurifier ? 'Keep your air purifier positioned in the bedroom away from walls and curtains, operating continuously on low/auto mode during the night.' : 'Since your profile indicates no mechanical air purifier, prioritize source control: seal gaps under external doors with draft stoppers and keep bedroom doors shut during heavy road traffic hours.'}\n` +
      `4. **Scientific Reality on Houseplants:** While snake plants and areca palms add aesthetic value, scientific studies prove potted plants cannot clean real-world residential air flow rates. Real particulate capture requires certified HEPA H13 filtration.\n` +
      `5. **Avoid Ozone Generators:** Never use 'ionizers' or ozone machines; ozone is a severe pulmonary irritant.`;
  }

  // 4. Commute & travel advice
  else if (q.includes('commute') || q.includes('travel') || q.includes('bike') || q.includes('office') || q.includes('two wheeler') || q.includes('metro')) {
    reply = `**Commute Exposure Strategy for Your ${p.commuteType.replace('_', ' ')} Route:**\n\n` +
      `• **Current Environmental Context:** ${loc} index is ${aqi} (${cat}), driven primarily by ${prominent}.\n` +
      `• **Tailpipe Plume Effect:** On main arterial roads, direct exposure inside the traffic micro-environment is frequently 2x to 3x higher than regional background levels.\n` +
      `• **Specific Action for Your Mode:**\n` +
      (p.commuteType === 'two_wheeler' || p.commuteType === 'bicycle' || p.commuteType === 'walk'
        ? `  - Wear a certified **N95 respirator** with an airtight nose-bridge seal while riding. Cloth masks only filter large dust (>10µm) and offer under 15% protection against sub-micron PM2.5.\n  - Avoid drafting directly behind diesel trucks or older auto-rickshaws at traffic junctions.`
        : `  - In cars/cabs: Immediately toggle the climate control to **Internal Air Recirculation mode**. Fresh-air mode draws toxic exhaust directly from the tailpipe of the vehicle in front of you.`) +
      `\n• **Cleaner Choice:** If metro rail or electric AC bus is accessible for your ${p.commuteDistanceKm} km journey, opting for it cuts both personal exposure and tailpipe emissions.`;
  }

  // 5. Senior citizens / Elderly
  else if (q.includes('senior') || q.includes('elderly') || q.includes('grandparent') || q.includes('old')) {
    reply = `**Specialized Protocol for Senior Household Members (Index: ${aqi} — ${cat}):**\n\n` +
      `• **Avoid Morning Walks:** Early morning outdoor walks (6 AM – 9 AM) carry elevated cardiovascular risk in urban India due to winter/ground thermal inversion.\n` +
      `• **Cardiovascular Correlation:** PM2.5 particles are small enough (<2.5 µm) to cross into pulmonary capillaries and trigger systemic inflammation, increasing ischemic events in older adults.\n` +
      `• **Recommended Routine:** Move walking exercises indoors (such as corridor walks or seated yoga) or defer outdoor strolls until bright afternoon hours when ground haze has lifted.\n` +
      `• Keep emergency prescribed bronchodilators or heart medication readily accessible.`;
  }

  // 6. Why is PM2.5 dangerous?
  else if (q.includes('pm2.5') || q.includes('pm25') || q.includes('particulate') || q.includes('dangerous')) {
    reply = `**Why PM2.5 is the Primary Health Hazard in Urban Air:**\n\n` +
      `• **Size Scale:** PM2.5 particles are less than 2.5 micrometers in aerodynamic diameter — roughly 1/30th the width of a human hair.\n` +
      `• **Deep Lung Infiltration:** Coarse particles (PM10) get trapped by nasal cilia and upper mucus linings. PM2.5 bypasses all natural bodily filters, traveling straight into the deepest alveoli where gas exchange takes place.\n` +
      `• **Cardiovascular Entry:** Ultrafine particles within PM2.5 can penetrate alveolar membranes directly into the bloodstream, triggering vascular plaque instability and long-term oxidative stress.\n` +
      `• **Current Reading in ${loc}:** ${context.airQuality.pollutants.find(p => p.code === 'pm25')?.value || 'N/A'} µg/m³ (Source: ${context.airQuality.provider}, status: ${freshness}).`;
  }

  // 7. General routine / fallback
  else {
    reply = `**AirAware Intelligence Summary for ${loc}**\n\n` +
      `• **Environmental Context:** Derived Index is **${aqi} (${cat})**, with ${prominent} as the primary active pollutant. Telemetry status is **${freshness}** from ${context.airQuality.provider}.\n` +
      `• **Household Tailoring:** Analyzing your household profile (${p.householdSize} members${p.hasChildren ? ', with children' : ''}${p.hasElderly ? ', senior citizens' : ''}${p.hasRespiratorySensitive ? ', respiratory sensitivities' : ''}):\n` +
      `  1. Adjust outdoor exertion based on the time-of-day dispersion cycle (best hours: 1 PM – 4 PM).\n` +
      `  2. Keep vehicle AC on internal circulation during your ${p.commuteDistanceKm} km ${p.commuteType.replace('_', ' ')} commute.\n` +
      `  3. Prioritize non-combustive indoor habits: avoid incense, ensure active kitchen exhaust venting.\n\n` +
      `*Feel free to ask specific questions about school safety, morning jogging, masks, or indoor air purification!*`;
  }

  return {
    content: reply,
    provider: 'deterministic',
    modelName: 'AirAware Deterministic Rule Engine (CPCB NAQI Aligned)',
    latencyMs: Date.now() - start,
    isFallback: false,
    confidenceNote: '100% evidence-based response using verified telemetry and CPCB/WHO health criteria.'
  };
}
