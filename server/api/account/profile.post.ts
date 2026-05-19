import { createError, readBody } from 'h3'
import { requireUser } from '~~/server/utils/auth'
import { getDb } from '~~/server/utils/firebase-admin'

const COLLECTION = 'user_profiles'
const ALLOWED = new Set(['en', 'ru'])

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody<{ language?: string }>(event)
  const language = (body?.language || '').trim().toLowerCase()

  if (!ALLOWED.has(language)) {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported language' })
  }

  await getDb().collection(COLLECTION).doc(user.uid).set({
    language,
    updatedAt: new Date().toISOString(),
  }, { merge: true })

  return { language }
})
