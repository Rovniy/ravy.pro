import type { H3Event } from 'h3'
import { reportServerError, reportServerEvent } from '~~/server/utils/report-error'

// Single capture point for all request errors (mirrors server/plugins/csp.ts).
// Severity policy keeps the alert signal clean:
//   5xx / unknown → ERROR  (drives alerts)
//   401 / 403     → WARNING (access-denial visibility, no alert by default)
//   429 / 4xx     → ignored (expected rate-limit / validation noise)
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error: unknown, ctx: { event?: H3Event }) => {
    const err = error as { statusCode?: number, status?: number } | undefined
    const status = Number(err?.statusCode ?? err?.status ?? 500)
    const event = ctx?.event
    const base: Record<string, unknown> = {
      route: event?.path,
      method: event?.method,
      status,
    }

    if (Number.isNaN(status) || status >= 500) {
      reportServerError(error, base)
    }
    else if (status === 401 || status === 403) {
      reportServerEvent('WARNING', `Access denied (${status}) on ${event?.path ?? 'unknown'}`, { ...base, kind: 'access-denied' })
    }
    // 429 / other 4xx are expected — don't report.
  })
})
