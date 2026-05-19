import { Buffer } from 'node:buffer'
import { describe, expect, it, vi } from 'vitest'

const getTextContentMock = vi.fn()
const getPageMock = vi.fn()
const pdfDestroyMock = vi.fn(async () => {})
const taskDestroyMock = vi.fn(async () => {})

vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: getPageMock,
      destroy: pdfDestroyMock,
    }),
    destroy: taskDestroyMock,
  })),
}))

describe('server/utils/pdf-text', () => {
  it('extracts and normalizes text from buffer', async () => {
    getTextContentMock.mockResolvedValueOnce({
      items: [
        { str: '-- 1 of 1 --', hasEOL: true },
        { str: 'Hello', hasEOL: false },
        { str: 'world', hasEOL: true },
      ],
    })
    getPageMock.mockResolvedValueOnce({
      getTextContent: getTextContentMock,
    })

    const { extractPdfTextFromBuffer } = await import('~~/server/utils/pdf-text')
    const result = await extractPdfTextFromBuffer(Buffer.from('x'))
    expect(result).toContain('Hello world')
    expect(result).not.toContain('-- 1 of 1 --')
  })

  it('extracts from base64 wrapper', async () => {
    getTextContentMock.mockResolvedValueOnce({
      items: [{ str: 'Text', hasEOL: true }],
    })
    getPageMock.mockResolvedValueOnce({
      getTextContent: getTextContentMock,
    })
    const { extractPdfTextFromBase64 } = await import('~~/server/utils/pdf-text')
    const result = await extractPdfTextFromBase64('data:application/pdf;base64,eA==')
    expect(result).toContain('Text')
  })
})
