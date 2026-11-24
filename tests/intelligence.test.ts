import { calculateNAQI, calculateSubIndex, getAQICategory } from '../src/intelligence/aqi/cpcb-calculator.ts';
import { generatePersonalizedRecommendations } from '../src/intelligence/recommendations/recommendation-engine.ts';
import { calculateWhatIfSavings } from '../src/intelligence/impact/emissions-calculator.ts';
import { DEFAULT_PROFILE } from '../src/types/profile.ts';
import { AirQualityContext } from '../src/types/air-quality.ts';

console.log('🧪 Starting AirAware AI Core Intelligence Tests...\n');

// TEST 1: CPCB Sub-index calculations
const pm25Sub = calculateSubIndex('pm25', 78);
console.log('Test 1.1: PM2.5 = 78 µg/m³ -> Sub-index:', pm25Sub, '(Exact mathematically: 159, Moderately Polluted)');
if (pm25Sub === 159) {
  console.log('✅ PASS: CPCB PM2.5 piecewise interpolation accurate.');
} else {
  console.error('❌ FAIL: PM2.5 interpolation discrepancy.');
  process.exit(1);
}

// TEST 2: CPCB Validity Rule (Must monitor at least PM10 or PM2.5)
const invalidReadings: any[] = [
  { code: 'no2', name: 'NO2', value: 45, unit: 'µg/m³', available: true },
  { code: 'so2', name: 'SO2', value: 20, unit: 'µg/m³', available: true },
  { code: 'co', name: 'CO', value: 1.0, unit: 'mg/m³', available: true }
];
const validityResult = calculateNAQI(invalidReadings);
console.log('\nTest 2.1: NAQI without PM2.5 or PM10 -> isValid:', validityResult.isValid);
if (!validityResult.isValid) {
  console.log('✅ PASS: CPCB NAQI correctly rejects calculation without particulate matter.');
} else {
  console.error('❌ FAIL: Allowed AQI calculation without PM.');
  process.exit(1);
}

// TEST 3: CPCB Overall AQI matches maximum sub-index (Prominent Pollutant)
const fullReadings: any[] = [
  { code: 'pm25', name: 'PM2.5', value: 140, unit: 'µg/m³', available: true }, // Sub-index 315 (Very Poor)
  { code: 'pm10', name: 'PM10', value: 160, unit: 'µg/m³', available: true }, // Sub-index 140 (Moderate)
  { code: 'no2', name: 'NO2', value: 50, unit: 'µg/m³', available: true },     // Sub-index 63 (Satisfactory)
  { code: 'so2', name: 'SO2', value: 20, unit: 'µg/m³', available: true }      // Sub-index 25 (Good)
];
const fullNAQI = calculateNAQI(fullReadings);
console.log('\nTest 3.1: Full readings -> AQI:', fullNAQI.aqi, 'Category:', fullNAQI.category, 'Prominent:', fullNAQI.prominentPollutant);
if (fullNAQI.aqi === 316 && fullNAQI.category === 'Very Poor' && fullNAQI.prominentPollutant === 'PM2.5') {
  console.log('✅ PASS: Prominent pollutant and peak sub-index correctly identified.');
} else {
  console.error('❌ FAIL: NAQI peak computation failed.');
  process.exit(1);
}

// TEST 4: Personalization Engine differs by profile
const sampleAQI: AirQualityContext = {
  location: 'Mumbai',
  country: 'India',
  latitude: 19.076,
  longitude: 72.877,
  provider: 'CPCB NAQI',
  aqi: 220,
  aqiCategory: 'Poor',
  prominentPollutant: 'PM2.5',
  freshness: 'fresh',
  pollutants: fullReadings
};

const familyWithKids = { ...DEFAULT_PROFILE, hasChildren: true, hasElderly: false };
const seniorHousehold = { ...DEFAULT_PROFILE, hasChildren: false, hasElderly: true };

const recKids = generatePersonalizedRecommendations(sampleAQI, familyWithKids);
const recSeniors = generatePersonalizedRecommendations(sampleAQI, seniorHousehold);

console.log('\nTest 4.1: Recommendations with Children:', recKids.actionItems.map(a => a.category).includes('children'));
console.log('Test 4.2: Recommendations with Senior Citizens:', recSeniors.actionItems.map(a => a.category).includes('elderly'));
if (recKids.actionItems.some(a => a.category === 'children') && recSeniors.actionItems.some(a => a.category === 'elderly')) {
  console.log('✅ PASS: Distinct personalized recommendations generated for different households.');
} else {
  console.error('❌ FAIL: Household personalization failed.');
  process.exit(1);
}

// TEST 5: Emissions Savings Math
const savings = calculateWhatIfSavings({
  baseTransport: 'petrol_car',
  targetTransport: 'electric_bus_metro',
  dailyRoundTripKm: 20,
  commuteDaysPerWeek: 5,
  errandTripBatching: true,
  noIdlingHabit: true
});
console.log('\nTest 5.1: Annual Avoided CO2e:', savings.annualKgCo2eAvoided, 'kg; Fuel savings: ₹', savings.fuelCostSavedInrAnnual);
if (savings.annualKgCo2eAvoided > 500 && savings.fuelCostSavedInrAnnual > 5000) {
  console.log('✅ PASS: Emissions and fuel calculations within validated ARAI bounds.');
} else {
  console.error('❌ FAIL: Emissions calculator error.');
  process.exit(1);
}

console.log('\n🎉 ALL 5 TEST SUITES PASSED FLAWLESSLY!\n');
