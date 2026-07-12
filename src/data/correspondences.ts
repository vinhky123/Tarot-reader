/**
 * Golden Dawn / Liber 777 astrological correspondences for all 78 cards.
 *
 * Sources: Crowley's Liber 777, Book of Thoth; Wang's Qabalistic Tarot;
 * Mathers' Tarot divination tradition. The RWS ordering is used (Strength=8,
 * Justice=11 — the Waite swap from the older TdM ordering).
 *
 * This is a *separate* lookup from TAROT_CARDS — keyed by card id (0–77) — so
 * the existing card definitions in tarotCards.ts don't need to change.
 *
 * Card id map:
 *   0–21   Major Arcana (Fool=0 … World=21)
 *   22–35  Wands     (Ace=22 … King=35)
 *   36–49  Cups      (Ace=36 … King=49)
 *   50–63  Swords    (Ace=50 … King=63)
 *   64–77  Pentacles (Ace=64 … King=77)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export type Element = 'Fire' | 'Water' | 'Air' | 'Earth'

export type ZodiacSign =
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer'
  | 'Leo' | 'Virgo' | 'Libra' | 'Scorpio'
  | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces'

export type Planet =
  | 'Sun' | 'Moon' | 'Mercury' | 'Venus' | 'Mars'
  | 'Jupiter' | 'Saturn'
  | 'Uranus' | 'Neptune' | 'Pluto' // modern rulers (used by some Major Arcana)

export type Astrology =
  | { kind: 'zodiac'; sign: ZodiacSign; planet: Planet; dates: string }
  | { kind: 'decan'; sign: ZodiacSign; planet: Planet; dates: string }
  | { kind: 'planet'; planet: Planet }
  | { kind: 'element' } // court cards — no zodiac/planet attribution

export interface Correspondence {
  element: Element
  astrology: Astrology
  yesNo: 'Yes' | 'No' | 'Maybe'
  /** Timing association for divination. */
  timing: string
}

// Suit → element (Golden Dawn)
export const SUIT_ELEMENT: Record<string, Element> = {
  wands: 'Fire',
  cups: 'Water',
  swords: 'Air',
  pentacles: 'Earth',
}

// Suit → timing unit (Golden Dawn tradition)
const SUIT_TIMING: Record<string, string> = {
  wands: 'tuần (weeks)',
  cups: 'ngày (days)',
  swords: 'tháng (months)',
  pentacles: 'năm (years)',
}

