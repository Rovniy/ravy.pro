import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import config from '~~/nuxt.config'
import { homePage } from '~/data'
import { PROJECT_PAGE_PATHS } from '~/data/project-routes'
import { commandIcons, postItems, RUN, SCOPES, staticCommandItems, TYPE_LABEL } from '~/utils/command-index'
import { searchCommands } from '~/utils/command-search'

const items = staticCommandItems()
const posts = postItems([
  { path: '/blogs/hello', title: 'Hello', description: 'First', tags: ['gamedev'], image: '/media/blog/x.webp' },
  { path: '/blogs/remote', title: 'Remote', image: 'https://example.com/a.png' },
  { title: 'No path' },
])

/** Does a root-relative path resolve to a page that exists? */
function isRoute(path: string): boolean {
  const clean = path.split(/[?#]/)[0]!.replace(/\/$/, '') || '/'
  if (clean === '/')
    return true
  if ((PROJECT_PAGE_PATHS as readonly string[]).includes(clean))
    return true
  const doc = clean.match(/^\/docs\/([\w-]+)$/)
  if (doc)
    return existsSync(`content/docs/${doc[1]}.md`)
  if (clean.startsWith('/blogs/'))
    return true
  return existsSync(`pages${clean}.vue`) || existsSync(`pages${clean}/index.vue`)
}

describe('command index', () => {
  it('has unique ids', () => {
    const all = [...items, ...posts].map(i => i.id)
    expect(new Set(all).size).toBe(all.length)
  })

  it('gives every item at least one action and a label for its type', () => {
    for (const i of items) {
      expect(i.actions.length, i.id).toBeGreaterThan(0)
      expect(TYPE_LABEL[i.type], i.id).toBeTruthy()
    }
  })

  it('points every internal action at a real page', () => {
    for (const i of items) {
      for (const a of i.actions.filter(a => a.kind === 'navigate'))
        expect(isRoute(a.value), `${i.id} → ${a.value}`).toBe(true)
    }
  })

  it('opens only https links or real files in a new tab and only runs known commands', () => {
    const commands = Object.values(RUN) as string[]
    for (const i of items) {
      for (const a of i.actions) {
        // Same-origin files (the CV, the RSS feed) open in a tab too, off-router.
        if (a.kind === 'external' && a.value.startsWith('/'))
          expect(a.value === '/rss.xml' || existsSync(`public${a.value}`), `${i.id} → ${a.value}`).toBe(true)
        else if (a.kind === 'external')
          expect(a.value, i.id).toMatch(/^https:\/\//)
        if (a.kind === 'mail')
          expect(a.value, i.id).toMatch(/^(?:mailto|tel):/)
        if (a.kind === 'run')
          expect(commands, i.id).toContain(a.value)
      }
    }
  })

  it('covers every scope with at least one item', () => {
    for (const scope of SCOPES.filter(s => s.types)) {
      const types = scope.types as readonly string[]
      const pool = scope.id === 'posts' ? posts : items
      expect(pool.some(i => types.includes(i.type)), scope.id).toBe(true)
    }
  })

  it('builds post items with an absolute share link and same-origin thumbnails only', () => {
    expect(posts.map(p => p.id)).toEqual(['post:/blogs/hello', 'post:/blogs/remote'])
    expect(posts[0]!.actions[1]!.value).toBe('https://ravy.pro/blogs/hello')
    expect(posts[0]!.image).toBe('/media/blog/x.webp')
    expect(posts[1]!.image).toBeUndefined()
  })

  it('finds something for every hero suggestion chip', () => {
    for (const q of homePage.hero.searchSuggestions)
      expect(searchCommands(items, q).hits.length, q).toBeGreaterThan(0)
  })

  it('finds the obvious things by name', () => {
    expect(searchCommands(items, 'jwt').hits[0]!.item.type).toBe('tool')
    expect(searchCommands(items, 'theme').hits[0]!.item.id).toContain('theme')
    expect(searchCommands(items, 'почта').hits.length).toBeGreaterThan(0)
  })

  it('bundles every icon the palette can render', () => {
    const bundled = new Set((config as any).icon.clientBundle.icons as string[])
    for (const name of commandIcons())
      expect(bundled.has(name), name).toBe(true)
    for (const i of items) {
      expect(bundled.has(i.icon), i.icon).toBe(true)
      for (const a of i.actions.filter(a => a.icon))
        expect(bundled.has(a.icon!), a.icon).toBe(true)
    }
  })
})
