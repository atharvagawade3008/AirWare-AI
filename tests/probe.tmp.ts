import { readFileSync } from 'node:fs';
import { GoogleGenAI } from '@google/genai';

for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match && match[2].trim()) process.env[match[1]] = match[2].trim();
}

const redact = (value: unknown) => String(value).replace(/AIza[0-9A-Za-z_-]+/g, '[redacted]');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

try {
  const res = await ai.models.generateContent({ model, contents: 'Reply with the single word: OK' });
  console.log('SUCCESS model=', model, 'text=', JSON.stringify(res.text));
} catch (error: any) {
  console.log('STATUS', error?.status ?? error?.statusCode ?? error?.code);
  console.log('ERROR', redact(error?.message || error).slice(0, 900));
}

try {
  const list = await ai.models.list();
  const names: string[] = [];
  for await (const m of list) {
    if (m.name && /gemini-3|gemini-2\.5-flash/.test(m.name)) names.push(m.name);
  }
  console.log('MODELS', names.slice(0, 12).join(', ') || 'none matched');
} catch (error: any) {
  console.log('LIST_ERROR', redact(error?.message || error).slice(0, 400));
}
