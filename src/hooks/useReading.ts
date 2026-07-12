import { useCallback, useRef, useState } from 'react'
import type { DrawnCard, ReaderTurn, ReadingStep } from '../types'
import { TAROT_CARDS } from '../data/tarotCards'
import { getSpreadById } from '../data/spreads'
import type { ReadingMeta } from '../data/correspondences'

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
  const [readingMeta, setReadingMeta] = useState<ReadingMeta | null>(null)
  const [readerThread, setReaderThread] = useState<ReaderTurn[]>([])
  const [chatSending, setChatSending] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [userQuestion, setUserQuestion] = useState('')
  const flipAllTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  // AbortController for the in-flight Gemini request (reading or chat).
  // Aborted whenever the user navigates away, resets, or starts a new draw —
  // prevents a late response from overwriting fresh state.
  const inflightRef = useRef<AbortController | null>(null)

  const spread = spreadId ? getSpreadById(spreadId) : undefined

  const clearFlipAllTimeouts = useCallback(() => {
    for (const id of flipAllTimeoutsRef.current) {
      clearTimeout(id)
    }
    flipAllTimeoutsRef.current = []
  }, [])

  /** Cancel any in-flight API request. Safe to call when nothing is running. */
  const abortInflight = useCallback(() => {
    if (inflightRef.current) {
      inflightRef.current.abort()
      inflightRef.current = null
    }
  }, [])

  const selectSpread = useCallback((id: string) => {
    clearFlipAllTimeouts()
    abortInflight()
    setSpreadId(id)
    setDrawn(null)
    setCardFaceUp([])
    setReadingText(null)
    setReadingMeta(null)
    setReaderThread([])
    setChatError(null)
    setError(null)
    setStep('spread')
  }, [clearFlipAllTimeouts, abortInflight])

  const startShuffleAndDraw = useCallback(() => {
    if (!spread) return
    clearFlipAllTimeouts()
    abortInflight()
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
    setReadingMeta(null)
    setReaderThread([])
    setChatError(null)
    setError(null)
    setStep('shuffle')
  }, [spread, clearFlipAllTimeouts, abortInflight])

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
    abortInflight()
    const controller = new AbortController()
    inflightRef.current = controller
    setStep('reading')
    setError(null)
    setReadingText(null)
    setReadingMeta(null)
    setReaderThread([])
    setChatError(null)
    try {
      const { requestTarotReading, getInitialReaderThread } = await import(
        '../services/gemini'
      )
      // Stream: update readingText incrementally so the UI can render partial
      // output as it arrives. Each setReadingText here is additive.
      let acc = ''
      const text = await requestTarotReading(
        spread,
        drawn,
        userQuestion,
        (delta) => {
          acc += delta
          // Only flip to 'reading'→'done' flow once we have real content; while
          // streaming we keep step='reading' so the spinner stays but the
          // partial text renders below it.
          setReadingText(acc)
        },
        controller.signal,
        (meta) => setReadingMeta(meta),
      )
      setReadingText(text)
      setReaderThread(getInitialReaderThread(spread, drawn, userQuestion, text))
      setStep('done')
    } catch (e) {
      if (controller.signal.aborted) return // user navigated away — silent
      const msg = e instanceof Error ? e.message : 'Lỗi không xác định'
      setError(msg)
      setStep('placed')
    } finally {
      if (inflightRef.current === controller) inflightRef.current = null
    }
  }, [spread, drawn, userQuestion, cardFaceUp, clearFlipAllTimeouts, abortInflight])

  const sendReaderMessage = useCallback(
    async (input: string) => {
      const t = input.trim()
      if (!t || readerThread.length < 2) return
      abortInflight()
      const controller = new AbortController()
      inflightRef.current = controller
      const before = readerThread
      const withUser: ReaderTurn[] = [...before, { role: 'user', text: t }]
      setReaderThread(withUser)
      setChatSending(true)
      setChatError(null)
      try {
        const { continueReaderConversation } = await import('../services/gemini')
        // Stream: append a placeholder model turn and grow it as chunks arrive.
        let acc = ''
        setReaderThread([...withUser, { role: 'model', text: '' }])
        const reply = await continueReaderConversation(
          withUser,
          (delta) => {
            acc += delta
            setReaderThread([...withUser, { role: 'model', text: acc }])
          },
          controller.signal,
        )
        setReaderThread([...withUser, { role: 'model', text: reply }])
      } catch (e) {
        // On abort, roll back the optimistic user turn and stay quiet.
        if (controller.signal.aborted) {
          setReaderThread(before)
          return
        }
        setReaderThread(before)
        setChatError(e instanceof Error ? e.message : 'Lỗi không xác định')
      } finally {
        if (inflightRef.current === controller) inflightRef.current = null
        setChatSending(false)
      }
    },
    [readerThread, abortInflight],
  )

  const resetAll = useCallback(() => {
    clearFlipAllTimeouts()
    abortInflight()
    setSpreadId(null)
    setDrawn(null)
    setCardFaceUp([])
    setReadingText(null)
    setReadingMeta(null)
    setReaderThread([])
    setChatError(null)
    setChatSending(false)
    setError(null)
    setUserQuestion('')
    setStep('spread')
  }, [clearFlipAllTimeouts, abortInflight])

  return {
    step,
    spreadId,
    spread,
    drawn,
    cardFaceUp,
    readingText,
    readingMeta,
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
