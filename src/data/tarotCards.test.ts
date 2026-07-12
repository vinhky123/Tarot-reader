import { describe, it, expect } from 'vitest'
import { TAROT_CARDS, getCardById } from './tarotCards'
import { SPREADS, getSpreadById } from './spreads'

describe('TAROT_CARDS data integrity', () => {
  it('has exactly 78 cards', () => {
    expect(TAROT_CARDS).toHaveLength(78)
  })

  it('has unique ids 0–77', () => {
    const ids = TAROT_CARDS.map((c) => c.id)
    expect(new Set(ids).size).toBe(78)
    for (let i = 0; i < 78; i++) {
      expect(ids).toContain(i)
    }
  })

  it('every card has required string fields', () => {
    for (const card of TAROT_CARDS) {
      expect(typeof card.id).toBe('number')
      expect(typeof card.name).toBe('string')
      expect(card.name.length).toBeGreaterThan(0)
      expect(card.arcana).toMatch(/^(major|minor)$/)
      expect(typeof card.upright).toBe('string')
      expect(card.upright.length).toBeGreaterThan(0)
      expect(typeof card.reversed).toBe('string')
      expect(card.reversed.length).toBeGreaterThan(0)
      expect(Array.isArray(card.keywords)).toBe(true)
      expect(card.keywords.length).toBeGreaterThan(0)
    }
  })

  it('Major Arcana are ids 0–21', () => {
    for (let i = 0; i <= 21; i++) {
      expect(TAROT_CARDS[i].arcana).toBe('major')
      expect(TAROT_CARDS[i].suit).toBeUndefined()
    }
  })

  it('Minor Arcana are ids 22–77 and all have suits', () => {
    for (let i = 22; i <= 77; i++) {
      expect(TAROT_CARDS[i].arcana).toBe('minor')
      expect(TAROT_CARDS[i].suit).toMatch(/^(wands|cups|swords|pentacles)$/)
    }
  })

  it('Minor Arcana suits are in Golden Dawn order (Wands, Cups, Swords, Pentacles)', () => {
    expect(TAROT_CARDS[22].suit).toBe('wands') // Ace of Wands
    expect(TAROT_CARDS[36].suit).toBe('cups') // Ace of Cups
    expect(TAROT_CARDS[50].suit).toBe('swords') // Ace of Swords
    expect(TAROT_CARDS[64].suit).toBe('pentacles') // Ace of Pentacles
  })

  it('uses Waite ordering: Strength=8, Justice=11 (not the older TdM swap)', () => {
    expect(TAROT_CARDS[8].name).toBe('Strength')
    expect(TAROT_CARDS[11].name).toBe('Justice')
  })

  it('The Fool is id 0, The World is id 21', () => {
    expect(TAROT_CARDS[0].name).toBe('The Fool')
    expect(TAROT_CARDS[21].name).toBe('The World')
  })
})

describe('getCardById', () => {
  it('returns the card for a valid id', () => {
    expect(getCardById(0)?.name).toBe('The Fool')
    expect(getCardById(77)?.name).toBe('King of Pentacles')
  })

  it('returns undefined for out-of-range ids', () => {
    expect(getCardById(-1)).toBeUndefined()
    expect(getCardById(78)).toBeUndefined()
  })
})

describe('SPREADS data integrity', () => {
  it('has 7 spreads after Sprint 3', () => {
    expect(SPREADS).toHaveLength(7)
  })

  it('every spread has positions matching cardCount', () => {
    for (const spread of SPREADS) {
      expect(spread.positions).toHaveLength(spread.cardCount)
      for (const pos of spread.positions) {
        expect(typeof pos.label).toBe('string')
        expect(pos.label.length).toBeGreaterThan(0)
        expect(typeof pos.hint).toBe('string')
        expect(pos.hint.length).toBeGreaterThan(0)
      }
    }
  })

  it('has the expected spread ids', () => {
    const ids = SPREADS.map((s) => s.id).sort()
    expect(ids).toEqual(['career', 'celtic', 'five', 'horseshoe', 'one', 'relationship', 'three'])
  })

  it('Celtic Cross has 10 positions', () => {
    expect(getSpreadById('celtic')?.cardCount).toBe(10)
  })

  it('getSpreadById returns undefined for unknown id', () => {
    expect(getSpreadById('nonexistent')).toBeUndefined()
  })
})
