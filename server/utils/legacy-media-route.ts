import type { H3Event } from 'h3'
import { getLegacyMediaMap } from './legacy-media'

/**
 * Shared handler for the three legacy asset prefixes.
 *
 * These routes are dormant while the files are still in `public/` — Nitro
 * serves a static asset before it reaches a route — and take over the moment the
 * folders are deleted.
 *
 * 301 rather than 302: the move is permanent, and a permanent redirect is what
 * lets Google Images carry the old URL's standing over to the new one.
 */
export async function legacyMediaRedirect(event: H3Event, prefix: string): Promise<void> {
  const path = getRouterParam(event, 'path') ?? ''
  if (!path || path.includes('..'))
    throw createError({ statusCode: 404, statusMessage: 'Not found' })

  const target = (await getLegacyMediaMap())[`/${prefix}/${decodeURIComponent(path)}`]
  if (!target)
    throw createError({ statusCode: 404, statusMessage: 'Not found' })

  // A day, not a year: the redirect is cheap to re-check, and an immutable 301
  // would be permanent in every browser cache if the map ever needed a fix.
  setHeader(event, 'cache-control', 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800')
  await sendRedirect(event, target, 301)
}
