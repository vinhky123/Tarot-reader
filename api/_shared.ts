/**
 * Shared logic for the Vercel serverless functions (api/reading.ts, api/chat.ts).
 *
 * This mirrors server/proxy.mjs (the Docker variant) so both deploy targets
 * stay in sync. If you change prompt-building or safety settings here, do the
 * same in server/proxy.mjs (or, better, extract into a shared package later).
 *
 * Runs in the Vercel Edge runtime — browser-like globals (fetch, ReadableStream,
 * TextEncoder) are available; Node built-ins are not.
 */

import { GoogleGenAI } from '@google/genai'
import {
  computeDignities,
  computeReadingMeta as computeMeta,
  getCorrespondence,
  type Astrology,
  type Element,
} from '../src/data/correspondences'

// ─────────────────────────────────────────────────────────────────────────────
// Config (server-only env vars — NO VITE_ prefix, so never inlined to client)
// ─────────────────────────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? ''
const GEMINI_MODEL = (process.env.GEMINI_MODEL ?? 'gemini-2.0-flash').trim()

// Note: rate limiting on Edge is per-instance (in-memory). Each cold start
// gets a fresh bucket, so the effective limit is approximate. For strict
// enforcement, back this with Vercel KV / Upstash in a future sprint.
const RATE_LIMIT_RPM = Number.parseInt(process.env.RATE_LIMIT_RPM ?? '20', 10)
const MAX_BODY_BYTES = Number.parseInt(process.env.MAX_BODY_BYTES ?? '65536', 10)
const UPSTREAM_TIMEOUT_MS = Number.parseInt(
  process.env.UPSTREAM_TIMEOUT_MS ?? '60000',
  10,
)

let _ai: GoogleGenAI | null = null
function ai(): GoogleGenAI {
  if (!_ai) _ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
  return _ai
}

export function isConfigured(): boolean {
  return GEMINI_API_KEY.length > 0
}

export function getModel(): string {
  return GEMINI_MODEL
}

// ─────────────────────────────────────────────────────────────────────────────
// System instruction + prompt builders (mirror of src/services/gemini.ts)
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_INSTRUCTION = `Bạn là một tarot reader kỳ cựu — không phải chatbot giải thích bài, mà là người ngồi đối diện, nhìn thẳng vào người xem và nói điều cần nói.

Giọng: trầm, thực, không hoa mỹ. Như người bạn đã đi qua nhiều thứ, không phán xét đạo đức, nhưng thẳng thắn và không vòng vo.

Ví dụ câu mở đúng tone:
- "Bài này nói về một điểm mắc kẹt mà bạn đã biết từ lâu, chỉ chưa chịu nhìn thẳng vào."
- "Có gì đó đang được xây dựng — chậm, nhưng có nền."
- "Năng lượng tháng này kéo bạn về hai hướng ngược nhau."

Ví dụ câu mở SAI tone (tránh tuyệt đối):
- "Chào bạn! Hãy cùng khám phá những thông điệp từ các lá bài nhé."
- "Những lá bài này mang đến một thông điệp rất thú vị cho bạn."
- "The Tower xuất hiện với hình ảnh một tòa tháp đang sụp đổ..."

Luôn trả lời bằng tiếng Việt.
Không đưa ra lời tiên tri tuyệt đối về sức khỏe, cái chết hay tài chính cụ thể; diễn giải theo hướng biểu tượng, năng lượng và lựa chọn.

Ưu tiên trọng tâm:
- Tập trung vào thông điệp cốt lõi và điều người xem cần hiểu ngay lúc này.
- Không lan man, không rào dài, không lặp lại cùng một ý theo nhiều cách.
- Có thể nhắc đến chi tiết biểu tượng trên lá nếu nó bổ sung insight, nhưng không mô tả hình ảnh một cách hời hợt. Dùng lá bài làm bằng chứng để rút insight.
- Không copy lại danh sách từ khóa hay "ý nghĩa kho" theo kiểu từ điển.
- Chỉ dùng thông tin từ dữ liệu bài đã cho; không thêm lá bài hoặc vị trí không có trong trải bài.

Định dạng cho bài đọc đầy đủ (lần đầu):
- Độ dài mục tiêu: khoảng 350–600 từ (có thể lên đến 800 từ cho trải bài lớn như Celtic Cross).
- Mở đầu 1–2 câu: nói thẳng thông điệp trung tâm của toàn bài. Không chào hỏi.
- Đi qua từng vị trí theo thứ tự: mỗi vị trí 2–3 câu, trả lời trực tiếp "câu hỏi vị trí" được ghi trong prompt, gắn vào bối cảnh người xem.
- Xác định lá bài nào là "chủ âm" của toàn bộ trải bài — lá mang năng lượng mạnh nhất hoặc lá lặp lại chủ đề xuyên suốt các vị trí.
- Sau khi đi qua các vị trí, dành 1–2 câu để tổng hợp: các lá có mối liên kết gì với nhau? Chúng bổ trợ hay mâu thuẫn? Lá nào giữ vai trò chủ đạo?
- Kết luận không quá 3 câu: 1 thông điệp then chốt + 1 gợi ý hành động cụ thể, nhẹ nhàng.
- Có thể dùng tiêu đề phụ markdown ngắn (##), nhưng giữ ngắn gọn.

Định dạng cho câu hỏi follow-up:
- Độ dài mục tiêu: khoảng 100–250 từ.
- Trả lời trực tiếp câu hỏi, thường 2–5 câu.
- Chỉ nhắc lại phần cần thiết từ các lá/vị trí liên quan; không lặp toàn bộ bài đọc trước đó.
- Nếu câu hỏi mơ hồ, chủ động nêu 1 cách hiểu hợp lý nhất và trả lời theo cách đó.`

