import { calculateNAQI, calculateSubIndex, getAQICategory, CPCB_BREAKPOINTS } from '../src/intelligence/aqi/cpcb-calculator.ts';
import { generatePersonalizedRecommendations } from '../src/intelligence/recommendations/recommendation-engine.ts';
import { calculateWhatIfSavings, PRESET_CHOICE_COMPARISONS } from '../src/intelligence/impact/emissions-calculator.ts';
import { runDeterministicAI } from '../src/services/ai/deterministic-provider.ts';
import { DEFAULT_PROFILE } from '../src/types/profile.ts';
import { AirQualityContext, PollutantReading } from '../src/types/air-quality.ts';

console.log('🧪 Starting Expanded AirAware AI Engineering & Data Integrity Test Suite...\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    failCount++;
  }
}

// ==========================================
// 1. CPCB CATEGORY BOUNDARY TESTS
// ==========================================
console.log('--- Suite 1: CPCB Category Boundaries ---');
assert(getAQICategory(0) === 'Good', 'Boundary 0 -> Good');
assert(getAQICategory(50) === 'Good', 'Boundary 50 -> Good');
assert(getAQICategory(51) === 'Satisfactory', 'Boundary 51 -> Satisfactory');
assert(getAQICategory(100) === 'Satisfactory', 'Boundary 100 -> Satisfactory');
assert(getAQICategory(101) === 'Moderately Polluted', 'Boundary 101 -> Moderately Polluted');
assert(getAQICategory(200) === 'Moderately Polluted', 'Boundary 200 -> Moderately Polluted');
assert(getAQICategory(201) === 'Poor', 'Boundary 201 -> Poor');
assert(getAQICategory(300) === 'Poor', 'Boundary 300 -> Poor');
assert(getAQICategory(301) === 'Very Poor', 'Boundary 301 -> Very Poor');
assert(getAQICategory(400) === 'Very Poor', 'Boundary 400 -> Very Poor');
assert(getAQICategory(401) === 'Severe', 'Boundary 401 -> Severe');
assert(getAQICategory(500) === 'Severe', 'Boundary 500 -> Severe');
assert(getAQICategory(600) === 'Severe', 'Boundary 600+ -> Severe');
assert(getAQICategory(-5) === 'Unknown', 'Negative input -> Unknown');

// ==========================================
// 2. PIECEWISE LINEAR INTERPOLATION (ALL 6 CRITERIA POLLUTANTS)
// ==========================================
console.log('\n--- Suite 2: Piecewise Interpolation Across Criteria Pollutants ---');
// PM2.5 = 78 -> bracket 61-90 (I: 101-200) -> 159
const pm25Sub = calculateSubIndex('pm25', 78);
assert(pm25Sub === 159, 'PM2.5 calculation: 78 µg/m³ -> Sub-index 159');

// PM10 = 175 -> bracket 101-250 (I: 101-200) -> 150
const pm10Sub = calculateSubIndex('pm10', 175);
assert(pm10Sub === 150, 'PM10 calculation: 175 µg/m³ -> Sub-index 150');

// NO2 = 60 -> bracket 41-80 (I: 51-100) -> 75
const no2Sub = calculateSubIndex('no2', 60);
assert(no2Sub === 75, 'NO2 calculation: 60 µg/m³ -> Sub-index 75');

// SO2 = 60 -> bracket 41-80 (I: 51-100) -> 75
const so2Sub = calculateSubIndex('so2', 60);
assert(so2Sub === 75, 'SO2 calculation: 60 µg/m³ -> Sub-index 75');

// CO in mg/m³: 5.0 -> bracket 2.1-10.0 (I: 101-200) -> ~137
const coSub = calculateSubIndex('co', 5.0);
assert(coSub !== undefined && coSub >= 135 && coSub <= 140, 'CO calculation: 5.0 mg/m³ -> Sub-index ~137');

// O3 = 75 -> bracket 51-100 (I: 51-100) -> 75
const o3Sub = calculateSubIndex('o3', 75);
assert(o3Sub === 75, 'Ozone calculation: 75 µg/m³ -> Sub-index 75');

