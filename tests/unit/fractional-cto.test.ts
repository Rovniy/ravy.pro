import { describe, expect, it } from 'vitest'
import { fractionalCto as c } from '~/data/fractional-cto'
import { offeringById } from '~/data/offerings'

// Copy invariants from the offer's own build brief. These are commitments, not
// style choices — each one has a concrete cost if it regresses.

function allCopy(): string {
  return JSON.stringify(c)
}

describe('fractional-cto offering wiring', () => {
  it('is wired to a real offering at the same path', () => {
    const offering = offeringById(c.id)
    expect(offering).toBeDefined()
    expect(offering!.cta).toEqual({ kind: 'page', path: c.path })
  })

  it('advertises all three prices on the card meta line', () => {
    const offering = offeringById(c.id)!
    expect(offering.meta).toContain('$1,500')
    expect(offering.meta).toContain('$2,500')
    expect(offering.meta).toContain('$5,000')
  })
})

describe('fractional-cto copy invariants', () => {
  it('keeps the section counts the page and schema advertise', () => {
    expect(c.facts).toHaveLength(4)
    expect(c.fit.yes.items).toHaveLength(5)
    expect(c.fit.no.items).toHaveLength(4)
    expect(c.steps.items).toHaveLength(3)
    expect(c.packages.items).toHaveLength(3)
    expect(c.deliverables.items).toHaveLength(6)
    expect(c.track.items).toHaveLength(6)
    expect(c.faq.items).toHaveLength(8)
  })

  it('shows all three prices, never "on request"', () => {
    const prices = c.packages.items.map(p => p.price)
    expect(prices).toEqual(['1500', '2500', '5000'])
    for (const pkg of c.packages.items) {
      expect(pkg.priceLine).toMatch(/^\$[\d,]+/)
    }
    expect(allCopy().toLowerCase()).not.toContain('on request')
  })

  it('emphasizes exactly one package as the default', () => {
    const emphasized = c.packages.items.filter(p => p.emphasized)
    expect(emphasized).toHaveLength(1)
    expect(emphasized[0]!.id).toBe('advisory')
  })

  // The UAE line is a legal boundary, not copy: it must appear in the facts
  // strip, the availability section, and the FAQ — and the page must never
  // claim worldwide availability.
  it('states the outside-the-UAE line in facts, availability, and FAQ', () => {
    expect(c.facts.join(' ')).toContain('outside the UAE')
    expect(c.availability.paragraphs.join(' ')).toContain('outside the UAE')
    const uaeFaq = c.faq.items.find(i => i.question.includes('UAE'))
    expect(uaeFaq).toBeDefined()
    expect(uaeFaq!.answer).toContain('outside the UAE')
  })

  it('never claims worldwide availability', () => {
    const copy = allCopy().toLowerCase()
    expect(copy).not.toContain('available worldwide')
    expect(copy).not.toContain('global clients')
    expect(copy).not.toContain('worldwide')
  })

  it('states the two-clients capacity line', () => {
    expect(c.packages.footnote).toContain('two clients at a time')
  })

  it('states the timezone honestly, including the North America gap', () => {
    const availability = c.availability.paragraphs.join(' ')
    expect(availability).toContain('GMT+7')
    expect(availability).toContain('North America')
  })

  it('keeps the banned marketing words out', () => {
    const copy = allCopy().toLowerCase()
    for (const word of ['leverage', 'synergy', 'cutting-edge', 'seamless', 'empower']) {
      expect(copy, `banned word: ${word}`).not.toContain(word)
    }
  })

  // No invented social proof: the data module must not even have the fields.
  it('carries no testimonials, logos, ratings, or client cases', () => {
    const copy = allCopy().toLowerCase()
    for (const marker of ['testimonial', 'aggregaterating', 'ratingvalue', 'client logo']) {
      expect(copy, `social-proof marker: ${marker}`).not.toContain(marker)
    }
  })

  it('gives every FAQ item a question and a substantive answer', () => {
    for (const item of c.faq.items) {
      expect(item.question).toBeTruthy()
      expect(item.answer.length).toBeGreaterThan(40)
    }
  })
})
