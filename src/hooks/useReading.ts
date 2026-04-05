import { useCallback, useRef, useState } from 'react'
import type { DrawnCard, ReaderTurn, ReadingStep } from '../types'
import { TAROT_CARDS } from '../data/tarotCards'
import { getSpreadById } from '../data/spreads'

function shuffleIndices(): number[] {
  const a = TAROT_CARDS.map((_, i) => i)
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function falses(n: number): boolean[] {
  return Array.from({ length: n }, () => false)
}

export function useReading() {
  const [step, setStep] = useState<ReadingStep>('spread')
  const [spreadId, setSpreadId] = useState<string | null>(null)
  const [drawn, setDrawn] = useState<DrawnCard[] | null>(null)
  const [cardFaceUp, setCardFaceUp] = useState<boolean[]>([])
  const [readingText, setReadingText] = useState<string | null>(null)
  const [readerThread, setReaderThread] = useState<ReaderTurn[]>([])
  const [chatSending, setChatSending] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [userQuestion, setUserQuestion] = useState('')
  const flipAllTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const spread = spreadId ? getSpreadById(spreadId) : undefined

  const clearFlipAllTimeouts = useCallback(() => {
    for (const id of flipAllTimeoutsRef.current) {
      clearTimeout(id)
    }
    flipAllTimeoutsRef.current = []
  }, [])

  const selectSpread = useCallback((id: string) => {
    clearFlipAllTimeouts()
    setSpreadId(id)
    setDrawn(null)
    setCardFaceUp([])
    setReadingText(null)
    setReaderThread([])
    setChatError(null)
    setError(null)
    setStep('spread')
  }, [clearFlipAllTimeouts])

  const startShuffleAndDraw = useCallback(() => {
    if (!spread) return
    clearFlipAllTimeouts()
    const deck = shuffleIndices()
    const picked = deck.slice(0, spread.cardCount)
    const next: DrawnCard[] = picked.map((cardId, i) => ({
      card: TAROT_CARDS[cardId],
      reversed: Math.random() < 0.5,
      positionIndex: i,
    }))
    setDrawn(next)
    setCardFaceUp(falses(next.length))
    setReadingText(null)
    setReaderThread([])
    setChatError(null)
    setError(null)
    setStep('shuffle')
  }, [spread, clearFlipAllTimeouts])

  const finishShuffle = useCallback(() => {
    setStep('placed')
  }, [])

  const toggleCardFace = useCallback(
    (index: number) => {
      if (step !== 'placed') return
      clearFlipAllTimeouts()
      setCardFaceUp((prev) => {
        if (index < 0 || index >= prev.length) return prev
        const next = [...prev]
        next[index] = !next[index]
        return next
      })
    },
    [step, clearFlipAllTimeouts],
  )

  const flipAllCards = useCallback(() => {
    if (!drawn?.length || step !== 'placed') return
    clearFlipAllTimeouts()
    const n = drawn.length
    const staggerMs = 70
    for (let i = 0; i < n; i++) {
      const id = setTimeout(() => {
        setCardFaceUp((prev) => {
          if (prev.length !== n) return prev
          const next = [...prev]
          next[i] = true
          return next
        })
      }, i * staggerMs)
      flipAllTimeoutsRef.current.push(id)
    }
  }, [drawn, step, clearFlipAllTimeouts])

  const runReading = useCallback(async () => {
    if (!spread || !drawn?.length) return
    if (!cardFaceUp.length || cardFaceUp.length !== drawn.length) return
    if (!cardFaceUp.every(Boolean)) return
    clearFlipAllTimeouts()
    setStep('reading')
    setError(null)
    setReadingText(null)
    setReaderThread([])
    setChatError(null)
    try {
      const { requestTarotReading, getInitialReaderThread } = await import(
        '../services/gemini'
      )
      const text = await requestTarotReading(spread, drawn, userQuestion)
      setReadingText(text)
      setReaderThread(getInitialReaderThread(spread, drawn, userQuestion, text))
      setStep('done')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Lỗi không xác định'
      setError(msg)
      setStep('placed')
    }
  }, [spread, drawn, userQuestion, cardFaceUp, clearFlipAllTimeouts])

  const sendReaderMessage = useCallback(
    async (input: string) => {
      const t = input.trim()
      if (!t || readerThread.length < 2) return
      const before = readerThread
      const withUser: ReaderTurn[] = [...before, { role: 'user', text: t }]
      setReaderThread(withUser)
      setChatSending(true)
      setChatError(null)
      try {
        const { continueReaderConversation } = await import('../services/gemini')
        const reply = await continueReaderConversation(withUser)
        setReaderThread([...withUser, { role: 'model', text: reply }])
      } catch (e) {
        setReaderThread(before)
        setChatError(e instanceof Error ? e.message : 'Lỗi không xác định')
      } finally {
        setChatSending(false)
      }
    },
    [readerThread],
  )

  const resetAll = useCallback(() => {
    clearFlipAllTimeouts()
    setSpreadId(null)
    setDrawn(null)
    setCardFaceUp([])
    setReadingText(null)
    setReaderThread([])
    setChatError(null)
    setChatSending(false)
    setError(null)
    setUserQuestion('')
    setStep('spread')
  }, [clearFlipAllTimeouts])

  return {
    step,
    spreadId,
    spread,
    drawn,
    cardFaceUp,
    readingText,
    readerThread,
    chatSending,
    chatError,
    error,
    userQuestion,
    setUserQuestion,
    selectSpread,
    startShuffleAndDraw,
    finishShuffle,
    toggleCardFace,
    flipAllCards,
    runReading,
    sendReaderMessage,
    resetAll,
  }
}
