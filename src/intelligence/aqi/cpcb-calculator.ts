import { AQICategory, PollutantReading, PollutantType, IndexClassification } from '../../types/air-quality.ts';

interface Breakpoint {
  cLo: number;
  cHi: number;
  iLo: number;
  iHi: number;
}

// Official CPCB Breakpoints (CPCB 2014 NAQI guidelines - Table 1 & Table 2)
export const CPCB_BREAKPOINTS: Record<PollutantType, Breakpoint[]> = {
  pm10: [
    { cLo: 0, cHi: 50, iLo: 0, iHi: 50 },
    { cLo: 51, cHi: 100, iLo: 51, iHi: 100 },
    { cLo: 101, cHi: 250, iLo: 101, iHi: 200 },
    { cLo: 251, cHi: 350, iLo: 201, iHi: 300 },
    { cLo: 351, cHi: 430, iLo: 301, iHi: 400 },
    { cLo: 431, cHi: 600, iLo: 401, iHi: 500 },
  ],
  pm25: [
    { cLo: 0, cHi: 30, iLo: 0, iHi: 50 },
    { cLo: 31, cHi: 60, iLo: 51, iHi: 100 },
    { cLo: 61, cHi: 90, iLo: 101, iHi: 200 },
    { cLo: 91, cHi: 120, iLo: 201, iHi: 300 },
    { cLo: 121, cHi: 250, iLo: 301, iHi: 400 },
    { cLo: 251, cHi: 500, iLo: 401, iHi: 500 },
  ],
  no2: [
    { cLo: 0, cHi: 40, iLo: 0, iHi: 50 },
    { cLo: 41, cHi: 80, iLo: 51, iHi: 100 },
    { cLo: 81, cHi: 180, iLo: 101, iHi: 200 },
    { cLo: 181, cHi: 280, iLo: 201, iHi: 300 },
    { cLo: 281, cHi: 400, iLo: 301, iHi: 400 },
    { cLo: 401, cHi: 800, iLo: 401, iHi: 500 },
  ],
  o3: [
    { cLo: 0, cHi: 50, iLo: 0, iHi: 50 },
    { cLo: 51, cHi: 100, iLo: 51, iHi: 100 },
    { cLo: 101, cHi: 168, iLo: 101, iHi: 200 },
    { cLo: 169, cHi: 208, iLo: 201, iHi: 300 },
    { cLo: 209, cHi: 748, iLo: 301, iHi: 400 },
    { cLo: 749, cHi: 1000, iLo: 401, iHi: 500 },
  ],
  co: [
    // Note: CO standard breakpoints in mg/m³
    { cLo: 0, cHi: 1.0, iLo: 0, iHi: 50 },
    { cLo: 1.1, cHi: 2.0, iLo: 51, iHi: 100 },
    { cLo: 2.1, cHi: 10.0, iLo: 101, iHi: 200 },
    { cLo: 10.1, cHi: 17.0, iLo: 201, iHi: 300 },
    { cLo: 17.1, cHi: 34.0, iLo: 301, iHi: 400 },
    { cLo: 34.1, cHi: 50.0, iLo: 401, iHi: 500 },
  ],
  so2: [
    { cLo: 0, cHi: 40, iLo: 0, iHi: 50 },
    { cLo: 41, cHi: 80, iLo: 51, iHi: 100 },
    { cLo: 81, cHi: 380, iLo: 101, iHi: 200 },
    { cLo: 381, cHi: 800, iLo: 201, iHi: 300 },
    { cLo: 801, cHi: 1600, iLo: 301, iHi: 400 },
    { cLo: 1601, cHi: 2000, iLo: 401, iHi: 500 },
  ],
};

export function getAQICategory(aqi: number): AQICategory {
  if (aqi < 0 || isNaN(aqi)) return 'Unknown';
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderately Polluted';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
}

