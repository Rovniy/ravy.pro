import { createError, readBody } from 'h3'
import { TOOL_IDS } from '~~/data/analytics'
import { assertRateLimit, clientIdentity } from '~~/server/utils/rate-limit'
import { applyVote } from '~~/server/utils/ratings'
import { reportServerError } from '~~/server/utils/report-error'
import { ratingSummary } from '~~/utils/rating'

export default defineEventHandler(async (event) => {
  // Public endpoint → throttle per IP. 20/10min leaves room to rate every
  // tool and change one's mind while capping scripted ballot-stuffing.
  await assertRateLimit({ bucket: 'tool-rating', identity: clientIdentity(event), limit: 20, windowMs: 10 * 60 * 1000 })

  const body = await readBody<{ toolId?: string, vote?: string, previous?: string | null }>(event)

  const toolId = String(body?.toolId || '')
  if (!(TOOL_IDS as readonly string[]).includes(toolId))
    throw createError({ statusCode: 400, statusMessage: 'Unknown tool' })

  const vote = body?.vote
  if (vote !== 'like' && vote !== 'dislike')
    throw createError({ statusCode: 400, statusMessage: 'Vote must be like or dislike' })

  const previous = body?.previous === 'like' || body?.previous === 'dislike' ? body.previous : null
  if (previous === vote)
    throw createError({ statusCode: 400, statusMessage: 'Vote unchanged' })

  try {
    return ratingSummary(await applyVote(toolId, vote, previous))
  }
  catch (err) {
    reportServerError(err, { kind: 'tool-rating-vote', toolId })
    throw createError({ statusCode: 502, statusMessage: 'Could not record your vote. Please try again.' })
  }
})
