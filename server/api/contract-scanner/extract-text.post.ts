import { Buffer } from 'node:buffer'
import { createError, readBody } from 'h3'
import { PDFParse } from 'pdf-parse'
import { requireAdminUser } from '~~/server/utils/auth'
import { extractPdfTextFromBase64 } from '~~/server/utils/pdf-text'

function extractResponseText(payload: Record<string, unknown>): string {
  const top = payload.output_text
  if (typeof top === 'string' && top.trim())
    return top.trim()

  const output = Array.isArray(payload.output) ? payload.output : []
  const chunks: string[] = []
  for (const item of output) {
    const content = Array.isArray((item as Record<string, unknown>).content)
      ? ((item as Record<string, unknown>).content as unknown[])
      : []
    for (const c of content) {
      const text = (c as Record<string, unknown>).text
      if (typeof text === 'string' && text.trim())
        chunks.push(text)
    }
  }
  return chunks.join('\n').trim()
}

async function ocrPdfFirstPageWithOpenAI(fileBase64: string, openaiApiKey: string): Promise<string> {
  const b64 = fileBase64.includes(',') ? fileBase64.split(',').at(-1) || '' : fileBase64
  const buffer = Buffer.from(b64, 'base64')

  const parser = new PDFParse({ data: buffer })
  const screenshots = await parser.getScreenshot({ first: 1, imageDataUrl: true, desiredWidth: 1400 })
  await parser.destroy()

  const first = screenshots.pages?.[0]
  if (!first?.dataUrl)
    return ''

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-mini',
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: 'Extract all visible text from this document page. Return plain text only, preserving line breaks.',
            },
            {
              type: 'input_image',
              image_url: first.dataUrl,
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok)
    return ''

  const payload = await response.json() as Record<string, unknown>
  return extractResponseText(payload)
}

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)
  const body = await readBody<{
    fileName?: string
    fileMime?: string
    fileBase64?: string
    files?: Array<{
      fileName?: string
      fileMime?: string
      fileBase64?: string
    }>
  }>(event)

  const fileMime = body?.fileMime || ''
  const fileBase64 = body?.fileBase64 || ''
  const files = body?.files || []
  if (!fileBase64 && files.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'File payload is required' })
  }

  const config = useRuntimeConfig(event)
  const openaiApiKey = config.openaiApiKey
  if (!openaiApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'OpenAI API key is not configured' })
  }

  let text = ''

  if (files.length > 0) {
    const pages: string[] = []
    for (const [index, file] of files.entries()) {
      const mime = file.fileMime || ''
      const b64 = file.fileBase64 || ''
      if (!mime.startsWith('image/') || !b64)
        continue
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-mini',
          input: [
            {
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text: 'Extract all visible text from this document image. Return plain text only, preserving line breaks.',
                },
                {
                  type: 'input_image',
                  image_url: b64,
                },
              ],
            },
          ],
        }),
      })
      if (!response.ok)
        continue
      const payload = await response.json() as Record<string, unknown>
      const pageText = extractResponseText(payload).trim()
      if (pageText)
        pages.push(`Page ${index + 1}:\n${pageText}`)
    }
    text = pages.join('\n\n')
  }

  else if (fileMime === 'application/pdf') {
    text = await extractPdfTextFromBase64(fileBase64)

    if (text.length < 30) {
      const ocrText = await ocrPdfFirstPageWithOpenAI(fileBase64, openaiApiKey)
      if (ocrText.trim().length > text.length)
        text = ocrText.trim()
    }
  }
  else if (fileMime.startsWith('image/')) {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: 'Extract all visible text from this document image. Return plain text only, preserving line breaks.',
              },
              {
                type: 'input_image',
                image_url: fileBase64,
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      throw createError({ statusCode: 400, statusMessage: 'Unable to extract text from this image' })
    }
    const payload = await response.json() as Record<string, unknown>
    text = extractResponseText(payload)
  }
  else {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported file type' })
  }

  if (!text) {
    throw createError({ statusCode: 400, statusMessage: 'Unable to extract text from this file' })
  }

  return {
    text,
    chars: text.length,
    fileName: body?.fileName || '',
  }
})
