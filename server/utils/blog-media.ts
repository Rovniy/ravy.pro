import type { Bucket } from '@google-cloud/storage'
import type { Buffer } from 'node:buffer'
import process from 'node:process'
import { getStorage } from 'firebase-admin/storage'
import { mediaObjectName } from '~~/utils/blog-media'
import { getAdminApp } from './firebase-admin'

/**
 * Cloud Storage access for post images.
 *
 * Uploads go through an authenticated server route and objects stay private —
 * Storage security rules are deny-all, mirroring `firestore.rules`. Reading is
 * done by `server/routes/media/blog/[...path].get.ts`, which serves the bytes
 * from this origin so that `/_ipx/` transforms, the CSP in
 * `server/plugins/csp.ts` and satori's OG rendering all keep working unchanged.
 */

let cachedBucket: Bucket | null = null

/**
 * Resolves the bucket name. `initializeApp()` on App Hosting picks
 * `storageBucket` up from FIREBASE_CONFIG, but that is not guaranteed in every
 * environment, so an explicit runtime config wins and the conventional
 * `<project>.firebasestorage.app` is the last resort.
 */
function bucketName(): string | undefined {
  const configured = useRuntimeConfig().firebaseStorageBucket
  if (configured)
    return String(configured)
  const project = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT
  return project ? `${project}.firebasestorage.app` : undefined
}

export function getMediaBucket(): Bucket {
  if (!cachedBucket)
    cachedBucket = getStorage(getAdminApp()).bucket(bucketName())
  return cachedBucket
}

export interface StoredMedia {
  bytes: Buffer
  contentType: string
}

export async function putMedia(relativePath: string, bytes: Buffer, contentType: string): Promise<void> {
  await getMediaBucket().file(mediaObjectName(relativePath)).save(bytes, {
    contentType,
    // The object is never served straight from Storage, so this only matters
    // if someone signs a URL by hand. The real cache policy is the one the
    // /media route sets.
    metadata: { cacheControl: 'public, max-age=31536000, immutable' },
  })
}

/** Returns null when the object does not exist. */
export async function getMedia(relativePath: string): Promise<Buffer | null> {
  const file = getMediaBucket().file(mediaObjectName(relativePath))
  try {
    const [bytes] = await file.download()
    return bytes
  }
  catch (err) {
    const code = (err as { code?: number }).code
    if (code === 404)
      return null
    throw err
  }
}

export async function deleteMedia(relativePath: string): Promise<void> {
  await getMediaBucket().file(mediaObjectName(relativePath)).delete({ ignoreNotFound: true })
}
