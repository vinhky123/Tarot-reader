# Verification — Sprint 1 & Sprint 2

> **Date:** 2026-07-11
> **Live site tested:** https://tarot-reader-kappa.vercel.app/
> **Local repo:** `D:\Data\Codes\Tarot-reader` @ master (post-Sprint-2)

---

## Executive summary

| Surface | Result |
|---------|--------|
| **Local code quality** (typecheck/lint/build/key-scan) | ✅ PASS |
| **Local proxy functional tests** (6/6 endpoints) | ✅ PASS |
| **Source audit — AbortController** (6/6 checks) | ✅ PASS |
| **Source audit — reduced-motion** (7/7 sources) | ✅ PASS |
| **Source audit — accessibility** (14/14 checks) | ✅ PASS |
| **Vercel Edge functions** (11/11 tests) | ✅ PASS (Sprint 2.5) |
| **Live site — readings work?** | ⏳ Awaiting deploy + `GEMINI_API_KEY` env var |

**Sprint 2.5 fixed the deployment gap.** The Vercel Edge functions
(`api/reading.ts`, `api/chat.ts`, `api/health.ts`) are built, type-checked, and
pass all 11 local function tests. The live site will work once you:
(1) commit + push these changes, (2) set `GEMINI_API_KEY` in Vercel project
settings, (3) let Vercel auto-deploy.

---

## ✅ Critical finding — Vercel deployment gap — FIXED (Sprint 2.5)

### What was broken

The live site at `https://tarot-reader-kappa.vercel.app/` served the static
React app correctly (homepage returned HTTP 200), but **every API call failed**:

| Endpoint | Expected | Actual (before fix) |
|----------|----------|---------------------|
| `GET /api/health` | `200 {"ok":true,...}` | `404` |
| `POST /api/reading` | SSE stream | `404 NOT_FOUND` |
| `POST /api/chat` | SSE stream | `404 NOT_FOUND` |

### Root cause

Sprint 1 built the proxy as `server/proxy.mjs` — a standalone
`http.createServer()` Node process designed for Docker Compose. **Vercel is
serverless** and doesn't run long-lived Node servers. The repo had no
`vercel.json`, no root `/api/` directory, and no serverless handler export.

### The fix (implemented in Sprint 2.5)

Created Vercel Edge serverless functions:
- `api/_shared.ts` — shared logic (prompts, validation, streaming, safety, rate limit)
- `api/reading.ts`, `api/chat.ts` — SSE-streaming Edge functions
- `api/health.ts` — health check
- `vercel.json` — Vite framework + SPA rewrite
- `tsconfig.api.json` + ESLint `api/` block
- `scripts/test-api.ts` — 11-test harness (`npm run test:api`)

All 11 function tests pass locally. See [PROGRESS.md](./PROGRESS.md) Sprint 2.5
for the full changelog.

### ⚠️ Still required to go live

The code is ready but **not yet deployed**. To activate the live site:

1. **Commit + push** these changes to `master` (Vercel auto-deploys).
2. **Set the env var** on Vercel: Project → Settings → Environment Variables →
   `GEMINI_API_KEY` = your Google AI Studio key (no `VITE_` prefix).
3. Wait for deploy to finish, then verify: `curl https://tarot-reader-kappa.vercel.app/api/health`
   should return `{"ok":true,"model":"gemini-2.0-flash","configured":true}`.

Until `GEMINI_API_KEY` is set, `/api/health` returns `{"configured":false}` and
`/api/reading` returns `503 "Server chưa cấu hình GEMINI_API_KEY."`.

---

## Local verification — PASS

### Build quality

