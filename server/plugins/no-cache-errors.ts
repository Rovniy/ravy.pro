import type { H3Event } from 'h3'

/**
 * A server error must never be held by the CDN.
 *
 * The routeRules `headers` (s-maxage=60, stale-while-revalidate=600 on the blog
 * and TIL pages) are set before the page renders, so a 503 thrown because
 * Firestore blinked went out with them too — and the CDN could keep serving
 * that error page for up to eleven minutes after Firestore came back.
 *
 * A fatal SSR error skips `render:response` and goes through Nitro's error
 * handler, so the override hooks `error`, which runs before that handler sends.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error: unknown, ctx: { event?: H3Event }) => {
    const status = (error as { statusCode?: number }).statusCode ?? 500
    if (status >= 500 && ctx.event && !ctx.event.node.res.headersSent)
      ctx.event.node.res.setHeader('cache-control', 'no-store')
  })
})
