import type { TilNoteMeta, TilNoteRecord } from '~~/utils/til'
import type { BlogToolContext } from './blog-tools'
import type { ToolDefinition, ToolResult } from './protocol'
import { TIL_TOPIC_IDS, TIL_TOPICS, tilTopicPath } from '~~/data/til'
import { isValidSlug, slugify } from '~~/utils/blog-post'
import { linkedInPost, normalizeNote, noteWarnings, TilNoteValidationError, xPost } from '~~/utils/til'
import { persistNote } from '../til-save'
import { getNote, listNotes } from '../til-store'
import { jsonResult, ToolInputError } from './protocol'

/**
 * Tools for the TIL notes at /til. Same rules as the blog tools: they save
 * through `normalizeNote` like the studio does, `update_note` never changes
 * `published`, and there is no delete tool.
 *
 * Every save returns `warnings` (habits that decide whether a short note gets
 * indexed) and, once a note is live, a ready LinkedIn and X post, so the
 * model can hand the author the text to share.
 */

const SLUG_SCHEMA = { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$', description: 'Note slug: lowercase ASCII letters, digits and single hyphens. Becomes /til/<slug> forever.' }

const NOTE_FIELDS = {
  title: { type: 'string', maxLength: 110, description: 'The question the note answers, phrased the way someone would search it, in English. E.g. "How to make Unity Addressables load from a local server". Under ~70 characters is best.' },
  markdown: { type: 'string', description: 'The note body in English markdown: one line of problem, the fix (a code fence with a language, a command or a concrete value), one line on why it works or where it bit, and a source link. 3–8 lines. No headings, no frontmatter, no title.' },
  topics: { type: 'array', items: { type: 'string', enum: TIL_TOPIC_IDS }, minItems: 1, description: 'One or two topics. Call list_topics for what each covers.' },
} as const

function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function requireSlug(args: Record<string, unknown>): string {
  const slug = str(args.slug).trim()
  if (!isValidSlug(slug))
    throw new ToolInputError('slug must be lowercase ASCII letters, digits and single hyphens.')
  return slug
}

async function requireNote(slug: string): Promise<TilNoteRecord> {
  const note = await getNote(slug)
  if (!note)
    throw new ToolInputError(`No note with slug "${slug}". Call list_notes to see what exists.`)
  return note
}

async function save(input: Record<string, unknown>, existing: TilNoteRecord | null): Promise<TilNoteRecord> {
  let note: TilNoteRecord
  try {
    note = normalizeNote(input, { now: new Date().toISOString(), existing })
  }
  catch (err) {
    if (err instanceof TilNoteValidationError)
      throw new ToolInputError(err.message)
    throw err
  }
  await persistNote(note, existing)
  return note
}

function summary(note: TilNoteMeta, origin: string) {
  return {
    slug: note.slug,
    title: note.title,
    url: `${origin}${note.path}`,
    published: note.published,
    topics: note.topics,
    createdAt: note.createdAt,
  }
}

function saved(note: TilNoteRecord, origin: string, message: string): ToolResult {
  const url = `${origin}${note.path}`
  return jsonResult({
    ...summary(note, origin),
    note: message,
    warnings: noteWarnings(note),
    ...(note.published
      ? { share: { linkedin: linkedInPost(note, url), x: xPost(note, url) } }
      : {}),
  })
}

const LIVE = 'Published. Live within about 60 seconds; search engines that support IndexNow were notified. Offer the author the share texts.'
const DRAFT = 'Saved as a draft. Call publish_note when it is ready.'

function pick(args: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of ['title', 'markdown', 'topics'] as const) {
    if (args[key] !== undefined)
      out[key] = args[key]
  }
  return out
}

