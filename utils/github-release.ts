// Pure parsing of a GitHub "latest release" payload.
//
// Kept free of fetch/h3 so it unit-tests directly; the network call and its
// cache live in server/api/xploit-translator/release.get.ts.

// The one place the repo slug lives — imported by both the Nitro route that
// queries the API and the page that renders the static fallback links.
export const TRANSLATOR_REPO = 'Rovniy/windows-translater'
export const TRANSLATOR_REPO_URL = `https://github.com/${TRANSLATOR_REPO}`
export const TRANSLATOR_RELEASES_URL = `${TRANSLATOR_REPO_URL}/releases`

export interface ReleaseAsset {
  name: string
  url: string
  size: number
}

export interface LatestRelease {
  /** tag_name with a leading `v` stripped — the workflow accepts both forms. */
  version: string
  /** html_url of the release page. */
  url: string
  /** ISO timestamp, or an empty string when GitHub omits it (draft/unpublished). */
  publishedAt: string
  installer: ReleaseAsset | null
  portable: ReleaseAsset | null
  checksums: ReleaseAsset | null
}

function toAsset(raw: unknown): ReleaseAsset | null {
  if (!raw || typeof raw !== 'object')
    return null
  const a = raw as Record<string, unknown>
  const name = typeof a.name === 'string' ? a.name : ''
  const url = typeof a.browser_download_url === 'string' ? a.browser_download_url : ''
  if (!name || !url)
    return null
  return { name, url, size: typeof a.size === 'number' && a.size > 0 ? a.size : 0 }
}

// Assets are matched by suffix, never by position: the release workflow may
// upload them in any order, and it adds files over time.
function findBySuffix(assets: ReleaseAsset[], suffix: string): ReleaseAsset | null {
  const lower = suffix.toLowerCase()
  return assets.find(a => a.name.toLowerCase().endsWith(lower)) || null
}

/**
 * Normalises GitHub's `/releases/latest` JSON. Returns `null` for anything
 * that isn't a recognisable release, so the caller can fall back to plain
 * links instead of rendering a half-empty download card.
 */
export function parseRelease(raw: unknown): LatestRelease | null {
  if (!raw || typeof raw !== 'object')
    return null
  const r = raw as Record<string, unknown>

  const tag = typeof r.tag_name === 'string' ? r.tag_name.trim() : ''
  if (!tag)
    return null

  const assets = Array.isArray(r.assets)
    ? r.assets.map(toAsset).filter((a): a is ReleaseAsset => a !== null)
    : []

  return {
    version: tag.replace(/^v/i, ''),
    url: typeof r.html_url === 'string' ? r.html_url : '',
    publishedAt: typeof r.published_at === 'string' ? r.published_at : '',
    installer: findBySuffix(assets, '-setup.exe'),
    portable: findBySuffix(assets, '-portable.exe'),
    checksums: findBySuffix(assets, 'SHA256SUMS.txt'),
  }
}
