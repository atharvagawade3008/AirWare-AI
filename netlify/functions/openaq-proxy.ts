// Netlify Serverless Function: Protected OpenAQ v3 Proxy
// Keeps OPENAQ_API_KEY secure on the server side

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  'Content-Type': 'application/json'
};

export async function handler(event: any) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const apiKey = process.env.OPENAQ_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 503,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'OpenAQ API key not configured',
        details: 'Using verified CAMS atmospheric model estimates via Open-Meteo as primary source.'
      })
    };
  }

  const lat = event.queryStringParameters?.lat;
  const lon = event.queryStringParameters?.lon;

  if (!lat || !lon) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'lat and lon parameters are required' })
    };
  }

  try {
    const url = `https://api.openaq.org/v3/locations?coordinates=${lat},${lon}&radius=25000&limit=3`;
    const res = await fetch(url, {
      headers: {
        'X-API-Key': apiKey,
        'User-Agent': 'AirAwareAI/1.0'
      }
    });

    if (!res.ok) {
      return {
        statusCode: res.status,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: `OpenAQ returned ${res.status}` })
      };
    }

    const data = await res.json();
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(data)
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'OpenAQ proxy failure', message: err.message })
    };
  }
}
