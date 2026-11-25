import { readFileSync } from 'node:fs';

// Load local secrets exactly the way Netlify does, without ever printing them.
try {
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && match[2].trim()) process.env[match[1]] = match[2].trim();
  }
} catch {
  console.log('NO_LOCAL_ENV_FILE');
}

const { handler } = await import('../netlify/functions/airaware-chat.ts');

const context = {
  location: 'Mumbai',
  region: 'Maharashtra',
  standard: 'Indian CPCB NAQI',
  aqi: 132,
  aqiCategory: 'Moderately Polluted',
  indexClassification: 'indicative_model_index',
  dataType: 'modelled_estimate',
  prominentPollutant: 'PM2.5',
  pollutants: [
    { name: 'PM2.5 (Fine Particulate)', value: 62.4, unit: 'µg/m³', subIndex: 132, available: true, modelled: true },
    { name: 'PM10', value: 118.0, unit: 'µg/m³', subIndex: 108, available: true, modelled: true }
  ],
  lastUpdated: new Date().toISOString(),
  freshness: 'fresh',
  weather: { temperatureC: 31, humidityPercent: 64, windSpeedKmh: 8, weatherDescription: 'Hazy', ventilationIndex: 'Moderate' },
  household: {
    householdSize: 4,
    children: true,
    elderly: false,
    respiratorySensitive: false,
    hasAirPurifier: false,
    cookingFuel: 'piped_gas',
    commuteType: 'public_transit',
    commuteDistanceKm: 12,
    outdoorExerciseTime: 'morning'
  },
  existingGuidance: {
    headline: 'Moderately polluted air today',
    summary: 'Sensitive groups should limit prolonged outdoor exertion.',
    topActions: ['Cap outdoor play to 45 minutes'],
    routine: ['Morning: outdoor play before 8 AM']
  }
};

const post = (body: unknown, ip = '203.0.113.7') =>
  handler({
    httpMethod: 'POST',
    headers: { 'x-nf-client-connection-ip': ip },
    body: JSON.stringify(body)
  });

console.log('--- validation: GET ---');
console.log((await handler({ httpMethod: 'GET', headers: {} })).statusCode);

console.log('--- validation: broken JSON ---');
console.log((await handler({ httpMethod: 'POST', headers: {}, body: '{oops' })).statusCode);

console.log('--- validation: empty message ---');
console.log((await post({ message: '   ', context })).statusCode);

if (!process.env.GEMINI_API_KEY) {
  console.log('SKIP_LIVE_CALL: no key available');
} else {
  console.log('--- live call 1 ---');
  const first = await post({ message: 'Is it safe for my children to play outside today? My daughter is 7.', history: [], context });
  console.log('status', first.statusCode);
  const parsed = JSON.parse(first.body);
  console.log('model', parsed.model);
  console.log('reply', String(parsed.reply || parsed.error).slice(0, 700));

  if (first.statusCode === 200) {
    console.log('--- live follow-up ---');
    const second = await post({
      message: 'And what about tomorrow morning for her school walk?',
      history: [
        { role: 'user', content: 'Is it safe for my children to play outside today? My daughter is 7.' },
        { role: 'assistant', content: parsed.reply }
      ],
      context
    });
    console.log('status', second.statusCode);
    console.log('reply', String(JSON.parse(second.body).reply || JSON.parse(second.body).error).slice(0, 700));
  }

  console.log('--- stale-data transparency ---');
  const stale = await post({
    message: 'What is the AQI right now?',
    history: [],
    context: { ...context, aqi: undefined, freshness: 'unavailable', lastUpdated: undefined }
  });
  console.log('status', stale.statusCode);
  console.log('reply', String(JSON.parse(stale.body).reply || JSON.parse(stale.body).error).slice(0, 500));
}

console.log('--- invalid credentials mapping ---');
const realKey = process.env.GEMINI_API_KEY;
process.env.GEMINI_API_KEY = 'invalid-key-for-test';
const badKey = await post({ message: 'Hello', history: [], context }, '203.0.113.8');
console.log('status', badKey.statusCode, 'code', JSON.parse(badKey.body).code);
console.log('leaks key?', badKey.body.includes('invalid-key-for-test'));
if (realKey) process.env.GEMINI_API_KEY = realKey;

console.log('--- rate limiting (>8/min from one IP) ---');
process.env.GEMINI_API_KEY = '';
for (let i = 0; i < 9; i++) {
  const r = await handler({
    httpMethod: 'POST',
    headers: { 'x-nf-client-connection-ip': '198.51.100.9' },
    body: JSON.stringify({ message: 'hi', context })
  });
  if (r.statusCode === 429) {
    console.log('rate limited at request', i + 1, JSON.parse(r.body).code);
    break;
  }
  if (i === 8) console.log('NOT_RATE_LIMITED');
}
