import { describe, expect, it, vi } from 'vitest'

const getRouterParamMock = vi.fn(() => 'scan-1')
vi.mock('h3', async (importOriginal) => {
  const mod = await importOriginal<typeof import('h3')>()
  return { ...mod, getRouterParam: getRouterParamMock }
})

// contract-scan.ts statically imports the Stripe client factory; stub it so the
// real `stripe` package isn't resolved in the test environment.
vi.mock('~~/server/utils/stripe', () => ({ getStripe: vi.fn() }))

// The single-scan GET is now PUBLIC and returns only a teaser (risk level,
// jurisdiction, summary, red-flag counts) — never the full clause analysis.
const getScanRecordMock = vi.fn()
vi.mock('~~/server/utils/contract-scan', async (importOriginal) => {
  const mod = await importOriginal<typeof import('~~/server/utils/contract-scan')>()
  return {
    // Reuse the real toTeaser so we assert its actual shape.
    toTeaser: mod.toTeaser,
    getScanRecord: getScanRecordMock,
  }
})

describe('gET /api/contract-scanner/scans/[id] (public teaser)', () => {
  it('returns the teaser, never the full red-flag details', async () => {
    getRouterParamMock.mockReturnValueOnce('scan-1')
    getScanRecordMock.mockResolvedValueOnce({
      id: 'scan-1',
      status: 'done',
      progress: 100,
      step: 'Completed',
      paid: false,
      createdAt: 'c',
      updatedAt: 'u',
      result: {
        jurisdiction: 'United States',
        summary: 'short summary',
        overallRiskScore: { score: 'high', reason: 'r' },
        redFlags: [
          { severity: 'high' },
          { severity: 'high' },
          { severity: 'medium' },
          { severity: 'low' },
        ],
      },
    })
    const { default: handler } = await import('~~/server/api/contract-scanner/scans/[id].get')
    const result = await handler({} as never) as Record<string, any>

    expect(result).toMatchObject({
      id: 'scan-1',
      status: 'done',
      paid: false,
      jurisdiction: 'United States',
      summary: 'short summary',
      overallRiskScore: { score: 'high' },
      redFlagCounts: { high: 2, medium: 1, low: 1, total: 4 },
    })
    // Crucially: no raw red-flag clause analysis leaks through the teaser.
    expect(result.redFlags).toBeUndefined()
    expect(result.result).toBeUndefined()
  })

  it('returns 404 for an unknown scan', async () => {
    getRouterParamMock.mockReturnValueOnce('missing')
    getScanRecordMock.mockResolvedValueOnce(null)
    const { default: handler } = await import('~~/server/api/contract-scanner/scans/[id].get')
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 404 })
  })
})
