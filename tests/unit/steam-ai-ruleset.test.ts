import { describe, expect, it } from 'vitest'
import {
  ANSWER_OPTIONS,
  classifyAudit,
  normalizeAnswers,
  RULESET_CATEGORIES,
  RULESET_VERSION,
} from '../../utils/steam-ai-ruleset'

describe('steam-ai-ruleset — classifyAudit', () => {
  it('all-none → nothing to disclose', () => {
    const c = classifyAudit({})
    expect(c.rulesetVersion).toBe(RULESET_VERSION)
    expect(c.mustDisclose).toBe(false)
    expect(c.hasPre).toBe(false)
    expect(c.hasLive).toBe(false)
    expect(c.hasGray).toBe(false)
    expect(c.perCategory).toHaveLength(RULESET_CATEGORIES.length)
    expect(c.perCategory.every(p => p.outcome === 'none')).toBe(true)
  })

  it('shipped AI art → Pre-Generated, must disclose', () => {
    const c = classifyAudit({ art_textures: 'shipped_pre' })
    const art = c.perCategory.find(p => p.id === 'art_textures')!
    expect(art.outcome).toBe('pre')
    expect(c.hasPre).toBe(true)
    expect(c.mustDisclose).toBe(true)
  })

  it('dev-only use is exempt, not a disclosure', () => {
    const c = classifyAudit({ music: 'dev_only' })
    const music = c.perCategory.find(p => p.id === 'music')!
    expect(music.outcome).toBe('exempt')
    expect(c.mustDisclose).toBe(false)
  })

  it('an AI coding assistant that ships is exempt (efficiency tool override)', () => {
    const c = classifyAudit({ code: 'shipped_pre' })
    const code = c.perCategory.find(p => p.id === 'code')!
    expect(code.outcome).toBe('exempt')
    expect(c.mustDisclose).toBe(false)
  })

  it('runtime AI → Live-Generated and flags hasLive', () => {
    const c = classifyAudit({ runtime: 'shipped_live' })
    const runtime = c.perCategory.find(p => p.id === 'runtime')!
    expect(runtime.outcome).toBe('live')
    expect(c.hasLive).toBe(true)
    expect(c.mustDisclose).toBe(true)
  })

  it('runtime "yes, ships" still resolves to Live', () => {
    const c = classifyAudit({ runtime: 'shipped_pre' })
    expect(c.perCategory.find(p => p.id === 'runtime')!.outcome).toBe('live')
  })

  it('unsure → gray zone, surfaced but not auto-counted as disclose', () => {
    const c = classifyAudit({ voice: 'unsure' })
    const voice = c.perCategory.find(p => p.id === 'voice')!
    expect(voice.outcome).toBe('gray')
    expect(c.hasGray).toBe(true)
    expect(c.mustDisclose).toBe(false)
  })

  it('marketing shipped content carries a scrutiny flag', () => {
    const c = classifyAudit({ marketing: 'shipped_pre' })
    const marketing = c.perCategory.find(p => p.id === 'marketing')!
    expect(marketing.outcome).toBe('pre')
    expect(marketing.flag).toBeTruthy()
  })

  it('voice cloning carries a consent flag', () => {
    const c = classifyAudit({ voice: 'shipped_pre' })
    expect(c.perCategory.find(p => p.id === 'voice')!.flag).toBeTruthy()
  })

  it('combines pre + live across categories', () => {
    const c = classifyAudit({ art_textures: 'shipped_pre', runtime: 'shipped_live' })
    expect(c.hasPre).toBe(true)
    expect(c.hasLive).toBe(true)
    expect(c.mustDisclose).toBe(true)
  })
})

describe('steam-ai-ruleset — normalizeAnswers', () => {
  it('drops unknown categories and invalid answers, defaults to none', () => {
    const n = normalizeAnswers({ art_textures: 'shipped_pre', bogus: 'shipped_pre', music: 'not-a-valid-answer' })
    expect(n.art_textures).toBe('shipped_pre')
    expect(n.music).toBe('none')
    expect('bogus' in n).toBe(false)
    expect(Object.keys(n)).toHaveLength(RULESET_CATEGORIES.length)
  })

  it('tolerates non-object input', () => {
    expect(normalizeAnswers(null).art_textures).toBe('none')
    expect(normalizeAnswers('nope').code).toBe('none')
  })
})

describe('steam-ai-ruleset — config integrity', () => {
  it('has 10 categories with unique ids', () => {
    expect(RULESET_CATEGORIES).toHaveLength(10)
    const ids = RULESET_CATEGORIES.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every category classifies every answer option', () => {
    for (const cat of RULESET_CATEGORIES) {
      for (const opt of ANSWER_OPTIONS) {
        const r = cat.classify(opt.value)
        expect(r.outcome).toBeTruthy()
        expect(r.rationale.length).toBeGreaterThan(0)
      }
    }
  })
})
