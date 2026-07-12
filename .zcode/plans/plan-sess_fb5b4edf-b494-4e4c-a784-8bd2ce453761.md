# Sprint 3 — Depth: Correspondences + Structured Metadata + New Spreads

## Scope (confirmed with user)
- **#9 Core astrological layer**: element, astrology (zodiac/planet), Minor decans, elemental dignity rules, Yes/No, timing. No Qabalah.
- **#6 Structured output**: computed metadata (dominant card, cross-card summary, elemental dignities) rendered as separate UI sections — **not** via Gemini `responseSchema` (that would kill streaming). Instead, computed locally on the server and streamed as a `meta` SSE event before the prose.
- **#11 New spreads**: Horseshoe (7), Relationship (5), Career Path (5).

## Part A — Correspondence data layer (#9)

### A1. New file: `src/data/correspondences.ts`
A single source of truth for the 78-card esoteric data. Schema:

```ts
export type Element = 'Fire' | 'Water' | 'Air' | 'Earth'
export type Astrology =
  | { kind: 'zodiac'; sign: ZodiacSign }          // Major Arcana
  | { kind: 'planet'; planet: Planet }             // Major Arcana
  | { kind: 'decan'; sign: ZodiacSign; planet: Planet; dates: string } // Minor Ace–10

export interface Correspondence {
  element: Element
  astrology: Astrology
  yesNo: 'Yes' | 'No' | 'Maybe'
  timing: string   // e.g. "Wands = weeks" for minors; zodiac date range for majors
}
export const CORRESPONDENCES: Record<number, Correspondence>  // keyed by card id 0–77
```

Data populated from Golden Dawn / Liber 777 attributions:
- **Major Arcana (0–21)**: element + zodiac sign or planet (e.g. Emperor=Aries, Star=Aquarius, Tower=Mars).
- **Minor Ace–10 (22–63)**: element by suit + decan (sign + ruling planet + date range). 36 decans total, 9 per suit.
- **Court cards (64–77)**: element by suit + court-element sub-attribution (e.g. King of Wands = Fire of Fire). No decan.
- **Yes/No**: traditional attributions (mostly Yes for upright Majors like Sun/Star/World, No for Tower/Death/Devil upright, etc.).
- **Timing**: suit-based for minors (Wands=weeks, Cups=days, Swords=months, Pentacles=years); zodiac date ranges for Majors with zodiac astrology.

### A2. Extend `TarotCard` type (`src/types/index.ts`)
Add optional fields (optional to avoid breaking `Omit<TarotCard,'id'|'arcana'>` on MAJOR_DEFS):
```ts
export interface TarotCard {
  // ...existing fields...
  correspondence?: Correspondence  // populated at runtime, not hardcoded in tarotCards.ts
}
```
Actually — cleaner: **don't** mutate `TarotCard`. Keep correspondences as a separate lookup (`CORRESPONDENCES[id]`). This avoids touching all 78 card definitions. The prompt builder and UI import from `correspondences.ts` directly.

### A3. Elemental dignity computation
New function in `correspondences.ts`:
```ts
export function computeDignities(drawn: DrawnCard[]): DignityResult[]
```
Returns per-pair or per-spread element balance (e.g. "Fire + Water = tension", "Fire + Air = mutual strengthening"). Rules:
- Same element = strengthened
- Fire↔Air, Water↔Earth = friendly
- Fire↔Water, Air↔Earth = hostile
- Neutral otherwise

## Part B — Enrich the prompt (#9 integration)

### B1. Update all 3 prompt builders
In `buildUserPrompt`, add correspondence data to each card block:
```
Thông số: Số 4 · Major Arcana · element Fire · Aries (Mars) · Yes
```
And add a **computed dignities block** to `buildSpreadSummary` when ≥2 cards:
```
• Dignity: Fire + Water = tension (will vs emotion)
```
Files to update (keep in sync):
- `api/_shared.ts` — `buildUserPrompt` + `buildSpreadSummary`
- `server/proxy.mjs` — same functions
- `src/services/gemini.ts` — same functions (client-side thread seeding)

## Part C — Structured metadata (#6, without killing streaming)