const SUIT_ELEMENT: Record<string, string> = {
  wands: 'Fire',
  cups: 'Water',
  swords: 'Air',
  pentacles: 'Earth',
}

const SPREAD_TEMPERATURE: Record<string, number> = {
  one: 0.95,
  three: 0.9,
  five: 0.85,
  celtic: 0.8,
  horseshoe: 0.82,
  relationship: 0.85,
  career: 0.85,
}

const MAX_THREAD_TURNS = 30

// Safety: loosen false-positive blocks on esoteric prose while keeping hard
// harms blocked. Without this, tarot text trips default filters → empty reply.
const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
]

function cardNumber(card: { id: number; arcana: 'major' | 'minor' }): number {
  return card.arcana === 'major' ? card.id : ((card.id - 22) % 14) + 1
}

function isCourt(rank: number): boolean {
  return rank >= 11
}

/** Format a card's astrology correspondence into a compact prompt string. */
function formatAstrology(astro: Astrology): string {
  switch (astro.kind) {
    case 'zodiac':
      return `${astro.sign} (${astro.planet}, ${astro.dates})`
    case 'decan':
      return `${astro.sign} (${astro.planet}, ${astro.dates})`
    case 'planet':
      return astro.planet
    case 'element':
      return 'thuần nguyên tố'
  }
}

function buildSpreadSummary(drawn: DrawnCard[]): string[] {
  if (drawn.length < 2) return []
  const majorCount = drawn.filter((d) => d.card.arcana === 'major').length
  const minorCount = drawn.length - majorCount
  const upright = drawn.filter((d) => !d.reversed).length
  const reversed = drawn.length - upright

  const suitCounts: Record<string, number> = {}
  let courtCount = 0
  const elements: Element[] = []
  for (const d of drawn) {
    if (d.card.suit) suitCounts[d.card.suit] = (suitCounts[d.card.suit] ?? 0) + 1
    if (d.card.arcana === 'minor' && isCourt(cardNumber(d.card))) courtCount++
    const corr = getCorrespondence(d.card.id)
    if (corr) elements.push(corr.element)
  }

  const lines: string[] = ['Tổng quan bộ bài:']
  lines.push(`• ${majorCount} Major · ${minorCount} Minor`)
  const suitParts: string[] = []
  for (const [suit, count] of Object.entries(suitCounts)) {
    if (count)
      suitParts.push(
        `${count} ${suit.charAt(0).toUpperCase() + suit.slice(1)} (${SUIT_ELEMENT[suit]})`,
      )
  }
  if (suitParts.length > 0) lines.push(`• ${suitParts.join(' + ')}`)
  lines.push(`• ${upright} xuôi · ${reversed} ngược`)
  if (courtCount > 0) lines.push(`• ${courtCount} Court (nhân vật / nguyên mẫu)`)

  // Elemental dignities — computed from Golden Dawn rules.
  const dignities = computeDignities(elements)
  for (const dg of dignities) {
    lines.push(`• Dignity: ${dg.pair[0]} + ${dg.pair[1]} — ${dg.gloss}`)
  }

  return lines
}

