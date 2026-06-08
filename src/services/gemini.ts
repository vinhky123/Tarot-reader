import { GoogleGenAI } from '@google/genai'
import type { DrawnCard, ReaderTurn, Suit } from '../types'
import type { SpreadDefinition } from '../data/spreads'

/**
 * Model mặc định; ghi đè trong .env: VITE_GEMINI_MODEL=gemini-2.5-flash
 * Nếu 2.0-flash hết quota free tier, thử 2.5-flash / 1.5-flash (xem AI Studio).
 */
function resolvedModel(): string {
  const fromEnv = import.meta.env.VITE_GEMINI_MODEL
  if (fromEnv && String(fromEnv).trim()) {
    return String(fromEnv).trim()
  }
  return 'gemini-2.0-flash'
}

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
- Có thể nhắc đến chi tiết biểu tượng trên lá nếu nó bổ sung insight, nhưng không mô tả hình ảnh một cách hời hợt. Dùng lá bài như bằng chứng để rút insight.
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

function client() {
  const key = import.meta.env.VITE_GEMINI_API_KEY
  if (!key || !String(key).trim()) {
    throw new Error(
      'Thiếu VITE_GEMINI_API_KEY. Sao chép .env.example thành .env và dán API key từ Google AI Studio.',
    )
  }
  return new GoogleGenAI({ apiKey: String(key).trim() })
}

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

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function errorToRaw(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  return JSON.stringify(err)
}

/** Trích số giây chờ từ chuỗi lỗi API (vd: "Please retry in 26.57s"). */
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

function formatGeminiFailure(raw: string, model: string): Error {
  if (isRateLimitError(raw)) {
    const wait = parseRetrySecondsFromText(raw)
    const waitHint =
      wait != null
        ? ` API gợi ý thử lại sau khoảng ${wait} giây.`
        : ''
    return new Error(
      `Gemini báo hết hạn mức (429) với model "${model}".${waitHint}

Đây thường là giới hạn free tier (theo phút / theo ngày) hoặc dự án chưa bật thanh toán.

Việc có thể làm:
• Đợi rồi thử lại (đọc bài hoặc gửi tin chat).
• Trong file .env đặt VITE_GEMINI_MODEL=gemini-2.5-flash hoặc gemini-1.5-flash rồi chạy lại dev server.
• Xem hạn mức: https://ai.google.dev/gemini-api/docs/rate-limits
• Theo dõi usage: https://ai.dev/rate-limit`,
    )
  }
  if (raw.length > 600) {
    return new Error(`Gemini lỗi: ${raw.slice(0, 500)}…`)
  }
  return new Error(`Gemini lỗi: ${raw}`)
}

async function generateWithRateLimitRetry(
  model: string,
  run: () => Promise<string>,
): Promise<string> {
  try {
    return await run()
  } catch (first: unknown) {
    const raw = errorToRaw(first)
    if (isRateLimitError(raw)) {
      const wait = parseRetrySecondsFromText(raw)
      if (wait != null && wait <= 90) {
        await sleep(wait * 1000)
        try {
          return await run()
        } catch (second: unknown) {
          throw formatGeminiFailure(errorToRaw(second), model)
        }
      }
    }
    throw formatGeminiFailure(raw, model)
  }
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
    const r = cardNumber(d.card)
    const courtLabel = d.card.arcana !== 'major' && isCourt(r) ? ' [Court]' : ''
    const suitName = d.card.suit ? d.card.suit.charAt(0).toUpperCase() + d.card.suit.slice(1) : ''
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
    if (count) suitParts.push(`${count} ${suit.charAt(0).toUpperCase() + suit.slice(1)} (${SUIT_ELEMENT[suit as Suit]})`)
  }
  if (suitParts.length > 0) lines.push(`• ${suitParts.join(' + ')}`)
  lines.push(`• ${upright} xuôi · ${reversed} ngược`)
  if (courtCount > 0) lines.push(`• ${courtCount} Court (nhân vật / nguyên mẫu)`)

  return lines
}

/** Hai lượt đầu cho API: prompt tarot + lời giải model. */
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

const MAX_THREAD_TURNS = 30

function trimThreadForApi(turns: ReaderTurn[]): ReaderTurn[] {
  if (turns.length <= MAX_THREAD_TURNS) return turns
  return [...turns.slice(0, 2), ...turns.slice(-(MAX_THREAD_TURNS - 2))]
}

function turnsToContents(turns: ReaderTurn[]) {
  return turns.map((t) => ({
    role: t.role,
    parts: [{ text: t.text }],
  }))
}

const SPREAD_TEMPERATURE: Record<string, number> = {
  one: 0.95,
  three: 0.90,
  five: 0.85,
  celtic: 0.80,
}

async function generateOnce(
  ai: GoogleGenAI,
  model: string,
  userText: string,
  cardCount: number,
  spreadId: string,
): Promise<string> {
  const temperature = SPREAD_TEMPERATURE[spreadId] ?? 0.9
  const dynamicMaxTokens = Math.min(600 + cardCount * 300, 3000)
  const response = await ai.models.generateContent({
    model,
    contents: userText,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature,
      maxOutputTokens: dynamicMaxTokens,
    },
  })
  const text = response.text
  if (!text?.trim()) {
    throw new Error('Gemini không trả về nội dung văn bản.')
  }
  return text.trim()
}

async function generateFromThread(
  ai: GoogleGenAI,
  model: string,
  turns: ReaderTurn[],
): Promise<string> {
  const trimmed = trimThreadForApi(turns)
  if (trimmed.length < 2) {
    throw new Error('Hội thoại chưa đủ ngữ cảnh.')
  }
  const last = trimmed[trimmed.length - 1]
  if (last.role !== 'user') {
    throw new Error('Tin nhắn cuối phải từ người dùng.')
  }
  const response = await ai.models.generateContent({
    model,
    contents: turnsToContents(trimmed),
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.75,
      maxOutputTokens: 1500,
    },
  })
  const text = response.text
  if (!text?.trim()) {
    throw new Error('Gemini không trả về nội dung văn bản.')
  }
  return text.trim()
}

export async function requestTarotReading(
  spread: SpreadDefinition,
  drawn: DrawnCard[],
  userQuestion: string,
): Promise<string> {
  const ai = client()
  const model = resolvedModel()
  const userText = buildUserPrompt(spread, drawn, userQuestion)
  return generateWithRateLimitRetry(model, () =>
    generateOnce(ai, model, userText, drawn.length, spread.id),
  )
}

/** Tiếp tục chat: \`turns\` kết thúc bằng tin user mới nhất. */
export async function continueReaderConversation(
  turns: ReaderTurn[],
): Promise<string> {
  const ai = client()
  const model = resolvedModel()
  return generateWithRateLimitRetry(model, () =>
    generateFromThread(ai, model, turns),
  )
}
