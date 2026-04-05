/**
 * Downloads Rider-Waite 1909 scans from Wikimedia Commons (public domain)
 * into public/cards/0.jpeg … 77.jpeg (same order as src/data/wikimedia-rws-files.json).
 */
import { mkdir, writeFile, access, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'public', 'cards')
const MANIFEST = join(__dirname, '..', 'src', 'data', 'wikimedia-rws-files.json')
const API = 'https://commons.wikimedia.org/w/api.php'

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

async function fileExists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function fetchImageWithRetry(url, id) {
  const headers = {
    'User-Agent': 'TarotReaderSetup/1.0 (educational; local dev)',
  }
  for (let attempt = 0; attempt < 12; attempt++) {
    const res = await fetch(url, { headers })
    if (res.status === 429) {
      const wait = 5000 * (attempt + 1)
      console.warn(`429 id ${id}, retry in ${wait}ms`)
      await delay(wait)
      continue
    }
    if (!res.ok) throw new Error(`Download ${id}: ${res.status}`)
    return Buffer.from(await res.arrayBuffer())
  }
  throw new Error(`Download ${id}: too many 429s`)
}

async function resolveUrls(filenames) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    prop: 'imageinfo',
    iiprop: 'url',
    titles: filenames.map((f) => `File:${f}`).join('|'),
  })
  const res = await fetch(`${API}?${params}`, {
    headers: {
      'User-Agent': 'TarotReaderSetup/1.0 (educational; local dev)',
    },
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  const data = await res.json()
  const pages = data.query?.pages ?? {}
  const byTitle = new Map()
  for (const page of Object.values(pages)) {
    const name = page.title?.replace(/^File:/, '') ?? ''
    const url = page.imageinfo?.[0]?.url
    byTitle.set(name, page.missing ? null : url)
  }
  return filenames.map((name) => byTitle.get(name) ?? null)
}

async function main() {
  const raw = await readFile(MANIFEST, 'utf8')
  const COMMONS_FILENAMES = JSON.parse(raw)
  await mkdir(OUT_DIR, { recursive: true })
  const chunk = 20
  for (let i = 0; i < COMMONS_FILENAMES.length; i += chunk) {
    const slice = COMMONS_FILENAMES.slice(i, i + chunk)
    await delay(800)
    const urls = await resolveUrls(slice)
    for (let j = 0; j < slice.length; j++) {
      const id = i + j
      const name = slice[j]
      const outPath = join(OUT_DIR, `${id}.jpeg`)
      if (await fileExists(outPath)) {
        console.log(`skip ${id}.jpeg (exists)`)
        continue
      }
      const url = urls[j]
      if (!url) {
        console.error(`Missing URL for ${name} (id ${id})`)
        continue
      }
      const buf = await fetchImageWithRetry(url, id)
      await writeFile(outPath, buf)
      console.log(`OK ${id}.jpeg ← ${name}`)
      await delay(1800)
    }
  }
  console.log('Done. 78 cards in public/cards/')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
