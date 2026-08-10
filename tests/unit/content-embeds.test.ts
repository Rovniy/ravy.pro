import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Markdown posts embed YouTube by pasting the <iframe> snippet YouTube hands
// out, and that snippet carries `width="720" height="405"`. A fixed pixel width
// is wider than a phone viewport, so the embed pushed the whole document
// sideways — one hard-coded attribute gave every reader a horizontal scrollbar.
//
// Sizing now lives in one place: `.prose iframe` in assets/css/tailwind.css
// renders every embed at column width and 16:9. These tests fail if a new post
// reintroduces the attributes that fight it.

const CONTENT_DIRS = ['blogs', 'docs', 'pages']

function markdownFiles(): { path: string, body: string }[] {
  const files: { path: string, body: string }[] = []
  for (const dir of CONTENT_DIRS) {
    const abs = join(process.cwd(), 'content', dir)
    for (const name of readdirSync(abs)) {
      if (!name.endsWith('.md'))
        continue
      files.push({ path: `content/${dir}/${name}`, body: readFileSync(join(abs, name), 'utf8') })
    }
  }
  return files
}

function iframesIn(body: string): string[] {
  return body.match(/<iframe\b[^>]*>/gi) ?? []
}

describe('content embeds stay responsive', () => {
  const files = markdownFiles()

  it('finds markdown to check', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it('has no iframe with a width or height attribute', () => {
    const offenders: string[] = []
    for (const { path, body } of files) {
      for (const tag of iframesIn(body)) {
        if (/\s(?:width|height)\s*=/i.test(tag))
          offenders.push(`${path}: ${tag.slice(0, 90)}`)
      }
    }
    expect(offenders, 'let the CSS size embeds — drop width/height from the snippet').toEqual([])
  })

  // A fixed inline width defeats the CSS the same way the attributes do.
  it('has no iframe with a fixed inline width', () => {
    const offenders: string[] = []
    for (const { path, body } of files) {
      for (const tag of iframesIn(body)) {
        const style = tag.match(/style\s*=\s*"([^"]*)"/i)?.[1] ?? ''
        if (/\bwidth\s*:\s*\d/.test(style))
          offenders.push(`${path}: ${style}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('keeps every embed titled for screen readers', () => {
    const offenders: string[] = []
    for (const { path, body } of files) {
      for (const tag of iframesIn(body)) {
        if (!/\stitle\s*=/i.test(tag))
          offenders.push(`${path}: ${tag.slice(0, 90)}`)
      }
    }
    expect(offenders).toEqual([])
  })
})

describe('the embed sizing rule exists', () => {
  const css = readFileSync(join(process.cwd(), 'assets/css/tailwind.css'), 'utf8')

  // If this block is ever dropped, the tests above stop protecting anything —
  // markdown embeds would fall back to the iframe default of 300x150.
  it('sizes .prose iframe to the column at 16:9', () => {
    const rule = css.match(/\.prose iframe\s*\{([^}]*)\}/)?.[1]
    expect(rule, '.prose iframe rule missing from assets/css/tailwind.css').toBeTruthy()
    expect(rule).toMatch(/max-width:\s*100%/)
    expect(rule).toMatch(/aspect-ratio:\s*16\s*\/\s*9/)
  })
})
