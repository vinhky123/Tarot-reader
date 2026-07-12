import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { HistoryEntry } from '../hooks/useReadingHistory'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { MysticMarkdown } from './MysticMarkdown'

interface ReadingHistoryProps {
  entries: HistoryEntry[]
  onClose: () => void
  onRemove: (id: string) => void
  onClear: () => void
  onExport: (entry: HistoryEntry) => void
}

export function ReadingHistory({
  entries,
  onClose,
  onRemove,
  onClear,
  onExport,
}: ReadingHistoryProps) {
  const reduceMotion = useReducedMotion()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  useFocusTrap(dialogRef, true, onClose)

  // Lock body scroll while open.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <motion.div
      ref={dialogRef}
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-[#05050d]/80 px-4 py-8 backdrop-blur-sm sm:px-6 sm:py-12"
      role="dialog"
      aria-modal="true"
      aria-label="Lịch sử trải bài"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="relative my-auto w-full max-w-3xl rounded-2xl border border-[#d4af37]/25 bg-[#0a0a1a]/95 p-5 shadow-[0_0_60px_rgba(124,58,237,0.15)] sm:p-8"
        initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="mystic-gradient-heading block font-display text-xl font-semibold sm:text-2xl">
            Lịch sử trải bài
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-lg border border-[#f5f0e6]/20 px-3 py-1.5 font-body text-sm text-[#f5f0e6]/75 transition hover:border-[#d4af37]/50 hover:text-[#f5f0e6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]/40"
          >
            Đóng ✕
          </button>
        </div>

        {entries.length === 0 ? (
          <p className="py-8 text-center font-body text-[#f5f0e6]/60">
            Chưa có bài đọc nào được lưu.
          </p>
        ) : (
          <>
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Xoá toàn bộ lịch sử? Không thể hoàn tác.')) onClear()
                }}
                className="rounded-lg border border-red-400/30 px-3 py-1 font-body text-xs text-red-200/80 transition hover:border-red-400/60 hover:text-red-200"
              >
                Xoá tất cả
              </button>
            </div>
            <ul className="max-h-[min(60svh,600px)] space-y-3 overflow-y-auto pr-1">
              {entries.map((e) => {
                const expanded = expandedId === e.id
                const date = new Date(e.createdAt).toLocaleString('vi-VN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
                return (
                  <li
                    key={e.id}
                    className="rounded-xl border border-[#f5f0e6]/10 bg-[#0f172a]/40 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setExpandedId(expanded ? null : e.id)}
                        className="flex-1 text-left"
                      >
                        <p className="font-display text-base font-semibold text-[#d4af37]">
                          {e.spreadTitle}
                        </p>
                        <p className="mt-0.5 font-body text-sm text-[#f5f0e6]/60">{date}</p>
                        <p className="mt-1.5 font-body text-sm text-[#f5f0e6]/80">
                          {e.cards.map((c) => c.name).join(' · ')}
                        </p>
                      </button>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => onExport(e)}
                          aria-label="Xuất Markdown"
                          className="rounded-lg border border-[#f5f0e6]/15 px-2.5 py-1 font-body text-xs text-[#f5f0e6]/70 transition hover:border-[#d4af37]/50 hover:text-[#d4af37]"
                        >
                          ↓ .md
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemove(e.id)}
                          aria-label="Xoá bài đọc này"
                          className="rounded-lg border border-red-400/25 px-2.5 py-1 font-body text-xs text-red-200/70 transition hover:border-red-400/50 hover:text-red-200"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <AnimatePresence>
                      {expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          {e.question.trim() && (
                            <p className="mt-3 rounded-lg border border-[#7c3aed]/20 bg-[#1a0a2e]/40 p-3 font-body text-sm text-[#f5f0e6]/75">
                              <span className="text-[#d4af37]/80">Câu hỏi: </span>
                              {e.question}
                            </p>
                          )}
                          <div className="mt-3 border-t border-[#f5f0e6]/10 pt-3">
                            <MysticMarkdown content={e.readingText} variant="compact" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
