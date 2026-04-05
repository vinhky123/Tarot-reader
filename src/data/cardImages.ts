import wikiFiles from './wikimedia-rws-files.json'

const WIKI_BASE =
  'https://commons.wikimedia.org/wiki/Special:FilePath/'

/** Thumbnail qua Commons; hoạt động ngay cả khi chưa chạy download-cards. */
export function remoteCardSrc(id: number, width = 420): string {
  const name = wikiFiles[id]
  if (!name) return ''
  return `${WIKI_BASE}${encodeURIComponent(name)}?width=${width}`
}

export function localCardSrc(id: number): string {
  return `/cards/${id}.jpeg`
}