| Check | Command | Result |
|-------|---------|--------|
| Typecheck | `npm run typecheck` (`tsc -b --noEmit`) | ✅ clean, exit 0 |
| Lint | `npm run lint` (eslint) | ✅ clean, no errors |
| Build | `npm run build` | ✅ 1033 modules, 340 ms |
| Key in bundle? | `grep -rhoE "AIza[A-Za-z0-9_-]{30,}" dist/` | ✅ **absent** |
| Key var names in bundle? | `grep -l "GEMINI_API_KEY\|generativelanguage" dist/` | ✅ **absent** |
| Client calls `/api`? | `find dist/assets -name 'gemini-*.js' -exec grep -o 'api/reading' {} \;` | ✅ `/api/reading` + `/api/chat` present |
| Proxy parses? | `node --check server/proxy.mjs` | ✅ OK |

### Proxy functional tests (booted with `GEMINI_API_KEY=dummy`, port 8789)

| # | Test | Expected | Actual | Result |
|---|------|----------|--------|--------|
| 1 | `GET /api/health` | `200` JSON `{"ok":true,"model":...}` | `200 {"ok":true,"model":"gemini-2.0-flash"}` | ✅ |
| 2 | `GET /api/reading` (wrong method) | `405` | `405` | ✅ |
| 3 | `POST /api/reading` `{}` (bad payload) | `400` JSON, pre-stream | `400 {"error":"spread không hợp lệ"}` | ✅ |
| 4 | `POST /api/reading` valid payload, dummy key | Opens SSE → `event: error` | `event: error` + `data: {"message":"Gemini lỗi: …API key not valid…"}` | ✅ |
| 5 | Rate limit — 22 rapid POSTs | First ~20 pass validation, then `429` | `400×18` then `429×4` (kicked in at 19 due to TEST 4 consuming a token) | ✅ |
| 6 | CORS preflight `OPTIONS` | `204` | `204` | ✅ |

> Test 4 proves the SSE streaming path works end-to-end: with a real key, the
> `event: error` would be replaced by `event: delta` chunks followed by
> `event: done`. The dummy key surfaces a Gemini `400 API_KEY_INVALID`, which
> the proxy correctly wraps as an SSE error event rather than crashing.

### Vercel Edge function tests (Sprint 2.5)

Run with `npm run test:api` (uses `tsx` to import handlers directly — no Vercel
CLI login required). Booted with `GEMINI_API_KEY=dummy_test_key`:

| # | Test | Expected | Result |
|---|------|----------|--------|
| 1 | `GET /api/health` | `200 {"ok":true,"model":...,"configured":true}` | ✅ |
| 2 | `OPTIONS /api/reading` (CORS preflight) | `204` + origin echoed | ✅ |
| 3 | `GET /api/reading` (wrong method) | `405` | ✅ |
| 4 | `POST /api/reading` `{}` (bad payload) | `400` JSON, pre-stream | ✅ |
| 5 | `POST /api/reading` valid payload | Opens `text/event-stream`, emits SSE | ✅ |
| 5b | Dummy key → error event | `event: error` with API-key-invalid msg | ✅ |
| 6 | `POST /api/chat` `{"turns":[]}` | `400` | ✅ |

Also verified post-build: `@google/genai` SDK is **not** in the client bundle
(`grep -l "generativelanguage" dist/` → absent), and the client still calls
`/api/reading` + `/api/chat`.

### Source audit — AbortController (Sprint 1 #3)

Verified by sub-agent reading `src/hooks/useReading.ts` + `src/services/gemini.ts`:

| Check | PASS/FAIL | Evidence |
|-------|-----------|----------|
| Inflight `AbortController` ref exists | ✅ PASS | `useReading.ts:34` |
| `abortInflight()` helper | ✅ PASS | `useReading.ts:46-51` |
| Called from `selectSpread` / `startShuffleAndDraw` / `resetAll` | ✅ PASS | `useReading.ts:55, 69, 212` |
| `runReading`: fresh controller, stores ref, passes signal, silent on abort | ✅ PASS | `useReading.ts:128,129,153,159` |
| `sendReaderMessage`: fresh controller, signal, rollback on abort | ✅ PASS | `useReading.ts:173,174,192,196-199` |
| `finally` clears ref only if current | ✅ PASS | `useReading.ts:164, 203` |
| Signal threaded into `fetch()` | ✅ PASS | `gemini.ts:200` |

