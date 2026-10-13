import type { BlogPostMeta, BlogPostRecord } from '~~/utils/blog-post'
import type { ToolDefinition, ToolResult } from './protocol'
import { nanoid } from 'nanoid'
import { baseData, BlogPostTag, categoryDescriptions, categoryNames } from '~~/data'
import { mediaUrl } from '~~/utils/blog-media'
import { BlogPostValidationError, isValidSlug, normalizeRecord, slugify } from '~~/utils/blog-post'
import { putMedia } from '../blog-media'
import { clearRenderCache } from '../blog-render'
import { getPost, listMeta, savePost } from '../blog-store'
import { pingIndexNow } from '../indexnow'
import { assertRateLimit } from '../rate-limit'
import { decodeBase64Image, fetchRemoteImage, ImageIntakeError, prepareImage } from './images'
import { jsonResult, ToolInputError } from './protocol'

/**
 * The blog tools the MCP endpoint exposes. They write through exactly the same
 * `normalizeRecord` → `savePost` path as the studio's PUT route, so every save
 * invariant (embed rules, slug rules, stored `path`, no future `createdAt`)
 * holds no matter which door a post came in through.
 *
 * There is deliberately no delete tool: `unpublish_post` takes a post off the
 * site reversibly, and deleting stays a human action in /studio.
 */

export interface BlogToolContext {
  email: string
  origin: string
}

/** Fields a tool may set. `slug` and `path` are handled separately. */
const EDITABLE_FIELDS = ['title', 'description', 'markdown', 'tags', 'image', 'ogImage', 'alt', 'locale', 'theme', 'trending', 'noindex', 'published'] as const

const POST_FIELD_SCHEMA = {
  title: { type: 'string', description: 'Post title (the h1 and <title>). Keep it under ~70 characters.' },
  description: { type: 'string', description: 'One or two sentences for the meta description, cards and RSS. ~150 characters.' },
  markdown: { type: 'string', description: 'The post body in markdown (no frontmatter, no leading # title — the page renders the title itself). Start sections at ##.' },
  tags: { type: 'array', items: { type: 'string', enum: BlogPostTag }, minItems: 1, description: 'One or more category tags. Call list_tags for what each one means.' },
  image: { type: 'string', description: 'Cover image URL — normally a /media/blog/... URL returned by upload_image.' },
  ogImage: { type: 'string', description: 'Social preview image. Defaults to the cover image.' },
  alt: { type: 'string', description: 'Alt text for the cover image. Defaults to the description.' },
  locale: { type: 'string', description: 'OG locale of the post language, e.g. en_US (default) or ru_RU. Sets <html lang>.' },
  theme: { type: 'string', description: 'Optional override for article:tag. Usually leave empty.' },
  trending: { type: 'boolean', description: 'Feature the post as trending.' },
  noindex: { type: 'boolean', description: 'Hide the post from search engines.' },
} as const

const SLUG_SCHEMA = { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$', description: 'Post slug: lowercase ASCII letters, digits and single hyphens.' }

function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function requireSlug(args: Record<string, unknown>): string {
  const slug = str(args.slug).trim()
  if (!isValidSlug(slug))
    throw new ToolInputError('slug must be lowercase ASCII letters, digits and single hyphens.')
  return slug
}

async function requireExisting(slug: string): Promise<BlogPostRecord> {
  const post = await getPost(slug)
  if (!post)
    throw new ToolInputError(`No post with slug "${slug}". Call list_posts to see what exists.`)
  return post
}

function assertKnownTags(tags: unknown): void {
  if (tags === undefined)
    return
  if (!Array.isArray(tags))
    throw new ToolInputError('tags must be an array of strings.')
  const unknown = tags.filter(t => typeof t !== 'string' || !BlogPostTag.includes(t))
  if (unknown.length)
    throw new ToolInputError(`Unknown tag(s): ${unknown.join(', ')}. Allowed: ${BlogPostTag.join(', ')}. New categories have to be added to the site code first.`)
}

function pickEditable(args: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of EDITABLE_FIELDS) {
    if (args[key] !== undefined)
      out[key] = args[key]
  }
  return out
}

/** Validates, saves and clears the render cache — the studio PUT route, minus HTTP. */
async function save(input: Record<string, unknown>, existing: BlogPostRecord | null): Promise<BlogPostRecord> {
  let record: BlogPostRecord
  try {
    record = normalizeRecord(input, { now: new Date().toISOString(), existing })
  }
  catch (err) {
    if (err instanceof BlogPostValidationError)
      throw new ToolInputError(err.message)
    throw err
  }
  await savePost(record)
  clearRenderCache()
  if (record.published || existing?.published)
    await pingIndexNow([record.path, '/blogs', ...record.tags.map(t => `/categories/${t}`)])
  return record
}

