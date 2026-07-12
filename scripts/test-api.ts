/**
 * Direct test harness for the Vercel Edge API functions.
 * Run with: npx tsx scripts/test-api.ts
 *
 * Imports the handlers directly and calls them with constructed Request
 * objects — no Vercel CLI / login required. Exercises:
 *   - /api/health (GET)
 *   - /api/reading OPTIONS preflight
 *   - /api/reading POST with bad payload → 400 JSON (pre-stream)
 *   - /api/reading POST with valid payload → SSE stream (will error on dummy key)
 */
import handler_health from '../api/health'
import handler_reading from '../api/reading'
import handler_chat from '../api/chat'

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`  ❌ FAIL: ${msg}`)
    process.exitCode = 1
  } else {
    console.log(`  ✅ PASS: ${msg}`)
  }
}

async function main() {
  console.log('=== TEST 1: GET /api/health ===')
  {
    const req = new Request('http://localhost/api/health', { method: 'GET' })
    const res = await handler_health(req)
    const body = (await res.json()) as { ok?: boolean; model?: string; configured?: boolean }
    assert(res.status === 200, `health returns 200 (got ${res.status})`)
    assert(body.ok === true, 'health body.ok === true')
    assert(typeof body.model === 'string', `health body.model is string ("${body.model}")`)
    console.log(`  → ${JSON.stringify(body)}`)
  }

  console.log('\n=== TEST 2: OPTIONS /api/reading (CORS preflight) ===')
  {
    const req = new Request('http://localhost/api/reading', {
      method: 'OPTIONS',
      headers: { origin: 'http://localhost:5173' },
    })
    const res = await handler_reading(req)
    assert(res.status === 204, `preflight returns 204 (got ${res.status})`)
    assert(
      res.headers.get('access-control-allow-origin') === 'http://localhost:5173',
      'CORS origin echoed',
    )
  }

  console.log('\n=== TEST 3: GET /api/reading (wrong method → 405) ===')
  {
    const req = new Request('http://localhost/api/reading', { method: 'GET' })
    const res = await handler_reading(req)
    assert(res.status === 405, `GET returns 405 (got ${res.status})`)
  }

  console.log('\n=== TEST 4: POST /api/reading with empty body (→ 400 JSON pre-stream) ===')
  {
    const req = new Request('http://localhost/api/reading', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    })
    const res = await handler_reading(req)
    const body = (await res.json()) as { error?: string }
    assert(res.status === 400, `bad payload returns 400 (got ${res.status})`)
    assert(
      res.headers.get('content-type')?.includes('application/json'),
      'error response is JSON (not SSE)',
    )
    assert(!!body.error, `has error message: "${body.error}"`)
  }

  console.log('\n=== TEST 5: POST /api/reading with valid payload (→ SSE stream) ===')
  {
    const payload = {
      spread: {
        id: 'one',
        title: 'Một lá',
        description: 'test',
        cardCount: 1,
        positions: [{ label: 'Tâm điểm', hint: 'Thông điệp.' }],
      },
      drawn: [
        {
          card: {
            id: 0,
            name: 'The Fool',
            arcana: 'major',
            upright: 'new beginnings',
            reversed: 'recklessness',
            keywords: ['beginnings', 'innocence'],
          },
          reversed: false,
          positionIndex: 0,
        },
      ],
      question: '',
    }
    const req = new Request('http://localhost/api/reading', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const res = await handler_reading(req)
    assert(
      res.headers.get('content-type')?.includes('text/event-stream'),
      `valid payload opens SSE stream (content-type: ${res.headers.get('content-type')})`,
    )
    // Read the stream and collect events.
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let text = ''
    let sawError = false
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      text += decoder.decode(value, { stream: true })
      if (text.includes('event: error')) {
        sawError = true
        break
      }
      if (text.includes('event: done')) break
    }
    assert(text.includes('event:'), `stream emitted at least one SSE event`)
    // With a dummy key, we expect an error event (API key invalid).
    console.log(
      `  → stream content (first 200 chars): ${text.slice(0, 200).replace(/\n/g, '\\n')}`,
    )
    if (process.env.GEMINI_API_KEY === 'dummy_test_key') {
      assert(sawError, 'dummy key → error event emitted (expected)')
    } else {
      assert(text.includes('event: delta') || text.includes('event: done'), 'real key → delta/done events')
    }
  }

  console.log('\n=== TEST 6: POST /api/chat with bad payload (→ 400) ===')
  {
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"turns":[]}',
    })
    const res = await handler_chat(req)
    assert(res.status === 400, `empty turns returns 400 (got ${res.status})`)
  }

  console.log('\n=== TEST 7: meta event structure (3-card spread with mixed cards) ===')
  {
    // 3-card spread: The Emperor (id 4, Major, Aries/Fire) + 2 of Cups (id 37, Water) + 7 of Swords (id 56, Air)
    const payload = {
      spread: {
        id: 'three',
        title: 'Ba lá',
        description: 'P/P/F',
        cardCount: 3,
        positions: [
          { label: 'Quá khứ', hint: 'a' },
          { label: 'Hiện tại', hint: 'b' },
          { label: 'Tương lai', hint: 'c' },
        ],
      },
      drawn: [
        { card: { id: 4, name: 'The Emperor', arcana: 'major', upright: 'x', reversed: 'y', keywords: [] }, reversed: false, positionIndex: 0 },
        { card: { id: 37, name: 'Two of Cups', arcana: 'minor', suit: 'cups', upright: 'x', reversed: 'y', keywords: [] }, reversed: true, positionIndex: 1 },
        { card: { id: 56, name: 'Seven of Swords', arcana: 'minor', suit: 'swords', upright: 'x', reversed: 'y', keywords: [] }, reversed: false, positionIndex: 2 },
      ],
      question: 'test',
    }
    const req = new Request('http://localhost/api/reading', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const res = await handler_reading(req)
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let text = ''
    // Read just enough to get the meta event (before Gemini error on dummy key).
    while (!text.includes('event: meta') && !text.includes('event: error')) {
      const { done, value } = await reader.read()
      if (done) break
      text += decoder.decode(value, { stream: true })
      if (text.length > 2000) break
    }
    const metaMatch = text.match(/event: meta\ndata: ({.*})/)
    assert(!!metaMatch, 'meta event emitted before deltas')
    if (metaMatch) {
      const meta = JSON.parse(metaMatch[1])
      assert(meta.dominantCard?.id === 4, `dominant card is The Emperor (sole Major, id 4) (got id ${meta.dominantCard?.id})`)
      assert(meta.crossCardSummary.major === 1, `crossCardSummary.major === 1 (got ${meta.crossCardSummary.major})`)
      assert(meta.crossCardSummary.minor === 2, `crossCardSummary.minor === 2 (got ${meta.crossCardSummary.minor})`)
      assert(meta.crossCardSummary.reversed === 1, `crossCardSummary.reversed === 1 (got ${meta.crossCardSummary.reversed})`)
      assert(meta.crossCardSummary.elements.Fire === 1, `elements.Fire === 1 (got ${meta.crossCardSummary.elements.Fire})`)
      assert(meta.crossCardSummary.elements.Water === 1, `elements.Water === 1 (got ${meta.crossCardSummary.elements.Water})`)
      // Fire + Water should be hostile; Fire + Air friendly; Water + Air hostile
      const hostile = meta.dignities.filter((d: { relation: string }) => d.relation === 'hostile')
      assert(hostile.length >= 1, `at least one hostile dignity (Fire+Water) (got ${hostile.length})`)
      console.log(`  → dominant: ${meta.dominantCard.name}, dignities: ${meta.dignities.length}`)
    }
  }

  console.log('\n=== DONE ===')
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exitCode = 1
})
