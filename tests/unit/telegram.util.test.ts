import { describe, expect, it } from 'vitest'
import {
  escapeTelegramHtml,
  markdownToTelegramBlocks,
  noteDraftKeyboard,
  noteDraftMessages,
  notePublishedKeyboard,
  packMessages,
  parsePublishCallback,
  TELEGRAM_MAX_CHARS,
} from '~/utils/telegram'

const origin = 'https://ravy.pro'
const note = {
  slug: 'node-event-loop-watchdog',
  title: 'How do I restart a <Node> container when it hangs?',
  topics: ['devops', 'web'],
  createdAt: '2026-11-14T19:08:07.319Z',
  markdown: [
    'A stuck event loop & a healthcheck that only marks it `unhealthy`.',
    '',
    '```ts',
    'if (a < b && c) process.kill(process.pid, \'SIGKILL\')',
    '```',
    '',
    '- one **bold** point',
    '- see [the docs](https://docs.docker.com/x) and [a post](/blogs/glimtide)',
  ].join('\n'),
}

describe('escapeTelegramHtml', () => {
  it('escapes the HTML parse-mode markup characters', () => {
    expect(escapeTelegramHtml('a < b && c > d')).toBe('a &lt; b &amp;&amp; c &gt; d')
  })
})

describe('markdownToTelegramBlocks', () => {
  const blocks = markdownToTelegramBlocks(note.markdown, origin)

  it('turns prose, code fences, lists and links into Telegram HTML', () => {
    expect(blocks).toEqual([
      'A stuck event loop &amp; a healthcheck that only marks it <code>unhealthy</code>.',
      '<pre><code class="language-ts">if (a &lt; b &amp;&amp; c) process.kill(process.pid, \'SIGKILL\')</code></pre>',
      '• one <b>bold</b> point',
      '• see <a href="https://docs.docker.com/x">the docs</a> and <a href="https://ravy.pro/blogs/glimtide">a post</a>',
    ])
  })

  it('keeps formatting characters inside inline code literal', () => {
    expect(markdownToTelegramBlocks('use `**not bold**` here', origin)).toEqual(['use <code>**not bold**</code> here'])
  })

  it('renders a fence without a language as plain pre and headings as bold lines', () => {
    expect(markdownToTelegramBlocks('## Why\n\n```\nRead CLAUDE.md\n```', origin)).toEqual(['<b>Why</b>', '<pre>Read CLAUDE.md</pre>'])
  })
})

describe('noteDraftMessages', () => {
  it('puts the title, topics, slug, date and warnings first, then the whole note', () => {
    const [text, ...rest] = noteDraftMessages(note, origin, ['Add a source link.'])
    expect(rest).toEqual([])
    expect(text).toContain('<b>How do I restart a &lt;Node&gt; container when it hangs?</b>')
    expect(text).toContain('<code>node-event-loop-watchdog</code> · 2026-11-14')
    expect(text).toContain('Темы: DevOps and tooling, Web development')
    expect(text).toContain('⚠️ Add a source link.')
    expect(text).toContain('<pre><code class="language-ts">')
  })

  it('splits a long note over several messages, each under the limit', () => {
    const long = { ...note, markdown: Array.from({ length: 40 }, (_, i) => `Paragraph ${i} ${'word '.repeat(40)}`).join('\n\n') }
    const messages = noteDraftMessages(long, origin)
    expect(messages.length).toBeGreaterThan(1)
    for (const m of messages)
      expect(m.length).toBeLessThanOrEqual(TELEGRAM_MAX_CHARS)
    expect(messages.join('\n\n')).toContain('Paragraph 39')
  })

  it('cuts a single oversized code block without breaking its tags or entities', () => {
    const [m] = packMessages('', [`<pre><code class="language-ts">${'a &amp; b '.repeat(600)}</code></pre>`], 500)
    expect(m!.length).toBeLessThanOrEqual(500)
    expect(m).toMatch(/…<\/code><\/pre>$/)
    expect(m).not.toMatch(/&[a-z]*…/)
  })
})

describe('keyboards and callbacks', () => {
  it('offers Publish and the studio link under a draft', () => {
    expect(noteDraftKeyboard('node-hang', origin)).toEqual({ inline_keyboard: [[
      { text: 'Опубликовать', callback_data: 'til:publish:node-hang' },
      { text: 'Открыть в студии', url: 'https://ravy.pro/studio/notes/node-hang' },
    ]] })
  })

  it('drops the Publish button when the slug does not fit callback_data', () => {
    expect(noteDraftKeyboard('x'.repeat(60), origin).inline_keyboard[0]).toHaveLength(1)
  })

  it('links the live note once published', () => {
    expect(notePublishedKeyboard('node-hang', origin).inline_keyboard[0]![0]!.url).toBe('https://ravy.pro/til/node-hang')
  })

  it('reads only well-formed publish callbacks', () => {
    expect(parsePublishCallback('til:publish:node-hang')).toBe('node-hang')
    expect(parsePublishCallback('til:publish:../etc')).toBeNull()
    expect(parsePublishCallback('til:delete:node-hang')).toBeNull()
    expect(parsePublishCallback(undefined)).toBeNull()
  })
})
