import { AirAwareContext, AIResponse } from '../../types/ai.ts';

export async function runGeminiProxyAI(
  context: AirAwareContext,
  userPrompt: string
): Promise<AIResponse> {
  const start = Date.now();

  const systemInstruction = `You are AirAware AI, an expert, empathetic, evidence-based environmental intelligence assistant.
Your mission is to help Indian families and professionals navigate urban air pollution with practical, personalized advice.

STRICT CONSTRAINTS:
1. NEVER fabricate or guess AQI readings or pollutant values. Use ONLY the environmental context provided below.
2. If data is missing or stale, explicitly state so.
3. NEVER claim to measure indoor air quality without a connected indoor sensor; clarify that indoor advice is hazard-mitigation assessment.
4. Distinguish live measurements from general environmental knowledge.
5. DO NOT provide medical diagnoses or make curative guarantees. Emphasize precautionary lifestyle guidance.
6. Keep answers concise, actionable, and structured with bullet points.

CURRENT ENVIRONMENTAL & HOUSEHOLD CONTEXT:
- Location: ${context.airQuality.location}, ${context.airQuality.country}
- Verified AQI: ${context.airQuality.aqi || 'Unavailable'} (${context.airQuality.aqiCategory || 'Unknown'})
- Prominent Pollutant: ${context.airQuality.prominentPollutant || 'N/A'}
- Telemetry Source: ${context.airQuality.provider} (Freshness: ${context.airQuality.freshness})
- Last Updated: ${context.airQuality.lastUpdated || 'N/A'}
- Pollutant Concentrations:
  ${context.airQuality.pollutants.map(p => `* ${p.name} (${p.chemicalFormula}): ${p.available ? `${p.value} ${p.unit} (Sub-index: ${p.subIndex ?? 'N/A'})` : 'Unavailable'}`).join('\n  ')}
- Weather: ${context.weather ? `${context.weather.temperatureC}°C, Humidity: ${context.weather.humidityPercent}%, Wind: ${context.weather.windSpeedKmh} km/h, Ventilation: ${context.weather.ventilationIndex}` : 'Weather unavailable'}
- Household Profile:
  * Size: ${context.profile.householdSize}
  * Has Children: ${context.profile.hasChildren ? `Yes (Ages: ${context.profile.childrenAges || 'N/A'})` : 'No'}
  * Has Senior Citizens: ${context.profile.hasElderly ? 'Yes' : 'No'}
  * Has Respiratory Sensitivities: ${context.profile.hasRespiratorySensitive ? 'Yes' : 'No'}
  * Commute: ${context.profile.commuteType} (${context.profile.commuteDistanceKm} km)
  * Outdoor Exercise: ${context.profile.outdoorExerciseTime}
  * Air Purifier: ${context.profile.hasAirPurifier ? 'Installed' : 'None'}`;

  const res = await fetch('/api/gemini-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: userPrompt,
      systemInstruction
    })
  });

  if (!res.ok) {
    throw new Error(`Gemini function error: ${res.status}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(data.details || data.error);
  }

  return {
    content: data.reply,
    provider: 'gemini',
    modelName: 'Gemini 1.5 Flash (Serverless)',
    latencyMs: Date.now() - start,
    isFallback: false
  };
}