function buildUserPrompt(
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
    const corr = getCorrespondence(d.card.id)
    const elementStr = corr ? corr.element : d.card.suit ? SUIT_ELEMENT[d.card.suit] : ''
    const astroStr = corr ? ` · ${formatAstrology(corr.astrology)}` : ''
    const yesNoStr = corr ? ` · ${corr.yesNo}` : ''
    const arcanaLabel = d.card.arcana === 'major' ? 'Major Arcana' : 'Minor Arcana'
    return [
      `--- Vị trí ${d.positionIndex + 1}: ${pos?.label ?? '?'} ---`,
      `Câu hỏi: "${pos?.hint ?? ''}"`,
      `Lá: ${d.card.name} (${d.reversed ? 'ngược' : 'xuôi'})${courtLabel}`,
      `Thông số: Số ${num} · ${arcanaLabel}${d.card.suit ? ` · ${suitName} · ${elementStr}` : ''}${astroStr}${yesNoStr}`,
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

function trimThreadForApi(turns: ReaderTurn[]): ReaderTurn[] {
  if (turns.length <= MAX_THREAD_TURNS) return turns
  return [...turns.slice(0, 2), ...turns.slice(-(MAX_THREAD_TURNS - 2))]
}

function turnsToContents(turns: ReaderTurn[]) {
  return turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] }))
}

// ─────────────────────────────────────────────────────────────────────────────
// Types (mirror of src/types/index.ts — kept inline so the API doesn't import
// from the Vite-bundled src/ tree)
// ─────────────────────────────────────────────────────────────────────────────
interface TarotCard {
  id: number
  name: string
  arcana: 'major' | 'minor'
  suit?: string
  upright: string
  reversed: string
  keywords: string[]
}
interface DrawnCard {
  card: TarotCard
  reversed: boolean
  positionIndex: number
}
interface SpreadDefinition {
  id: string
  title: string
  description: string
  positions: { label: string; hint: string }[]
}
interface ReaderTurn {
  role: 'user' | 'model'
  text: string
}

