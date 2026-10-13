// IndexNow (https://www.indexnow.org): one POST tells Bing, Yandex, Seznam,
// Naver and the other participating engines that a URL changed, so a new note
// is crawled in minutes instead of whenever the sitemap is next read. Google
// does not take part; it still finds pages through the sitemap.
//
// The key is public by design: engines verify it by fetching the key file,
// which proves the submitter controls the host. It is served at KEY_PATH by
// server/routes/indexnow-key.txt.ts, and `keyLocation` points at it, which
// covers every URL on the host since the file sits at the root.

export const INDEXNOW_KEY = '50de139b9c736888d1ecddf526bc2816'
export const INDEXNOW_KEY_PATH = '/indexnow-key.txt'
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

/** The request body for a batch of root-relative paths on `site`. */
export function indexNowPayload(site: string, paths: string[]) {
  const origin = site.replace(/\/+$/, '')
  return {
    host: new URL(origin).host,
    key: INDEXNOW_KEY,
    keyLocation: `${origin}${INDEXNOW_KEY_PATH}`,
    urlList: [...new Set(paths)].map(p => (p.startsWith('http') ? p : `${origin}${p}`)),
  }
}
