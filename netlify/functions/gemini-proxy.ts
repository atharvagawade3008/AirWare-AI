// Netlify Serverless Function: Protected Gemini Proxy
// Keeps GEMINI_API_KEY secure on the server side

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 503,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Cloud AI service unconfigured',
        details: 'GEMINI_API_KEY is not set in environment variables. Falling back to deterministic intelligence.'
      })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { prompt, systemInstruction } = body;

    if (!prompt) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Missing prompt' })
      };
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const payload: any = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 600
      }
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      return {
        statusCode: res.status,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: `Gemini API error: ${res.status}`, details: errText })
      };
    }

    const data = await res.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ reply })
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'AI Proxy processing failure', message: error.message })
    };
  }
}
