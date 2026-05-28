import { describe, expect, it } from 'vitest'
import {
  BRAND_SPECS,
  detectBrand,
  formatCardNumber,
  generateCard,
  generateCardNumber,
  luhnCheck,
  luhnCheckDigit,
  validateCardNumber,
} from '../../utils/credit-card'

describe('utils/credit-card — Luhn', () => {
  it('accepts known good numbers', () => {
    // Common test-fixture cards.
    expect(luhnCheck('4111111111111111')).toBe(true)
    expect(luhnCheck('5555555555554444')).toBe(true)
    expect(luhnCheck('378282246310005')).toBe(true)
    expect(luhnCheck('6011111111111117')).toBe(true)
    expect(luhnCheck('3530111333300000')).toBe(true)
  })

  it('rejects invalid numbers', () => {
    expect(luhnCheck('4111111111111112')).toBe(false)
    expect(luhnCheck('1234567890123456')).toBe(false)
    expect(luhnCheck('')).toBe(false)
    expect(luhnCheck('1234')).toBe(false)
  })

  it('ignores spaces and dashes', () => {
    expect(luhnCheck('4111 1111 1111 1111')).toBe(true)
    expect(luhnCheck('4111-1111-1111-1111')).toBe(true)
  })

  it('luhnCheckDigit produces a digit that makes the full number valid', () => {
    const partial = '411111111111111'
    const cd = luhnCheckDigit(partial)
    expect(cd).toMatch(/^\d$/)
    expect(luhnCheck(partial + cd)).toBe(true)
  })
})

describe('utils/credit-card — brand detection', () => {
  it('detects each supported brand by its prefix', () => {
    expect(detectBrand('4111111111111111')).toBe('visa')
    expect(detectBrand('5555555555554444')).toBe('mastercard')
    expect(detectBrand('2221000000000009')).toBe('mastercard')
    expect(detectBrand('378282246310005')).toBe('amex')
    expect(detectBrand('6011111111111117')).toBe('discover')
    expect(detectBrand('3530111333300000')).toBe('jcb')
    expect(detectBrand('30000000000004')).toBe('diners')
    expect(detectBrand('6200000000000005')).toBe('unionpay')
  })

  it('returns null for unknown prefixes', () => {
    expect(detectBrand('9999000000000000')).toBe(null)
    expect(detectBrand('')).toBe(null)
  })
})

describe('utils/credit-card — formatting', () => {
  it('groups visa/mastercard as 4-4-4-4', () => {
    expect(formatCardNumber('4111111111111111')).toBe('4111 1111 1111 1111')
  })

  it('groups amex as 4-6-5', () => {
    expect(formatCardNumber('378282246310005')).toBe('3782 822463 10005')
  })

  it('groups diners 14-digit as 4-6-4', () => {
    expect(formatCardNumber('30000000000004')).toBe('3000 000000 0004')
  })
})

describe('utils/credit-card — generation', () => {
  for (const spec of BRAND_SPECS) {
    it(`generates a valid ${spec.label} number that passes Luhn and detects as ${spec.brand}`, () => {
      for (let i = 0; i < 20; i++) {
        const number = generateCardNumber({ brand: spec.brand })
        expect(number).toMatch(/^\d+$/)
        expect(spec.lengths).toContain(number.length)
        expect(luhnCheck(number)).toBe(true)
        expect(detectBrand(number)).toBe(spec.brand)
      }
    })
  }

  it('honours a custom BIN prefix', () => {
    const number = generateCardNumber({ brand: 'visa', prefix: '424242' })
    expect(number.startsWith('424242')).toBe(true)
    expect(luhnCheck(number)).toBe(true)
  })

  it('builds a full card object with expiry and CVV of correct length', () => {
    const card = generateCard({ brand: 'amex' })
    expect(card.brand).toBe('amex')
    expect(card.number).toMatch(/^\d{15}$/)
    expect(card.cvv).toMatch(/^\d{4}$/)
    expect(card.expiry).toMatch(/^(0[1-9]|1[0-2])\/\d{2}$/)
    expect(card.holder.split(' ').length).toBe(2)
    expect(card.formatted.replace(/\s/g, '')).toBe(card.number)
  })
})

describe('utils/credit-card — validation report', () => {
  it('flags a valid Visa', () => {
    const r = validateCardNumber('4111 1111 1111 1111')
    expect(r.brand).toBe('visa')
    expect(r.brandLabel).toBe('Visa')
    expect(r.luhnValid).toBe(true)
    expect(r.lengthValid).toBe(true)
    expect(r.formatted).toBe('4111 1111 1111 1111')
    expect(r.cvvLength).toBe(3)
  })

  it('flags an Amex with 4-digit CVV expectation', () => {
    const r = validateCardNumber('378282246310005')
    expect(r.brand).toBe('amex')
    expect(r.cvvLength).toBe(4)
    expect(r.lengthValid).toBe(true)
  })

  it('reports lengthValid=false when digits do not match brand length', () => {
    const r = validateCardNumber('411111111111') // 12 digits, valid Visa prefix but wrong length
    expect(r.brand).toBe('visa')
    expect(r.lengthValid).toBe(false)
  })

  it('reports unknown brand without crashing', () => {
    const r = validateCardNumber('9999999999999999')
    expect(r.brand).toBe(null)
    expect(r.brandLabel).toBe(null)
    expect(r.cvvLength).toBe(null)
  })
})
