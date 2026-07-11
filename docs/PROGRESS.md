# Improvement Progress

Tracks execution of the sprints defined in [`IMPROVEMENT_PLAN.md`](./IMPROVEMENT_PLAN.md).
Each entry records what was done, what was verified, and what (if anything) is deferred.

---

## Sprint 1 — Stop the bleeding — ✅ COMPLETE

**Date:** 2026-07-11
**Goal:** Remove the security ship-blockers and add baseline tooling so the project
can be deployed safely.

### Items delivered

#### #1 🔴 Gemini API key moved server-side — DONE

The key no longer ships to the browser.

- **New:** `server/proxy.mjs` — a dependency-light Node HTTP server that:
  - Holds `GEMINI_API_KEY` as a server-only env var (no `VITE_` prefix → Vite
    never inlines it).
  - Owns the `@google/genai` client and all prompt-building logic (mirrored from
    the client so the client can stay thin).
  - Exposes `POST /api/reading`, `POST /api/chat`, `GET /api/health`.
  - Per-IP token-bucket rate limit (default 20 req/min/IP, configurable via
    `RATE_LIMIT_RPM`), with periodic GC so the bucket map can't grow unbounded.
  - Hard caps: `MAX_BODY_BYTES` (64 KiB), `UPSTREAM_TIMEOUT_MS` (60 s).
  - CORS allowlist via `ALLOWED_ORIGINS` (comma-separated).
  - Strict payload validation (the proxy is the trust boundary — every field is
    checked before touching Gemini).
  - 429 retry-once-with-parsed-wait heuristic carried over from the old client.
- **New:** `server/package.json` + `server/Dockerfile` — proxy gets its own image
  with only `@google/genai` as a dep, runs as non-root `node` user.
- **Modified:** `src/services/gemini.ts` — gutted. Now just prompt-shaping helpers
  + `fetch('/api/reading'|'/api/chat')`. `@google/genai` import removed entirely.
- **Modified:** `vite.config.ts` — dev proxy: `/api` → `http://localhost:8787`.
- **Modified:** `nginx.conf` — production proxy: `location /api/` →
  `http://proxy:8787`, with `X-Forwarded-For`, 90 s read timeout, 96 KiB body cap.
- **Modified:** `docker-compose.yml` — two services: `web` (nginx) + `proxy`
  (Node). The key is passed only to `proxy`, never to `web`.
- **Modified:** `Dockerfile` (web) — `VITE_GEMINI_API_KEY` ARG/ENV removed.
- **Modified:** `.env.example` — documents the new server-only `GEMINI_API_KEY`,
  `GEMINI_MODEL`, `RATE_LIMIT_RPM`, `ALLOWED_ORIGINS`.
- **Modified:** `package.json` — `@google/genai` removed from client deps (moved
  to `server/package.json`). 37 transitive packages dropped from the client bundle.

**New dev command:** `npm run dev:all` runs Vite + the proxy together via
`concurrently`. (`npm run dev:proxy` runs the proxy alone, reading `.env`.)

**Verified:**
- `grep` for `VITE_GEMINI_API_KEY` / `GEMINI_API_KEY` / `generativelanguage` /
  `AIza…`-shaped strings across `dist/` → **none found**.
- The `gemini-*.js` client chunk now contains only prompt helpers + `fetch()`
  calls to `/api/*`.
- Proxy boots: `/api/health` → `{"ok":true,"model":"gemini-2.0-flash"}`; bad
  payloads → `400`; rate limit kicks in at request #21 → `429`.
- Proxy fails closed: refuses to start when `GEMINI_API_KEY` is unset.

#### #2 🔴 `.dockerignore` blocks secrets — DONE

`.dockerignore` now excludes `.env`, `.env.*` (with `!.env.example` allow-rule),
plus `docs/`, `coverage`, and other cruft. The on-disk `.env` (168 B) can no
longer enter any image layer via `COPY . .`.

