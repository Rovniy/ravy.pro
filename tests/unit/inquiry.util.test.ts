import { describe, expect, it } from 'vitest'
import { INQUIRY_LIMITS, normalizeInquiry } from '~/utils/inquiry'

const valid = {
  service: 'mentorship',
  name: 'Anna',
  contact: '@anna',
  consent: true,
}

describe('normalizeInquiry', () => {
  it('accepts a valid submission and returns trimmed values', () => {
    const res = normalizeInquiry({
      ...valid,
      name: '  Anna   Petrova ',
      contact: ' @anna ',
      message: ' Hello  there ',
      page: '/services/mentorship',
    })

    expect(res).toEqual({
      status: 'ok',
      value: {
        service: 'mentorship',
        name: 'Anna Petrova',
        contact: '@anna',
        message: 'Hello there',
        page: '/services/mentorship',
      },
    })
  })

  it('treats a filled honeypot as honeypot before any other validation', () => {
    // Invalid service AND missing consent AND a filled honeypot: the honeypot
    // branch must win, or the 400 tells the bot which field gave it away.
    const res = normalizeInquiry({ service: 'nope', company: 'Acme Inc', consent: false })
    expect(res).toEqual({ status: 'honeypot' })
  })

  it('ignores a honeypot that is only whitespace', () => {
    const res = normalizeInquiry({ ...valid, company: '   ' })
    expect(res.status).toBe('ok')
  })

  it('rejects an unknown service', () => {
    expect(normalizeInquiry({ ...valid, service: 'consulting' }).status).toBe('ok')
    expect(normalizeInquiry({ ...valid, service: 'Mentorship' }).status).toBe('invalid')
    expect(normalizeInquiry({ ...valid, service: '' }).status).toBe('invalid')
    expect(normalizeInquiry({ ...valid, service: undefined }).status).toBe('invalid')
  })

  it('enforces the name boundaries', () => {
    expect(normalizeInquiry({ ...valid, name: 'A' }).status).toBe('invalid')
    expect(normalizeInquiry({ ...valid, name: 'Al' }).status).toBe('ok')
    expect(normalizeInquiry({ ...valid, name: 'a'.repeat(INQUIRY_LIMITS.name) }).status).toBe('ok')
    expect(normalizeInquiry({ ...valid, name: 'a'.repeat(INQUIRY_LIMITS.name + 1) }).status).toBe('invalid')
  })

  it('enforces the contact boundaries but not a format', () => {
    expect(normalizeInquiry({ ...valid, contact: '@a' }).status).toBe('invalid')
    expect(normalizeInquiry({ ...valid, contact: '@ab' }).status).toBe('ok')
    expect(normalizeInquiry({ ...valid, contact: 'a'.repeat(INQUIRY_LIMITS.contact) }).status).toBe('ok')
    expect(normalizeInquiry({ ...valid, contact: 'a'.repeat(INQUIRY_LIMITS.contact + 1) }).status).toBe('invalid')

    // Free-form on purpose — all of these are real ways people leave a contact.
    for (const contact of ['@handle', '+971585503210', 'me@example.com', 'wa.me/79991234567', 't.me/someone']) {
      expect(normalizeInquiry({ ...valid, contact }).status).toBe('ok')
    }
  })

  it('truncates an over-long message instead of rejecting it', () => {
    const res = normalizeInquiry({ ...valid, message: 'x'.repeat(INQUIRY_LIMITS.message + 500) })
    expect(res.status).toBe('ok')
    if (res.status === 'ok')
      expect(res.value.message).toHaveLength(INQUIRY_LIMITS.message)
  })

  it('requires consent to be a literal true', () => {
    for (const consent of ['true', 'on', 1, {}, undefined, false, null]) {
      expect(normalizeInquiry({ ...valid, consent }).status).toBe('invalid')
    }
    expect(normalizeInquiry({ ...valid, consent: true }).status).toBe('ok')
  })

  it('strips control characters rather than failing', () => {
    const nul = String.fromCharCode(0)
    const bell = String.fromCharCode(7)
    const res = normalizeInquiry({ ...valid, name: `An${nul}na${bell}` })
    expect(res.status).toBe('ok')
    if (res.status === 'ok')
      expect(res.value.name).toBe('An na')
  })

  it('keeps paragraph breaks in the message but collapses runs of them', () => {
    const res = normalizeInquiry({ ...valid, message: 'One\r\n\r\n\r\n\r\nTwo' })
    expect(res.status).toBe('ok')
    if (res.status === 'ok')
      expect(res.value.message).toBe('One\n\nTwo')
  })

  it('drops a page value that is not a site-relative path', () => {
    for (const page of ['https://evil.example', 'services', '', undefined]) {
      const res = normalizeInquiry({ ...valid, page })
      expect(res.status).toBe('ok')
      if (res.status === 'ok')
        expect(res.value.page).toBe('')
    }
  })

  it('ignores non-string field values instead of throwing', () => {
    expect(normalizeInquiry({ ...valid, name: 42 }).status).toBe('invalid')
    const res = normalizeInquiry({ ...valid, message: { nope: true } })
    expect(res.status).toBe('ok')
    if (res.status === 'ok')
      expect(res.value.message).toBe('')
  })
})
