import type { OutdoorAirContext, QuestionnaireAnswers } from '../src/types/indoor';

/**
 * Household scenarios used by the test suite. Answers are plain questionnaire
 * responses — no sensor readings anywhere.
 */

/** Scenario A — gas cooking, no kitchen exhaust, frequent mosquito coils. */
export const scenarioA: QuestionnaireAnswers = {
  cookingFuel: 'lpg',
  kitchenExhaust: 'none',
  smokeSpread: 'often',
  kitchenVentilation: 'poor',
  indoorSmoking: 'none',
  incenseCoils: 'frequently',
  candles: 'none',
  cleaningFrequency: 'weekly',
  visibleDust: 'sometimes',
  carpetsCurtains: 'some',
  pets: 'none',
  dampness: 'no',
  mould: 'no',
  leakage: 'no',
  windowOpening: 'fewTimesWeek',
  windowSafety: 'safe',
  ventilationRestriction: 'none',
  airPurifier: 'none',
  filterMaintenance: 'irregular',
};

/** Scenario B — well-ventilated apartment, no indoor combustion, no dampness. */
export const scenarioB: QuestionnaireAnswers = {
  cookingFuel: 'electric',
  kitchenExhaust: 'chimney',
  smokeSpread: 'never',
  kitchenVentilation: 'good',
  indoorSmoking: 'none',
  incenseCoils: 'none',
  candles: 'none',
  cleaningFrequency: 'daily',
  visibleDust: 'no',
  carpetsCurtains: 'none',
  pets: 'none',
  dampness: 'no',
  mould: 'no',
  leakage: 'no',
  windowOpening: 'daily',
  windowSafety: 'safe',
  ventilationRestriction: 'none',
  airPurifier: 'hepaMaintained',
  filterMaintenance: 'regular',
};

/** Scenario C — visible dampness, mould, heavy dust and poor ventilation. */
export const scenarioC: QuestionnaireAnswers = {
  cookingFuel: 'pipedGas',
  kitchenExhaust: 'none',
  smokeSpread: 'sometimes',
  kitchenVentilation: 'poor',
  indoorSmoking: 'none',
  incenseCoils: 'none',
  candles: 'none',
  cleaningFrequency: 'rarely',
  visibleDust: 'often',
  carpetsCurtains: 'many',
  pets: 'multiple',
  dampness: 'significant',
  mould: 'widespread',
  leakage: 'persistent',
  windowOpening: 'rarely',
  windowSafety: 'restricted',
  ventilationRestriction: 'sealed',
  airPurifier: 'none',
  filterMaintenance: 'never',
};

export const cleanOutdoor: OutdoorAirContext = {
  aqi: 38,
  category: 'Good',
  source: 'Test fixture',
  freshness: 'fresh',
  lastUpdated: '2026-11-24T08:00:00.000Z',
};

export const pollutedOutdoor: OutdoorAirContext = {
  aqi: 186,
  category: 'Poor',
  source: 'Test fixture',
  freshness: 'fresh',
  lastUpdated: '2026-11-24T08:00:00.000Z',
};

export const staleOutdoor: OutdoorAirContext = {
  aqi: 42,
  category: 'Good',
  source: 'Test fixture',
  freshness: 'stale',
  lastUpdated: '2026-11-23T02:00:00.000Z',
};

export const delayedOutdoor: OutdoorAirContext = {
  aqi: 96,
  category: 'Satisfactory',
  source: 'Test fixture',
  freshness: 'delayed',
  lastUpdated: '2026-11-24T06:00:00.000Z',
};

export const unavailableOutdoor: OutdoorAirContext = {
  source: 'Test fixture',
  freshness: 'unavailable',
};
