# BUILD STATUS — AirAware AI

**Last Updated:** November 2026 (WebLLM removed → Gemini Cloud AI + first-visit product tour)  
**Overall Status:** Production ready for Vercel (Gemini key required for conversational AI)  
**Deployment Target:** Vercel (Serverless Functions + static Vite build)  
**Automated Test Suite:** 35/35 passing (`npx tsx tests/intelligence.test.ts`)  
**Vulnerability Audit:** 0 vulnerabilities (`npm audit`)  
**Production Build:** `npm run build` passes (TypeScript + Vite)

---

## 1. Local inference removed

WebLLM/WebGPU is no longer part of the application.

- `@mlc-ai/web-llm` uninstalled; `webllm-provider.ts`, `web-llm.d.ts` and the model-loading UI deleted.
- No model download, GPU detection, cache management, progress screens or initialization gates remain.
- The assistant opens instantly and the dashboard never waits on an AI model.

## 2. Gemini Cloud AI (server-side)

`POST /api/airaware-chat` — implemented in `api/airaware-chat.ts` with the official `@google/genai` SDK.

| Concern | Implementation |
|---|---|
| Secret handling | `process.env.GEMINI_API_KEY`, server only. Never `VITE_`, never in the bundle, never logged or returned. |
| Model | `GEMINI_MODEL` (default `gemini-3.8-flash`); `GEMINI_FALLBACK_MODEL` (default `gemini-3.5-flash`) on 503 UNAVAILABLE or 429. Free-tier quota is per model, per day, so the second model is a real second bucket. No paid-model switching. |
| Output control | `GEMINI_MAX_OUTPUT_TOKENS` (default 1024), temperature 0.4. |
| Timeout | 22s server-side SDK timeout + 25s client abort, retry offered to the user. |
| Input validation | JSON body required, message 1–1500 chars, history capped at 6 turns, pollutants capped at 8, all context fields coerced and length-limited. |
| Rate limiting | Best-effort in-memory limiter: 8 requests / 60s per client IP. Per-instance only (see limitations). |
| Error mapping | 429 → `quota_exhausted` / `rate_limited`; 401/403 or invalid-key 400 → safe `misconfigured` (logged, no secret); 5xx → `upstream_unavailable`; timeout/504 → `timeout`; bad input → 400. |
| Prompt safety | System instruction forbids invented readings, guarantees, diagnoses, ozone generators, plant-as-HEPA claims and exercise advice without readings; distinguishes station observations from modelled estimates and flags stale/unavailable data. |
| Grounding | Real app data only: location/region, AQI + category + classification, pollutants with units/sub-indices/modelled flags, station name/distance, timestamp, freshness, weather, household flags, and existing rules-engine guidance. No names, no GPS coordinates. |

Frontend path: `AIChatDrawer` → `askAirAwareAI` → `askGemini` → function. On any failure the drawer shows a labelled notice with **Retry**, and the deterministic CPCB engine produces the answer — never presented as Gemini output.

## 3. Onboarding tour

`src/components/onboarding/ProductTour.tsx` — 8-step spotlight tour (Welcome, AQI, Daily routine, Indoor air, Cleaner swaps, AI assistant, Impact, Ready).

- Four-panel overlay produces a true cutout with an animated emerald glow ring; the real component stays visible.
- Switches to the required tab (and opens the assistant) before spotlighting, polls for the element, scrolls it into view, and keeps the ring synced on scroll/resize.
- Card: title, description, "Why it matters", "Try this", step count, progress bar, Previous / Next / Skip Tour; bottom-sheet layout below 640px; card clamped to the viewport; Arrow keys and Escape supported.
- Persistence in `localStorage` (`airaware_tour_status`); first visit only. Footer **Take a Tour** replays from step 1. Skip always closes immediately and returns to the dashboard.

## 4. Verification performed (25 Nov 2026)

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Pass |
| `npm run build` | Pass (~6s) |
| `npx tsx tests/intelligence.test.ts` | 35 passed, 0 failed |
| Function: non-POST request | 405 |
| Function: broken JSON / empty message | 400 / 400 |
| Function: missing `GEMINI_API_KEY` | 503 `not_configured` |
| Function: invalid credentials | 503 `misconfigured`, response contains no key |
| Function: 9 rapid requests, one IP | 9th → 429 `rate_limited` |
| **Live Gemini request** (real key, real telemetry, AQI 132 Mumbai) | **200**, grounded answer quoting the supplied AQI |
| **Live follow-up** (history included) | **200**, used the prior turn |
| **Live stale-data turn** (AQI unavailable) | **200**, explicitly stated data unavailable |
| Function over HTTP through a local dev host (`/api/airaware-chat`; verified before the Vercel port, same handler) | **200** via `gemini-3.5-flash`: because free-tier quota is per model per day, `gemini-3.8-flash` returned 429 and the configured fallback model answered a complete, grounded reply |
| Chat UI: send, fallback notice, retry | Drawer opens instantly; fallback answer labelled "Verified CPCB engine (AI unavailable)"; quota notice + working Retry |
| Tour steps 1–8 | Each step spotlights the correct live component; steps 4/5/7 switch tabs, step 6 opens the assistant |
| Tour skip | Overlay removed, dashboard interactive, `airaware_tour_status` = `skipped` |
| Returning visitor | Reload does **not** re-open the tour |
| Tour layout | 380px floating card ≥640px wide; bottom-sheet card below 640px; always inside the viewport |
| Frontend bundle secret scan | `grep -rl "AIza" dist/` → 0 files |

## 5. Known limitations

- **Model availability:** on 25 Nov 2026 `gemini-3.8-flash` and `gemini-3.7-flash` returned `503 UNAVAILABLE` ("high demand") for this key; `gemini-3.5-flash` answered in ~1.5s and served the successful live calls via the configured fallback. Set `GEMINI_MODEL` / `GEMINI_FALLBACK_MODEL` to whatever your project's free tier serves.
- **Free-tier quota:** the key used for verification exhausted its Gemini free-tier quota during testing. Afterwards the endpoint correctly returned 429 `quota_exhausted` and the UI showed the labelled CPCB fallback with Retry. Live answers resume when the quota window resets; no paid tier is enabled automatically.
- **Rate limiting is per function instance.** Vercel may run several instances, so the effective limit can be higher than 8/min/site. Add a durable store (e.g. Vercel KV / Upstash Redis) before high-traffic public launch.
- **No streaming:** answers arrive as one response; the UI shows a typing indicator instead.
- **`npm run dev` (Vite only) exposes no functions**, so chat deliberately falls back with a message telling the developer to use `vercel dev`.
- Tour persistence is local to the browser; there is no user account to sync it with.
- Evaluator scenarios remain simulated fixtures and are labelled as such in the AI context.

## 6. Deployment checklist

1. Vercel → Project → Settings → Environment Variables: `GEMINI_API_KEY` (required), optionally `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`, `GEMINI_MAX_OUTPUT_TOKENS`.
2. `GEMINI_API_KEY` must never be committed or prefixed with `VITE_`. `.env` is gitignored; `.env.example` holds placeholders only.
3. Redeploy after adding secrets so the function receives `process.env`.
4. Smoke test `/api/airaware-chat` with the curl example in README §7.
5. `grep -r "AIza" dist/` must return nothing.
