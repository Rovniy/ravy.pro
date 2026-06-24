import { requireUser } from '~~/server/utils/auth'
import { getDb } from '~~/server/utils/firebase-admin'

const COLLECTION = 'user_profiles'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const ref = getDb().collection(COLLECTION).doc(user.uid)
  const snap = await ref.get()

  const language = snap.exists
    ? ((snap.data()?.language as string | undefined) || 'en')
    : 'en'

  // Record the email so the admin's access manager can list who has signed in.
  await ref.set({ email: user.email, lastSeenAt: new Date().toISOString() }, { merge: true })

  return {
    language,
  }
})