#### #3 🔴 AbortController prevents stale writes — DONE

`src/hooks/useReading.ts`:
- New `inflightRef` holds the active `AbortController`.
- New `abortInflight()` helper, called from `selectSpread`, `startShuffleAndDraw`,
  and `resetAll` — so navigating away / re-shuffling / re-selecting cancels the
  in-flight request.
- `runReading` and `sendReaderMessage` each create a fresh controller, pass
  `signal` into `requestTarotReading` / `continueReaderConversation`, and treat
  `AbortError` as silent (no error state shown; chat rolls back the optimistic
  user turn).
- `finally` blocks clear the ref only if it still points at *this* controller,
  avoiding a race where a newer request is already in flight.

#### #20 🟡 Tooling: typecheck / format scripts + Prettier + editorconfig — DONE

- `package.json` scripts added: `typecheck` (`tsc -b --noEmit`), `format`,
  `format:check`, `dev:all`, `dev:proxy`.
- `.prettierrc.json` — project style (no semi, single quotes, trailing comma,
  100 cols, LF).
- `.prettierignore` — excludes `dist`, lockfiles, the wikimedia manifest.
- `.editorconfig` — consistent editor behavior across IDEs.

### Verification summary (all green)

| Check | Command | Result |
|-------|---------|--------|
| Deps install | `npm install` | ✅ 37 packages removed, 18 added |
| Typecheck | `npm run typecheck` | ✅ clean |
| Lint | `npm run lint` | ✅ clean |
| Build | `npm run build` | ✅ 1032 modules, 627 ms |
| Key not in bundle | `grep -rE "AIza…|GEMINI_API_KEY" dist/` | ✅ absent |
| Proxy boots + health | `curl /api/health` | ✅ `200 {"ok":true,...}` |
| Proxy rate limit | 25 rapid POSTs | ✅ first 20 pass validation, then `429` |
| Proxy fails closed | no key | ✅ refuses to start |

### Files changed

```
Modified:
  .dockerignore
  .env.example
  Dockerfile
  docker-compose.yml
  nginx.conf
  package.json
  package-lock.json
  src/hooks/useReading.ts
  src/services/gemini.ts
  vite.config.ts

New:
  .editorconfig
  .prettierignore
  .prettierrc.json
  docs/IMPROVEMENT_PLAN.md
  docs/PROGRESS.md
  server/Dockerfile
  server/package.json
  server/proxy.mjs
```

### Notes / follow-ups for the user

1. **You need a real `GEMINI_API_KEY` in your `.env`** for the proxy to work
   locally. The old `VITE_GEMINI_API_KEY` var is no longer used.
2. **To run locally:** `npm run dev:all` (starts Vite on :5173 and the proxy on
   :8787 together). Or `npm run dev` + `npm run dev:proxy` in two terminals.
3. **To deploy:** `docker compose up --build` now builds two services. Set
   `GEMINI_API_KEY` (and optionally `ALLOWED_ORIGINS`) in the host environment.
4. **Not committed to git** — all changes are in the working tree. Review with
   `git diff` and commit when ready.
5. **`npm audit` reports 5 vulnerabilities** (1 low, 3 moderate, 1 high) in
   client deps — pre-existing, not introduced by Sprint 1. Worth a separate
   `npm audit fix` pass.

---

## Sprint 2 — Resilience & UX feel — ✅ COMPLETE

**Date:** 2026-07-11
**Goal:** Streaming responses, stronger API resilience, accessibility basics,
and `prefers-reduced-motion` everywhere.

### Items delivered

#### #5 🟠 Streaming — DONE (end-to-end)

Users now see the interpretation render progressively instead of staring at a
spinner for the full generation.

- **Proxy** (`server/proxy.mjs`): `POST /api/reading` and `/api/chat` now return
  `text/event-stream` (SSE) instead of JSON. Chunks flow as
  `event: delta` → `data: {"delta":"..."}` as Gemini streams; the stream
  terminates with `event: done` (final text) or `event: error` (message).
  Switched from `generateContent` to `generateContentStream`. SSE headers include
  `x-accel-buffering: no` so nginx flushes chunks immediately.
