import { Buffer } from 'node:buffer'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

function normalizeExtractedText(text: string): string {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => !/^--\s*\d+\s+of\s+\d+\s*--$/i.test(line))
    .join('\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export async function extractPdfTextFromBase64(fileBase64: string): Promise<string> {
  const b64 = fileBase64.includes(',') ? fileBase64.split(',').at(-1) || '' : fileBase64
  const buffer = Buffer.from(b64, 'base64')
  return extractPdfTextFromBuffer(buffer)
}

export async function extractPdfTextFromBuffer(buffer: Buffer): Promise<string> {
  const loadingTask = getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  })
  const pdf = await loadingTask.promise
  try {
    const pages: string[] = []
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const content = await page.getTextContent()
      const chunks: string[] = []

      for (const item of content.items) {
        if ('str' in item) {
          chunks.push(item.str || '')
          if (item.hasEOL)
            chunks.push('\n')
          else
            chunks.push(' ')
        }
      }

      const pageText = chunks.join('').replace(/[ \t]+\n/g, '\n').trim()
      if (pageText)
        pages.push(pageText)
    }

    return normalizeExtractedText(pages.join('\n\n'))
  }
  finally {
    await pdf.destroy()
    await loadingTask.destroy()
  }
}
