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
  getAdminAuth: vi.fn(),
}))

// contract-scan.ts statically imports the Stripe client factory; stub it so the
// real `stripe` package isn't resolved in the test environment.
vi.mock('~~/server/utils/stripe', () => ({ getStripe: vi.fn() }))

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

  it('toTeaser counts red flags by severity and never exposes the full result', async () => {
    const { toTeaser } = await import('~~/server/utils/contract-scan')
    const teaser = toTeaser('scan-1', {
      id: 'scan-1',
      status: 'done',
      progress: 100,
      step: 'Completed',
      paid: false,
      createdAt: 'c',
      updatedAt: 'u',
      result: {
        language: 'English',
        jurisdiction: 'United States',
        overallRiskScore: { score: 'high', reason: 'r' },
        summary: 'sum',
        narrowPoints: [],
        hiddenRisks: [],
        missingProtections: [],
        questionsToClarify: [],
        creatorNegotiationPriorities: [],
        redFlags: [
          { severity: 'high' } as never,
          { severity: 'medium' } as never,
          { severity: 'medium' } as never,
          { severity: 'low' } as never,
        ],
      },
    })
    expect(teaser.redFlagCounts).toEqual({ high: 1, medium: 2, low: 1, total: 4 })
    expect(teaser.jurisdiction).toBe('United States')
    expect(teaser.summary).toBe('sum')
    expect((teaser as Record<string, unknown>).redFlags).toBeUndefined()
  })

  it('toTeaser omits counts before the scan finishes', async () => {
    const { toTeaser } = await import('~~/server/utils/contract-scan')
    const teaser = toTeaser('scan-2', {
      id: 'scan-2',
      status: 'processing',
      progress: 35,
      step: 'Analyzing',
      createdAt: 'c',
      updatedAt: 'u',
    })
    expect(teaser.redFlagCounts).toBeUndefined()
    expect(teaser.paid).toBe(false)
  })
})