- **Client service** (`src/services/gemini.ts`): new `streamFromProxy()` reads the
  `Response.body` ReadableStream, parses SSE events incrementally, and invokes an
  `onChunk(delta)` callback per delta. `requestTarotReading` and
  `continueReaderConversation` now take `onChunk` as a required arg.
- **Hook** (`src/hooks/useReading.ts`): `runReading` accumulates chunks into
  `readingText` live (step stays `'reading'` so the spinner + partial text show
  together); `sendReaderMessage` appends a placeholder model turn and grows it.
- **UI**: `App.tsx` renders `ReadingResult streaming` below `LoadingOracle` while
  streaming. `ReadingResult` gained a `streaming` prop (reduced motion, `aria-busy`,
  a blinking cursor, "đang viết…" label). `LoadingOracle` gained a `streaming`
  prop that calms the spinner copy once text is arriving.

#### #4 🟠 Resilience — DONE

- **`safetySettings`** added to all Gemini calls on the proxy
  (`BLOCK_ONLY_HIGH` across harassment/hate/sexually-explicit/dangerous-content).
  Tarot prose was tripping default filters → empty responses; this loosens
  false positives while keeping hard harms blocked.
- **Upstream retry with exponential backoff** (`streamGenerateContents`):
  retries transient errors (429, network, 5xx) up to 2 times with jittered
  backoff — but only *before* the first chunk is emitted (once we've streamed
  anything, retrying would corrupt the output).
- **Client-side retry** (`streamFromProxy`): 2 retries with backoff on
  connection-level failures, also gated on "no bytes received yet."
- **Timeout + abort-on-disconnect**: the proxy attaches an `AbortController`
  with a hard `UPSTREAM_TIMEOUT_MS`; if the client disconnects, the upstream
  Gemini call is aborted too (no orphaned work).
- **Empty-response distinction**: safety blocks now surface as a real error
  message instead of a silent empty string.

#### #13 🟠 Reduced motion everywhere — DONE

All 7 infinite-animation sources now respect `prefers-reduced-motion`:

| Source | Before | After |
|--------|--------|-------|
| `MysticCover` | ✅ already had it | unchanged |
| `LoadingOracle` | ❌ 3 concurrent infinite rotations | `useReducedMotion()` gates all 3 |
| `Navbar` glyph | ❌ 6s rotate/scale loop | gated |
| `TarotDeck` shuffle | ❌ 2.8s loop + fixed 3s timer | gated; timer drops to 600 ms |
| `ReadingFlowStepper` | ❌ 2.2s active pulse | gated |
| `MysticBackground` particles | ❌ 78 always-drifting particles | count → 14, movement + opacity flicker disabled |
| CSS (moon spin, oracle pulse, typing dots, twinkle) | ❌ always on | `@media (prefers-reduced-motion: reduce) { animation: none !important }` |

`MysticBackground` now reads the media query via `useSyncExternalStore`
(idiomatic — avoids the `setState`-in-effect lint rule).

#### #12 🟠 Accessibility basics — DONE

- **Focus trap** (`src/hooks/useFocusTrap.ts`, new): traps Tab/Shift+Tab inside
  the `MysticCover` dialog, focuses the entry button on mount, restores focus
  to the trigger on close, and dismisses on Escape. No new dependency.
- **Card alt text**: `CardReveal` images now carry `alt="${card.name}${reversed ? ' (ngược)' : ''}"`
  instead of `alt=""`.
- **`aria-live`**: `ReadingResult` (`polite`, with `aria-busy` while streaming)
  and the `ReaderChat` message list (`polite`) announce streaming content.
- **`aria-current="step"`** on the active stepper item.
- **`role="status"`** on `TarotDeck` (was `aria-hidden` with zero SR feedback)
  + a `sr-only` "Đang xáo bài…" label.
