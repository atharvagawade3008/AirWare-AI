// Vercel Serverless Function: Protected OpenAQ v3 Proxy
// Keeps OPENAQ_API_KEY secure on the server side.
// Equivalent to netlify/functions/openaq-proxy.ts, rewritten for Vercel.

import type { VercelRequest, VercelResponse } from '@vercel/node';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  'Content-Type': 'application/json',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers on every response
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.OPENAQ_API_KEY;
  if (!apiKey) {
    // No key — tell the client to fall back to Open-Meteo
    return res.status(503).json({
      error: 'OpenAQ API key not configured',
      details:
        'Using verified CAMS atmospheric model estimates via Open-Meteo as primary source.',
    });
  }

  const lat = req.query.lat as string | undefined;
  const lon = req.query.lon as string | undefined;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'lat and lon parameters are required' });
  }

  // Basic bounds check — prevents SSRF via crafted coordinates
  const latN = parseFloat(lat);
  const lonN = parseFloat(lon);
  if (
    isNaN(latN) ||
    isNaN(lonN) ||
    latN < -90 ||
    latN > 90 ||
    lonN < -180 ||
    lonN > 180
  ) {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }

  try {
    const url = `https://api.openaq.org/v3/locations?coordinates=${latN},${lonN}&radius=25000&limit=3`;
    const upstream = await fetch(url, {
      headers: {
        'X-API-Key': apiKey,
        'User-Agent': 'AirAwareAI/1.0',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!upstream.ok) {
      return res
        .status(upstream.status)
        .json({ error: `OpenAQ returned ${upstream.status}` });
    }

    const data = await upstream.json();
    return res.status(200).json(data);
  } catch (err: any) {
    console.error('[openaq-proxy] upstream error:', err?.message);
    return res.status(500).json({ error: 'OpenAQ proxy failure', message: err.message });
  }
}
