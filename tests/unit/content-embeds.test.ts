import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { findEmbedProblems } from '~~/utils/blog-embeds'

// Markdown embeds YouTube by pasting the <iframe> snippet YouTube hands out,
// and that snippet carries `width="720" height="405"`. A fixed pixel width is
// wider than a phone viewport, so the embed pushed the whole document sideways
// — one hard-coded attribute gave every reader a horizontal scrollbar.
//
// Sizing lives in one place: `.prose iframe` in assets/css/tailwind.css renders
// every embed at column width and 16:9.
//
// Blog posts are no longer files, so the rule is enforced at save time by
// `findEmbedProblems` (see utils/blog-embeds.ts) and covered below. The file
// scan stays for the content that is still file-based: docs and pages.

const CONTENT_DIRS = ['blogs', 'docs', 'pages']

function markdownFiles(): { path: string, body: string }[] {
  const files: { path: string, body: string }[] = []
  for (const dir of CONTENT_DIRS) {
    const abs = join(process.cwd(), 'content', dir)
    // `content/blogs` disappears once the archive is migrated to Firestore.
    if (!existsSync(abs))
      continue
    for (const name of readdirSync(abs)) {
      if (!name.endsWith('.md'))
        continue
      files.push({ path: `content/${dir}/${name}`, body: readFileSync(join(abs, name), 'utf8') })
    }
  }
  return files
}

describe('the save-time embed check', () => {
  it('passes a responsive, titled embed', () => {
    const good = '<iframe src="https://www.youtube.com/embed/x" title="YouTube video player" allowfullscreen></iframe>'
    expect(findEmbedProblems(good)).toEqual([])
  })

  it('rejects width and height attributes', () => {
    const bad = '<iframe src="https://www.youtube.com/embed/x" title="v" width="720" height="405"></iframe>'
    expect(findEmbedProblems(bad)).toHaveLength(1)
    expect(findEmbedProblems(bad)[0]).toMatch(/width\/height/)
  })

  // A fixed inline width defeats the CSS the same way the attributes do.
  it('rejects a fixed inline width', () => {
    const bad = '<iframe src="https://x" title="v" style="width: 720px; border: 0"></iframe>'
    expect(findEmbedProblems(bad)[0]).toMatch(/inline width/)
  })

  it('allows a percentage inline width', () => {
    const ok = '<iframe src="https://x" title="v" style="width: 100%"></iframe>'
    expect(findEmbedProblems(ok)).toEqual([])
  })

  it('requires a title for screen readers', () => {
    const bad = '<iframe src="https://x"></iframe>'
    expect(findEmbedProblems(bad)[0]).toMatch(/no title/)
  })

  it('ignores markdown with no embeds at all', () => {
    expect(findEmbedProblems('## Heading\n\nJust prose.')).toEqual([])
  })
})

describe('file-based content stays responsive', () => {
  const files = markdownFiles()

  it('finds markdown to check', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it('has no embed the save-time check would reject', () => {
    const offenders: string[] = []
    for (const { path, body } of files) {
      for (const problem of findEmbedProblems(body))
        offenders.push(`${path}: ${problem}`)
    }
    expect(offenders).toEqual([])
  })
})

describe('the embed sizing rule exists', () => {
  const css = readFileSync(join(process.cwd(), 'assets/css/tailwind.css'), 'utf8')

  // If this block is ever dropped, the checks above stop protecting anything —
  // embeds would fall back to the iframe default of 300x150.
  it('sizes .prose iframe to the column at 16:9', () => {
    const rule = css.match(/\.prose iframe\s*\{([^}]*)\}/)?.[1]
    expect(rule, '.prose iframe rule missing from assets/css/tailwind.css').toBeTruthy()
    expect(rule).toMatch(/max-width:\s*100%/)
    expect(rule).toMatch(/aspect-ratio:\s*16\s*\/\s*9/)
  })
})
