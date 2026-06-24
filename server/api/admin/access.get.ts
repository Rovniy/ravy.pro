import type { ManagedAccount } from '~~/types/access'
import { GATED_TOOLS } from '~~/data/services'
import { accessCollection } from '~~/server/utils/access'
import { requireAdminUser } from '~~/server/utils/auth'
import { getDb } from '~~/server/utils/firebase-admin'

// Admin-only: every known account (signed-in users + emails with grants) and the
// gated-tool registry, so the UI can render a checkbox matrix.
export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const [grantsSnap, profilesSnap] = await Promise.all([
    accessCollection().get(),
    getDb().collection('user_profiles').get(),
  ])

  const map = new Map<string, ManagedAccount>()

  for (const doc of profilesSnap.docs) {
    const data = doc.data()
    const email = (data.email as string | undefined)?.toLowerCase()
    if (!email)
      continue
    map.set(email, {
      email,
      displayName: data.displayName as string | undefined,
      tools: [],
      hasSignedIn: true,
    })
  }

  for (const doc of grantsSnap.docs) {
    const email = doc.id // doc id is the normalized email
    const tools = Array.isArray(doc.data().tools) ? doc.data().tools as string[] : []
    const existing = map.get(email)
    if (existing)
      existing.tools = tools
    else
      map.set(email, { email, tools, hasSignedIn: false })
  }

  const accounts = [...map.values()].sort((a, b) => a.email.localeCompare(b.email))
  return { accounts, tools: GATED_TOOLS }
})
