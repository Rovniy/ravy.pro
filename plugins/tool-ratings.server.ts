import type { ToolId } from '~/data/analytics'
import type { ToolRatingSummary } from '~/types/rating'
import { toolIdFromPath } from '~/data/analytics'

/**
 * Loads the tool ratings into shared state before the server renders, so the
 * prerendered tool pages and the /tools hub ship the rating widget and the card
 * badges already filled in instead of a skeleton.
 *
 * Why a plugin and not a composable: tool pages are prerendered, and a
 * `useAsyncData` call inside a composable registers a promise without suspending
 * setup, so the HTML would render with `null`. An async Nuxt plugin *is* awaited
 * before the app renders.
 *
 * The ratings are deliberately NOT in the JSON-LD: the counters are seeded, and
 * review markup on invented votes is a manual-action risk (see useToolPageSchema).
 *
 * Server-only (`.server.ts`): `useState` carries the value across in the payload,
 * so the browser makes no extra request.
 *
 * Scoped to `/tools` routes so the other prerendered pages don't each pay a
 * Firestore round-trip at build time.
 *
 * Fails soft and silently: with no Firestore credentials (or an outage) the
 * state stays null and the widget fills in on the client.
 */
export default defineNuxtPlugin(async (nuxtApp) => {
  const path = nuxtApp.ssrContext?.url?.split('?')[0] ?? ''
  if (!path.startsWith('/tools'))
    return

  // Skip result pages and anything not in the tool registry — the hub itself
  // (/tools) does want them, for the rating badges on its cards.
  if (path !== '/tools' && !toolIdFromPath(path))
    return

  const ratings = useState<Record<ToolId, ToolRatingSummary> | null>('tool-ratings', () => null)
  if (ratings.value)
    return

  try {
    ratings.value = await $fetch<Record<ToolId, ToolRatingSummary>>('/api/ratings')
  }
  catch {
    // Fail-soft: the widget loads its numbers on the client instead.
  }
})