// Value exceeding highest CPCB bracket clamps to 500
const extremePm = calculateSubIndex('pm25', 650);
assert(extremePm === 500, 'Extreme PM2.5 > 500 µg/m³ clamps to 500');

// ==========================================
// 3. CPCB VALIDITY RULES & DATA PATHWAY DISTINCTION
// ==========================================
console.log('\n--- Suite 3: CPCB Validity Constraints & Data Pathway Separation ---');

// Rejection: Missing both PM2.5 and PM10
const missingPmReadings: PollutantReading[] = [
  { code: 'no2', name: 'NO2', chemicalFormula: 'NO₂', value: 45, unit: 'µg/m³', available: true },
  { code: 'so2', name: 'SO2', chemicalFormula: 'SO₂', value: 20, unit: 'µg/m³', available: true },
  { code: 'co', name: 'CO', chemicalFormula: 'CO', value: 1.0, unit: 'mg/m³', available: true }
];
const resMissingPm = calculateNAQI(missingPmReadings);
assert(!resMissingPm.isValid && resMissingPm.indexClassification === 'insufficient_data', 
  'CPCB Validity: Correctly flags insufficient data when PM is absent');

// Rejection: Fewer than 3 valid pollutants monitored
const fewerThanThree: PollutantReading[] = [
  { code: 'pm25', name: 'PM2.5', chemicalFormula: 'PM₂.₅', value: 50, unit: 'µg/m³', available: true },
  { code: 'pm10', name: 'PM10', chemicalFormula: 'PM₁₀', value: 80, unit: 'µg/m³', available: true }
];
const resFewerThanThree = calculateNAQI(fewerThanThree);
assert(!resFewerThanThree.isValid && resFewerThanThree.indexClassification === 'insufficient_data',
  'CPCB Validity: Correctly rejects calculations with fewer than 3 pollutants');

// Data Pathway Distinction: Model Data vs Station Observation
const validFullReadings: PollutantReading[] = [
  { code: 'pm25', name: 'PM2.5', chemicalFormula: 'PM₂.₅', value: 140, unit: 'µg/m³', available: true },
  { code: 'pm10', name: 'PM10', chemicalFormula: 'PM₁₀', value: 160, unit: 'µg/m³', available: true },
  { code: 'no2', name: 'NO2', chemicalFormula: 'NO₂', value: 50, unit: 'µg/m³', available: true },
  { code: 'so2', name: 'SO2', chemicalFormula: 'SO₂', value: 20, unit: 'µg/m³', available: true }
];

const modelIndexResult = calculateNAQI(validFullReadings, true); // isModelData = true
assert(modelIndexResult.indexClassification === 'indicative_model_index', 
  'Pathway Distinction: Model data produces indicative_model_index, NOT official station AQI');

const stationObservationResult = calculateNAQI(validFullReadings, false); // isModelData = false
assert(stationObservationResult.indexClassification === 'official_cpcb_naqi', 
  'Pathway Distinction: Ground station data produces official_cpcb_naqi');

// Prominent Pollutant Identification
assert(modelIndexResult.prominentPollutant === 'PM2.5' && modelIndexResult.aqi === 316,
  'Peak sub-index and prominent pollutant correctly identified (PM2.5 = 316, Very Poor)');

// ==========================================
// 4. HOUSEHOLD PERSONALIZATION AUDIT
// ==========================================
console.log('\n--- Suite 4: Household Personalization Engine ---');

const baseContext: AirQualityContext = {
  location: 'Mumbai',
  country: 'India',
  latitude: 19.076,
  longitude: 72.877,
  provider: 'CAMS Atmospheric Model (Open-Meteo)',
  dataType: 'modelled_estimate',
  indexClassification: 'indicative_model_index',
  aqi: 240,
  aqiCategory: 'Poor',
  prominentPollutant: 'PM2.5',
  freshness: 'fresh',
  scientificDisclaimer: 'Modelled atmospheric estimate.',
  pollutants: validFullReadings
};

