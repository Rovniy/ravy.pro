import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Frontmatter invariants for the blog archive. Each of these encodes a bug that
// actually shipped or nearly shipped, so the assertions are deliberately blunt.

interface Post { file: string, fm: Record<string, string> }

function posts(): Post[] {
  const dir = join(process.cwd(), 'content/blogs')
  return readdirSync(dir)
    .filter(name => name.endsWith('.md'))
    .map((name) => {
      const text = readFileSync(join(dir, name), 'utf8')
      const block = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? ''
      const fm: Record<string, string> = {}
      for (const line of block.split(/\r?\n/)) {
        // `:\s*` next to `(.*)` is ambiguous enough to trip the linter's
        // backtracking check — match the value verbatim and trim it instead.
        const m = line.match(/^([A-Z_][\w-]*):(.*)$/i)
        // eslint-disable-next-line ts/ban-ts-comment
        if (m) { // @ts-expect-error
          fm[m[1]] = m[2].trim()
        }
      }
      return { file: name, fm }
    })
}

const ALL = posts()

describe('blog frontmatter', () => {
  it('finds the archive', () => {
    expect(ALL.length).toBeGreaterThan(20)
  })

  // 22 of 31 posts once shared one byte-identical createdAt, which left
  // datePublished, sitemap lastmod, and the prev/next ordering with no real sort
  // key across most of the archive.
  it('gives every post a distinct createdAt', () => {
    const dates = ALL.map(p => p.fm.createdAt).filter(Boolean)
    expect(dates.length).toBe(ALL.length)
    const duplicates = dates.filter((d, i) => dates.indexOf(d) !== i)
    expect(duplicates, `duplicated createdAt: ${duplicates.join(', ')}`).toEqual([])
  })

  // One post shipped `article:modified_time` earlier than `article:published_time`.
  it('never has lastUpdated before createdAt', () => {
    const inverted = ALL
      .filter(p => p.fm.createdAt && p.fm.lastUpdated)
      .filter(p => new Date(String(p.fm.lastUpdated)).getTime() < new Date(String(p.fm.createdAt)).getTime())
      .map(p => p.file)
    expect(inverted).toEqual([])
  })

  /*
   * The polarity of the noindex flag is load-bearing.
   *
   * It was first written as `indexable: false`, and an absent optional boolean
   * comes back from the content DB as `false` rather than `undefined` — so the
   * check matched every post that never set the field and rendered
   * `noindex, follow` across the entire blog. The flag has to stay a positive
   * opt-out so that "absent" means "index normally".
   */
  it('uses the positive `noindex` opt-out, never `indexable`', () => {
    const wrong = ALL.filter(p => 'indexable' in p.fm).map(p => p.file)
    expect(wrong, 'use `noindex: true` — an absent `indexable` reads as false').toEqual([])
  })

  it('only ever sets noindex to true', () => {
    for (const p of ALL) {
      if ('noindex' in p.fm)
        expect(p.fm.noindex, p.file).toBe('true')
    }
  })

  // The canary for the polarity bug: if a future change de-indexes the archive
  // wholesale, this fails rather than quietly dropping the site out of Google.
  it('leaves the clear majority of posts indexable', () => {
    const hidden = ALL.filter(p => p.fm.noindex === 'true')
    expect(hidden.length).toBeLessThan(ALL.length / 2)
  })

  it('keeps every post published with a title and description', () => {
    for (const p of ALL) {
      expect(p.fm.title, `${p.file} title`).toBeTruthy()
      expect(p.fm.description, `${p.file} description`).toBeTruthy()
    }
  })
})
