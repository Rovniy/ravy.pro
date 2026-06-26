import { createError, readBody } from 'h3'
import { requireToolAccess } from '~~/server/utils/access'
import { contractScanCollection, processContractScan } from '~~/server/utils/contract-scan'
import { extractPdfTextFromBase64 } from '~~/server/utils/pdf-text'
import { assertRateLimit } from '~~/server/utils/rate-limit'

export default defineEventHandler(async (event) => {
  const admin = await requireToolAccess(event, 'contract-scanner')
  await assertRateLimit({ bucket: 'contract-scan', identity: admin.uid, limit: 20, windowMs: 60 * 60 * 1000 })
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

  const config = useRuntimeConfig(event)
  const openaiApiKey = config.openaiApiKey
  if (!openaiApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'OpenAI API key is not configured' })
  }

  const docRef = contractScanCollection().doc()
  const now = new Date().toISOString()
  await docRef.set({
    ownerUid: admin.uid,
    status: 'queued',
    progress: 5,
    step: 'Queued',
    sourceFileName: fileName || undefined,
    inputPreview: text.slice(0, 280),
    createdAt: now,
    updatedAt: now,
  })

  void processContractScan(docRef.id, text, openaiApiKey, responseLanguage).catch((err) => {
    console.error('Contract scan failed', err)
  })

  return {
    id: docRef.id,
    status: 'queued',
    progress: 5,
    step: 'Queued',
  }
})
