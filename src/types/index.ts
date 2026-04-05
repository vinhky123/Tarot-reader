export type Arcana = 'major' | 'minor'
export type Suit = 'wands' | 'cups' | 'swords' | 'pentacles'

export interface TarotCard {
  id: number
  name: string
  arcana: Arcana
  suit?: Suit
  upright: string
  reversed: string
  keywords: string[]
}

export interface DrawnCard {
  card: TarotCard
  reversed: boolean
  positionIndex: number
}

export type ReadingStep =
  | 'spread'
  | 'shuffle'
  | 'placed'
  | 'reading'
  | 'done'

/** Một lượt trong hội thoại reader (gửi lên Gemini đa lượt). */
export interface ReaderTurn {
  role: 'user' | 'model'
  text: string
}
