import { describe, expect, it } from 'vitest'
import { escapeTelegramHtml, noteDraftMessage, TELEGRAM_MAX_CHARS } from '~/utils/telegram'

const note = {
  slug: 'node-event-loop-watchdog',
  title: 'How do I restart a <Node> container when it hangs?',
  topics: ['devops', 'web'],
  excerpt: 'A stuck event loop & a healthcheck that only marks it unhealthy.',
}

describe('telegram helpers', () => {
  it('escapes the HTML parse-mode markup characters', () => {
    expect(escapeTelegramHtml('a < b && c > d')).toBe('a &lt; b &amp;&amp; c &gt; d')
  })

  it('builds a draft notice with the title, excerpt, topics and studio link', () => {
    const text = noteDraftMessage(note, 'https://ravy.pro')
    expect(text).toContain('<b>How do I restart a &lt;Node&gt; container when it hangs?</b>')
    expect(text).toContain('A stuck event loop &amp; a healthcheck')
    expect(text).toContain('Темы: devops, web')
    expect(text).toContain('https://ravy.pro/studio/notes/node-event-loop-watchdog')
  })

  it('stays under Telegram\'s message limit', () => {
    const text = noteDraftMessage({ ...note, excerpt: 'x'.repeat(5000) }, 'https://ravy.pro')
    expect(text.length).toBeLessThanOrEqual(TELEGRAM_MAX_CHARS)
  })
})
