import process from 'node:process'
import { baseData } from '~~/data'
import { INDEXNOW_ENDPOINT, indexNowPayload } from '~~/utils/indexnow'
import { reportServerEvent } from './report-error'

/**
 * Tells the IndexNow engines that `paths` changed. Best-effort: a failure is
 * logged and never fails the save that triggered it, and nothing is sent
 * outside production, so local edits and tests never ping real engines with
 * URLs that do not exist.
 */
export async function pingIndexNow(paths: string[]): Promise<void> {
  if (!paths.length || import.meta.dev || process.env.NODE_ENV !== 'production' || process.env.VITEST)
    return
  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify(indexNowPayload(baseData.site.url, paths)),
      signal: AbortSignal.timeout(5000),
    })
    // 200 and 202 are both success; 202 means the key is still being verified.
    if (!res.ok)
      reportServerEvent('WARNING', 'IndexNow rejected a submission', { kind: 'indexnow', status: res.status, paths })
  }
  catch (err) {
    reportServerEvent('WARNING', 'IndexNow ping failed', { kind: 'indexnow', detail: String(err) })
  }
}
