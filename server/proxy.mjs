// Gemini API proxy.
//
// Why this exists: the previous design shipped VITE_GEMINI_API_KEY into the
// browser bundle, where anyone with DevTools could extract it. This server
// holds the key in a server-only env var (GEMINI_API_KEY — no VITE_ prefix, so
// Vite never sees it) and is the only thing that talks to Google.
//
// Endpoints (JSON in / JSON out):
//   POST /api/reading   { spread, drawn, question }            -> { text }
//   POST /api/chat      { turns }                              -> { text }
//   GET  /api/health                                          -> { ok: true }
//
// Safety:
//   - Per-IP token-bucket rate limit (RATE_LIMIT_RPM, default 20 req/min).
//   - Hard request size cap (MAX_BODY_BYTES, default 64 KiB).
//   - Hard upstream timeout (UPSTREAM_TIMEOUT_MS, default 60_000).
//   - CORS locked to ALLOWED_ORIGINS (comma-separated). Falls back to the
//     request's Origin when unset in dev, but you SHOULD pin it in prod.
//
// All env vars are read at boot and never serialized into any response.

import http from 'node:http'
import { GoogleGenAI } from '@google/genai'

// ─────────────────────────────────────────────────────────────────────────────
// Config (server-only — never prefixed with VITE_)
// ─────────────────────────────────────────────────────────────────────────────
const PORT = Number.parseInt(process.env.PORT ?? '8787', 10)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? ''
const GEMINI_MODEL = (process.env.GEMINI_MODEL ?? 'gemini-2.0-flash').trim()
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
const RATE_LIMIT_RPM = Number.parseInt(process.env.RATE_LIMIT_RPM ?? '20', 10)
const MAX_BODY_BYTES = Number.parseInt(process.env.MAX_BODY_BYTES ?? '65536', 10)
const UPSTREAM_TIMEOUT_MS = Number.parseInt(
  process.env.UPSTREAM_TIMEOUT_MS ?? '60000',
  10,
)

if (!GEMINI_API_KEY) {
  console.error('[proxy] FATAL: GEMINI_API_KEY is not set. Refusing to start.')
  process.exit(1)
}

// ─────────────────────────────────────────────────────────────────────────────
// Gemini client (single shared instance — the SDK reuses connections)
// ─────────────────────────────────────────────────────────────────────────────
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

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

const SUIT_ELEMENT = {
  wands: 'Lửa (Fire)',
  cups: 'Nước (Water)',
  swords: 'Khí (Air)',
  pentacles: 'Đất (Earth)',
}

const SPREAD_TEMPERATURE = {
  one: 0.95,
  three: 0.9,
  five: 0.85,
  celtic: 0.8,
}

const MAX_THREAD_TURNS = 30

// Safety: Gemini defaults can block legitimate esoteric content. Loosen the
// categories most likely to false-positive on tarot/astrology prose while
// keeping hard harms blocked. Without this, a safety block returns an empty
// response indistinguishable from a genuine empty — see Sprint 2 #4.
const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Prompt builders (mirror of src/services/gemini.ts — kept in sync deliberately)
// ─────────────────────────────────────────────────────────────────────────────
function cardNumber(card) {
  return card.arcana === 'major' ? card.id : ((card.id - 22) % 14) + 1
}

function isCourt(rank) {
  return rank >= 11
}

function buildSpreadSummary(drawn) {
  if (drawn.length < 2) return []
  const majorCount = drawn.filter((d) => d.card.arcana === 'major').length
  const minorCount = drawn.length - majorCount
  const upright = drawn.filter((d) => !d.reversed).length
  const reversed = drawn.length - upright

  const suitCounts = {}
  let courtCount = 0
  for (const d of drawn) {
    if (d.card.suit) suitCounts[d.card.suit] = (suitCounts[d.card.suit] ?? 0) + 1
    if (d.card.arcana === 'minor' && isCourt(cardNumber(d.card))) courtCount++
  }

  const lines = ['Tổng quan bộ bài:']
  lines.push(`• ${majorCount} Major · ${minorCount} Minor`)

  const suitParts = []
  for (const [suit, count] of Object.entries(suitCounts)) {
    if (count)
      suitParts.push(
        `${count} ${suit.charAt(0).toUpperCase() + suit.slice(1)} (${SUIT_ELEMENT[suit]})`,
      )
  }
  if (suitParts.length > 0) lines.push(`• ${suitParts.join(' + ')}`)
  lines.push(`• ${upright} xuôi · ${reversed} ngược`)
  if (courtCount > 0) lines.push(`• ${courtCount} Court (nhân vật / nguyên mẫu)`)
  return lines
}

