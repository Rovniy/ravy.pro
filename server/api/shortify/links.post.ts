import { FieldValue } from 'firebase-admin/firestore'
import { createError, defineEventHandler, readBody } from 'h3'
import { requireToolAccess } from '~~/server/utils/access'
import { generateUniqueCode } from '~~/server/utils/code'
import { getDb, SHORTLINKS_COLLECTION } from '~~/server/utils/firebase-admin'

interface CreateBody {
  url?: string
}

function normalizeUrl(input: string): string {
  const trimmed = input.trim()
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  const parsed = new URL(withProtocol)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http(s) URLs are allowed')
  }
  return parsed.toString()
}

export default defineEventHandler(async (event) => {
  const user = await requireToolAccess(event, 'shortify')
  const body = await readBody<CreateBody>(event)
  const raw = body?.url

  if (!raw || typeof raw !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'url is required' })
  }

  let url: string
  try {
    url = normalizeUrl(raw)
  }
  catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid URL' })
  }

  const code = await generateUniqueCode()
  const db = getDb()
  const ref = db.collection(SHORTLINKS_COLLECTION).doc(code)

  await ref.set({
    url,
    clicks: 0,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: user.uid,
  })

  const snap = await ref.get()
  const data = snap.data() ?? {}

  return {
    code,
    url,
    clicks: 0,
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    lastClickedAt: null,
  }
})
