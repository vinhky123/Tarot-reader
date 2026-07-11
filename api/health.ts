import { getModel, isConfigured } from './_shared'

export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(req) })
  }
  if (req.method !== 'GET') {
    return json(405, { error: 'Method not allowed' }, req)
  }
  return json(
    200,
    { ok: true, model: getModel(), configured: isConfigured() },
    req,
  )
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