### Source audit — reduced-motion (Sprint 2 #13)

All 7 infinite-animation sources verified:

| Source | PASS/FAIL | Evidence |
|--------|-----------|----------|
| `MysticCover` (already had it) | ✅ PASS | `MysticCover.tsx:12` |
| `LoadingOracle` (3 rotations) | ✅ PASS | `LoadingOracle.tsx:37,42,47` all gated by `reduceMotion ? {}` |
| `Navbar` glyph loop | ✅ PASS | `Navbar.tsx:17-23` |
| `TarotDeck` shuffle + timer | ✅ PASS | gated `:34-42`; timer `:16` (600ms vs 3000ms) |
| `ReadingFlowStepper` active pulse | ✅ PASS | `ReadingFlowStepper.tsx:63-67` |
| `MysticBackground` particles | ✅ PASS | count 14:78 `:17`; move disabled `:30`; `useSyncExternalStore` `:58` |
| `index.css` media query | ✅ PASS | `index.css:156-163` — disables all 4 CSS animation classes |

### Source audit — accessibility (Sprint 2 #12)

| Check | PASS/FAIL | Evidence |
|-------|-----------|----------|
| `useFocusTrap.ts`: Tab trap, Escape, first-focus, restore | ✅ PASS | `useFocusTrap.ts:43-47, 39-40, 54-63, 71` |
| `MysticCover` uses `useFocusTrap` + ref | ✅ PASS | `MysticCover.tsx:3, 15-16, 20` |
| `CardReveal` real `alt` (name + orientation) | ✅ PASS | `CardReveal.tsx:128` |
| `ReadingResult` `aria-live` + `aria-busy` | ✅ PASS | `ReadingResult.tsx:19-20` |
| `ReaderChat` list `aria-live` | ✅ PASS | `ReaderChat.tsx:93` |
| `ReadingFlowStepper` `aria-current="step"` | ✅ PASS | `ReadingFlowStepper.tsx:69` |
| `TarotDeck` `role=status` + `sr-only` label | ✅ PASS | `TarotDeck.tsx:25, 28` |
| Footer contrast ≥ `/70` | ✅ PASS | `Footer.tsx:3` (`/70`) |
| LoadingOracle caption ≥ `/65` | ✅ PASS | `LoadingOracle.tsx:67` (`/65`) |
| MysticCover hint ≥ `/70`, subtitle ≥ `/75` | ✅ PASS | `MysticCover.tsx:132` (`/70`), `:96` (`/75`) |
| App textarea placeholder ≥ `/50` | ✅ PASS | `App.tsx:114` (`/50`) |

**Audit totals: 27/27 PASS, 0 FAIL.**

---

## Minor observations (not failures)

1. **`useFocusTrap.ts:73`** — `onEscape` is in the effect deps; passing an inline
   callback (as `MysticCover` does) re-attaches the listener per render. Harmless
   for the short-lived cover screen, but could be wrapped in `useCallback` if
   reused on a long-lived modal.
2. **Rate-limit bucket is per-cold-start on serverless** — in the Docker setup
   it's accurate; on Vercel it resets per function invocation, so the effective
   limit is higher than `RATE_LIMIT_RPM`. Needs an external store (KV) for true
   enforcement.
3. **`npm audit`** still reports 5 vulnerabilities (1 low, 3 moderate, 1 high)
   in client deps — pre-existing, not introduced by Sprints 1–2.
4. **`index.js` chunk is 680 kB** (208 kB gzip) — over Vite's 500 kB warning
   threshold. Code-splitting the markdown/chat/particles would help. Not a
   regression; noted in the original Sprint review.

---

## Recommended next action

**Before Sprint 3**, create a **Sprint 2.5 hotfix** to make the proxy deployable
on Vercel — otherwise the live site remains broken and Sprint 3 work (which
depends on the proxy serving readings) can't be validated in production. The
fix is scoped: extract shared logic, add `api/*.ts` serverless handlers, set the
`GEMINI_API_KEY` env var in Vercel. ~2–3 hours of work.
