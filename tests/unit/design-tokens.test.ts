import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

/*
 * The design system's guard rail. Everything below is outside the system:
 * ad-hoc pixel font sizes (use the scale, `text-micro` for mono labels),
 * gradients, the cursor spotlight, the old teal/emerald brand, rounded
 * corners (the system cuts corners; only `rounded-full` survives, for status
 * dots and avatars), soft shadows (depth comes from panel layers) and a bare
 * `bg-white`, which stays white in the dark theme (use `bg-panel`; a
 * `dark:` variant may still use it).
 */

const ROOT = join(__dirname, '..', '..')
const DIRS = ['components', 'pages', 'layouts']
// Root-level SFCs (error.vue, app.vue) sit outside those folders.
const ROOT_FILES = ['error.vue', 'app.vue']

const RULES: Array<{ name: string, pattern: RegExp }> = [
  { name: 'pixel font size', pattern: /\btext-\[\d+(?:\.\d+)?(?:px|rem)\]/g },
  { name: 'gradient', pattern: /\bbg-(?:gradient|linear|radial)-to-\w+/g },
  { name: 'spotlight', pattern: /\bv-spotlight\b/g },
  { name: 'old brand hue', pattern: /\b(?:teal|emerald)-\d{2,3}\b/g },
  { name: 'rounded corner', pattern: /(?<![\w-])(?:[\w-]+:)*rounded(?:-[trblse]{1,2})?(?:-(?:sm|md|lg|xl|2xl|3xl))?(?=[\s"'`]|$)/g },
  { name: 'theme-blind white', pattern: /(?<![\w:-])(?!dark:)(?:[\w-]+:)*bg-white\b/g },
  { name: 'soft shadow', pattern: /(?<![\w-])(?:[\w-]+:)*shadow(?:-(?!none(?:[\s"'`]|$))[^\s"'`]+)?(?=[\s"'`]|$)/g },
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

// A line that holds a library value which only looks like a utility (a QR
// dot style called 'rounded') opts out with a `design-tokens-allow` comment.
function countViolations(source: string): number {
  const checked = source.split('\n').filter(line => !line.includes('design-tokens-allow')).join('\n')
  return RULES.reduce((n, rule) => n + (checked.match(rule.pattern)?.length ?? 0), 0)
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
  for (const name of ROOT_FILES) {
    const n = countViolations(readFileSync(join(ROOT, name), 'utf8'))
    if (n > 0)
      counts.set(name, n)
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
    expect(countViolations('class="dark:shadow-black/30 hover:shadow-(color:--brand)/20 shadow-none"')).toBe(2)
    expect(countViolations('dotsType: "extra-rounded", class="transition-shadow"')).toBe(0)
    expect(countViolations('class="bg-white/60 hover:bg-white/70 dark:hover:bg-white/5"')).toBe(2)
  })

  it('no component, page or layout breaks the system', () => {
    expect([...counts]).toEqual([])
  })
})
