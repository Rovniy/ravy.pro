import type { ToolId } from '~/data/analytics'
import type { ToolRatingSummary, ToolVote } from '~/types/rating'
import { EVENTS } from '~/data/analytics'
import { DISLIKE_VALUE, LIKE_VALUE } from '~/utils/rating'

// Tool rating state. All ratings come from one GET /api/ratings shared via
// useState, so the homepage cards and any tool page visited in the same
// session cost a single fetch. Everything is client-only and fail-soft: on
// error the widget simply stays hidden.

const STORAGE_PREFIX = 'tool-rating.'

function readStoredVote(toolId: ToolId): ToolVote | null {
  try {
    const v = localStorage.getItem(`${STORAGE_PREFIX}${toolId}`)
    return v === 'like' || v === 'dislike' ? v : null
  }
  catch {
    return null
  }
}

export function useToolRatings() {
  const ratings = useState<Record<ToolId, ToolRatingSummary> | null>('tool-ratings', () => null)
  const pending = useState<boolean>('tool-ratings-pending', () => false)

  async function load() {
    if (!import.meta.client || ratings.value || pending.value)
      return
    pending.value = true
    try {
      ratings.value = await $fetch<Record<ToolId, ToolRatingSummary>>('/api/ratings')
    }
    catch {
      // Fail-soft: no ratings → widgets render nothing.
    }
    finally {
      pending.value = false
    }
  }

  return { ratings, pending, load }
}

// The server-side half of this lives in plugins/tool-ratings.server.ts, which
// fills the same `useState('tool-ratings')` before the server renders so the
// rating reaches the JSON-LD in the prerendered HTML. `load()` above stays
// client-only for the interactive widget; the payload means it usually finds the
// state already populated and skips the request.

// `toolId: null` (page not in TOOL_IDS) is a supported no-op: nothing loads,
// nothing renders — so the widget can resolve the id from the route itself.
export function useToolRating(toolId: ToolId | null) {
  const { ratings, pending, load } = useToolRatings()
  const { track } = useAnalytics()

  const summary = computed(() => (toolId ? ratings.value?.[toolId] : null) ?? null)
  const myVote = ref<ToolVote | null>(null)
  const voting = ref(false)

  onMounted(() => {
    if (!toolId)
      return
    load()
    myVote.value = readStoredVote(toolId)
  })

  async function vote(v: ToolVote) {
    if (!toolId || voting.value || myVote.value === v)
      return
    const previous = myVote.value
    voting.value = true
    try {
      const next = await $fetch<ToolRatingSummary>('/api/ratings/vote', {
        method: 'POST',
        body: { toolId, vote: v, previous },
      })
      ratings.value = { ...(ratings.value ?? {} as Record<ToolId, ToolRatingSummary>), [toolId]: next }
      myVote.value = v
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${toolId}`, v)
      }
      catch {}
      track(EVENTS.TOOL_RATE, {
        tool_id: toolId,
        action: v,
        rating: v === 'like' ? LIKE_VALUE : DISLIKE_VALUE,
        changed: previous !== null,
      })
    }
    catch {
      // Server response is the source of truth — nothing was applied locally,
      // so there is nothing to roll back.
    }
    finally {
      voting.value = false
    }
  }

  return { summary, pending, myVote, voting, vote }
}
