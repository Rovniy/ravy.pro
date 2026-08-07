import type { LatestRelease } from '~~/utils/github-release'
import { setResponseHeader } from 'h3'
import { reportServerEvent } from '~~/server/utils/report-error'
import { parseRelease, TRANSLATOR_REPO } from '~~/utils/github-release'

// Proxies GitHub's "latest release" for the XPLOIT Translator download card.
//
// Server-side on purpose: the unauthenticated GitHub API allows 60 requests an
// hour per IP, which visitors would burn through in minutes. With the memo
// below this backend makes at most 4 calls an hour regardless of traffic.

const API_URL = `https://api.github.com/repos/${TRANSLATOR_REPO}/releases/latest`
const TTL_MS = 15 * 60 * 1000

let memo: { release: LatestRelease, fetchedAt: number } | null = null

async function fetchLatest(): Promise<LatestRelease | null> {
  const res = await fetch(API_URL, {
    headers: {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      // GitHub rejects requests without one.
      'User-Agent': 'ravy.pro',
    },
  })
  if (!res.ok)
    throw new Error(`GitHub responded ${res.status}`)
  return parseRelease(await res.json())
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'public, max-age=300, s-maxage=900, stale-while-revalidate=3600')

  if (memo && Date.now() - memo.fetchedAt < TTL_MS)
    return { ok: true as const, release: memo.release }

  try {
    const release = await fetchLatest()
    if (!release)
      throw new Error('Unrecognised release payload')
    memo = { release, fetchedAt: Date.now() }
    return { ok: true as const, release }
  }
  catch (err) {
    // Fail-open, so WARNING rather than ERROR — nothing is broken, the page
    // degrades to plain "latest release" links.
    reportServerEvent('WARNING', err instanceof Error ? err.message : 'GitHub release lookup failed', {
      kind: 'github-release-get',
      repo: TRANSLATOR_REPO,
    })
    // Never a 5xx: a GitHub outage must not surface as an error on a
    // documentation page.
    if (memo)
      return { ok: true as const, release: memo.release, stale: true as const }
    return { ok: false as const, release: null }
  }
})