export function getAQIColor(category: AQICategory): string {
  switch (category) {
    case 'Good':
      return '#10B981'; // Emerald 500
    case 'Satisfactory':
      return '#84CC16'; // Lime 500
    case 'Moderately Polluted':
      return '#F59E0B'; // Amber 500
    case 'Poor':
      return '#F97316'; // Orange 500
    case 'Very Poor':
      return '#EF4444'; // Red 500
    case 'Severe':
      return '#7F1D1D'; // Maroon 900
    default:
      return '#94A3B8'; // Slate 400
  }
}

/**
 * Calculates pollutant sub-index based on CPCB piecewise linear interpolation:
 * Ip = [ (I_hi - I_lo) / (B_hi - B_lo) ] * (Cp - B_lo) + I_lo
 */
export function calculateSubIndex(pollutant: PollutantType, rawValue: number): number | undefined {
  if (rawValue < 0 || isNaN(rawValue)) return undefined;

  const brackets = CPCB_BREAKPOINTS[pollutant];
  if (!brackets) return undefined;

  // Handle value above highest bracket
  const highest = brackets[brackets.length - 1];
  if (rawValue > highest.cHi) {
    return 500;
  }

  for (const b of brackets) {
    if (rawValue >= b.cLo && rawValue <= b.cHi) {
      const sub = ((b.iHi - b.iLo) / (b.cHi - b.cLo)) * (rawValue - b.cLo) + b.iLo;
      return Math.round(sub);
    }
  }

  return undefined;
}

export interface CPCBCalculationResult {
  aqi?: number;
  category?: AQICategory;
  prominentPollutant?: string;
  subIndices: Record<string, number>;
  isValid: boolean;
  indexClassification: IndexClassification;
  validationReason?: string;
}

/**
 * CPCB Rule Implementation & Pathway Separation:
 * 1. Must monitor at least 3 pollutants.
 * 2. At least ONE of them must be either PM10 or PM2.5.
 * 3. AQI is the maximum of the calculated sub-indices.
 * 
 * Data Pathway Distinction:
 * - If isModelData === true: Output is labeled as 'indicative_model_index'
 *   (Applying CPCB breakpoint math to atmospheric model forecasts, NOT official station AQI).
 * - If isModelData === false: Output is labeled as 'official_cpcb_naqi'
 *   (Valid only when input is physical station monitoring data).
 */
export function calculateNAQI(
  readings: PollutantReading[],
  isModelData: boolean = true
): CPCBCalculationResult {
  const subIndices: Record<string, number> = {};
  let pmCount = 0;
  let validCount = 0;
  let maxSubIndex = -1;
  let prominent = '';

  for (const r of readings) {
    if (!r.available || r.value === undefined || r.value === null || isNaN(r.value)) continue;

    // Normalise CO if provided in µg/m³ to mg/m³
    let val = r.value;
    if (r.code === 'co' && (r.unit.includes('µg') || r.unit.includes('ug') || val > 100)) {
      val = val / 1000;
    }

    const sub = calculateSubIndex(r.code, val);
    if (sub !== undefined) {
      subIndices[r.code] = sub;
      validCount++;

      if (r.code === 'pm10' || r.code === 'pm25') {
        pmCount++;
      }

      if (sub > maxSubIndex) {
        maxSubIndex = sub;
        prominent = r.name;
      }
    }
  }

  // Validity checks per CPCB official methodology
  if (pmCount === 0) {
    return {
      subIndices,
      isValid: false,
      indexClassification: 'insufficient_data',
      validationReason: 'CPCB methodology mandates monitoring of at least PM2.5 or PM10. Insufficient validated data to calculate CPCB AQI.'
    };
  }

  if (validCount < 3) {
    return {
      subIndices,
      isValid: false,
      indexClassification: 'insufficient_data',
      validationReason: `CPCB methodology mandates at least 3 monitored criteria pollutants (found ${validCount}). Insufficient validated data to calculate official CPCB AQI.`
    };
  }

  return {
    aqi: maxSubIndex,
    category: getAQICategory(maxSubIndex),
    prominentPollutant: prominent,
    subIndices,
    isValid: true,
    indexClassification: isModelData ? 'indicative_model_index' : 'official_cpcb_naqi'
  };
}
