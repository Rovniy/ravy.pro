import type { ContractScanRecord } from '~~/types/contract-scan'
import { requireUser } from '~~/server/utils/auth'
import { contractScanCollection, toTeaser } from '~~/server/utils/contract-scan'
import { signScanToken } from '~~/server/utils/contract-scan-token'

// The signed-in user's contract scans. Matched both by ownerUid (scans started
// while logged in) and by customerEmail (anonymous purchases on the same email).
// A durable access token is attached ONLY to paid scans — handing out a token
// for an unpaid scan would bypass the paywall.
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const config = useRuntimeConfig(event)
  const col = contractScanCollection()

  const [byUid, byEmail] = await Promise.all([
    col.where('ownerUid', '==', user.uid).limit(100).get(),
    col.where('customerEmail', '==', user.email).limit(100).get(),
  ])

  // Merge + dedupe, then sort newest-first in memory (avoids a composite index).
  const map = new Map<string, ContractScanRecord>()
  for (const doc of [...byUid.docs, ...byEmail.docs])
    map.set(doc.id, { id: doc.id, ...(doc.data() as Omit<ContractScanRecord, 'id'>) })

  const sorted = [...map.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

  const items = await Promise.all(sorted.map(async record => ({
    teaser: toTeaser(record.id, record),
    token: record.paid === true ? await signScanToken(record.id, config.contractScanTokenSecret) : '',
  })))

  return { items }
})
