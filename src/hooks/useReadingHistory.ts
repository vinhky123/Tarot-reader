import { useCallback, useEffect, useState } from 'react'

/**
 * Local-first reading history persisted to localStorage.
 *
 * Each entry captures a completed reading: spread, cards, question, text, and
 * timestamp. The list is capped at MAX_ENTRIES (newest first) to stay within
 * localStorage quotas (~5 MiB). On quota errors we trim oldest entries.
 */

const STORAGE_KEY = 'mystic-tarot:history'
const MAX_ENTRIES = 50

export interface HistoryCard {
  id: number
  name: string
  reversed: boolean
}

export interface HistoryEntry {
  id: string
  createdAt: number
  spreadId: string
  spreadTitle: string
  question: string
  cards: HistoryCard[]
  readingText: string
}

function safeRead(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as HistoryEntry[]
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

function safeWrite(entries: HistoryEntry[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    return true
  } catch {
    // Quota exceeded — try trimming to half, then retry once.
    try {
      const trimmed = entries.slice(0, Math.floor(MAX_ENTRIES / 2))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
      return true
    } catch {
      return false
    }
  }
}

export function useReadingHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([])

  // Load on mount.
  useEffect(() => {
    setEntries(safeRead())
  }, [])

  const addEntry = useCallback(
    (entry: Omit<HistoryEntry, 'id' | 'createdAt'>): HistoryEntry | null => {
      const full: HistoryEntry = {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
      }
      const next = [full, ...safeRead().slice(0, MAX_ENTRIES - 1)]
      const ok = safeWrite(next)
      if (ok) setEntries(next)
      return ok ? full : null
    },
    [],
  )

  const removeEntry = useCallback((id: string) => {
    const next = safeRead().filter((e) => e.id !== id)
    safeWrite(next)
    setEntries(next)
  }, [])

  const clearAll = useCallback(() => {
    safeWrite([])
    setEntries([])
  }, [])

  return { entries, addEntry, removeEntry, clearAll }
}

/** Format a history entry as Markdown for export. */
export function entryToMarkdown(e: HistoryEntry): string {
  const date = new Date(e.createdAt).toLocaleString('vi-VN', {
    dateStyle: 'long',
    timeStyle: 'short',
  })
  const cardsList = e.cards
    .map((c, i) => `${i + 1}. **${c.name}** ${c.reversed ? '(ngược)' : '(xuôi)'}`)
    .join('\n')

  return [
    `# ${e.spreadTitle}`,
    '',
    `*${date}*`,
    '',
    e.question.trim() ? `**Câu hỏi:** ${e.question}` : '*Không có câu hỏi cụ thể*',
    '',
    '## Các lá bài',
    '',
    cardsList,
    '',
    '## Lời giải',
    '',
    e.readingText,
    '',
    '---',
    `*Xuất từ Mystic Tarot · ${date}*`,
  ].join('\n')
}

/** Trigger a browser download of text content. */
export function downloadText(filename: string, content: string, mime = 'text/markdown') {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
