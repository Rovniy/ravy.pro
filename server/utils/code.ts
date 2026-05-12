import { createError } from 'h3'
import { customAlphabet } from 'nanoid'
import { getDb, SHORTLINKS_COLLECTION } from './firebase-admin'

const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'
const CODE_LENGTH = 6
const MAX_ATTEMPTS = 5

const nanoid = customAlphabet(ALPHABET, CODE_LENGTH)

export async function generateUniqueCode(): Promise<string> {
  const db = getDb()
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const code = nanoid()
    const snap = await db.collection(SHORTLINKS_COLLECTION).doc(code).get()
    if (!snap.exists)
      return code
  }
  throw createError({ statusCode: 500, statusMessage: 'Failed to generate unique code' })
}
