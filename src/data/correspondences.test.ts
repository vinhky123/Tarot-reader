import { describe, it, expect } from 'vitest'
import {
  CORRESPONDENCES,
  getCorrespondence,
  computeDignities,
  computeReadingMeta,
} from './correspondences'

describe('CORRESPONDENCES data integrity', () => {
  it('has exactly 78 entries (ids 0–77)', () => {
    expect(Object.keys(CORRESPONDENCES)).toHaveLength(78)
    for (let i = 0; i < 78; i++) {
      expect(CORRESPONDENCES[i], `card id ${i} missing`).toBeDefined()
    }
  })

  it('every entry has element, astrology, yesNo, and timing', () => {
    for (const [, c] of Object.entries(CORRESPONDENCES)) {
      expect(c.element).toMatch(/^(Fire|Water|Air|Earth)$/)
      expect(c.astrology).toBeDefined()
      expect(c.yesNo).toMatch(/^(Yes|No|Maybe)$/)
      expect(typeof c.timing).toBe('string')
      expect(c.timing.length).toBeGreaterThan(0)
    }
  })
})

describe('Major Arcana correspondences (Golden Dawn / Liber 777)', () => {
  it('The Emperor (id 4) = Aries / Fire', () => {
    const c = CORRESPONDENCES[4]
    expect(c.element).toBe('Fire')
    expect(c.astrology.kind).toBe('zodiac')
    if (c.astrology.kind === 'zodiac') expect(c.astrology.sign).toBe('Aries')
  })

  it('The Hierophant (id 5) = Taurus / Earth', () => {
    const c = CORRESPONDENCES[5]
    expect(c.element).toBe('Earth')
    if (c.astrology.kind === 'zodiac') expect(c.astrology.sign).toBe('Taurus')
  })

  it('The Lovers (id 6) = Gemini / Air', () => {
    const c = CORRESPONDENCES[6]
    expect(c.element).toBe('Air')
    if (c.astrology.kind === 'zodiac') expect(c.astrology.sign).toBe('Gemini')
  })

  it('Death (id 13) = Scorpio / Water', () => {
    const c = CORRESPONDENCES[13]
    expect(c.element).toBe('Water')
    if (c.astrology.kind === 'zodiac') expect(c.astrology.sign).toBe('Scorpio')
  })

  it('The Tower (id 16) = Mars / Fire', () => {
    const c = CORRESPONDENCES[16]
    expect(c.element).toBe('Fire')
    expect(c.astrology.kind).toBe('planet')
    if (c.astrology.kind === 'planet') expect(c.astrology.planet).toBe('Mars')
  })

  it('The Star (id 17) = Aquarius / Air', () => {
    const c = CORRESPONDENCES[17]
    expect(c.element).toBe('Air')
    if (c.astrology.kind === 'zodiac') expect(c.astrology.sign).toBe('Aquarius')
  })

  it('uses the Waite ordering: Strength=8, Justice=11', () => {
    expect(CORRESPONDENCES[8].element).toBe('Fire') // Strength = Leo
    if (CORRESPONDENCES[8].astrology.kind === 'zodiac')
      expect(CORRESPONDENCES[8].astrology.sign).toBe('Leo')
    expect(CORRESPONDENCES[11].element).toBe('Air') // Justice = Libra
    if (CORRESPONDENCES[11].astrology.kind === 'zodiac')
      expect(CORRESPONDENCES[11].astrology.sign).toBe('Libra')
  })
})

describe('Minor Arcana decans', () => {
  it('all suit elements match SUIT_ELEMENT', () => {
    // Wands 22–35 = Fire, Cups 36–49 = Water, Swords 50–63 = Air, Pentacles 64–77 = Earth
    for (let id = 22; id <= 35; id++)
      expect(CORRESPONDENCES[id].element).toBe('Fire')
    for (let id = 36; id <= 49; id++)
      expect(CORRESPONDENCES[id].element).toBe('Water')
    for (let id = 50; id <= 63; id++)
      expect(CORRESPONDENCES[id].element).toBe('Air')
    for (let id = 64; id <= 77; id++)
      expect(CORRESPONDENCES[id].element).toBe('Earth')
  })

  it('2 of Wands (id 23) = Mars in Aries (first decan of Aries)', () => {
    const c = CORRESPONDENCES[23]
    expect(c.astrology.kind).toBe('decan')
    if (c.astrology.kind === 'decan') {
      expect(c.astrology.sign).toBe('Aries')
      expect(c.astrology.planet).toBe('Mars')
    }
  })

  it('2 of Cups (id 37) = Venus in Cancer (first decan of Cancer)', () => {
    const c = CORRESPONDENCES[37]
    expect(c.astrology.kind).toBe('decan')
    if (c.astrology.kind === 'decan') {
      expect(c.astrology.sign).toBe('Cancer')
      expect(c.astrology.planet).toBe('Venus')
    }
  })

  it('Aces have no decan (pure element)', () => {
    for (const aceId of [22, 36, 50, 64]) {
      expect(CORRESPONDENCES[aceId].astrology.kind).toBe('element')
    }
  })

  it('court cards (ranks 11–14) have no decan', () => {
    // rank 11 = id+10, rank 14 = id+13
    for (const startId of [22, 36, 50, 64]) {
      for (let r = 11; r <= 14; r++) {
        const id = startId + (r - 1)
        expect(CORRESPONDENCES[id].astrology.kind).toBe('element')
      }
    }
  })
})

