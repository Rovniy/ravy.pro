import { getMedia } from '~~/server/utils/blog-media'
import { isSafeMediaPath, SANDBOXED_TYPES, typeForExtension } from '~~/utils/blog-media'

/**
 * Serves a post image out of Cloud Storage under this origin.
 *
 * Same-origin serving is the whole point of the proxy: `/_ipx/` can transform
 * these images, the CSP built in `server/plugins/csp.ts` needs no extra host,
 * satori can fetch them while rendering OG cards, and the Storage bucket itself
 * stays private.
 *
 * Object names are never reused (a nanoid per upload), so `immutable` is
 * accurate and the CDN should only ever ask for a given file once.
 */
export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path') ?? ''
  if (!isSafeMediaPath(path))
    throw createError({ statusCode: 404, statusMessage: 'Not found' })

  const contentType = typeForExtension(path)
  if (!contentType)
    throw createError({ statusCode: 404, statusMessage: 'Not found' })

  const bytes = await getMedia(path)
  if (!bytes)
    throw createError({ statusCode: 404, statusMessage: 'Not found' })

  setHeader(event, 'content-type', contentType)
  setHeader(event, 'cache-control', 'public, max-age=31536000, immutable')
  // Never let the browser second-guess the type: a mislabelled file served from
  // this origin would inherit the site's own privileges.
  setHeader(event, 'x-content-type-options', 'nosniff')

  // An SVG or PDF opened directly from this origin can run script. Uploads
  // refuse both types, so the only files here are the two the blog archive
  // brought with it — locked down anyway, because "trusted today" is not a
  // security property.
  if (SANDBOXED_TYPES.has(contentType)) {
    setHeader(event, 'content-security-policy', 'default-src \'none\'; style-src \'unsafe-inline\'; sandbox')
    setHeader(event, 'content-disposition', 'inline')
  }

  return bytes
})
