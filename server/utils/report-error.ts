// Structured error/event reporting for Cloud Logging + Error Reporting.
//
// On Cloud Run, a single-line JSON written to stdout/stderr is parsed into a
// structured log entry; Error Reporting ingests entries that carry a stack
// trace and the ReportedErrorEvent `@type`. In local dev we print readable
// output instead. Production is detected via NODE_ENV (set to "production" in
// the Nitro/App Hosting runtime).

import process from 'node:process'

export type LogSeverity = 'ERROR' | 'WARNING' | 'INFO' | 'DEBUG'

export interface ErrorContext {
  kind?: string
  route?: string
  method?: string
  status?: number
  [key: string]: unknown
}

const REPORTED_ERROR_TYPE = 'type.googleapis.com/google.devtools.clouderrorreporting.v1beta1.ReportedErrorEvent'

function isProd(): boolean {
  return process.env.NODE_ENV === 'production'
}

function serviceContext() {
  return {
    service: process.env.K_SERVICE || 'ravy-pro',
    ...(process.env.K_REVISION ? { version: process.env.K_REVISION } : {}),
  }
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value)
  }
  catch {
    return JSON.stringify({ severity: 'ERROR', message: 'Failed to serialise log entry' })
  }
}

// Report a genuine failure (severity ERROR). These are what alerts fire on.
export function reportServerError(error: unknown, context: ErrorContext = {}): void {
  const err = error instanceof Error
    ? error
    : new Error(typeof error === 'string' ? error : 'Unknown error')

  if (!isProd()) {
    console.error(`[error]${context.kind ? ` [${context.kind}]` : ''}`, err, context)
    return
  }

  console.error(safeStringify({
    'severity': 'ERROR',
    '@type': REPORTED_ERROR_TYPE,
    // Error Reporting reads the first line of `message` as the error and the
    // rest as the stack — so include the full stack trace here.
    'message': err.stack || `${err.name}: ${err.message}`,
    'serviceContext': serviceContext(),
    context,
  }))
}

// Report a non-error event at an explicit severity (e.g. WARNING for an
// access-denial or a fail-open hiccup). Not an alert trigger by default.
export function reportServerEvent(severity: LogSeverity, message: string, context: ErrorContext = {}): void {
  // Cloud Logging reads the JSON `severity` field, so the stream (warn=stderr)
  // doesn't matter; we avoid console.log (disallowed by lint).
  const log = severity === 'ERROR' ? console.error : console.warn

  if (!isProd()) {
    log(`[${severity.toLowerCase()}]${context.kind ? ` [${context.kind}]` : ''}`, message, context)
    return
  }

  log(safeStringify({
    severity,
    message,
    serviceContext: serviceContext(),
    context,
  }))
}