function summary(post: BlogPostMeta, origin: string) {
  return {
    slug: post.slug,
    title: post.title,
    url: `${origin}${post.path}`,
    published: post.published,
    tags: post.tags,
    createdAt: post.createdAt,
    lastUpdated: post.lastUpdated,
  }
}

function saved(record: BlogPostRecord, origin: string, note: string): ToolResult {
  return jsonResult({
    ...summary(record, origin),
    note,
  })
}

const LIVE_NOTE = 'Published. The page and lists are cached for up to 60 seconds, so it may take a minute to appear.'
const DRAFT_NOTE = 'Saved as a draft — not visible on the site. Call publish_post when it is ready.'

export const blogTools: ToolDefinition<BlogToolContext>[] = [
  {
    name: 'list_posts',
    title: 'List posts',
    description: 'Lists blog posts (metadata only, newest first), including drafts.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['all', 'published', 'draft'], default: 'all' },
        tag: { type: 'string', enum: BlogPostTag, description: 'Only posts with this tag.' },
        limit: { type: 'integer', minimum: 1, maximum: 200, default: 50 },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    async handler(args, ctx) {
      const status = str(args.status) || 'all'
      const tag = str(args.tag)
      const limit = Math.min(200, Math.max(1, Number(args.limit) || 50))
      const posts = (await listMeta({ fresh: true }))
        .filter(p => status === 'all' || (status === 'published' ? p.published : !p.published))
        .filter(p => !tag || p.tags.includes(tag))
      return jsonResult({
        total: posts.length,
        posts: posts.slice(0, limit).map(p => ({ ...summary(p, ctx.origin), description: p.description })),
      })
    },
  },
  {
    name: 'get_post',
    title: 'Get post',
    description: 'Returns one post in full, including its markdown body. Read a post before editing it.',
    inputSchema: {
      type: 'object',
      properties: { slug: SLUG_SCHEMA },
      required: ['slug'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    async handler(args, ctx) {
      const post = await requireExisting(requireSlug(args))
      return jsonResult({ ...post, url: `${ctx.origin}${post.path}` })
    },
  },
  {
    name: 'list_tags',
    title: 'List tags',
    description: 'The categories a post can be tagged with, and what each one covers.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
    async handler() {
      return jsonResult({
        tags: BlogPostTag.map(tag => ({
          tag,
          name: categoryNames[tag] ?? tag,
          description: categoryDescriptions[tag] ?? '',
        })),
      })
    },
  },
  {
    name: 'create_post',
    title: 'Create post',
    description: 'Creates a new post. Saved as a draft unless published is true. Fails if the slug is taken. A cover image is required — upload one with upload_image first (use the slug you are about to create).',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { ...SLUG_SCHEMA, description: `${SLUG_SCHEMA.description} Derived from the title when omitted — required for non-Latin titles. Becomes the URL /blogs/<slug> forever.` },
        ...POST_FIELD_SCHEMA,
        published: { type: 'boolean', default: false, description: 'Publish immediately.' },
      },
      required: ['title', 'description', 'markdown', 'tags', 'image'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    async handler(args, ctx) {
      const slug = str(args.slug).trim() || slugify(str(args.title))
      if (!isValidSlug(slug))
        throw new ToolInputError('Could not derive a slug from the title — pass slug explicitly (lowercase ASCII, hyphens).')
      assertKnownTags(args.tags)
      if (await getPost(slug))
        throw new ToolInputError(`A post with slug "${slug}" already exists. Use update_post to change it, or pick another slug.`)
      const record = await save({ ...pickEditable(args), slug }, null)
      return saved(record, ctx.origin, record.published ? LIVE_NOTE : DRAFT_NOTE)
    },
  },
  {
    name: 'update_post',
    title: 'Update post',
    description: 'Changes fields of an existing post. Only the fields you pass are changed; the URL never changes. To rewrite the body, pass the complete new markdown (get_post first).',
    inputSchema: {
      type: 'object',
      properties: {
        slug: SLUG_SCHEMA,
        ...POST_FIELD_SCHEMA,
      },
      required: ['slug'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
    async handler(args, ctx) {
      const existing = await requireExisting(requireSlug(args))
      assertKnownTags(args.tags)
      // `published` is not editable here — publishing is its own tool, so a
      // content edit can never flip a draft live by accident.
      const { published: _ignored, ...changes } = pickEditable(args)
      const record = await save({ ...existing, ...changes }, existing)
      return saved(record, ctx.origin, record.published ? 'Updated. Live within about 60 seconds.' : 'Draft updated.')
    },
  },
  {
    name: 'publish_post',
    title: 'Publish post',
    description: 'Makes a post visible on the site, in lists, RSS and the sitemap.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: SLUG_SCHEMA,
        redate: { type: 'boolean', default: false, description: 'Set the publication date to now — use when publishing a draft written earlier.' },
      },
      required: ['slug'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    async handler(args, ctx) {
      const existing = await requireExisting(requireSlug(args))
      const input: Record<string, unknown> = { ...existing, published: true }
      if (args.redate === true)
        input.createdAt = new Date().toISOString()
      const record = await save(input, existing)
      return saved(record, ctx.origin, LIVE_NOTE)
    },
  },
  {
    name: 'unpublish_post',
    title: 'Unpublish post',
    description: 'Turns a published post back into a draft. Reversible with publish_post.',
    inputSchema: {
      type: 'object',
      properties: { slug: SLUG_SCHEMA },
      required: ['slug'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
    async handler(args, ctx) {
      const existing = await requireExisting(requireSlug(args))
      const record = await save({ ...existing, published: false }, existing)
      return saved(record, ctx.origin, 'Unpublished. It drops off the site once the 60-second cache expires.')
    },
  },
  {
    name: 'upload_image',
    title: 'Upload image',
    description: 'Stores an image for a post and returns its URL, for the cover (image) or for ![alt](url) in the markdown. Pass either a public https URL or base64 data. Images are downscaled to 1600px and converted to WebP.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { ...SLUG_SCHEMA, description: 'Slug of the post the image belongs to (it may not exist yet).' },
        url: { type: 'string', description: 'Public https:// URL to fetch the image from.' },
        data_base64: { type: 'string', description: 'The image bytes, base64-encoded (a data: URL is accepted too).' },
      },
      required: ['slug'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    async handler(args, ctx) {
      const slug = requireSlug(args)
      const url = str(args.url).trim()
      const data = str(args.data_base64)
      if (!url === !data)
        throw new ToolInputError('Pass exactly one of url or data_base64.')

      try {
        await assertRateLimit({ bucket: 'blog-media', identity: ctx.email, limit: 120, windowMs: 60 * 60 * 1000 })
      }
      catch {
        // The only throw is the 429 — the store itself fails open.
        throw new ToolInputError('Upload limit reached (120 images per hour). Try again later.')
      }

      let prepared
      try {
        prepared = await prepareImage(url ? await fetchRemoteImage(url) : decodeBase64Image(data))
      }
      catch (err) {
        if (err instanceof ImageIntakeError)
          throw new ToolInputError(err.message)
        throw err
      }

      const relativePath = `${slug}/${nanoid(12)}.${prepared.extension}`
      await putMedia(relativePath, prepared.bytes, prepared.contentType)
      return jsonResult({ url: mediaUrl(relativePath), bytes: prepared.bytes.length, contentType: prepared.contentType })
    },
  },
]

export const BLOG_MCP_INSTRUCTIONS = `This server edits the blog on ravy.pro — the personal site of ${baseData.me.name} (game developer, CTO, AI tinkerer). Posts are stored in Firestore and go live about 60 seconds after publishing, without a deploy.

Workflow for a new post:
1. list_tags to choose tags (only listed tags are accepted); list_posts to avoid duplicating an existing topic and to match the voice of recent posts (get_post on one or two).
2. upload_image for the cover (required) and any inline images, using the slug the post will have.
3. create_post — as a draft unless the user asked to publish right away.
4. publish_post when the user is happy. Report the returned url.

Writing rules:
- markdown body only: no frontmatter and no leading "# Title" — the page renders the title. Use ## and ### headings; they build the table of contents.
- Images: ![alt text](/media/blog/...) with URLs from upload_image. Do not hotlink other sites.
- Code fences need a language (ts, js, vue, bash, python, csharp, go, rust, json, yaml, sql, …).
- Embeds (<iframe>) must have a title attribute and no width/height or fixed inline width — the site sizes them. Saves that break this are rejected.
- Write in the language the user asks for and set locale to match (ru_RU for Russian, en_US default).
- The slug becomes the permanent URL /blogs/<slug>; keep it short and ASCII.
- There is no delete tool. To take a post down, unpublish_post.`