// ─────────────────────────────────────────────────────────────────────────────
// Major Arcana (ids 0–21) — element + zodiac sign or ruling planet
// ─────────────────────────────────────────────────────────────────────────────
// Golden Dawn attributions (Liber 777, col. XV–XVIII). Cards with elemental
// rulers (0, 1, 2, 21) or planetary rulers get { kind: 'planet' }; cards on
// the zodiac wheel get { kind: 'zodiac' } with their decan-spanning date range.
const MAJOR_CORRESPONDENCES: Correspondence[] = [
  // 0 — The Fool: element Air (spiritual, wind)
  { element: 'Air', astrology: { kind: 'planet', planet: 'Uranus' }, yesNo: 'Maybe', timing: 'Bất ngờ, không cố định (Uranus)' },
  // 1 — The Magician: Mercury
  { element: 'Air', astrology: { kind: 'planet', planet: 'Mercury' }, yesNo: 'Yes', timing: 'Nhanh, trong ngày' },
  // 2 — The High Priestess: Moon
  { element: 'Water', astrology: { kind: 'planet', planet: 'Moon' }, yesNo: 'Maybe', timing: 'Theo chu kỳ mặt trăng' },
  // 3 — The Empress: Venus
  { element: 'Earth', astrology: { kind: 'planet', planet: 'Venus' }, yesNo: 'Yes', timing: 'Mùa sinh sôi — xuân' },
  // 4 — The Emperor: Aries
  { element: 'Fire', astrology: { kind: 'zodiac', sign: 'Aries', planet: 'Mars', dates: '21/3 – 19/4' }, yesNo: 'Yes', timing: '21/3 – 19/4 (Aries)' },
  // 5 — The Hierophant: Taurus
  { element: 'Earth', astrology: { kind: 'zodiac', sign: 'Taurus', planet: 'Venus', dates: '20/4 – 20/5' }, yesNo: 'Yes', timing: '20/4 – 20/5 (Taurus)' },
  // 6 — The Lovers: Gemini
  { element: 'Air', astrology: { kind: 'zodiac', sign: 'Gemini', planet: 'Mercury', dates: '21/5 – 20/6' }, yesNo: 'Yes', timing: '21/5 – 20/6 (Gemini)' },
  // 7 — The Chariot: Cancer
  { element: 'Water', astrology: { kind: 'zodiac', sign: 'Cancer', planet: 'Moon', dates: '21/6 – 22/7' }, yesNo: 'Yes', timing: '21/6 – 22/7 (Cancer)' },
  // 8 — Strength: Leo
  { element: 'Fire', astrology: { kind: 'zodiac', sign: 'Leo', planet: 'Sun', dates: '23/7 – 22/8' }, yesNo: 'Yes', timing: '23/7 – 22/8 (Leo)' },
  // 9 — The Hermit: Virgo
  { element: 'Earth', astrology: { kind: 'zodiac', sign: 'Virgo', planet: 'Mercury', dates: '23/8 – 22/9' }, yesNo: 'Maybe', timing: '23/8 – 22/9 (Virgo)' },
  // 10 — Wheel of Fortune: Jupiter
  { element: 'Fire', astrology: { kind: 'planet', planet: 'Jupiter' }, yesNo: 'Yes', timing: '3–12 tháng' },
  // 11 — Justice: Libra
  { element: 'Air', astrology: { kind: 'zodiac', sign: 'Libra', planet: 'Venus', dates: '23/9 – 22/10' }, yesNo: 'Maybe', timing: '23/9 – 22/10 (Libra)' },
  // 12 — The Hanged Man: Neptune (water, surrender)
  { element: 'Water', astrology: { kind: 'planet', planet: 'Neptune' }, yesNo: 'No', timing: 'Chậm, treo cẩn thận (Neptune)' },
  // 13 — Death: Scorpio
  { element: 'Water', astrology: { kind: 'zodiac', sign: 'Scorpio', planet: 'Mars', dates: '23/10 – 21/11' }, yesNo: 'No', timing: '23/10 – 21/11 (Scorpio)' },
  // 14 — Temperance: Sagittarius
  { element: 'Fire', astrology: { kind: 'zodiac', sign: 'Sagittarius', planet: 'Jupiter', dates: '22/11 – 21/12' }, yesNo: 'Yes', timing: '22/11 – 21/12 (Sagittarius)' },
  // 15 — The Devil: Capricorn
  { element: 'Earth', astrology: { kind: 'zodiac', sign: 'Capricorn', planet: 'Saturn', dates: '22/12 – 19/1' }, yesNo: 'No', timing: '22/12 – 19/1 (Capricorn)' },
  // 16 — The Tower: Mars
  { element: 'Fire', astrology: { kind: 'planet', planet: 'Mars' }, yesNo: 'No', timing: 'Đột ngột, trong tuần' },
  // 17 — The Star: Aquarius
  { element: 'Air', astrology: { kind: 'zodiac', sign: 'Aquarius', planet: 'Saturn', dates: '20/1 – 18/2' }, yesNo: 'Yes', timing: '20/1 – 18/2 (Aquarius)' },
  // 18 — The Moon: Pisces
  { element: 'Water', astrology: { kind: 'zodiac', sign: 'Pisces', planet: 'Jupiter', dates: '19/2 – 20/3' }, yesNo: 'No', timing: '19/2 – 20/3 (Pisces)' },
  // 19 — The Sun: Sun
  { element: 'Fire', astrology: { kind: 'planet', planet: 'Sun' }, yesNo: 'Yes', timing: 'Trong ngày, mùa hè' },
  // 20 — Judgement: Pluto (transformation, fire)
  { element: 'Fire', astrology: { kind: 'planet', planet: 'Pluto' }, yesNo: 'Yes', timing: 'Chuyển hóa dài hạn (Pluto)' },
  // 21 — The World: Saturn (completion, earth)
  { element: 'Earth', astrology: { kind: 'planet', planet: 'Saturn' }, yesNo: 'Yes', timing: 'Cuối chu kỳ, 1 năm' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Minor Arcana — decans for Ace–10 (ids 22–63)
// ─────────────────────────────────────────────────────────────────────────────
// Each suit spans 3 zodiac signs (its element's signs). Each sign has 3 decans
// (10° each), ruled by a planet in the Chaldean order. The numbering follows
// the Golden Dawn assignment: 2,3,4 = first sign's decans; 5,6,7 = second;
// 8,9,10 = third. The Ace is the element itself (no decan).
//
// Decan rulers follow the Chaldean sequence: Saturn, Jupiter, Mars, Sun, Venus,
// Mercury, Moon — cycling through the 36 decans starting from Aries.

interface DecanDef {
  rank: number // 2–10 (Ace handled separately)
  sign: ZodiacSign
  planet: Planet
  dates: string
  yesNo: 'Yes' | 'No' | 'Maybe'
}

// Wands = Fire → Aries, Leo, Sagittarius
const WANDS_DECANS: DecanDef[] = [
  { rank: 2, sign: 'Aries', planet: 'Mars', dates: '21/3 – 30/3', yesNo: 'Yes' },
  { rank: 3, sign: 'Aries', planet: 'Sun', dates: '31/3 – 9/4', yesNo: 'Yes' },
  { rank: 4, sign: 'Aries', planet: 'Venus', dates: '10/4 – 19/4', yesNo: 'Maybe' },
  { rank: 5, sign: 'Leo', planet: 'Saturn', dates: '23/7 – 1/8', yesNo: 'No' },
  { rank: 6, sign: 'Leo', planet: 'Jupiter', dates: '2/8 – 11/8', yesNo: 'Yes' },
  { rank: 7, sign: 'Leo', planet: 'Mars', dates: '12/8 – 22/8', yesNo: 'Yes' },
  { rank: 8, sign: 'Sagittarius', planet: 'Mercury', dates: '22/11 – 1/12', yesNo: 'Maybe' },
  { rank: 9, sign: 'Sagittarius', planet: 'Moon', dates: '2/12 – 11/12', yesNo: 'Yes' },
  { rank: 10, sign: 'Sagittarius', planet: 'Saturn', dates: '12/12 – 21/12', yesNo: 'Maybe' },
]

// Cups = Water → Cancer, Scorpio, Pisces
const CUPS_DECANS: DecanDef[] = [
  { rank: 2, sign: 'Cancer', planet: 'Venus', dates: '21/6 – 1/7', yesNo: 'Yes' },
  { rank: 3, sign: 'Cancer', planet: 'Mercury', dates: '2/7 – 11/7', yesNo: 'Yes' },
  { rank: 4, sign: 'Cancer', planet: 'Moon', dates: '12/7 – 22/7', yesNo: 'Maybe' },
  { rank: 5, sign: 'Scorpio', planet: 'Mars', dates: '23/10 – 1/11', yesNo: 'No' },
  { rank: 6, sign: 'Scorpio', planet: 'Sun', dates: '2/11 – 11/11', yesNo: 'Yes' },
  { rank: 7, sign: 'Scorpio', planet: 'Venus', dates: '12/11 – 21/11', yesNo: 'Maybe' },
  { rank: 8, sign: 'Pisces', planet: 'Saturn', dates: '19/2 – 28/2', yesNo: 'No' },
  { rank: 9, sign: 'Pisces', planet: 'Jupiter', dates: '1/3 – 10/3', yesNo: 'Yes' },
  { rank: 10, sign: 'Pisces', planet: 'Mars', dates: '11/3 – 20/3', yesNo: 'Maybe' },
]

// Swords = Air → Gemini, Libra, Aquarius
const SWORDS_DECANS: DecanDef[] = [
  { rank: 2, sign: 'Gemini', planet: 'Jupiter', dates: '21/5 – 31/5', yesNo: 'Maybe' },
  { rank: 3, sign: 'Gemini', planet: 'Mars', dates: '1/6 – 10/6', yesNo: 'No' },
  { rank: 4, sign: 'Gemini', planet: 'Sun', dates: '11/6 – 20/6', yesNo: 'Maybe' },
  { rank: 5, sign: 'Libra', planet: 'Saturn', dates: '23/9 – 2/10', yesNo: 'No' },
  { rank: 6, sign: 'Libra', planet: 'Mercury', dates: '3/10 – 12/10', yesNo: 'Maybe' },
  { rank: 7, sign: 'Libra', planet: 'Moon', dates: '13/10 – 22/10', yesNo: 'No' },
  { rank: 8, sign: 'Aquarius', planet: 'Mercury', dates: '20/1 – 29/1', yesNo: 'Maybe' },
  { rank: 9, sign: 'Aquarius', planet: 'Venus', dates: '30/1 – 8/2', yesNo: 'Yes' },
  { rank: 10, sign: 'Aquarius', planet: 'Moon', dates: '9/2 – 18/2', yesNo: 'No' },
]

// Pentacles = Earth → Taurus, Virgo, Capricorn
const PENTACLES_DECANS: DecanDef[] = [
  { rank: 2, sign: 'Taurus', planet: 'Mercury', dates: '20/4 – 29/4', yesNo: 'Yes' },
  { rank: 3, sign: 'Taurus', planet: 'Moon', dates: '30/4 – 9/5', yesNo: 'Yes' },
  { rank: 4, sign: 'Taurus', planet: 'Saturn', dates: '10/5 – 20/5', yesNo: 'Maybe' },
  { rank: 5, sign: 'Virgo', planet: 'Sun', dates: '23/8 – 1/9', yesNo: 'No' },
  { rank: 6, sign: 'Virgo', planet: 'Venus', dates: '2/9 – 11/9', yesNo: 'Yes' },
  { rank: 7, sign: 'Virgo', planet: 'Mercury', dates: '12/9 – 22/9', yesNo: 'Maybe' },
  { rank: 8, sign: 'Capricorn', planet: 'Jupiter', dates: '22/12 – 31/12', yesNo: 'No' },
  { rank: 9, sign: 'Capricorn', planet: 'Mars', dates: '1/1 – 9/1', yesNo: 'Maybe' },
  { rank: 10, sign: 'Capricorn', planet: 'Sun', dates: '10/1 – 19/1', yesNo: 'Yes' },
]

// Court cards (Page, Knight, Queen, King = ranks 11–14): element of the suit
// combined with a court-element sub-attribution. No decan. Yes/No by tradition
// (Pages = Maybe, Knights = Yes/No by suit, Queens = Yes, Kings = Yes).
interface CourtDef {
  rank: number
  yesNo: 'Yes' | 'No' | 'Maybe'
  courtElement: Element
}
const COURT_DEFS: CourtDef[] = [
  { rank: 11, yesNo: 'Maybe', courtElement: 'Earth' }, // Page = Earth of the suit
  { rank: 12, yesNo: 'Yes', courtElement: 'Fire' },   // Knight = Fire of the suit
  { rank: 13, yesNo: 'Yes', courtElement: 'Water' },   // Queen = Water of the suit
  { rank: 14, yesNo: 'Yes', courtElement: 'Air' },     // King = Air of the suit
]

// ─────────────────────────────────────────────────────────────────────────────
// Assemble the full lookup
// ─────────────────────────────────────────────────────────────────────────────
function buildCorrespondences(): Record<number, Correspondence> {
  const map: Record<number, Correspondence> = {}

  // Majors 0–21
  MAJOR_CORRESPONDENCES.forEach((c, i) => {
    map[i] = c
  })

  // Minors: 4 suits, ids start at 22, 36, 50, 64
  const suitConfigs: { suit: string; startId: number; decans: DecanDef[] }[] = [
    { suit: 'wands', startId: 22, decans: WANDS_DECANS },
    { suit: 'cups', startId: 36, decans: CUPS_DECANS },
    { suit: 'swords', startId: 50, decans: SWORDS_DECANS },
    { suit: 'pentacles', startId: 64, decans: PENTACLES_DECANS },
  ]

  for (const { suit, startId, decans } of suitConfigs) {
    const element = SUIT_ELEMENT[suit]
    const timing = SUIT_TIMING[suit]

    // Ace (rank 1) = pure element, no decan
    map[startId] = {
      element,
      astrology: { kind: 'element' },
      yesNo: 'Yes',
      timing,
    }

    // Numbered 2–10 = decans
    for (const d of decans) {
      const id = startId + (d.rank - 1) // rank 2 → id+1, rank 10 → id+9
      map[id] = {
        element,
        astrology: { kind: 'decan', sign: d.sign, planet: d.planet, dates: d.dates },
        yesNo: d.yesNo,
        timing: `${d.dates} (${d.sign})`,
      }
    }

    // Court 11–14 = element + court sub-element
    for (const c of COURT_DEFS) {
      const id = startId + (c.rank - 1) // rank 11 → id+10, rank 14 → id+13
      map[id] = {
        element,
        astrology: { kind: 'element' },
        yesNo: c.yesNo,
        timing,
      }
    }
  }

  return map
}

export const CORRESPONDENCES: Record<number, Correspondence> = buildCorrespondences()

/** Get correspondence for a card id; returns undefined if somehow missing. */
export function getCorrespondence(cardId: number): Correspondence | undefined {
  return CORRESPONDENCES[cardId]
}

// ─────────────────────────────────────────────────────────────────────────────
// Elemental dignity computation
// ─────────────────────────────────────────────────────────────────────────────
// Golden Dawn elemental dignities:
//   Same element     → strengthened (mutually reinforcing)
//   Fire ↔ Air       → friendly (both hot/active)
//   Water ↔ Earth    → friendly (both cold/passive)
//   Fire ↔ Water     → hostile (opposite)
//   Air ↔ Earth      → hostile (opposite)
//   (Same-suit pairs are "strengthened")

export type DignityRelation = 'strengthened' | 'friendly' | 'hostile' | 'neutral'

export interface DignityResult {
  pair: [Element, Element]
  relation: DignityRelation
  /** Vietnamese gloss of the relationship for the prompt. */
  gloss: string
}

const DIGNITY_MAP: Record<string, DignityRelation> = {
  'Fire+Fire': 'strengthened',
  'Water+Water': 'strengthened',
  'Air+Air': 'strengthened',
  'Earth+Earth': 'strengthened',
  'Fire+Air': 'friendly',
  'Air+Fire': 'friendly',
  'Water+Earth': 'friendly',
  'Earth+Water': 'friendly',
  'Fire+Water': 'hostile',
  'Water+Fire': 'hostile',
  'Air+Earth': 'hostile',
  'Earth+Air': 'hostile',
}

const DIGNITY_GLOSS: Record<DignityRelation, string> = {
  strengthened: 'cùng nguyên tố — tăng cường lẫn nhau',
  friendly: 'hỗ trợ — cùng tính chất',
  hostile: 'căng thẳng — nguyên tố đối lập',
  neutral: 'trung tính',
}

/**
 * Compute elemental dignities for a set of drawn cards. Returns one result per
 * *unique* element pair present (not per card pair — that would be O(n²) and
 * noisy). If a spread has 3 Fire cards + 1 Water, you get one "Fire+Fire
 * strengthened" and one "Fire+Water hostile".
 */
export function computeDignities(elements: Element[]): DignityResult[] {
  const present = [...new Set(elements)]
  const results: DignityResult[] = []

  // Same-element presence (if ≥2 cards share an element, it's strengthened)
  const counts: Partial<Record<Element, number>> = {}
  for (const e of elements) counts[e] = (counts[e] ?? 0) + 1
  for (const [el, count] of Object.entries(counts)) {
    if ((count ?? 0) >= 2) {
      const e = el as Element
      results.push({
        pair: [e, e],
        relation: 'strengthened',
        gloss: DIGNITY_GLOSS.strengthened,
      })
    }
  }

  // Cross-element pairs
  for (let i = 0; i < present.length; i++) {
    for (let j = i + 1; j < present.length; j++) {
      const a = present[i]
      const b = present[j]
      const key = `${a}+${b}`
      const relation = DIGNITY_MAP[key] ?? 'neutral'
      if (relation === 'neutral') continue
      results.push({
        pair: [a, b],
        relation,
        gloss: DIGNITY_GLOSS[relation],
      })
    }
  }

  return results
}

// ─────────────────────────────────────────────────────────────────────────────
// Reading metadata (computed, deterministic — no LLM needed)
// ─────────────────────────────────────────────────────────────────────────────

export interface DominantCardInfo {
  id: number
  name: string
  reason: string
}

export interface CrossCardSummary {
  major: number
  minor: number
  court: number
  upright: number
  reversed: number
  suits: Record<string, number>
  elements: Record<Element, number>
  yesNo: { Yes: number; No: number; Maybe: number }
}

export interface ReadingMeta {
  dominantCard: DominantCardInfo | null
  crossCardSummary: CrossCardSummary
  dignities: DignityResult[]
}

interface CardLike {
  id: number
  name: string
  arcana: 'major' | 'minor'
  suit?: string
}

interface DrawnLike {
  card: CardLike
  reversed: boolean
}

/**
 * Compute structured reading metadata from the drawn cards. Deterministic —
 * safe to run before the LLM call. Used for the `meta` SSE event + the UI
 * metadata panel.
 */
export function computeReadingMeta(drawn: DrawnLike[]): ReadingMeta {
  const summary: CrossCardSummary = {
    major: 0,
    minor: 0,
    court: 0,
    upright: 0,
    reversed: 0,
    suits: {},
    elements: { Fire: 0, Water: 0, Air: 0, Earth: 0 },
    yesNo: { Yes: 0, No: 0, Maybe: 0 },
  }

  const elementList: Element[] = []

  for (const d of drawn) {
    const c = d.card
    if (c.arcana === 'major') summary.major++
    else {
      summary.minor++
      // Court = ranks 11–14 → ids where (id - 22) % 14 >= 10
      const rank = c.arcana === 'minor' ? ((c.id - 22) % 14) + 1 : 0
      if (rank >= 11) summary.court++
    }

    if (d.reversed) summary.reversed++
    else summary.upright++

    if (c.suit) summary.suits[c.suit] = (summary.suits[c.suit] ?? 0) + 1

    const corr = getCorrespondence(c.id)
    if (corr) {
      summary.elements[corr.element]++
      elementList.push(corr.element)
      summary.yesNo[corr.yesNo]++
    }
  }

  // Dominant card heuristic:
  // 1. If there's exactly one Major, it's the dominant card.
  // 2. Else, the card whose element appears most in the spread.
  // 3. Else (all neutral / single card), the first card.
  let dominant: DominantCardInfo | null = null
  const majors = drawn.filter((d) => d.card.arcana === 'major')
  if (majors.length === 1) {
    dominant = {
      id: majors[0].card.id,
      name: majors[0].card.name,
      reason: 'Lá Major Arcana duy nhất — năng lượng chủ đạo của trải bài.',
    }
  } else if (elementList.length > 0) {
    // Find the element with the highest count, then pick the first card of that element.
    const elementCounts: Partial<Record<Element, number>> = {}
    for (const e of elementList) elementCounts[e] = (elementCounts[e] ?? 0) + 1
    let topElement: Element | null = null
    let topCount = 0
    for (const [el, count] of Object.entries(elementCounts)) {
      if ((count ?? 0) > topCount) {
        topCount = count ?? 0
        topElement = el as Element
      }
    }
    if (topElement && topCount >= 2) {
      const domCard = drawn.find((d) => getCorrespondence(d.card.id)?.element === topElement)
      if (domCard) {
        dominant = {
          id: domCard.card.id,
          name: domCard.card.name,
          reason: `Nguyên tố ${topElement} xuất hiện nhiều nhất (${topCount} lá) — năng lượng trội.`,
        }
      }
    }
  }
  if (!dominant && drawn.length > 0) {
    dominant = {
      id: drawn[0].card.id,
      name: drawn[0].card.name,
      reason: 'Lá đầu tiên — tâm điểm trải bài.',
    }
  }

  const dignities = computeDignities(elementList)

  return { dominantCard: dominant, crossCardSummary: summary, dignities }
}
