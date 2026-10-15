import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'
import { LEGACY_VIOLATIONS } from './design-tokens.legacy'

/*
 * The design system's guard rail. Everything below is outside the system:
 * ad-hoc pixel font sizes (use the scale, `text-micro` for mono labels),
 * gradients, the cursor spotlight, the old teal/emerald brand, rounded
 * corners (the system cuts corners; only `rounded-full` survives, for status
 * dots and avatars) and soft shadows (depth comes from panel layers).
 *
 * Files written before the system are listed in design-tokens.legacy.ts with
 * the number of violations they had. That number may only go down: a file
 * that gains one fails, and a file that loses some fails until its entry is
 * lowered (or removed at zero) — the same ratchet as the coverage thresholds.
 */

const ROOT = join(__dirname, '..', '..')
const DIRS = ['components', 'pages', 'layouts']

const RULES: Array<{ name: string, pattern: RegExp }> = [
  { name: 'pixel font size', pattern: /\btext-\[\d+(?:\.\d+)?(?:px|rem)\]/g },
  { name: 'gradient', pattern: /\bbg-(?:gradient|linear|radial)-to-\w+/g },
  { name: 'spotlight', pattern: /\bv-spotlight\b/g },
  { name: 'old brand hue', pattern: /\b(?:teal|emerald)-\d{2,3}\b/g },
  { name: 'rounded corner', pattern: /\brounded(?:-[trblse]{1,2})?(?:-(?:sm|md|lg|xl|2xl|3xl))?(?![\w-])|\brounded(?:-[trblse]{1,2})?-(?:sm|md|lg|xl|2xl|3xl)\b/g },
  { name: 'soft shadow', pattern: /\bshadow(?:-(?:sm|md|lg|xl|2xl|inner))?(?![\w-])|\bshadow-(?:slate|black|white|accent|teal|emerald|amber)-/g },
]

function vueFiles(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory())
      out.push(...vueFiles(full))
    else if (name.endsWith('.vue'))
      out.push(full)
  }
  return out
}

function countViolations(source: string): number {
  return RULES.reduce((n, rule) => n + (source.match(rule.pattern)?.length ?? 0), 0)
}

function scan(): Map<string, number> {
  const counts = new Map<string, number>()
  for (const dir of DIRS) {
    for (const file of vueFiles(join(ROOT, dir))) {
      const n = countViolations(readFileSync(file, 'utf8'))
      if (n > 0)
        counts.set(relative(ROOT, file).split(sep).join('/'), n)
    }
  }
  return counts
}

describe('design tokens', () => {
  const counts = scan()

  it('the rules catch what they are meant to', () => {
    expect(countViolations('class="text-[11px] rounded-xl shadow-lg"')).toBe(3)
    expect(countViolations('class="bg-gradient-to-r from-teal-400"')).toBe(2)
    expect(countViolations('class="rounded-full text-micro bg-panel"')).toBe(0)
    expect(countViolations('class="rounded rounded-t-lg"')).toBe(2)
  })

  it('no file outside the legacy list breaks the system', () => {
    const offenders = [...counts].filter(([file]) => !(file in LEGACY_VIOLATIONS))
    expect(offenders).toEqual([])
  })

  it('legacy files only ever lose violations', () => {
    const grew: string[] = []
    const shrank: string[] = []
    for (const [file, allowed] of Object.entries(LEGACY_VIOLATIONS)) {
      const now = counts.get(file) ?? 0
      if (now > allowed)
        grew.push(`${file}: ${now} > ${allowed}`)
      else if (now < allowed)
        shrank.push(`${file}: now ${now}, lower the entry from ${allowed}${now === 0 ? ' (delete it)' : ''}`)
    }
    expect(grew, 'gained off-system classes').toEqual([])
    expect(shrank, 'ratchet: update design-tokens.legacy.ts').toEqual([])
  })
})
