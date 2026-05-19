import { describe, expect, it, vi } from 'vitest'

const setMock = vi.fn(async () => {})
const collectionMock = vi.fn(() => ({
  doc: vi.fn(() => ({
    set: setMock,
  })),
}))

vi.mock('~~/server/utils/firebase-admin', () => ({
  getDb: vi.fn(() => ({
    collection: collectionMock,
  })),
}))

describe('server/utils/contract-scan', () => {
  it('processContractScan marks done on valid model JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        output_text: JSON.stringify({
          language: 'English',
          jurisdiction: 'United States',
          overallRiskScore: { score: 'low', reason: 'ok' },
          summary: 'sum',
          narrowPoints: [],
          hiddenRisks: [],
          missingProtections: [],
          questionsToClarify: [],
          creatorNegotiationPriorities: [],
          redFlags: [],
        }),
      }),
    })) as never)

    const { processContractScan } = await import('~~/server/utils/contract-scan')
    await processContractScan('scan-1', 'text', 'k', 'en')
    expect(setMock).toHaveBeenCalled()
    expect(setMock).toHaveBeenLastCalledWith(expect.objectContaining({
      status: 'done',
      progress: 100,
      step: 'Completed',
    }), { merge: true })
  })

  it('processContractScan marks error when model has no text', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({}),
    })) as never)
    const { processContractScan } = await import('~~/server/utils/contract-scan')
    await expect(processContractScan('scan-2', 'text', 'k', 'en')).rejects.toBeTruthy()
    expect(setMock).toHaveBeenLastCalledWith(expect.objectContaining({
      status: 'error',
      step: 'Failed',
      progress: 100,
    }), { merge: true })
  })
})
