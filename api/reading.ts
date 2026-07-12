import {
  CONFIG,
  clientIp,
  computeReadingMeta,
  friendlyError,
  isConfigured,
  rateLimitOk,
  sseEvent,
  sseResponse,
  streamReading,
  validateReadingPayload,
  type ReadingPayload,
} from './_shared'

export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(req) })
  }
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' }, req)
  }
  if (!isConfigured()) {
    return json(503, { error: 'Server chưa cấu hình GEMINI_API_KEY.' }, req)
  }

  // Rate limit BEFORE reading the body.
  const ip = clientIp(req)
  if (!rateLimitOk(ip)) {
    return json(
      429,
      { error: `Quá nhiều yêu cầu. Giới hạn ${CONFIG.RATE_LIMIT_RPM} yêu cầu/phút/IP.` },
      req,
    )
  }

  // Read + validate body. On failure, return JSON (do NOT open the SSE stream).
  let payload: ReadingPayload
  try {
    const raw = await req.text()
    if (raw.length > CONFIG.MAX_BODY_BYTES) {
      throw new Error('Yêu cầu quá lớn.')
    }
    const parsed = JSON.parse(raw) as unknown
    validateReadingPayload(parsed)
    payload = parsed
  } catch (err) {
    const fe = friendlyError(err)
    return json(fe.status, { error: fe.message }, req)
  }

  // Validation passed → open SSE stream and pipe Gemini chunks.
  const { response, controller } = sseResponse()
  const upstreamAbort = new AbortController()
  const timeoutTimer = setTimeout(() => upstreamAbort.abort(), CONFIG.UPSTREAM_TIMEOUT_MS)

  // Abort upstream if the client disconnects (response stream errors/closes).
  req.signal.addEventListener('abort', () => upstreamAbort.abort())

  ;(async () => {
    try {
      // Emit computed metadata first — dominant card, cross-card summary,
      // elemental dignities. Deterministic, no LLM call.
      const meta = computeReadingMeta(payload.drawn)
      sseEvent(controller, 'meta', meta)

      let full = ''
      await streamReading(
        payload,
        (delta) => {
          full += delta
          sseEvent(controller, 'delta', { delta })
        },
        upstreamAbort.signal,
      )
      sseEvent(controller, 'done', { text: full })
    } catch (err) {
      if (upstreamAbort.signal.aborted) {
        // Client gone or timeout — nothing useful to send.
      } else {
        const fe = friendlyError(err)
        sseEvent(controller, 'error', { message: fe.message })
      }
    } finally {
      clearTimeout(timeoutTimer)
      try {
        controller.close()
      } catch {
        /* already closed */
      }
    }
  })()

  return response
}

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '*'
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
  }
}

function json(status: number, body: unknown, req: Request): Response {
  const headers: Record<string, string> = {
    'content-type': 'application/json; charset=utf-8',
  }
  const origin = req.headers.get('origin')
  if (origin) headers['access-control-allow-origin'] = origin
  return new Response(JSON.stringify(body), { status, headers })
}
