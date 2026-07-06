import type { ToolVote } from '~~/types/rating'
import type { RatingCounts } from '~~/utils/rating'
import { FieldValue } from 'firebase-admin/firestore'
import { generateRatingSeed } from '~~/utils/rating'
import { getDb } from './firebase-admin'

export const RATINGS_COLLECTION = 'tool_ratings'

// Guard against corrupted docs — counters must never be NaN or negative.
function normalize(data: FirebaseFirestore.DocumentData | undefined): RatingCounts {
  const clamp = (x: unknown) => Math.max(0, Math.floor(Number(x) || 0))
  return { likes: clamp(data?.likes), dislikes: clamp(data?.dislikes) }
}

// Seed a tool's rating doc exactly once. Transactions are serializable, so a
// concurrent seeder retries, sees the doc, and returns the stored counts.
async function seedRating(toolId: string): Promise<RatingCounts> {
  const db = getDb()
  const ref = db.collection(RATINGS_COLLECTION).doc(toolId)
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (snap.exists)
      return normalize(snap.data())
    const seed = generateRatingSeed()
    tx.set(ref, {
      ...seed,
      seededAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    return seed
  })
}

// One batched read for all tools; only missing docs go through the seeding
// transaction (normally just the very first request after deploy).
export async function getOrSeedRatings(toolIds: readonly string[]): Promise<Record<string, RatingCounts>> {
  const db = getDb()
  const refs = toolIds.map(id => db.collection(RATINGS_COLLECTION).doc(id))
  const snaps = await db.getAll(...refs)

  const result: Record<string, RatingCounts> = {}
  const missing: string[] = []
  snaps.forEach((snap, i) => {
    if (snap.exists)
      result[toolIds[i]] = normalize(snap.data())
    else
      missing.push(toolIds[i])
  })

  for (const toolId of missing)
    result[toolId] = await seedRating(toolId)

  return result
}

// Apply a vote in a single transaction. `previous` (client-claimed) reverses
// an earlier vote when the user changes their mind; the clamp keeps a spoofed
// `previous` from driving a counter negative.
export async function applyVote(toolId: string, vote: ToolVote, previous: ToolVote | null): Promise<RatingCounts> {
  const db = getDb()
  const ref = db.collection(RATINGS_COLLECTION).doc(toolId)
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const current = snap.exists ? normalize(snap.data()) : generateRatingSeed()

    const next = { ...current }
    next[vote === 'like' ? 'likes' : 'dislikes'] += 1
    if (previous && previous !== vote) {
      const key = previous === 'like' ? 'likes' : 'dislikes'
      next[key] = Math.max(0, next[key] - 1)
    }

    tx.set(ref, {
      ...next,
      updatedAt: FieldValue.serverTimestamp(),
      ...(snap.exists ? {} : { seededAt: FieldValue.serverTimestamp() }),
    }, { merge: true })
    return next
  })
}
