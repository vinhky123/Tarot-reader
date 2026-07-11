# Mystic Tarot — Improvement Plan

> **Status:** Proposed (not yet implemented)
> **Authored:** 2026-07-11
> **Method:** Senior-engineer review synthesized from a 4-agent parallel exploration (read-only Explore agents on a small model). See [Methodology](#methodology) at the bottom.

---

## TL;DR

Mystic Tarot is a solid ~2,000-LoC React 19 + Vite 8 + Tailwind 4 single-page app
that calls Gemini client-side for Vietnamese tarot interpretations. The prompting
layer is genuinely thoughtful (dynamic temperature/token caps, hallucination
guards, synthesis instructions). However, the project has:

- **One ship-blocker:** the Gemini API key is bundled into the browser.
- **Real correctness gaps:** no request cancellation, thin retry logic, no streaming.
- **A missing esoteric layer:** the data model has keywords + upright/reversed but
  **no element, astrology, decan, or Qabalah** — the "Thông số" in the prompt is a
  prose hint, not a real schema.
- **Weak accessibility:** infinite animations ignore `prefers-reduced-motion`,
  modal has no focus trap, several text colors fail WCAG AA.
- **No tests, no CI.**

Issues are graded **🔴 Critical / 🟠 High / 🟡 Medium / 🔵 Polish**.

---

## TIER 0 — Ship-blockers / security

### 1. 🔴 Gemini API key is exposed client-side

`src/services/gemini.ts:57,63` — `import.meta.env.VITE_GEMINI_API_KEY` is statically
inlined into the browser bundle at build time. `Dockerfile:11-14` bakes it into the
image too. Anyone with DevTools / view-source can extract the key → quota theft,
billing abuse, policy abuse.

**Plan:**
- Introduce a **server-side proxy** (Cloudflare Worker / Netlify Edge / Vercel
  function / small Bun service) that holds the key in a secret, enforces per-IP
  rate limits, and forwards to `generativelanguage.googleapis.com`.
- Client posts `{spread, question, cards, thread}` to the proxy; never sees the key.
- Add a secret-scanning CI step (gitleaks / trufflehog) to catch regressions.

### 2. 🔴 `.env` not in `.dockerignore`

`Dockerfile:8` does `COPY . .` — the on-disk `.env` (168 B) leaks into the build
layer. **Plan:** add `.env` and `.env.*` to `.dockerignore`.

### 3. 🔴 No `AbortController` → stale-write race

`src/hooks/useReading.ts:108` (`runReading`) and `:133` (`sendReaderMessage`) fire
API calls with no cancellation. If the user resets or re-shuffles mid-flight, the
in-flight promise still calls `setReadingText` / `setReaderThread` afterward →
corrupted state.

**Plan:** wire an `AbortController` per request; abort on reset / spread change.

---

## TIER 1 — Correctness & robustness

### 4. 🟠 API resilience is thin

`gemini.ts:134` `generateWithRateLimitRetry` retries **once, only on 429**, with
brittle text-parsing (`parseRetrySecondsFromText:92`). No timeout, no backoff for
5xx / network.

**Plan:** exponential backoff with jitter for 429/5xx/network; a request timeout
(~30s); configure `safetySettings` so safety-blocks are distinguishable from
genuine empty responses (currently masked at `:277`).

### 5. 🟠 No streaming → poor perceived latency

Everything is non-streaming (`generateContent`, `gemini.ts:258`). Users stare at
`LoadingOracle` for the full generation.

**Plan:** switch to `generateContentStream`; render markdown progressively
(`MysticMarkdown` already handles partial input). Big UX win for the token-heavy
Celtic Cross read.

### 6. 🟠 Structured output is "free text"

The prompt asks for structured fields (dominant card, synthesis, cross-card
summary) but they are embedded in free text.

**Plan:** adopt `responseMimeType: 'application/json'` + `responseSchema`. Enables
a "dominant card" highlight UI, a cross-card stats panel, and a separate synthesis
section instead of one prose blob.

### 7. 🟡 Chat history grows unboundedly (token-wise)

`trimThreadForApi:239` caps at **30 turns**, not tokens. 30 verbose Vietnamese
turns can still blow context.

**Plan:** use `countTokens` before send; trim by token budget, not turn count.

### 8. 🟡 Minor smells in `gemini.ts`

- Redundant `num` / `r` both compute card number (`:165-166`).
- New `GoogleGenAI` client per call (`:56`) — hoist to module scope.
- Hardcoded follow-up temperature (0.75) and token cap (1500) at `:302-303` —
  don't scale with thread size.

---

## TIER 2 — Astrological / esoteric depth

### 9. 🟠 The esoteric layer is entirely missing

Despite the "Thông số" upgrade commit, the data model
(`src/types/index.ts:4-12`) carries **only** `id, name, arcana, suit, upright,
reversed, keywords`. There is **no** element, astrology, planet, numerology, decan,
Hebrew letter, or Qabalah path on any card. Element is only *inferred* via the
Vietnamese `DOMAIN` prose (`tarotCards.ts:3-8`). So the "element" in the prompt is
a string hint, not a real field.

**This is the single biggest opportunity to deepen meaning.** A serious
RWS / Golden-Dawn app should encode:

| Layer | What | Source | Example |
|-------|------|--------|---------|
| **Element** | Fire / Water / Air / Earth per suit | Golden Dawn | Wands=Fire, Cups=Water, Swords=Air, Pentacles=Earth |
| **Major astrology** | zodiac sign or planet per Major | Liber 777 | Emperor=Aries, Lovers=Gemini, Chariot=Cancer, Star=Aquarius, Tower=Mars |
| **Minor decans** | each Ace–10 → one of 36 decans | Golden Dawn | 2 of Wands = Mars in Aries; 4 of Cups = Moon in Cancer |
| **Qabalah** | Hebrew letter + Tree of Life path (Majors) | 777 | Fool=א (Aleph), path 11 |
| **Numerology** | rank's numerological meaning | esoteric | |
| **Yes/No** | binary attribution | tradition | |
| **Timing** | suit-based time units | Golden Dawn | Wands=weeks, Cups=days, Swords=months, Pentacles=years |
| **Elemental dignities** | friendly / hostile interactions | tradition | Fire+Air friendly; Fire+Water hostile — **huge for multi-card reads** |

**Plan:** extend `TarotCard` schema with these fields; populate a
`correspondences.ts` data file (78 entries — real work; cite `Liber 777`,
Crowley's *Book of Thoth*, Wang's *Qabalistic Tarot*). Then feed elemental
dignities into the prompt as a **computed** input ("Wands + Cups = tension between
will & emotion"), not just raw keywords. This is what turns a keyword-flinger into
a genuine reader.

### 10. 🟡 Content nits

- `tarotCards.ts:337` reversed text has a Vietnamese/English mix: "martyr phức tạp"
  (likely "martyr complex").
- Only **31/78** card images present in `public/cards/` vs 78 entries in the
  manifest — `npm run download-cards` was never completed / committed. Either
  finish it or fall back to a face-down / wiki hotlink.

### 11. 🟡 Spread depth

Celtic Cross (`spreads.ts:66-77`) is correctly structured (10 standard positions,
Significator omitted as is modern practice). Consider adding: **Horseshoe (7)**,
**Relationship (5)**, **Career Path (5)**, **Birthday / Year-ahead (12)** — crowd
pleasers that are cheap given the position-hint framework already exists.

---

## TIER 3 — UI/UX & design system

### 12. 🟠 Accessibility is the weakest layer

- `MysticCover.tsx:17-19` declares `role="dialog" aria-modal` but has **no focus
  trap**, no Escape-to-dismiss, Tab leaks to background.
- `TarotDeck.tsx:22-24` shuffle is `aria-hidden` with **no `aria-live` /
  `role="status"`** — screen-reader users get zero feedback for 3s.
- Card images use `alt=""` (`CardReveal.tsx:128`) with name only in a `title`
  tooltip — invisible to SR and touch.
- Body text frequently uses `text-[#f5f0e6]/45`, `/38`, `/50` (`Footer.tsx:3`,
  `ReadingFlowStepper.tsx:61`, `MysticCover.tsx:91`) — **below WCAG AA 4.5:1**.

**Plan:** add focus trap to the cover; `role="status"` + `aria-live="polite"`
around async states; real `alt` text from card name + orientation; contrast pass
on all `/NN` opacities.

### 13. 🟠 Motion sickness risk — only 1 of ~7 infinite animations respects `prefers-reduced-motion`

Particles (78 always-on, `MysticBackground.tsx:10-41`), rotating moon 58s, Navbar
glyph 6s, stepper 2.2s pulse, oracle pulse, **3 concurrent** rotations in
`LoadingOracle.tsx:28-44`. Only `MysticCover.tsx:10-12` checks `useReducedMotion()`.

**Plan:** wrap *all* infinite animations behind `useReducedMotion()`; reduce
particle count / disable loops when set. This is a genuine vestibular hazard, not
a nicety.

### 14. 🟡 Design tokens exist but are bypassed

`index.css:7-13` declares `@theme` tokens (`--color-mystic-gold` etc.) but **every
component hardcodes hex literals** (`#d4af37`, `#7c3aed`, `#f5f0e6`...) with ad-hoc
opacity modifiers (`/20 /25 /35 /40 /45 /65 /70 /90`) — dozens of near-duplicate
but-not-identical shades. Buttons are re-declared inline (`App.tsx:18-22` vs
`ReaderChat.tsx:157`).

**Plan:** migrate hex literals → Tailwind theme classes (`bg-mystic-gold`,
`text-mystic-gold/70`); extract a `<Button variant>` component to kill the
copy-paste. This also makes re-theming (e.g. a light mode) feasible.

### 15. 🟡 Missing UX recovery & persistence

- **No retry button** on errors (`App.tsx:191-198`, `ReaderChat.tsx:171`) —
  display-only.
- **No save / export / share / history** — refreshing loses the reading entirely.
- **No undo / back** — "Trải bài mới" (`App.tsx:176`) is a full reset; you can't
  tweak the question.
- **Chat is hidden** until `readerThread.length >= 2` (`ReaderChat.tsx:60`) with no
  affordance hint.
- Cover copy "Chỉ có thể vào qua nút bên dưới" (`MysticCover.tsx:131`) threatens the
  user — rewrite to guide.

**Plan:** add a retry affordance; localStorage reading history + export-to-text /
image; a back-to-question step; a persistent "Ask the Oracle more →" prompt.

### 16. 🔵 i18n

All copy is hardcoded Vietnamese inline (`App.tsx:97`, `index.html:2`
`lang="vi"`). No string table. **Plan:** extract to `i18n/vi.json` + `i18n/en.json`
with a tiny context-based `t()` (or `react-i18next`) — cheap insurance for an
English audience.

### 17. 🔵 React nits

- `CardReveal.tsx:79` `useState(() => localCardSrc(...))` never resets if
  `drawn.card.id` changes → stale image when instance reused.
- No `React.memo` on `CardReveal` / `Slot` → every flip re-renders all siblings.
- `App.tsx:42-50` uses `getElementById` scroll instead of a ref.
- `App.tsx:171,206` fire-and-forget async with swallowed rejections.

---

## TIER 4 — Infra & quality

### 18. 🟠 No tests at all

Zero `*.test.*` / `*.spec.*`, no vitest / playwright in deps. For an app with a
non-trivial state machine (`useReading`), prompt builder, and 78-card dataset,
this is risky.

**Plan:** add **Vitest** for the pure logic that matters most — `gemini.ts` prompt
builders (`buildUserPrompt`, `buildSpreadSummary`, `trimThreadForApi`),
`tarotCards.ts` data integrity (78 cards, no duplicate ids, court structure),
`spreads.ts` position counts. Add **Playwright** later for the flow.

### 19. 🟠 No CI/CD

No `.github/` exists. **Plan:** GitHub Actions: `lint` → `typecheck`
(`tsc -b --noEmit`) → `build` → `test`; add `dependency-review-action` and
`gitleaks-action`.

### 20. 🟡 Missing scripts & hygiene

- Add `typecheck`, `test`, `format` scripts (`package.json:6-12`).
- Add Prettier + `.editorconfig`.
- **No LICENSE, no CHANGELOG, no CONTRIBUTING**; `package.json:4` version stuck at
  `0.0.0`.
- Add `eslint-plugin-security` and import ordering.

### 21. 🟡 nginx hardening (`nginx.conf`)

- **No gzip / brotli.**
- **No security headers** (CSP, HSTS, X-Frame-Options, X-Content-Type-Options,
  Referrer-Policy).
- `index.html` has no explicit `no-cache` → stale HTML after deploys.
- `docker-compose.yml`: no `healthcheck`, no `mem_limit`, no read-only fs.

---

## Suggested rollout order

If I were driving this as your tech lead, I'd sequence it as:

1. **Sprint 1 — Stop the bleeding:** #1 key proxy, #2 `.dockerignore`, #3
   AbortController, #20 Prettier / typecheck scripts. (Unblocks safe deployment.)
2. **Sprint 2 — Resilience & UX feel:** #4 retry / timeout, #5 streaming, #12 a11y
   basics, #13 reduced-motion.
3. **Sprint 3 — Depth:** #9 correspondences data layer (the differentiator), #6
   structured JSON output, #11 new spreads.
4. **Sprint 4 — Polish & scale:** #14 design tokens, #15 save / history / export,
   #18 tests, #19 CI, #21 nginx hardening, #16 i18n.

---

## Methodology

This plan was produced by dispatching a **4-agent team in parallel** (read-only
Explore agents on a small/fast model) — one per independent domain — then
synthesizing their findings as a senior engineer. Each agent had a tight scope and
a required output format.

| Agent | Domain | Files audited |
|-------|--------|---------------|
| 🟣 AI/Prompting | Gemini integration & prompt eng | `services/gemini.ts`, `hooks/useReading.ts`, `types/index.ts`, `.env.example` |
| 🔵 Data/Astrology | Card meanings, spreads, correspondences | `data/tarotCards.ts`, `data/spreads.ts`, `data/cardImages.ts`, `data/wikimedia-rws-files.json` |
| 🟢 UI/UX | Components, a11y, design system | `App.tsx`, all `components/**`, `index.css`, `index.html` |
| 🟠 Infra/Security | Build, Docker, CI, secrets | `package.json`, `vite.config.ts`, `tsconfig*`, `Dockerfile`, `docker-compose.yml`, `nginx.conf`, `.dockerignore`, `.gitignore`, `.env.example`, `scripts/download-cards.mjs` |

Findings are cited as `file:line` wherever possible so they remain traceable as the
codebase evolves.
