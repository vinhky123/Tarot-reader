import type { DrawnCard, ReaderTurn, Suit } from '../types'
import type { SpreadDefinition } from '../data/spreads'

/**
 * Client side of the Gemini proxy.
 *
 * The API key never lives in the browser. All calls go through the server-side
 * proxy (see `server/proxy.mjs`) which holds GEMINI_API_KEY as a server-only
 * secret and enforces per-IP rate limiting. This module just shapes the request
 * and decodes the response.
 *
 * In dev, Vite proxies `/api` to http://localhost:8787 (see vite.config.ts). In
 * prod, nginx proxies `/api` to the `proxy` service (see nginx.conf).
 */

const SUIT_ELEMENT: Record<Suit, string> = {
  wands: 'Lửa (Fire)',
  cups: 'Nước (Water)',
  swords: 'Khí (Air)',
  pentacles: 'Đất (Earth)',
}

function cardNumber(card: { id: number; arcana: 'major' | 'minor' }): number {
  return card.arcana === 'major' ? card.id : ((card.id - 22) % 14) + 1
}

function isCourt(rank: number): boolean {
  return rank >= 11
}

export function buildUserPrompt(
  spread: SpreadDefinition,
  drawn: DrawnCard[],
  userQuestion: string,
): string {
  const summary = buildSpreadSummary(drawn)
  const blocks = drawn.map((d) => {
    const pos = spread.positions[d.positionIndex]
    const num = cardNumber(d.card)
    const courtLabel = d.card.arcana !== 'major' && isCourt(num) ? ' [Court]' : ''
    const suitName = d.card.suit
      ? d.card.suit.charAt(0).toUpperCase() + d.card.suit.slice(1)
      : ''
    const element = d.card.suit ? ` · ${SUIT_ELEMENT[d.card.suit]}` : ''
    const arcanaLabel = d.card.arcana === 'major' ? 'Major Arcana' : 'Minor Arcana'
    return [
      `--- Vị trí ${d.positionIndex + 1}: ${pos?.label ?? '?'} ---`,
      `Câu hỏi: "${pos?.hint ?? ''}"`,
      `Lá: ${d.card.name} (${d.reversed ? 'ngược' : 'xuôi'})${courtLabel}`,
      `Thông số: Số ${num} · ${arcanaLabel}${d.card.suit ? ` · ${suitName}${element}` : ''}`,
      `Từ khóa: ${d.card.keywords.join(', ')}`,
    ].join('\n')
  })
  return [
    `Kiểu trải bài: ${spread.title}`,
    spread.description,
    '',
    userQuestion.trim()
      ? `Câu hỏi / bối cảnh của người xem: ${userQuestion.trim()}`
      : 'Người xem không nhập câu hỏi cụ thể — hãy đọc tổng quát theo các lá và vị trí. Nếu câu hỏi của người xem quá chung chung hoặc mơ hồ, hãy chủ động chọn cách hiểu hợp lý nhất và trả lời theo hướng đó.',
    '',
    ...summary,
    '',
    ...blocks,
    '',
    'Yêu cầu đầu ra: đi thẳng vào thông điệp cốt lõi, ưu tiên tính thực dụng, tránh mở đầu xã giao kiểu "Chào bạn", tránh diễn giải lan man.',
  ].join('\n')
}

function buildSpreadSummary(drawn: DrawnCard[]): string[] {
  if (drawn.length < 2) return []

  const majorCount = drawn.filter((d) => d.card.arcana === 'major').length
  const minorCount = drawn.length - majorCount
  const upright = drawn.filter((d) => !d.reversed).length
  const reversed = drawn.length - upright

  const suitCounts: Partial<Record<Suit, number>> = {}
  let courtCount = 0
  for (const d of drawn) {
    if (d.card.suit) suitCounts[d.card.suit] = (suitCounts[d.card.suit] ?? 0) + 1
    if (d.card.arcana === 'minor' && isCourt(cardNumber(d.card))) courtCount++
  }

  const lines: string[] = ['Tổng quan bộ bài:']
  lines.push(`• ${majorCount} Major · ${minorCount} Minor`)

  const suitParts: string[] = []
  for (const [suit, count] of Object.entries(suitCounts)) {
    if (count)
      suitParts.push(
        `${count} ${suit.charAt(0).toUpperCase() + suit.slice(1)} (${SUIT_ELEMENT[suit as Suit]})`,
      )
  }
  if (suitParts.length > 0) lines.push(`• ${suitParts.join(' + ')}`)
  lines.push(`• ${upright} xuôi · ${reversed} ngược`)
  if (courtCount > 0) lines.push(`• ${courtCount} Court (nhân vật / nguyên mẫu)`)

  return lines
}

/** Hai lượt đầu cho thread reader: prompt tarot + lời giải model. */
export function getInitialReaderThread(
  spread: SpreadDefinition,
  drawn: DrawnCard[],
  userQuestion: string,
  readingText: string,
): ReaderTurn[] {
  return [
    { role: 'user', text: buildUserPrompt(spread, drawn, userQuestion) },
    { role: 'model', text: readingText },
  ]
}

