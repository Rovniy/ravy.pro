/**
 * Where the YouTube Shorts bot runs: the Cloud Run Job `shorts-bot` (repo
 * shorts-bot) in the same Google Cloud project as this site. A note's first
 * publish starts one execution with `run-short <slug>`; the bot reads the note
 * from Firestore, uploads a private Short and writes `youtube` back onto it.
 *
 * Pure, so the request shape is unit-tested; the call itself is in
 * `server/utils/shorts.ts`.
 */

export const SHORTS_JOB = {
  region: 'us-east4',
  name: 'shorts-bot',
} as const

/** Cloud Run Admin API v2 `jobs.run`. */
export function shortsJobRunUrl(project: string): string {
  return `https://run.googleapis.com/v2/projects/${project}/locations/${SHORTS_JOB.region}/jobs/${SHORTS_JOB.name}:run`
}

/** One execution for one note: the job's default args are `check-status`. */
export function runShortBody(slug: string) {
  return { overrides: { containerOverrides: [{ args: ['run-short', slug] }] } }
}
