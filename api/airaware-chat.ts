// Vercel Serverless Function: AirAware AI Chat
// Thin adapter over the shared handler in netlify/functions/airaware-chat.ts so the
// Gemini endpoint, validation, rate limiting and error mapping stay in one place.
// The Gemini API key stays server-side; it is never sent to the browser.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handler } from '../netlify/functions/airaware-chat';

export const config = { maxDuration: 30 };

export default async function airawareChat(req: VercelRequest, res: VercelResponse) {
  const headers: Record<string, string | undefined> = {};
  for (const [name, value] of Object.entries(req.headers)) {
    headers[name.toLowerCase()] = Array.isArray(value) ? value.join(',') : value;
  }

  const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});

  const result = await handler({
    httpMethod: req.method,
    headers,
    body,
    path: '/api/airaware-chat'
  });

  res.status(result.statusCode);
  for (const [name, value] of Object.entries(result.headers || {})) {
    res.setHeader(name, value as string);
  }

  return res.send(result.body);
}