export interface ReadingPayload {
  spread: SpreadDefinition
  drawn: DrawnCard[]
  question: string
}
export interface ChatPayload {
  turns: ReaderTurn[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation (the function is the trust boundary)
// ─────────────────────────────────────────────────────────────────────────────
export class ValidationError extends Error {
  statusCode = 400
}

function validateCard(card: TarotCard) {
  if (!card || typeof card !== 'object') throw new ValidationError('card không hợp lệ')
  if (typeof card.id !== 'number') throw new ValidationError('card.id phải là số')
  if (typeof card.name !== 'string') throw new ValidationError('card.name phải là chuỗi')
  if (card.arcana !== 'major' && card.arcana !== 'minor')
    throw new ValidationError('card.arcana phải là "major" | "minor"')
  if (card.arcana === 'minor' && !SUIT_ELEMENT[card.suit ?? ''])
    throw new ValidationError('card.suit không hợp lệ')
  if (!Array.isArray(card.keywords)) throw new ValidationError('card.keywords phải là mảng')
}

export function validateReadingPayload(p: unknown): asserts p is ReadingPayload {
  if (!p || typeof p !== 'object') throw new ValidationError('Payload không hợp lệ')
  const { spread, drawn, question } = p as ReadingPayload
  if (!spread || typeof spread !== 'object') throw new ValidationError('spread không hợp lệ')
  if (typeof spread.id !== 'string' || !SPREAD_TEMPERATURE[spread.id])
    throw new ValidationError(`spread.id "${spread?.id}" không được hỗ trợ`)
  if (!Array.isArray(spread.positions) || spread.positions.length === 0)
    throw new ValidationError('spread.positions phải là mảng không rỗng')
  if (!Array.isArray(drawn) || drawn.length === 0)
    throw new ValidationError('drawn phải là mảng không rỗng')
  if (drawn.length > spread.positions.length)
    throw new ValidationError('drawn nhiều hơn số vị trí của spread')
  for (const d of drawn) {
    if (!d || typeof d !== 'object') throw new ValidationError('drawn item không hợp lệ')
    validateCard(d.card)
    if (typeof d.positionIndex !== 'number')
      throw new ValidationError('drawn.positionIndex phải là số')
    if (d.positionIndex < 0 || d.positionIndex >= spread.positions.length)
      throw new ValidationError('drawn.positionIndex ngoài phạm vi')
    if (typeof d.reversed !== 'boolean')
      throw new ValidationError('drawn.reversed phải là boolean')
  }
  if (typeof question !== 'string')
    throw new ValidationError('question phải là chuỗi (có thể rỗng)')
}

export function validateChatPayload(p: unknown): asserts p is ChatPayload {
  if (!p || typeof p !== 'object') throw new ValidationError('Payload không hợp lệ')
  const { turns } = p as ChatPayload
  if (!Array.isArray(turns) || turns.length < 2)
    throw new ValidationError('turns phải có ít nhất 2 phần tử')
  if (turns.length > MAX_THREAD_TURNS + 2)
    throw new ValidationError(`turns vượt giới hạn ${MAX_THREAD_TURNS + 2}`)
  for (const t of turns) {
    if (!t || (t.role !== 'user' && t.role !== 'model'))
      throw new ValidationError('turn.role phải là "user" | "model"')
    if (typeof t.text !== 'string' || t.text.length === 0)
      throw new ValidationError('turn.text phải là chuỗi không rỗng')
    if (t.text.length > 16_000) throw new ValidationError('turn.text quá dài')
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Gemini streaming with retry (mirror of server/proxy.mjs)
// ─────────────────────────────────────────────────────────────────────────────
function parseRetrySecondsFromText(text: string): number | undefined {
  const m = /retry in ([\d.]+)\s*s/i.exec(text)
  if (!m) return undefined
  const sec = Math.ceil(parseFloat(m[1]))
  if (!Number.isFinite(sec) || sec < 1 || sec > 120) return undefined
  return sec
}

function isRateLimitError(raw: string): boolean {
  return (
    raw.includes('429') ||
    raw.includes('RESOURCE_EXHAUSTED') ||
    raw.includes('quota') ||
    raw.includes('Quota exceeded')
  )
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

const MAX_UPSTREAM_RETRIES = 2

/**
 * Stream Gemini output, calling `onChunk(delta)` for each text piece.
 * Retries transient errors (429/network/5xx) but only before the first chunk.
 */
async function streamGenerateContents(
  buildContents: () => unknown,
  config: Record<string, unknown>,
  onChunk: (delta: string) => void,
  signal: AbortSignal,
): Promise<string> {
  let emitted = false
  let lastErr: unknown = null

  for (let attempt = 0; attempt <= MAX_UPSTREAM_RETRIES; attempt++) {
    if (emitted) break
    try {
      // 429 retry-once-with-parsed-wait, wrapped around the stream.
      let streamResult: AsyncIterable<{ text?: string }> | null = null
      const fullConfig = { ...config, abortSignal: signal }
      try {
        streamResult = await ai().models.generateContentStream({
          model: GEMINI_MODEL,
          contents: buildContents() as never,
          config: fullConfig as never,
        })
      } catch (first) {
        const raw = first instanceof Error ? first.message : String(first)
        if (isRateLimitError(raw)) {
          const wait = parseRetrySecondsFromText(raw)
          if (wait != null && wait <= 90) {
            await sleep(wait * 1000)
            streamResult = await ai().models.generateContentStream({
              model: GEMINI_MODEL,
              contents: buildContents() as never,
              config: fullConfig as never,
            })
          } else {
            throw first
          }
        } else {
          throw first
        }
      }

      let acc = ''
      for await (const chunk of streamResult!) {
        const delta = chunk.text ?? ''
        if (delta) {
          acc += delta
          emitted = true
          onChunk(delta)
        }
      }
      return acc
    } catch (err) {
      lastErr = err
      const raw = err instanceof Error ? err.message : String(err)
      const transient =
        isRateLimitError(raw) ||
        /fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|network|socket hang up/i.test(raw) ||
        /5\d\d/.test(raw)
      if (!transient || emitted || attempt === MAX_UPSTREAM_RETRIES) break
      const backoff = Math.min(800 * 2 ** attempt, 4000) + Math.random() * 300
      await sleep(backoff)
    }
  }
  throw lastErr ?? new Error('Gemini lỗi không xác định.')
}

export async function streamReading(
  payload: ReadingPayload,
  onChunk: (delta: string) => void,
  signal: AbortSignal,
): Promise<string> {
  const userText = buildUserPrompt(payload.spread, payload.drawn, payload.question)
  const temperature = SPREAD_TEMPERATURE[payload.spread.id] ?? 0.9
  const maxOutputTokens = Math.min(600 + payload.drawn.length * 300, 3000)
  const config = {
    systemInstruction: SYSTEM_INSTRUCTION,
    temperature,
    maxOutputTokens,
    safetySettings: SAFETY_SETTINGS,
  }
  const text = await streamGenerateContents(
    () => userText,
    config,
    onChunk,
    signal,
  )
  if (!text.trim()) throw new Error('Gemini không trả về nội dung văn bản.')
  return text
}

export async function streamChat(
  payload: ChatPayload,
  onChunk: (delta: string) => void,
  signal: AbortSignal,
): Promise<string> {
  const trimmed = trimThreadForApi(payload.turns)
  if (trimmed.length < 2) throw new Error('Hội thoại chưa đủ ngữ cảnh.')
  const last = trimmed[trimmed.length - 1]
  if (last.role !== 'user') throw new Error('Tin nhắn cuối phải từ người dùng.')
  const config = {
    systemInstruction: SYSTEM_INSTRUCTION,
    temperature: 0.75,
    maxOutputTokens: 1500,
    safetySettings: SAFETY_SETTINGS,
  }
  const text = await streamGenerateContents(
    () => turnsToContents(trimmed),
    config,
    onChunk,
    signal,
  )
  if (!text.trim()) throw new Error('Gemini không trả về nội dung văn bản.')
  return text
}

// ─────────────────────────────────────────────────────────────────────────────
// SSE response helpers
// ─────────────────────────────────────────────────────────────────────────────
const encoder = new TextEncoder()

export interface SseStream {
  response: Response
  controller: ReadableStreamDefaultController<Uint8Array>
}

export function sseResponse(): SseStream {
  let controller!: ReadableStreamDefaultController<Uint8Array>
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c
    },
  })
  const response = new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
    },
  })
  return { response, controller }
}