describe('getCorrespondence', () => {
  it('returns the entry for a valid id', () => {
    expect(getCorrespondence(0)?.element).toBe('Air')
  })

  it('returns undefined for invalid ids', () => {
    expect(getCorrespondence(-1)).toBeUndefined()
    expect(getCorrespondence(999)).toBeUndefined()
  })
})

describe('computeDignities', () => {
  it('same element ≥2 → strengthened', () => {
    const result = computeDignities(['Fire', 'Fire', 'Water'])
    expect(result.some((d) => d.relation === 'strengthened')).toBe(true)
  })

  it('Fire + Air → friendly', () => {
    const result = computeDignities(['Fire', 'Air'])
    expect(result.some((d) => d.relation === 'friendly')).toBe(true)
  })

  it('Fire + Water → hostile', () => {
    const result = computeDignities(['Fire', 'Water'])
    expect(result.some((d) => d.relation === 'hostile')).toBe(true)
  })

  it('Water + Earth → friendly', () => {
    const result = computeDignities(['Water', 'Earth'])
    expect(result.some((d) => d.relation === 'friendly')).toBe(true)
  })

  it('Air + Earth → hostile', () => {
    const result = computeDignities(['Air', 'Earth'])
    expect(result.some((d) => d.relation === 'hostile')).toBe(true)
  })

  it('empty or single element → no results', () => {
    expect(computeDignities([])).toHaveLength(0)
    expect(computeDignities(['Fire'])).toHaveLength(0)
  })

  it('returns gloss strings for each result', () => {
    const result = computeDignities(['Fire', 'Water'])
    for (const d of result) {
      expect(typeof d.gloss).toBe('string')
      expect(d.gloss.length).toBeGreaterThan(0)
    }
  })
})

describe('computeReadingMeta', () => {
  it('identifies the sole Major as dominant', () => {
    const drawn = [
      { card: { id: 4, name: 'The Emperor', arcana: 'major' as const }, reversed: false },
      { card: { id: 23, name: '2 of Wands', arcana: 'minor' as const, suit: 'wands' }, reversed: false },
    ]
    const meta = computeReadingMeta(drawn)
    expect(meta.dominantCard?.id).toBe(4)
    expect(meta.dominantCard?.reason).toContain('Major Arcana duy nhất')
  })

  it('counts Major/Minor/upright/reversed correctly', () => {
    const drawn = [
      { card: { id: 0, name: 'Fool', arcana: 'major' as const }, reversed: false },
      { card: { id: 1, name: 'Magician', arcana: 'major' as const }, reversed: true },
      { card: { id: 23, name: '2 of Wands', arcana: 'minor' as const, suit: 'wands' }, reversed: false },
    ]
    const meta = computeReadingMeta(drawn)
    expect(meta.crossCardSummary.major).toBe(2)
    expect(meta.crossCardSummary.minor).toBe(1)
    expect(meta.crossCardSummary.upright).toBe(2)
    expect(meta.crossCardSummary.reversed).toBe(1)
  })

  it('counts elements from correspondences', () => {
    const drawn = [
      { card: { id: 4, name: 'Emperor', arcana: 'major' as const }, reversed: false }, // Fire
      { card: { id: 37, name: '2 of Cups', arcana: 'minor' as const, suit: 'cups' }, reversed: false }, // Water
    ]
    const meta = computeReadingMeta(drawn)
    expect(meta.crossCardSummary.elements.Fire).toBe(1)
    expect(meta.crossCardSummary.elements.Water).toBe(1)
  })

  it('detects hostile dignity (Fire + Water)', () => {
    const drawn = [
      { card: { id: 4, name: 'Emperor', arcana: 'major' as const }, reversed: false },
      { card: { id: 37, name: '2 of Cups', arcana: 'minor' as const, suit: 'cups' }, reversed: false },
    ]
    const meta = computeReadingMeta(drawn)
    expect(meta.dignities.some((d) => d.relation === 'hostile')).toBe(true)
  })

  it('falls back to first card when no Major and no dominant element', () => {
    const drawn = [
      { card: { id: 22, name: 'Ace of Wands', arcana: 'minor' as const, suit: 'wands' }, reversed: false },
    ]
    const meta = computeReadingMeta(drawn)
    expect(meta.dominantCard?.id).toBe(22)
  })
})
