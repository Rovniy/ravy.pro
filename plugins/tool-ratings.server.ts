import type { ToolId } from '~/data/analytics'
import type { ToolRatingSummary } from '~/types/rating'
import { toolIdFromPath } from '~/data/analytics'

/**
 * Loads the tool ratings into shared state before the server renders.
 *
 * Why a plugin and not a composable: the rating has to be in the JSON-LD that
 * crawlers read, and tool pages are prerendered. A `useAsyncData` call inside the
 * schema composable does not work — it registers a promise but does not suspend
 * setup, so Vue renders the graph with `null` and only the payload gets the value
 * afterwards. An async Nuxt plugin *is* awaited before the app renders, so the
 * data is there in time. Verified by the absence of `aggregateRating` in the
 * prerendered HTML with the composable approach.
 *
 * Server-only (`.server.ts`): the client already loads ratings on mount for the
 * interactive widget, and `useState` carries this value across in the payload, so
 * the browser makes no extra request.
 *
 * Scoped to `/tools` routes so the other ~50 prerendered pages don't each pay a
 * Firestore round-trip at build time.
 *
 * Fails soft and silently: a build with no Firestore credentials (or a Firestore
 * outage) leaves the state null, `useToolPageSchema` omits the `aggregateRating`
 * node exactly as it did before, and the widget still fills in on the client.
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
    // Fail-soft: no rating node in the graph, same as before this existed.
  }
})
