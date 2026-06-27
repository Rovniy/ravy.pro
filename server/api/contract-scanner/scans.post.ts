import { createError, readBody } from 'h3'
import { getOptionalUser } from '~~/server/utils/access'
import { contractScanCollection, processContractScan } from '~~/server/utils/contract-scan'
import { extractPdfTextFromBase64 } from '~~/server/utils/pdf-text'
import { assertRateLimit, clientIdentity } from '~~/server/utils/rate-limit'
import { reportServerError } from '~~/server/utils/report-error'

// Public endpoint: the scan (and its result) is produced for free; the paywall
// only gates *viewing the full report*. Throttle by IP to cap pre-payment
// OpenAI spend / Firestore writes from anonymous callers.
export default defineEventHandler(async (event) => {
  await assertRateLimit({ bucket: 'contract-scan', identity: clientIdentity(event), limit: 20, windowMs: 60 * 60 * 1000 })
  const owner = await getOptionalUser(event)
  const body = await readBody<{
    text?: string
    fileName?: string
    fileMime?: string
    fileBase64?: string
    responseLanguage?: string
  }>(event)

  let text = (body?.text || '').trim()

  const fileMime = body?.fileMime || ''
  const fileBase64 = body?.fileBase64 || ''
  const fileName = body?.fileName || ''
  const responseLanguage = (body?.responseLanguage || 'en').trim() || 'en'

  if (!text && fileMime === 'application/pdf' && fileBase64) {
    text = await extractPdfTextFromBase64(fileBase64)
  }

  if (!text) {
    throw createError({ statusCode: 400, statusMessage: 'Contract text is required (or provide a valid PDF)' })
  }

  const minLength = 30
  if (text.length < minLength) {
    const source = fileMime === 'application/pdf' ? 'PDF' : 'text'
    throw createError({
      statusCode: 400,
      statusMessage: `Extracted ${source} content is too short for analysis (${text.length} chars, minimum ${minLength}). If this is a scanned PDF/image, run OCR first or paste text manually.`,
    })
  }

  // ~100 KB cap — guards against OOM and runaway OpenAI token spend.
  const maxLength = 100_000
  if (text.length > maxLength) {
    throw createError({
      statusCode: 413,
      statusMessage: `Contract text is too long (${text.length} chars, maximum ${maxLength}). Trim it to the most relevant sections and try again.`,
    })
  }

  const config = useRuntimeConfig(event)
  const openaiApiKey = config.openaiApiKey
  if (!openaiApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'OpenAI API key is not configured' })
  }

  const docRef = contractScanCollection().doc()
  const now = new Date().toISOString()
  await docRef.set({
    // Link to the buyer when signed in so the scan shows in their account
    // history; anonymous scans stay reachable via the paid token link.
    ...(owner ? { ownerUid: owner.uid, ownerEmail: owner.email } : {}),
    status: 'queued',
    progress: 5,
    step: 'Queued',
    paid: false,
    sourceFileName: fileName || undefined,
    responseLanguage,
    inputPreview: text.slice(0, 280),
    createdAt: now,
    updatedAt: now,
  })

  void processContractScan(docRef.id, text, openaiApiKey, responseLanguage).catch((err) => {
    reportServerError(err, { kind: 'contract-scan' })
  })

  return {
    id: docRef.id,
    status: 'queued',
    progress: 5,
    step: 'Queued',
  }
})