- **Contrast fixes** (WCAG AA 4.5:1): Footer `/50`→`/70`, LoadingOracle caption
  `/48`→`/65`, MysticCover hint `/45`→`/70` (and subtitle `/55`→`/75`), textarea
  placeholder `/38`→`/50`, chat placeholder `/35`→`/50`, stepper non-active
  labels `/38`/`/65`→`/55`/`/75`.
- **Cover copy**: "Chỉ có thể vào qua nút bên dưới" (threatening) → "Nhấn nút bên
  dưới hoặc nhấn Enter để vào" (guides + documents the Escape/Enter affordance).

### Verification summary (all green)

| Check | Command | Result |
|-------|---------|--------|
| Typecheck | `npm run typecheck` | ✅ clean |
| Lint | `npm run lint` | ✅ clean |
| Build | `npm run build` | ✅ 1033 modules, 344 ms |
| Key not in bundle | `grep -rE "AIza…\|GEMINI_API_KEY" dist/` | ✅ absent |
| Proxy SSE stream | `curl -N /api/reading` | ✅ opens `text/event-stream`, emits `event: error` on dummy key |
| Validation still pre-stream | `curl -X POST /api/reading -d '{}'` | ✅ `400` JSON, stream never opened |
| Proxy syntax | `node --check server/proxy.mjs` | ✅ OK |

### Files changed

```
Modified:
  server/proxy.mjs               (SSE streaming, safetySettings, retry, abort-on-disconnect)
  src/App.tsx                    (streaming result layout)
  src/components/CardReveal.tsx  (real alt text)
  src/components/Layout/Footer.tsx        (contrast)
  src/components/Layout/MysticBackground.tsx (reduced-motion particles, useSyncExternalStore)
  src/components/Layout/MysticCover.tsx   (focus trap, Escape, contrast, copy)
  src/components/Layout/Navbar.tsx        (reduced-motion)
  src/components/LoadingOracle.tsx        (streaming prop, reduced-motion, contrast)
  src/components/ReaderChat.tsx           (aria-live, contrast)
  src/components/ReadingFlowStepper.tsx   (reduced-motion, aria-current, contrast)
  src/components/ReadingResult.tsx        (streaming prop, aria-busy, cursor)
  src/components/TarotDeck.tsx            (reduced-motion, sr-only label)
  src/hooks/useReading.ts        (onChunk streaming for reading + chat)
  src/index.css                  (prefers-reduced-motion media query)
  src/services/gemini.ts         (SSE client parser, retry)

New:
  src/hooks/useFocusTrap.ts      (focus trap hook, no deps)
```

### Notes / follow-ups

1. **Streaming is visible in dev now.** Run `npm run dev:all`, do a reading, and
   you'll see text appear token-by-token. The spinner stays until the first
   chunk, then switches to "Oracle đang viết…" with the partial text below.
2. **Chat also streams** — the reader's reply grows in place.
3. **`safetySettings` is intentionally permissive** (`BLOCK_ONLY_HIGH`). If you
   see genuinely harmful output, tighten to `BLOCK_MEDIUM_AND_ABOVE`.
4. **Reduced-motion users** now get a near-static experience: 14 still
   particles, no rotating glyphs, a 600 ms shuffle instead of 3 s, and the cover
   rotates in 0.35 s with no infinite loops.
5. Not committed to git — review with `git diff` and commit when ready.

## Sprint 3 — Depth — ⏳ NOT STARTED

#9 correspondences data layer (the differentiator — Golden Dawn astrology,
decans, Qabalah, elemental dignities), #6 structured JSON output via
`responseSchema`, #11 new spreads (Horseshoe, Relationship, Career, Year-ahead).

## Sprint 4 — Polish & scale — ⏳ NOT STARTED

#14 design tokens, #15 save/history/export, #18 tests, #19 CI, #21 nginx
hardening, #16 i18n.
