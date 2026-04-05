import { GoogleGenAI } from '@google/genai'
import type { DrawnCard, ReaderTurn } from '../types'
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

const SYSTEM_INSTRUCTION = `Bạn là một tarot reader dày dạn: giọng điệu trầm, ấm, có chiều sâu tâm linh nhưng không gây sợ hãi hay thao túng.
Luôn trả lời bằng tiếng Việt.
Không đưa ra lời tiên tri tuyệt đối về sức khỏe, cái chết hay tài chính cụ thể; hãy nói theo hướng biểu tượng, năng lượng và lựa chọn.
Kết hợp các lá bài thành một câu chuyện thống nhất — không chỉ liệt kê từng lá một cách tách rời.
Cấu trúc gợi ý: (1) Tổng quan năng lượng trải bài, (2) Đi qua từng vị trí theo thứ tự với liên hệ chéo, (3) Thông điệp tổng kết và một gợi ý hành động nhẹ nhàng.
Giữ đoạn văn mạch lạc; có thể dùng tiêu đề phụ ngắn bằng markdown (##).
Khi người xem hỏi tiếp sau lời giải: trả lời ngắn gọn, làm rõ phần họ chưa hiểu; tham chiếu lại các lá và vị trí đã rút nếu cần, không lặp lại nguyên văn cả bài đọc trừ khi họ yêu cầu.`

function client() {
  const key = import.meta.env.VITE_GEMINI_API_KEY
  if (!key || !String(key).trim()) {
    throw new Error(
      'Thiếu VITE_GEMINI_API_KEY. Sao chép .env.example thành .env và dán API key từ Google AI Studio.',
    )
  }
  return new GoogleGenAI({ apiKey: String(key).trim() })
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
  const blocks = drawn.map((d) => {
    const pos = spread.positions[d.positionIndex]
    const meaning = d.reversed ? d.card.reversed : d.card.upright
    return [
      `---`,
      `Vị trí: ${pos?.label ?? '?'} — ${pos?.hint ?? ''}`,
      `Lá: ${d.card.name} (${d.reversed ? 'ngược' : 'xuôi'})`,
      `Ý nghĩa kho (tham chiếu): ${meaning}`,
      `Từ khóa: ${d.card.keywords.join(', ')}`,
    ].join('\n')
  })
  return [
    `Kiểu trải bài: ${spread.title}`,
    spread.description,
    '',
    userQuestion.trim()
      ? `Câu hỏi / bối cảnh của người xem: ${userQuestion.trim()}`
      : 'Người xem không nhập câu hỏi cụ thể — hãy đọc tổng quát theo các lá và vị trí.',
    '',
    ...blocks,
    '',
    'Hãy trả lời như một buổi đọc bài trực tiếp, chân thành và có chiều sâu.',
  ].join('\n')
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

async function generateOnce(
  ai: GoogleGenAI,
  model: string,
  userText: string,
): Promise<string> {
  const response = await ai.models.generateContent({
    model,
    contents: userText,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.88,
      maxOutputTokens: 8192,
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
      temperature: 0.85,
      maxOutputTokens: 8192,
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
    generateOnce(ai, model, userText),
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
