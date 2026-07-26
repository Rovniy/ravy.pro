import { describe, expect, it } from 'vitest'
import { mentorship } from '~/data/mentorship'
import { isOfferingId, OFFERING_IDS, OFFERING_PAGE_PATHS, offeringById, OFFERINGS } from '~/data/offerings'

describe('offerings registry', () => {
  it('has a unique, registered id for every offering', () => {
    const ids = OFFERINGS.map(o => o.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(OFFERING_IDS).toContain(id)
  })

  it('fills every copy field — an empty one renders as a blank card', () => {
    for (const o of OFFERINGS) {
      for (const key of ['name', 'icon', 'tag', 'blurb', 'tagline', 'meta', 'action', 'inquiryLabel', 'telegramText'] as const) {
        expect(o[key], `${o.id}.${key}`).toBeTruthy()
      }
    }
  })

  // The homepage card gives the tagline one line in a third-width column, so a
  // long one silently reflows the whole row.
  it('keeps the homepage tagline to a single short line', () => {
    for (const o of OFFERINGS) {
      expect(o.tagline.length, `${o.id}.tagline is ${o.tagline.length} chars`).toBeLessThanOrEqual(75)
      expect(o.tagline, `${o.id}.tagline should be one sentence`).not.toMatch(/\.\s+\S/)
    }
  })

  it('gives page-backed offerings a /services path and inquiry-backed ones none', () => {
    for (const o of OFFERINGS) {
      if (o.cta.kind === 'page')
        expect(o.cta.path).toMatch(/^\/services\//)
      else
        expect(o.cta).toEqual({ kind: 'inquiry' })
    }
  })

  it('derives OFFERING_PAGE_PATHS from the page-backed offerings', () => {
    const expected = OFFERINGS
      .filter(o => o.cta.kind === 'page')
      .map(o => (o.cta as { path: string }).path)
    expect(OFFERING_PAGE_PATHS).toEqual(expected)
    expect(OFFERING_PAGE_PATHS).toContain('/services/mentorship')
  })

  it('resolves an offering by id and nothing else', () => {
    expect(offeringById('mentorship')?.id).toBe('mentorship')
    expect(offeringById('nope')).toBeUndefined()
  })

  it('validates offering ids strictly', () => {
    expect(isOfferingId('mentorship')).toBe(true)
    for (const bad of ['', 'Mentorship', 'mentorship ', null, undefined, 0, {}]) {
      expect(isOfferingId(bad), String(bad)).toBe(false)
    }
  })
})

describe('mentorship copy', () => {
  it('is wired to a real offering at the same path', () => {
    const offering = offeringById(mentorship.id)
    expect(offering).toBeDefined()
    expect(offering!.cta).toEqual({ kind: 'page', path: mentorship.path })
  })

  // The page and its JSON-LD both advertise these counts, so a copy edit that
  // silently drops a step or an FAQ item should fail here rather than ship.
  it('keeps the section counts the page and schema advertise', () => {
    expect(mentorship.program.steps).toHaveLength(6)
    expect(mentorship.faq.items).toHaveLength(9)
    expect(mentorship.cases.items).toHaveLength(4)
    expect(mentorship.included.items).toHaveLength(8)
    expect(mentorship.terms.facts).toHaveLength(4)
  })

  it('numbers the program steps 01..06 in order', () => {
    expect(mentorship.program.steps.map(s => s.n)).toEqual(['01', '02', '03', '04', '05', '06'])
  })

  it('gives every FAQ item a question and an answer', () => {
    for (const item of mentorship.faq.items) {
      expect(item.question).toBeTruthy()
      expect(item.answer.length).toBeGreaterThan(40)
    }
  })

  it('names the market on every case card, since cards get quoted out of context', () => {
    for (const c of mentorship.cases.items) {
      expect(c.market).toBeTruthy()
      expect(c.salaryRange).toBeTruthy()
      expect(c.weeks).toBeTruthy()
    }
  })

  // Pricing must read currency-free wherever it leads, so a visitor who can't
  // parse ₽ still understands the offer. Roubles belong only to the labelled
  // example and the case cards.
  it('keeps roubles out of the hero, terms lede and FAQ answers', () => {
    const leadCopy = [
      mentorship.hero.title,
      mentorship.hero.lede,
      ...mentorship.hero.facts,
      mentorship.terms.lede,
      ...mentorship.faq.items.map(i => i.answer),
    ]
    for (const copy of leadCopy) expect(copy).not.toContain('₽')

    expect(mentorship.terms.example.text).toContain('₽')
  })
})
