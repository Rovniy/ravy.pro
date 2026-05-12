import { FieldValue } from 'firebase-admin/firestore'
import { defineEventHandler, getRouterParam, sendRedirect } from 'h3'
import { getDb, SHORTLINKS_COLLECTION } from '~~/server/utils/firebase-admin'

const VALID_CODE = /^[\w-]{1,32}$/

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code') ?? ''
  if (!VALID_CODE.test(code)) {
    return sendRedirect(event, '/', 302)
  }

  const db = getDb()
  const ref = db.collection(SHORTLINKS_COLLECTION).doc(code)
  const snap = await ref.get()

  if (!snap.exists) {
    return sendRedirect(event, '/', 302)
  }

  const url = snap.get('url') as string | undefined
  if (!url) {
    return sendRedirect(event, '/', 302)
  }

  ref.update({
    clicks: FieldValue.increment(1),
    lastClickedAt: FieldValue.serverTimestamp(),
  }).catch(() => { /* fire-and-forget */ })

  return sendRedirect(event, url, 302)
})