export const tilTools: ToolDefinition<BlogToolContext>[] = [
  {
    name: 'list_notes',
    title: 'List TIL notes',
    description: 'Lists the short TIL notes (newest first), drafts included. Check it before writing a note so the same fix is not published twice.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['all', 'published', 'draft'], default: 'all' },
        topic: { type: 'string', enum: TIL_TOPIC_IDS },
        limit: { type: 'integer', minimum: 1, maximum: 200, default: 50 },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    async handler(args, ctx) {
      const status = str(args.status) || 'all'
      const topic = str(args.topic)
      const limit = Math.min(200, Math.max(1, Number(args.limit) || 50))
      const notes = (await listNotes({ fresh: true }))
        .filter(n => status === 'all' || (status === 'published' ? n.published : !n.published))
        .filter(n => !topic || n.topics.includes(topic))
      return jsonResult({ total: notes.length, notes: notes.slice(0, limit).map(n => ({ ...summary(n, ctx.origin), excerpt: n.excerpt })) })
    },
  },
  {
    name: 'get_note',
    title: 'Get TIL note',
    description: 'Returns one note with its markdown.',
    inputSchema: { type: 'object', properties: { slug: SLUG_SCHEMA }, required: ['slug'], additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
    async handler(args, ctx) {
      const note = await requireNote(requireSlug(args))
      return jsonResult({ ...note, url: `${ctx.origin}${note.path}`, warnings: noteWarnings(note) })
    },
  },
  {
    name: 'list_topics',
    title: 'List TIL topics',
    description: 'The topics a note can have. Each one is a hub page on the site.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
    async handler(_args, ctx) {
      return jsonResult({ topics: TIL_TOPICS.map(t => ({ topic: t.id, name: t.name, description: t.description, url: `${ctx.origin}${tilTopicPath(t.id)}` })) })
    },
  },
  {
    name: 'create_note',
    title: 'Create TIL note',
    description: 'Creates a short TIL note. A draft unless published is true. No image needed. Fails if the slug is taken.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { ...SLUG_SCHEMA, description: `${SLUG_SCHEMA.description} Derived from the title when omitted.` },
        ...NOTE_FIELDS,
        published: { type: 'boolean', default: false, description: 'Publish immediately.' },
      },
      required: ['title', 'markdown', 'topics'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    async handler(args, ctx) {
      const slug = str(args.slug).trim() || slugify(str(args.title))
      if (!isValidSlug(slug))
        throw new ToolInputError('Could not derive a slug from the title — pass slug explicitly.')
      if (await getNote(slug))
        throw new ToolInputError(`A note with slug "${slug}" already exists. Use update_note, or pick another slug.`)
      const note = await save({ ...pick(args), slug, published: args.published === true }, null)
      return saved(note, ctx.origin, note.published ? LIVE : DRAFT)
    },
  },
  {
    name: 'update_note',
    title: 'Update TIL note',
    description: 'Changes the title, body or topics of a note. Only the fields passed change; the URL never does. Never publishes or unpublishes.',
    inputSchema: {
      type: 'object',
      properties: { slug: SLUG_SCHEMA, ...NOTE_FIELDS },
      required: ['slug'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
    async handler(args, ctx) {
      const existing = await requireNote(requireSlug(args))
      const note = await save({ ...existing, ...pick(args) }, existing)
      return saved(note, ctx.origin, note.published ? 'Updated. Live within about 60 seconds.' : 'Draft updated.')
    },
  },
  {
    name: 'publish_note',
    title: 'Publish TIL note',
    description: 'Makes a note visible at /til, in its topic hubs, the RSS feed and the sitemap. Returns ready-to-paste LinkedIn and X posts.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: SLUG_SCHEMA,
        redate: { type: 'boolean', default: false, description: 'Set the date to now — for a draft written earlier.' },
      },
      required: ['slug'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    async handler(args, ctx) {
      const existing = await requireNote(requireSlug(args))
      const input: Record<string, unknown> = { ...existing, published: true }
      if (args.redate === true)
        input.createdAt = new Date().toISOString()
      const note = await save(input, existing)
      return saved(note, ctx.origin, LIVE)
    },
  },
  {
    name: 'unpublish_note',
    title: 'Unpublish TIL note',
    description: 'Turns a published note back into a draft. Reversible with publish_note.',
    inputSchema: { type: 'object', properties: { slug: SLUG_SCHEMA }, required: ['slug'], additionalProperties: false },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
    async handler(args, ctx) {
      const existing = await requireNote(requireSlug(args))
      const note = await save({ ...existing, published: false }, existing)
      return saved(note, ctx.origin, 'Unpublished. It drops off the site once the 60-second cache expires.')
    },
  },
]

export const TIL_MCP_INSTRUCTIONS = `TIL notes (short notes at /til, separate from blog posts):
- A note answers one question in a few lines, in English, with no cover image. Use it when the user shares a small fix, trick or lesson; use a blog post for anything that needs sections.
- Title: the question as someone would search it. Body: the problem in one line, the fix (code fence with a language, command or value), one line of first-hand experience, a source link.
- list_notes first to avoid duplicates; list_topics for topics. create_note as a draft unless asked to publish; publish_note when approved.
- Every save returns warnings; fix them before publishing when you can. publish_note returns share.linkedin and share.x: show them to the user to post.`
