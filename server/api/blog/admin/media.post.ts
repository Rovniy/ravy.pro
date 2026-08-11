import { Buffer } from 'node:buffer'
import { nanoid } from 'nanoid'
import { requireToolAccess } from '~~/server/utils/access'
import { putMedia } from '~~/server/utils/blog-media'
import { assertRateLimit } from '~~/server/utils/rate-limit'
import { extensionForType, MAX_IMAGE_BYTES, mediaUrl } from '~~/utils/blog-media'
import { isValidSlug } from '~~/utils/blog-post'

/**
 * Uploads one post image to Cloud Storage and returns the URL to put in the
 * markdown.
 *
 * The panel downscales and converts to WebP in the browser before sending, so
 * what arrives here is normally well under the limit even from a phone. The
 * size and type checks are still enforced server-side, because a client-side
 * limit is a convenience, not a control.
 */
export default defineEventHandler(async (event) => {
  const user = await requireToolAccess(event, 'studio')
  await assertRateLimit({
    bucket: 'blog-media',
    identity: user.email,
    limit: 120,
    windowMs: 60 * 60 * 1000,
  })

  const form = await readMultipartFormData(event)
  if (!form?.length)
    throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })

  const file = form.find(part => part.name === 'file' && part.filename)
  const slugPart = form.find(part => part.name === 'slug')
  const slug = slugPart?.data ? Buffer.from(slugPart.data).toString('utf8').trim() : ''

  if (!file?.data?.length)
    throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })
  if (!isValidSlug(slug))
    throw createError({ statusCode: 400, statusMessage: 'A valid post slug is required' })
  if (file.data.length > MAX_IMAGE_BYTES)
    throw createError({ statusCode: 413, statusMessage: 'Image is larger than 10 MB' })

  const contentType = file.type ?? ''
  const extension = extensionForType(contentType)
  if (!extension)
    throw createError({ statusCode: 415, statusMessage: `Unsupported image type: ${contentType || 'unknown'}` })

  // Content-addressed enough for the purpose: the name is never reused, which
  // is what lets the serving route mark these immutable.
  const relativePath = `${slug}/${nanoid(12)}.${extension}`
  await putMedia(relativePath, Buffer.from(file.data), contentType)

  return { url: mediaUrl(relativePath), bytes: file.data.length }
})
