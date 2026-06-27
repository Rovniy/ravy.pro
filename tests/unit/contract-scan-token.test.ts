import { describe, expect, it } from 'vitest'
import { signScanToken, verifyScanToken } from '~~/server/utils/contract-scan-token'

const SECRET = 'a-sufficiently-long-test-secret-value'

describe('contract-scan-token', () => {
  it('round-trips a scan id', async () => {
    const token = await signScanToken('scan-abc', SECRET)
    expect(await verifyScanToken(token, SECRET)).toBe('scan-abc')
  })

  it('rejects a token signed with a different secret', async () => {
    const token = await signScanToken('scan-abc', SECRET)
    expect(await verifyScanToken(token, 'some-other-secret-value-entirely')).toBeNull()
  })

  it('returns null for a tampered / garbage token', async () => {
    expect(await verifyScanToken('not.a.jwt', SECRET)).toBeNull()
    expect(await verifyScanToken('', SECRET)).toBeNull()
  })
})
