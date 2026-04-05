import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { ReaderTurn } from '../types'
import { MysticMarkdown } from './MysticMarkdown'

function SendIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  )
}

function TypingBubble() {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl border border-[#f5f0e6]/12 bg-[#0f172a]/55 px-4 py-3"
      aria-hidden
    >
      <span className="font-display text-lg text-[#d4af37]/80" aria-hidden>
        ☾
      </span>
      <div className="flex gap-1.5">
        <span className="mystic-typing-dot inline-block h-2 w-2 rounded-full bg-[#d4af37]/70" />
        <span className="mystic-typing-dot inline-block h-2 w-2 rounded-full bg-[#d4af37]/70" />
        <span className="mystic-typing-dot inline-block h-2 w-2 rounded-full bg-[#d4af37]/70" />
      </div>
    </div>
  )
}

interface ReaderChatProps {
  readingText: string | null
  readerThread: ReaderTurn[]
  chatSending: boolean
  chatError: string | null
  onSend: (message: string) => void | Promise<void>
}

export function ReaderChat({
  readingText,
  readerThread,
  chatSending,
  chatError,
  onSend,
}: ReaderChatProps) {
  const [draft, setDraft] = useState('')
  const listEndRef = useRef<HTMLLIElement>(null)

  const hasChat =
    Boolean(readingText?.trim()) && readerThread.length >= 2
  const followUps = hasChat ? readerThread.slice(2) : []

  useEffect(() => {
    if (!hasChat) return
    listEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [followUps.length, chatSending, hasChat])

  if (!hasChat) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const t = draft.trim()
    if (!t || chatSending) return
    setDraft('')
    await onSend(t)
  }

  return (
    <section className="mx-auto mt-8 w-full max-w-5xl rounded-2xl border border-[#7c3aed]/25 bg-[#0a0a1a]/55 p-5 shadow-[0_0_32px_rgba(124,58,237,0.06)] backdrop-blur-md sm:p-8">
      <h2 className="mystic-gradient-heading block font-display text-xl font-semibold sm:text-2xl">
        Hỏi thêm reader
      </h2>
      <p className="mt-2 font-body text-base text-[#f5f0e6]/60">
        Lời giải đầy đủ nằm ở khung &quot;Lời giải&quot; phía trên. Ở đây bạn có thể
        hỏi tiếp để Oracle làm rõ từng ý.
      </p>

      {(followUps.length > 0 || chatSending) && (
        <ul
          className="mt-6 max-h-[min(28rem,50svh)] space-y-4 overflow-y-auto pr-1"
          aria-label="Tin nhắn hỏi đáp"
        >
          {followUps.map((turn, i) => (
            <li
              key={`${turn.role}-${i}-${turn.text.slice(0, 24)}`}
              className={`flex gap-2 ${turn.role === 'user' ? 'flex-row-reverse justify-start' : 'flex-row justify-start'}`}
            >
              <span
                className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm ${
                  turn.role === 'user'
                    ? 'border-[#d4af37]/35 bg-[#1a0a2e]/80 text-[#d4af37]'
                    : 'border-[#7c3aed]/30 bg-[#0f172a]/80 text-[#d4af37]'
                }`}
                aria-hidden
              >
                {turn.role === 'user' ? '◆' : '☾'}
              </span>
              <div
                className={`max-w-[min(100%,32rem)] rounded-2xl px-4 py-3 sm:px-5 ${
                  turn.role === 'user'
                    ? 'border border-[#d4af37]/35 bg-[#1a0a2e]/8 text-[#f5f0e6]'
                    : 'border border-[#f5f0e6]/12 bg-[#0f172a]/55 text-[#f5f0e6]'
                }`}
              >
                {turn.role === 'model' ? (
                  <MysticMarkdown content={turn.text} variant="compact" />
                ) : (
                  <p className="whitespace-pre-wrap font-body text-base leading-relaxed text-[#f5f0e6]/92">
                    {turn.text}
                  </p>
                )}
              </div>
            </li>
          ))}
          {chatSending && (
            <li className="flex gap-2">
              <span
                className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#7c3aed]/30 bg-[#0f172a]/80 text-sm text-[#d4af37]"
                aria-hidden
              >
                ☾
              </span>
              <TypingBubble />
            </li>
          )}
          <li ref={listEndRef} aria-hidden className="h-0 list-none overflow-hidden p-0 opacity-0" />
        </ul>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-3">
        <label className="sr-only" htmlFor="reader-chat-input">
          Tin nhắn cho reader
        </label>
        <textarea
          id="reader-chat-input"
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={chatSending}
          placeholder="Ví dụ: Phần “tương lai” bạn nói là sao cụ thể hơn?"
          className="w-full resize-y rounded-xl border border-[#f5f0e6]/18 bg-[#0a0a1a]/60 px-4 py-3 font-body text-base text-[#f5f0e6] transition-transform placeholder:text-[#f5f0e6]/35 focus:border-[#7c3aed]/50 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/25 focus-visible:scale-[1.005] disabled:opacity-50"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={chatSending || !draft.trim()}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-[#d4af37]/65 bg-[#1a0a2e] px-6 py-2.5 font-display text-sm font-semibold text-[#f5f0e6] transition hover:border-[#d4af37] hover:bg-[#d4af37]/12 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {chatSending ? (
              'Đang gửi…'
            ) : (
              <>
                Gửi
                <SendIcon />
              </>
            )}
          </button>
        </div>
      </form>

      {chatError && (
        <div
          className="mt-4 whitespace-pre-line rounded-xl border border-red-400/35 bg-red-950/40 px-4 py-3 text-left font-body text-sm leading-relaxed text-red-200/90"
          role="alert"
        >
          {chatError}
        </div>
      )}
    </section>
  )
}
