import type { ToolId } from '~~/data/analytics'
import type { ToolRatingSummary } from '~~/types/rating'
import { createError, setResponseHeader } from 'h3'
import { TOOL_IDS } from '~~/data/analytics'
import { getOrSeedRatings } from '~~/server/utils/ratings'
import { reportServerError } from '~~/server/utils/report-error'
import { ratingSummary } from '~~/utils/rating'

export default defineEventHandler(async (event) => {
  // Ratings move slowly — let browsers/CDN cache; post-vote freshness comes
  // from the POST response, not from re-fetching this endpoint.
  setResponseHeader(event, 'Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')

  try {
    const counts = await getOrSeedRatings(TOOL_IDS)
    return Object.fromEntries(
      TOOL_IDS.map(id => [id, ratingSummary(counts[id])]),
    ) as Record<ToolId, ToolRatingSummary>
  }
  catch (err) {
    reportServerError(err, { kind: 'tool-ratings-get' })
    throw createError({ statusCode: 502, statusMessage: 'Ratings are unavailable right now' })
  }
})
