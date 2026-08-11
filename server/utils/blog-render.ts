// Explicit import rather than the Nitro auto-import: `parseMarkdown` is
// registered by @nuxtjs/mdc, which this project only gets transitively through
// @nuxt/content, and an auto-import that appears by accident is not a contract.
import { createMarkdownParser } from '@nuxtjs/mdc/runtime'

/**
 * Renders a post's markdown at request time.
 *
 * The output feeds `<ContentRenderer>` unchanged. That works because
 * ContentRenderer only converts `value.body` from minimark when
 * `body.type === 'minimark'` and otherwise hands the tree straight to
 * MDCRenderer — which is exactly the shape `parseMarkdown` returns. Prose
 * components, `{width= height=}` image attributes and Shiki code blocks all
 * behave the same as they did when @nuxt/content parsed these files at build
 * time, because the remark/rehype plugin set comes from the same generated
 * `#mdc-imports` module.
 */

// Matches the toc @nuxt/content generated for these posts (verified against
// .nuxt/content/sql_dump.txt): h2 as top-level links, h3 nested as children.
const TOC_OPTIONS = { depth: 2, searchDepth: 2 }

export interface RenderedBody {
  type: 'root'
  children: unknown[]
  /**
   * `components/blog/toc.vue` reads `articles.body.toc.links`, but
   * `parseMarkdown` returns the toc as a sibling of `body`. Nesting it here is
   * what keeps the sidebar working without touching the component.
   */
  toc: unknown
}

// `parseMarkdown` builds a fresh unified processor on every call. Creating the
// parser once and reusing it keeps that cost off the request path.
let parserPromise: ReturnType<typeof createMarkdownParser> | null = null

function getParser() {
  if (!parserPromise)
    parserPromise = createMarkdownParser({ toc: TOC_OPTIONS })
  return parserPromise
}

/*
 * Keyed on the markdown itself, not on `slug + lastUpdated`.
 *
 * A metadata-preserving edit — the media importer rewrote every image URL
 * without touching `lastUpdated`, deliberately, so 30 posts wouldn't all claim
 * to have been revised the same minute — leaves that key identical while the
 * body changes underneath it. Keying on the content cannot go stale, and it
 * costs nothing: the parsed tree held in the value is far larger than the
 * string held in the key.
 *
 * The limit sits above the post count so the RSS feed, which renders every post
 * in one pass, warms this cache instead of evicting the pages that use it.
 */
const CACHE_LIMIT = 100
const cache = new Map<string, RenderedBody>()

export async function renderMarkdown(markdown: string): Promise<RenderedBody> {
  const source = String(markdown ?? '').replace(/\r\n/g, '\n')

  const hit = cache.get(source)
  if (hit)
    return hit

  const parser = await getParser()
  const parsed = await parser(source)
  const body = {
    ...(parsed.body as object),
    toc: parsed.toc,
  } as RenderedBody

  cache.set(source, body)
  // FIFO: Map preserves insertion order, so the first key is the oldest.
  while (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next().value
    if (oldest === undefined)
      break
    cache.delete(oldest)
  }

  return body
}

/** Drops every cached body. Called after a post is saved or deleted. */
export function clearRenderCache(): void {
  cache.clear()
}