// ─────────────────────────────────────────────────────────────────────────────
// Proxy client (SSE streaming)
// ─────────────────────────────────────────────────────────────────────────────
//
// The proxy responds to /api/reading and /api/chat with a Server-Sent Events
// stream: `event: delta` chunks as text arrives, then a terminal `event: done`
// (or `event: error`). We parse the stream incrementally so the UI can render
// the interpretation as it's generated instead of waiting for the whole thing.

interface SseEvent {
  type: string
  data: string
}

/**
 * Parse a ReadableStream of SSE bytes into typed events. Resolves when the
 * stream ends. Throws on AbortError (propagated from fetch).
 */
async function readSseStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (ev: SseEvent) => void,
): Promise<void> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      // SSE events are separated by a blank line. Process complete events.
      let sep = buffer.indexOf('\n\n')
      while (sep !== -1) {
        const rawEvent = buffer.slice(0, sep)
        buffer = buffer.slice(sep + 2)
        const ev = parseSseEvent(rawEvent)
        if (ev) onEvent(ev)
        sep = buffer.indexOf('\n\n')
      }
    }
    // Flush any trailing event without a blank-line terminator.
    if (buffer.trim()) {
      const ev = parseSseEvent(buffer)
      if (ev) onEvent(ev)
    }
  } finally {
    reader.releaseLock()
  }
}

function parseSseEvent(raw: string): SseEvent | null {
  let type = 'message'
  const dataLines: string[] = []
  for (const line of raw.split('\n')) {
    if (line.startsWith('event:')) type = line.slice(6).trim()
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
  }
  if (dataLines.length === 0 && type === 'message') return null
  return { type, data: dataLines.join('\n') }
}

/** Client-side retry for transient network errors before the first byte. */
const MAX_CLIENT_RETRIES = 2

async function streamFromProxy(
  url: string,
  body: unknown,
  onChunk: (delta: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  let lastErr: unknown = null
  let receivedAny = false

  for (let attempt = 0; attempt <= MAX_CLIENT_RETRIES; attempt++) {
    if (receivedAny) break // can't retry once we've shown partial output
    try {
      let res: Response
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            accept: 'text/event-stream',
          },
          body: JSON.stringify(body),
          signal,
        })
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') throw e
        throw new Error(
          'Không kết nối được tới server Oracle. Kiểm tra mạng rồi thử lại.',
        )
      }

      if (!res.ok || !res.body) {
        // Non-SSE error: try to read JSON error body.
        let msg = `Server Oracle lỗi (HTTP ${res.status}).`
        try {
          const data = (await res.json()) as { error?: string }
          if (data?.error) msg = data.error
        } catch {
          /* keep default */
        }
        throw new Error(msg)
      }

      let full = ''
      let errMsg: string | null = null
      await readSseStream(res.body, (ev) => {
        if (ev.type === 'delta') {
          try {
            const parsed = JSON.parse(ev.data) as { delta?: string }
            if (parsed.delta) {
              full += parsed.delta
              receivedAny = true
              onChunk(parsed.delta)
            }
          } catch {
            /* ignore malformed delta */
          }
        } else if (ev.type === 'error') {
          try {
            const parsed = JSON.parse(ev.data) as { message?: string }
            errMsg = parsed.message ?? 'Oracle gặp lỗi không xác định.'
          } catch {
            errMsg = 'Oracle gặp lỗi không xác định.'
          }
        }
        // 'done' event: final text already accumulated; nothing to do.
      })

      if (errMsg) throw new Error(errMsg)
      if (!full.trim()) {
        throw new Error('Oracle không trả về nội dung. Thử lại sau giây lát.')
      }
      return full
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') throw e
      lastErr = e
      // Retry only on connection-level failures (no bytes received yet).
      if (receivedAny) throw e
      if (attempt === MAX_CLIENT_RETRIES) throw e
      const backoff = 500 * 2 ** attempt + Math.random() * 200
      await new Promise((r) => setTimeout(r, backoff))
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error('Không kết nối được tới server Oracle.')
}

export interface ProxyReadingRequest {
  spread: SpreadDefinition
  drawn: DrawnCard[]
  question: string
}

export interface ProxyChatRequest {
  turns: ReaderTurn[]
}

/**
 * Yêu cầu một bài đọc Tarot qua proxy (streaming). `onChunk` được gọi mỗi khi
 * một đoạn text mới về — dùng để render tiến triển. Truyền `signal` để huỷ.
 */
export async function requestTarotReading(
  spread: SpreadDefinition,
  drawn: DrawnCard[],
  userQuestion: string,
  onChunk: (delta: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  return streamFromProxy(
    '/api/reading',
    { spread, drawn, question: userQuestion },
    onChunk,
    signal,
  )
}

/** Tiếp tục chat (streaming). `turns` kết thúc bằng tin user mới nhất. */
export async function continueReaderConversation(
  turns: ReaderTurn[],
  onChunk: (delta: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  return streamFromProxy('/api/chat', { turns }, onChunk, signal)
}