function buildUserPrompt(spread, drawn, userQuestion) {
  const summary = buildSpreadSummary(drawn)
  const blocks = drawn.map((d) => {
    const pos = spread.positions[d.positionIndex]
    const num = cardNumber(d.card)
    const courtLabel =
      d.card.arcana !== 'major' && isCourt(num) ? ' [Court]' : ''
    const suitName = d.card.suit
      ? d.card.suit.charAt(0).toUpperCase() + d.card.suit.slice(1)
      : ''
    const element = d.card.suit ? ` · ${SUIT_ELEMENT[d.card.suit]}` : ''
    const arcanaLabel =
      d.card.arcana === 'major' ? 'Major Arcana' : 'Minor Arcana'
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

function trimThreadForApi(turns) {
  if (turns.length <= MAX_THREAD_TURNS) return turns
  return [...turns.slice(0, 2), ...turns.slice(-(MAX_THREAD_TURNS - 2))]
}

function turnsToContents(turns) {
  return turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] }))
}

// ─────────────────────────────────────────────────────────────────────────────
// Gemini calls with retry (429 only, same heuristic as the old client path)
// ─────────────────────────────────────────────────────────────────────────────
function parseRetrySecondsFromText(text) {
  const m = /retry in ([\d.]+)\s*s/i.exec(text)
  if (!m) return undefined
  const sec = Math.ceil(parseFloat(m[1]))
  if (!Number.isFinite(sec) || sec < 1 || sec > 120) return undefined
  return sec
}

