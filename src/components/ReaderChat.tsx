import { useState, type FormEvent } from 'react'
import type { ReaderTurn } from '../types'
import { MysticMarkdown } from './MysticMarkdown'

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

  if (!readingText?.trim() || readerThread.length < 2) return null

  const followUps = readerThread.slice(2)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const t = draft.trim()
    if (!t || chatSending) return
    setDraft('')
    await onSend(t)
  }

  return (
    <section className="mx-auto mt-8 w-full max-w-5xl rounded-2xl border border-[#7c3aed]/25 bg-[#0a0a1a]/55 p-5 shadow-[0_0_32px_rgba(124,58,237,0.06)] backdrop-blur-md sm:p-8">
      <h2 className="font-display text-xl font-semibold text-[#d4af37] sm:text-2xl">
        Hỏi thêm reader
      </h2>
      <p className="mt-2 font-body text-base text-[#f5f0e6]/60">
        Lời giải đầy đủ nằm ở khung &quot;Lời giải&quot; phía trên. Ở đây bạn có thể
        hỏi tiếp để Oracle làm rõ từng ý.
      </p>

      {followUps.length > 0 && (
        <ul
          className="mt-6 max-h-[min(28rem,50svh)] space-y-4 overflow-y-auto pr-1"
          aria-label="Tin nhắn hỏi đáp"
        >
          {followUps.map((turn, i) => (
            <li
              key={`${turn.role}-${i}-${turn.text.slice(0, 24)}`}
              className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[min(100%,36rem)] rounded-2xl px-4 py-3 sm:px-5 ${
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
          className="w-full resize-y rounded-xl border border-[#f5f0e6]/18 bg-[#0a0a1a]/60 px-4 py-3 font-body text-base text-[#f5f0e6] placeholder:text-[#f5f0e6]/35 focus:border-[#7c3aed]/50 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/25 disabled:opacity-50"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={chatSending || !draft.trim()}
            className="rounded-xl border-2 border-[#d4af37]/65 bg-[#1a0a2e] px-6 py-2.5 font-display text-sm font-semibold text-[#f5f0e6] transition hover:border-[#d4af37] hover:bg-[#d4af37]/12 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {chatSending ? 'Đang gửi…' : 'Gửi'}
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