### C1. Computed metadata on the server
New function in `api/_shared.ts` + `server/proxy.mjs`:
```ts
export function computeReadingMeta(drawn: DrawnCard[]): ReadingMeta {
  return {
    dominantCard: { id, name, reason },     // heuristic: highest element concentration / sole Major
    crossCardSummary: { major, minor, suits, elements, upright, reversed, courts },
    dignities: computeDignities(drawn),
  }
}
```
This is **deterministic** — no LLM call needed.

### C2. Stream as `meta` event before prose
In `api/reading.ts` and `server/proxy.mjs`, after opening the SSE stream and before calling Gemini:
```js
sseEvent(controller, 'meta', computeReadingMeta(payload.drawn))
// then stream deltas as before
```

### C3. Client parses `meta` event
In `src/services/gemini.ts` `streamFromProxy`: handle `event: meta` → call a new `onMeta(meta)` callback. Update `requestTarotReading` signature to accept `onMeta`.

### C4. UI: render metadata sections
- `src/hooks/useReading.ts`: new `readingMeta` state, set from `onMeta`.
- New component `src/components/ReadingMeta.tsx`: renders dominant card highlight + cross-card stats + dignity chips. Shown above the prose reading.
- `src/App.tsx`: render `<ReadingMeta>` above `<ReadingResult>`.

## Part D — New spreads (#11)

### D1. Add 3 spreads to `src/data/spreads.ts`
- **Horseshoe** (7 cards): Past, Present, Future, Hidden Influences, Advice, External Influences, Outcome
- **Relationship** (5 cards): You, Partner, Connection, Strengths, Challenges
- **Career Path** (5 cards): Current Situation, Challenge, Opportunity, Action, Outcome

### D2. SpreadLayout support
Check `src/components/SpreadLayout.tsx` — it hardcodes 4 layouts. Add layout cases for 5-card (reuse existing 5-card layout shape), 7-card (horizontal row). The Relationship and Career spreads are both 5-card so they can share the existing 5-card layout geometry.

## Part E — Validation update

### E1. Update `validateReadingPayload` in both `api/_shared.ts` and `server/proxy.mjs`
The `spread.id` whitelist currently checks `SPREAD_TEMPERATURE`. Add the 3 new spread ids (`horseshoe`, `relationship`, `career`) to `SPREAD_TEMPERATURE` in all 3 prompt-builder files.

## Execution order
1. **Part A** — `correspondences.ts` (the big data file, ~250 lines) + dignity computation
2. **Part D** — new spreads (quick, unblocks E)
3. **Part B** — enrich the 3 prompt builders with correspondence + dignity data
4. **Part E** — update validators + temperature map
5. **Part C** — structured metadata (server compute + SSE meta event + client parse + UI component)
6. **Verify** — typecheck + lint + build + `npm run test:api` + proxy smoke test

## Verification plan
- `npm run typecheck` — clean
- `npm run lint` — clean
- `npm run build` — clean
- `npm run test:api` — all 11 existing tests still pass
- New test: `scripts/test-api.ts` gets a Test 7 — verify `event: meta` is emitted before deltas
- Manual: spot-check 5 cards' correspondences against Liber 777 (Emperor=Aries, Star=Aquarius, 2 of Wands=Mars in Aries, etc.)
- Proxy smoke test: valid payload → confirm SSE stream emits `meta` event first, then `delta` chunks

## Files touched
**New:**
- `src/data/correspondences.ts` (78-card correspondence data + dignity rules)
- `src/components/ReadingMeta.tsx` (metadata UI)

**Modified:**
- `src/data/spreads.ts` (+3 spreads)
- `src/components/SpreadLayout.tsx` (+7-card layout)
- `src/types/index.ts` (maybe: add ReadingMeta types, or keep in correspondences.ts)
- `src/services/gemini.ts` (onMeta callback, prompt enrichment)
- `src/hooks/useReading.ts` (readingMeta state)
- `src/App.tsx` (render ReadingMeta)
- `api/_shared.ts` (prompt enrichment + computeReadingMeta + meta event + new spread temps)
- `server/proxy.mjs` (same: prompt enrichment + computeReadingMeta + meta event + new spread temps)
- `scripts/test-api.ts` (+1 test for meta event)