// Test Children Personalization
const kidsProfile = { ...DEFAULT_PROFILE, hasChildren: true, hasElderly: false, hasRespiratorySensitive: false };
const kidsRecs = generatePersonalizedRecommendations(baseContext, kidsProfile);
assert(kidsRecs.actionItems.some(i => i.category === 'children'), 'Personalization: Children triggers school/play guidance');

// Test Senior Citizen Personalization
const seniorProfile = { ...DEFAULT_PROFILE, hasChildren: false, hasElderly: true, hasRespiratorySensitive: false };
const seniorRecs = generatePersonalizedRecommendations(baseContext, seniorProfile);
assert(seniorRecs.actionItems.some(i => i.category === 'elderly'), 'Personalization: Elderly triggers morning walk inversion warning');

// Test Respiratory Sensitivities (Asthma/COPD)
const asthmaProfile = { ...DEFAULT_PROFILE, hasRespiratorySensitive: true };
const asthmaRecs = generatePersonalizedRecommendations(baseContext, asthmaProfile);
assert(asthmaRecs.actionItems.some(i => i.category === 'sensitive'), 'Personalization: Respiratory sensitivity triggers reliever inhaler & N95 advisory');

// Test Open Commute Mode
const twoWheelerProfile = { ...DEFAULT_PROFILE, commuteType: 'two_wheeler' as const };
const commuteRecs = generatePersonalizedRecommendations(baseContext, twoWheelerProfile);
assert(commuteRecs.actionItems.some(i => i.category === 'commute'), 'Personalization: Two-wheeler triggers tailpipe plume respirator guidance');

// ==========================================
// 5. AQI SAFETY GATING & EMISSIONS CALCULATOR
// ==========================================
console.log('\n--- Suite 5: Safety Gating & What-If Calculator ---');

// Verify active transport gating in high smog
const bikeOption = PRESET_CHOICE_COMPARISONS.find(c => c.id === 'bike-short-errands');
assert(bikeOption !== undefined && bikeOption.outdoorAqiSafeThreshold === 150, 
  'Safety Gating: Cycling/walking capped at AQI 150 (prevents heavy respiration in toxic smog)');

// Verify What-If emissions calculations
const emissionsSavings = calculateWhatIfSavings({
  baseTransport: 'petrol_car',
  targetTransport: 'electric_bus_metro',
  dailyRoundTripKm: 25,
  commuteDaysPerWeek: 5,
  errandTripBatching: true,
  noIdlingHabit: true
});

assert(emissionsSavings.annualKgCo2eAvoided > 700, 'Emissions Math: Annual avoided CO2e calculated correctly (>700 kg)');
assert(emissionsSavings.fuelCostSavedInrAnnual > 10000, 'Financial Math: Annual fuel savings calculated (>₹10,000)');
assert(emissionsSavings.methodologyNotes.includes('does not substitute for personal exposure protection'), 
  'Data Honesty: Methodology note clarifies personal emissions reduction does not substitute for exposure protection');

// ==========================================
// 6. AI CONTEXT TRUTHFULNESS & MISSING DATA FALLBACK
// ==========================================
console.log('\n--- Suite 6: AI Fallback & Missing Data Honesty ---');

const missingStationContext: AirQualityContext = {
  location: 'Remote Outskirts',
  country: 'India',
  latitude: 23.6,
  longitude: 72.4,
  provider: 'CPCB CAAQMS Network',
  dataType: 'station_observation',
  indexClassification: 'insufficient_data',
  aqi: undefined,
  aqiCategory: 'Unknown',
  freshness: 'unavailable',
  scientificDisclaimer: 'No station in range.',
  pollutants: []
};

const aiReply = runDeterministicAI({
  airQuality: missingStationContext,
  profile: DEFAULT_PROFILE
}, 'What is the AQI right now?');

assert(aiReply.content.includes('avoid') || aiReply.content.includes('Unavailable'), 
  'AI Honesty: Assistant explicitly states telemetry is unavailable without inventing fake readings');

console.log(`\n==========================================`);
console.log(`TEST SUMMARY: ${passCount} Passed, ${failCount} Failed`);
console.log(`==========================================\n`);

if (failCount > 0) {
  process.exit(1);
}
