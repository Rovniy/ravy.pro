import { describe, expect, it } from 'vitest'
import { minimarkToHtml } from '../../server/utils/minimark-html'

const SITE = 'https://ravy.pro'

describe('minimarkToHtml', () => {
  it('renders headings, paragraphs, and inline markup', () => {
    const body = {
      type: 'minimark',
      value: [
        ['h2', { id: 'intro' }, 'Intro'],
        ['p', {}, 'Hello ', ['strong', {}, 'world'], '!'],
      ],
    }
    expect(minimarkToHtml(body, SITE)).toBe('<h2>Intro</h2>\n<p>Hello <strong>world</strong>!</p>')
  })

  it('absolutizes relative href/src and keeps allowed attributes', () => {
    const body = {
      type: 'minimark',
      value: [
        ['p', {}, ['a', { href: '/blogs/other', class: 'x' }, 'link']],
        ['img', { src: '/blog-content/a.webp', alt: 'pic', width: 720 }],
      ],
    }
    const html = minimarkToHtml(body, SITE)
    expect(html).toContain('<a href="https://ravy.pro/blogs/other">link</a>')
    expect(html).toContain('<img src="https://ravy.pro/blog-content/a.webp" alt="pic" width="720">')
    expect(html).not.toContain('class=')
  })

  it('escapes text content and attribute values', () => {
    const body = { type: 'minimark', value: [['p', {}, 'a < b & "c"']] }
    expect(minimarkToHtml(body, SITE)).toBe('<p>a &lt; b &amp; &quot;c&quot;</p>')
  })

  it('unwraps unknown/custom component tags but keeps their children', () => {
    const body = { type: 'minimark', value: [['MyWidget', { foo: 1 }, ['p', {}, 'inner']]] }
    expect(minimarkToHtml(body, SITE)).toBe('<p>inner</p>')
  })

  it('returns empty string for missing or non-minimark bodies', () => {
    expect(minimarkToHtml(null, SITE)).toBe('')
    expect(minimarkToHtml({}, SITE)).toBe('')
    expect(minimarkToHtml({ type: 'root', children: [] }, SITE)).toBe('')
  })
})
