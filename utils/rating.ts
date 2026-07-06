// Pure tool-rating math and formatting. Kept free of Firestore/network so it
// can be unit-tested and shared between the server routes and the client
// widget. A like is a 5-star vote, a dislike a 2-star vote.

import type { ToolRatingSummary } from '~/types/rating'

export interface RatingCounts {
  likes: number
  dislikes: number
}

export const LIKE_VALUE = 5
export const DISLIKE_VALUE = 2

/** Average rating rounded to 1 decimal; 0 when there are no votes. */
export function ratingAverage(counts: RatingCounts): number {
  const count = counts.likes + counts.dislikes
  if (count <= 0)
    return 0
  return Math.round(((LIKE_VALUE * counts.likes + DISLIKE_VALUE * counts.dislikes) / count) * 10) / 10
}

export function ratingSummary(counts: RatingCounts): ToolRatingSummary {
  return {
    likes: counts.likes,
    dislikes: counts.dislikes,
    count: counts.likes + counts.dislikes,
    average: ratingAverage(counts),
  }
}

/** 999 → '999', 1234 → '1.2k', 12000 → '12k'. */
export function formatCompactCount(n: number): string {
  if (n < 1000)
    return String(n)
  const thousands = n / 1000
  const rounded = thousands >= 10 ? Math.round(thousands) : Math.round(thousands * 10) / 10
  return `${rounded}k`
}

/**
 * Initial seed for a tool that has no votes yet: 300–2000 total votes with an
 * average between 4 and 5. Since votes are only 5s (likes) and 2s (dislikes),
 * avg ∈ [4, 5] ⇔ likes fraction ∈ [2/3, 1]; the ceil clamp keeps rounding
 * from dipping the average below 4.0.
 */
export function generateRatingSeed(rand: () => number = Math.random): RatingCounts {
  const total = 300 + Math.floor(rand() * 1701)
  const likesFraction = 2 / 3 + rand() * (1 / 3)
  const likes = Math.min(total, Math.max(Math.ceil(total * 2 / 3), Math.round(total * likesFraction)))
  return { likes, dislikes: total - likes }
}
