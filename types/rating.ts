// Tool rating (like/dislike) shared types.
// A like counts as a 5-star vote, a dislike as a 2-star vote — every stored
// vote is an integer; `average` and `count` are derived from the two counters.

export type ToolVote = 'like' | 'dislike'

export interface ToolRatingSummary {
  likes: number
  dislikes: number
  count: number
  average: number
}