export function sseEvent(
  controller: ReadableStreamDefaultController<Uint8Array>,
  type: string,
  data: unknown,
): void {
  const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`
  controller.enqueue(encoder.encode(payload))
}

export function friendlyError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err)
  if (err instanceof ValidationError) return { status: err.statusCode, message: raw }
  if (isRateLimitError(raw)) {
    const wait = parseRetrySecondsFromText(raw)
    const waitHint = wait != null ? ` API gợi ý thử lại sau khoảng ${wait} giây.` : ''
    return {
      status: 429,
      message: `Gemini báo hết hạn mức (429) với model "${GEMINI_MODEL}".${waitHint}`,
    }
  }
  const trimmed = raw.length > 600 ? raw.slice(0, 500) + '…' : raw
  return { status: 502, message: `Gemini lỗi: ${trimmed}` }
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-IP rate limit (in-memory — approximate on Edge, see note above)
// ─────────────────────────────────────────────────────────────────────────────
const REFILL_PER_MS = RATE_LIMIT_RPM / 60_000
const buckets = new Map<string, { tokens: number; last: number }>()

export function rateLimitOk(ip: string): boolean {
  const now = Date.now()
  const b = buckets.get(ip)
  if (!b) {
    buckets.set(ip, { tokens: RATE_LIMIT_RPM - 1, last: now })
    return true
  }
  const elapsed = now - b.last
  b.tokens = Math.min(RATE_LIMIT_RPM, b.tokens + elapsed * REFILL_PER_MS)
  b.last = now
  if (b.tokens < 1) return false
  b.tokens -= 1
  return true
}

export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return 'unknown'
}

export const CONFIG = {
  MAX_BODY_BYTES,
  UPSTREAM_TIMEOUT_MS,
  RATE_LIMIT_RPM,
}

// Re-export the deterministic reading-metadata computation so api/reading.ts
// can emit it as a `meta` SSE event before streaming the prose.
export { computeMeta as computeReadingMeta }
