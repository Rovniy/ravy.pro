import process from 'node:process'
import { applicationDefault } from 'firebase-admin/app'
import { runShortBody, shortsJobRunUrl } from '~~/utils/shorts-job'
import { getAdminApp } from './firebase-admin'
import { reportServerEvent } from './report-error'

/**
 * Starts the Shorts bot for a note that just went live. Best-effort like
 * `pingIndexNow`: production only, a failure is logged as a WARNING and never
 * fails the save. The bot itself skips a note that already has a video, so a
 * repeated call costs one empty execution, not a second upload.
 *
 * Auth is the backend's own service account (application default
 * credentials), which holds `roles/run.jobsExecutorWithOverrides` on the job.
 */
export async function enqueueShort(slug: string): Promise<void> {
  if (import.meta.dev || process.env.NODE_ENV !== 'production' || process.env.VITEST)
    return
  try {
    const project = getAdminApp().options.projectId || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT
    if (!project) {
      reportServerEvent('WARNING', 'Shorts job not started: no project id', { kind: 'shorts', slug })
      return
    }
    const { access_token: token } = await applicationDefault().getAccessToken()
    const res = await fetch(shortsJobRunUrl(project), {
      method: 'POST',
      headers: { 'authorization': `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(runShortBody(slug)),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok)
      reportServerEvent('WARNING', 'Shorts job rejected', { kind: 'shorts', slug, status: res.status, detail: (await res.text()).slice(0, 300) })
  }
  catch (err) {
    reportServerEvent('WARNING', 'Shorts job start failed', { kind: 'shorts', slug, detail: String(err) })
  }
}