function isRateLimitError(raw) {
  return (
    raw.includes('429') ||
    raw.includes('RESOURCE_EXHAUSTED') ||
    raw.includes('quota') ||
    raw.includes('Quota exceeded')
  )
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function generateWithRateLimitRetry(run) {
  try {
    return await run()
  } catch (first) {
    const raw = first instanceof Error ? first.message : String(first)
    if (isRateLimitError(raw)) {
      const wait = parseRetrySecondsFromText(raw)
      if (wait != null && wait <= 90) {
        await sleep(wait * 1000)
        try {
          return await run()
        } catch (second) {
          throw second
        }
      }
    }
    throw first
  }
}

/**
 * Stream a reading. Calls `onChunk(textDelta)` for each piece as it arrives.
 * Throws on empty / blocked response so the caller can surface an error.
 *
 * Retry policy: on a 429 with a parseable wait, sleep once and retry the whole
 * stream. Network errors and 5xx are retried with exponential backoff up to
 * MAX_UPSTREAM_RETRIES — but only if no chunk has been emitted yet (once we've
 * started streaming to the client, retrying would corrupt the output).
 */
async function streamReading({ spread, drawn, question }, onChunk, signal) {
  const userText = buildUserPrompt(spread, drawn, question)
  const temperature = SPREAD_TEMPERATURE[spread.id] ?? 0.9
  const maxOutputTokens = Math.min(600 + drawn.length * 300, 3000)
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

async function streamChat({ turns }, onChunk, signal) {
  const trimmed = trimThreadForApi(turns)
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

const MAX_UPSTREAM_RETRIES = 2

/**
 * Core streaming primitive with retry. `buildContents` is a function so a
 * retry rebuilds a fresh contents value (some SDK types are single-use).
 */
async function streamGenerateContents(buildContents, config, onChunk, signal) {
  let emitted = false
  let lastErr = null

  for (let attempt = 0; attempt <= MAX_UPSTREAM_RETRIES; attempt++) {
    // Once we've streamed anything to the client, we can't retry — partial
    // output is already committed.
    if (emitted) break
    try {
      const text = await generateWithRateLimitRetry(async () => {
        const stream = await ai.models.generateContentStream({
          model: GEMINI_MODEL,
          contents: buildContents(),
          config,
          abortSignal: signal,
        })
        let acc = ''
        for await (const chunk of stream) {
          const delta = chunk.text ?? ''
          if (delta) {
            acc += delta
            emitted = true
            onChunk(delta)
          }
        }
        return acc
      })
      return text
    } catch (err) {
      lastErr = err
      const raw = err instanceof Error ? err.message : String(err)
      // Retry only transient errors, and only if nothing was emitted yet.
      const transient =
        isRateLimitError(raw) ||
        /fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|network|socket hang up/i.test(
          raw,
        ) ||
        /5\d\d/.test(raw)
      if (!transient || emitted || attempt === MAX_UPSTREAM_RETRIES) break
      const backoff = Math.min(800 * 2 ** attempt, 4000) + Math.random() * 300
      await sleep(backoff)
    }
  }
  throw lastErr ?? new Error('Gemini lỗi không xác định.')
}

// ─────────────────────────────────────────────────────────────────────────────
// Payload validation (the proxy is the trust boundary — never trust the client)
// ─────────────────────────────────────────────────────────────────────────────
function fail(msg) {
  const e = new Error(msg)
  e.statusCode = 400
  return e
}

function validateCard(card) {
  if (!card || typeof card !== 'object') throw fail('card không hợp lệ')
  if (typeof card.id !== 'number') throw fail('card.id phải là số')
  if (typeof card.name !== 'string') throw fail('card.name phải là chuỗi')
  if (card.arcana !== 'major' && card.arcana !== 'minor')
    throw fail('card.arcana phải là "major" | "minor"')
  if (card.arcana === 'minor' && !SUIT_ELEMENT[card.suit])
    throw fail('card.suit không hợp lệ')
  if (!Array.isArray(card.keywords)) throw fail('card.keywords phải là mảng')
  return card
}

function validateReadingPayload(p) {
  if (!p || typeof p !== 'object') throw fail('Payload không hợp lệ')
  const { spread, drawn, question } = p
  if (!spread || typeof spread !== 'object') throw fail('spread không hợp lệ')
  if (typeof spread.id !== 'string' || !SPREAD_TEMPERATURE[spread.id])
    throw fail(`spread.id "${spread?.id}" không được hỗ trợ`)
  if (!Array.isArray(spread.positions) || spread.positions.length === 0)
    throw fail('spread.positions phải là mảng không rỗng')
  if (!Array.isArray(drawn) || drawn.length === 0)
    throw fail('drawn phải là mảng không rỗng')
  if (drawn.length > spread.positions.length)
    throw fail('drawn nhiều hơn số vị trí của spread')
  for (const d of drawn) {
    if (!d || typeof d !== 'object') throw fail('drawn item không hợp lệ')
    validateCard(d.card)
    if (typeof d.positionIndex !== 'number')
      throw fail('drawn.positionIndex phải là số')
    if (d.positionIndex < 0 || d.positionIndex >= spread.positions.length)
      throw fail('drawn.positionIndex ngoài phạm vi')
    if (typeof d.reversed !== 'boolean')
      throw fail('drawn.reversed phải là boolean')
  }
  if (typeof question !== 'string')
    throw fail('question phải là chuỗi (có thể rỗng)')
}

function validateChatPayload(p) {
  if (!p || typeof p !== 'object') throw fail('Payload không hợp lệ')
  const { turns } = p
  if (!Array.isArray(turns) || turns.length < 2)
    throw fail('turns phải có ít nhất 2 phần tử')
  if (turns.length > MAX_THREAD_TURNS + 2)
    throw fail(`turns vượt giới hạn ${MAX_THREAD_TURNS + 2}`)
  for (const t of turns) {
    if (!t || (t.role !== 'user' && t.role !== 'model'))
      throw fail('turn.role phải là "user" | "model"')
    if (typeof t.text !== 'string' || t.text.length === 0)
      throw fail('turn.text phải là chuỗi không rỗng')
    if (t.text.length > 16_000) throw fail('turn.text quá dài')
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-IP token-bucket rate limit
// ─────────────────────────────────────────────────────────────────────────────
const REFILL_PER_MS = RATE_LIMIT_RPM / 60_000 // tokens per ms
const buckets = new Map() // ip -> { tokens, last }

function rateLimitOk(ip) {
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

// Periodic GC so the map can't grow unbounded under attack.
setInterval(() => {
  const now = Date.now()
  for (const [ip, b] of buckets) {
    if (now - b.last > 10 * 60_000) buckets.delete(ip)
  }
}, 5 * 60_000).unref()

// ─────────────────────────────────────────────────────────────────────────────
// HTTP server
// ─────────────────────────────────────────────────────────────────────────────
function clientIp(req) {
  // Trust X-Forwarded-For from nginx. First hop is the real client.
  const xff = req.headers['x-forwarded-for']
  if (typeof xff === 'string' && xff.length > 0) {
    return xff.split(',')[0].trim()
  }
  return req.socket.remoteAddress ?? 'unknown'
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new Error('PAYLOAD_TOO_LARGE'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendJson(res, status, obj, origin) {
  const headers = { 'content-type': 'application/json; charset=utf-8' }
  if (origin) headers['access-control-allow-origin'] = origin
  res.writeHead(status, headers)
  res.end(JSON.stringify(obj))
}

/** Begin an SSE stream. Returns helpers to send events and end. */
function startSse(res, origin) {
  const headers = {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    'x-accel-buffering': 'no', // disable nginx buffering so chunks flush
  }
  if (origin) headers['access-control-allow-origin'] = origin
  res.writeHead(200, headers)
  let closed = false
  res.on('close', () => {
    closed = true
  })
  return {
    get closed() {
      return closed
    },
    event(type, data) {
      if (closed) return
      res.write(`event: ${type}\n`)
      res.write(`data: ${JSON.stringify(data)}\n\n`)
    },
    end() {
      if (!closed) res.end()
    },
  }
}

function corsHeaders(req) {
  const origin = req.headers.origin
  if (!origin) return null
  if (ALLOWED_ORIGINS.length === 0) return origin // dev: allow anything
  return ALLOWED_ORIGINS.includes(origin) ? origin : null
}

function friendlyError(err) {
  const raw = err instanceof Error ? err.message : String(err)
  // Validation errors carry their own status.
  if (err instanceof Error && typeof err.statusCode === 'number') {
    return { status: err.statusCode, body: { error: raw } }
  }
  if (isRateLimitError(raw)) {
    const wait = parseRetrySecondsFromText(raw)
    const waitHint = wait != null ? ` API gợi ý thử lại sau khoảng ${wait} giây.` : ''
    return {
      status: 429,
      body: {
        error: `Gemini báo hết hạn mức (429) với model "${GEMINI_MODEL}".${waitHint}`,
      },
    }
  }
  if (raw === 'PAYLOAD_TOO_LARGE') {
    return {
      status: 413,
      body: { error: 'Yêu cầu quá lớn.' },
    }
  }
  const trimmed = raw.length > 600 ? raw.slice(0, 500) + '…' : raw
  return { status: 502, body: { error: `Gemini lỗi: ${trimmed}` } }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')
  const path = url.pathname
  const origin = corsHeaders(req)

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': origin ?? '*',
      'access-control-allow-methods': 'POST, GET, OPTIONS',
      'access-control-allow-headers': 'content-type',
      'access-control-max-age': '86400',
    })
    res.end()
    return
  }

  if (path === '/api/health' && req.method === 'GET') {
    sendJson(res, 200, { ok: true, model: GEMINI_MODEL }, origin)
    return
  }

  if (path !== '/api/reading' && path !== '/api/chat') {
    sendJson(res, 404, { error: 'Not found' }, origin)
    return
  }
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' }, origin)
    return
  }

  // Rate limit BEFORE reading the body.
  const ip = clientIp(req)
  if (!rateLimitOk(ip)) {
    sendJson(
      res,
      429,
      {
        error: `Quá nhiều yêu cầu. Giới hạn ${RATE_LIMIT_RPM} yêu cầu/phút/IP.`,
      },
      origin,
    )
    return
  }

  let payload
  try {
    const raw = await readBody(req)
    payload = JSON.parse(raw)
    if (path === '/api/reading') validateReadingPayload(payload)
    else validateChatPayload(payload)
  } catch (err) {
    if (
      err instanceof Error &&
      (err.name === 'AbortError' || /aborted/i.test(err.message))
    ) {
      sendJson(res, 504, { error: 'Gemini quá thời gian phản hồi.' }, origin)
      return
    }
    const fe = friendlyError(err)
    sendJson(res, fe.status, fe.body, origin)
    return
  }

  // Validate passed → open an SSE stream and pipe Gemini chunks to the client.
  const sse = startSse(res, origin)

  // Hard timeout: abort the upstream if it runs long, independent of the
  // client connection (which has its own close handling).
  const upstreamAbort = new AbortController()
  const timeoutTimer = setTimeout(
    () => upstreamAbort.abort(),
    UPSTREAM_TIMEOUT_MS,
  )
  // If the client disconnects, cancel the upstream call too.
  const onClientClose = () => upstreamAbort.abort()
  res.on('close', onClientClose)

  try {
    let full = ''
    const onChunk = (delta) => {
      full += delta
      sse.event('delta', { delta })
    }
    if (path === '/api/reading') {
      await streamReading(payload, onChunk, upstreamAbort.signal)
    } else {
      await streamChat(payload, onChunk, upstreamAbort.signal)
    }
    sse.event('done', { text: full })
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err)
    const aborted =
      err instanceof Error &&
      (err.name === 'AbortError' ||
        /aborted/i.test(raw) ||
        upstreamAbort.signal.aborted)
    if (aborted) {
      // Client gone or timeout — nothing useful to send.
    } else if (isRateLimitError(raw)) {
      const wait = parseRetrySecondsFromText(raw)
      const waitHint = wait != null ? ` API gợi ý thử lại sau khoảng ${wait} giây.` : ''
      sse.event('error', {
        message: `Gemini báo hết hạn mức (429) với model "${GEMINI_MODEL}".${waitHint}`,
      })
    } else {
      const trimmed = raw.length > 600 ? raw.slice(0, 500) + '…' : raw
      sse.event('error', { message: `Gemini lỗi: ${trimmed}` })
    }
  } finally {
    clearTimeout(timeoutTimer)
    res.off('close', onClientClose)
    sse.end()
  }
})

server.listen(PORT, () => {
  console.log(
    `[proxy] listening on :${PORT} | model=${GEMINI_MODEL} | rpm/ip=${RATE_LIMIT_RPM}`,
  )
})
