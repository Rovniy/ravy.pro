// Test-only credit card generator and validator.
// Numbers produced here pass the Luhn check but are not issued by any bank —
// they are intended for QA, sandbox payment gateways, and form testing.

export type CardBrand
  = | 'visa'
    | 'mastercard'
    | 'amex'
    | 'discover'
    | 'jcb'
    | 'diners'
    | 'unionpay'

export interface BrandSpec {
  brand: CardBrand
  label: string
  prefixes: string[]
  lengths: number[]
  cvvLength: number
  defaultLength: number
}

export const BRAND_SPECS: BrandSpec[] = [
  {
    brand: 'visa',
    label: 'Visa',
    prefixes: ['4'],
    lengths: [16],
    cvvLength: 3,
    defaultLength: 16,
  },
  {
    brand: 'mastercard',
    label: 'MasterCard',
    prefixes: ['51', '52', '53', '54', '55', '2221', '2222', '2223', '2224', '2225', '2226', '2227', '2228', '2229', '223', '224', '225', '226', '227', '228', '229', '23', '24', '25', '26', '270', '271', '2720'],
    lengths: [16],
    cvvLength: 3,
    defaultLength: 16,
  },
  {
    brand: 'amex',
    label: 'American Express',
    prefixes: ['34', '37'],
    lengths: [15],
    cvvLength: 4,
    defaultLength: 15,
  },
  {
    brand: 'discover',
    label: 'Discover',
    prefixes: ['6011', '644', '645', '646', '647', '648', '649', '65'],
    lengths: [16],
    cvvLength: 3,
    defaultLength: 16,
  },
  {
    brand: 'jcb',
    label: 'JCB',
    prefixes: ['3528', '3529', '353', '354', '355', '356', '357', '358'],
    lengths: [16],
    cvvLength: 3,
    defaultLength: 16,
  },
  {
    brand: 'diners',
    label: 'Diners Club',
    prefixes: ['300', '301', '302', '303', '304', '305', '3095', '36', '38', '39'],
    lengths: [14],
    cvvLength: 3,
    defaultLength: 14,
  },
  {
    brand: 'unionpay',
    label: 'UnionPay',
    prefixes: ['62', '81'],
    lengths: [16, 17, 18, 19],
    cvvLength: 3,
    defaultLength: 16,
  },
]

const BRAND_BY_ID: Record<CardBrand, BrandSpec> = BRAND_SPECS.reduce(
  (acc, spec) => {
    acc[spec.brand] = spec
    return acc
  },
  {} as Record<CardBrand, BrandSpec>,
)

export function getBrandSpec(brand: CardBrand): BrandSpec {
  return BRAND_BY_ID[brand]
}

export function normalizeCardNumber(value: string): string {
  return value.replace(/\D+/g, '')
}

export function luhnCheck(value: string): boolean {
  const digits = normalizeCardNumber(value)
  if (digits.length < 12 || digits.length > 19)
    return false
  let sum = 0
  let alt = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i])
    if (alt) {
      n *= 2
      if (n > 9)
        n -= 9
    }
    sum += n
    alt = !alt
  }
  return sum % 10 === 0
}

export function luhnCheckDigit(partial: string): string {
  const digits = normalizeCardNumber(partial)
  let sum = 0
  // We append one digit on the right, so the existing rightmost digit will
  // sit at "alt = true" position. Walk left from there.
  let alt = true
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i])
    if (alt) {
      n *= 2
      if (n > 9)
        n -= 9
    }
    sum += n
    alt = !alt
  }
  return String((10 - (sum % 10)) % 10)
}

export function detectBrand(value: string): CardBrand | null {
  const digits = normalizeCardNumber(value)
  if (!digits)
    return null
  let best: { brand: CardBrand, length: number } | null = null
  for (const spec of BRAND_SPECS) {
    for (const prefix of spec.prefixes) {
      if (digits.startsWith(prefix)) {
        if (!best || prefix.length > best.length)
          best = { brand: spec.brand, length: prefix.length }
      }
    }
  }
  return best?.brand ?? null
}

export interface FormattedCard {
  groups: number[]
  display: string
}

export function formatCardNumber(value: string, brand?: CardBrand | null): string {
  const digits = normalizeCardNumber(value)
  if (!digits)
    return ''
  const groups = groupSizesFor(brand ?? detectBrand(digits), digits.length)
  const parts: string[] = []
  let cursor = 0
  for (const size of groups) {
    if (cursor >= digits.length)
      break
    parts.push(digits.slice(cursor, cursor + size))
    cursor += size
  }
  if (cursor < digits.length)
    parts.push(digits.slice(cursor))
  return parts.join(' ')
}

function groupSizesFor(brand: CardBrand | null, length: number): number[] {
  if (brand === 'amex')
    return [4, 6, 5]
  if (brand === 'diners' && length === 14)
    return [4, 6, 4]
  // Fallback: groups of 4 covering the typical 16/19 layouts.
  const sizes: number[] = []
  let remaining = length
  while (remaining > 0) {
    sizes.push(Math.min(4, remaining))
    remaining -= 4
  }
  return sizes
}

function randomInt(max: number): number {
  if (max <= 0)
    return 0
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const buf = new Uint32Array(1)
    globalThis.crypto.getRandomValues(buf)
    return buf[0]! % max
  }
  return Math.floor(Math.random() * max)
}

function randomDigits(length: number): string {
  let out = ''
  for (let i = 0; i < length; i++)
    out += String(randomInt(10))
  return out
}

function pickFrom<T>(items: readonly T[]): T {
  return items[randomInt(items.length)]!
}

export interface GenerateOptions {
  brand: CardBrand
  prefix?: string // optional BIN prefix that overrides the brand's default
  length?: number // optional length within the brand's allowed lengths
}

export interface GeneratedCard {
  brand: CardBrand
  number: string
  formatted: string
  expiry: string // MM/YY
  cvv: string
  holder: string
}

export function generateCardNumber(opts: GenerateOptions): string {
  const spec = getBrandSpec(opts.brand)
  const length = opts.length && spec.lengths.includes(opts.length)
    ? opts.length
    : spec.defaultLength
  const prefix = opts.prefix?.trim()
    ? normalizeCardNumber(opts.prefix)
    : pickFrom(spec.prefixes)
  // If a custom prefix is given but doesn't match the brand's prefixes, we
  // still respect it — callers may want to test a specific BIN range.
  const bodyLength = length - prefix.length - 1
  if (bodyLength < 0)
    throw new Error('Prefix is longer than the target card length')
  const partial = prefix + randomDigits(bodyLength)
  return partial + luhnCheckDigit(partial)
}

const FIRST_NAMES = [
  'ALEX',
  'JORDAN',
  'TAYLOR',
  'CASEY',
  'MORGAN',
  'RILEY',
  'JAMIE',
  'AVERY',
  'PARKER',
  'QUINN',
  'REESE',
  'ROWAN',
  'SAM',
  'SKYLER',
  'CHARLIE',
  'EMERSON',
]
const LAST_NAMES = [
  'CARTER',
  'BENNETT',
  'HAYES',
  'MORALES',
  'SULLIVAN',
  'FOSTER',
  'GRAHAM',
  'HOLLAND',
  'KENNEDY',
  'LOPEZ',
  'MITCHELL',
  'NGUYEN',
  'PATEL',
  'ROBERTS',
  'SHARMA',
  'TANAKA',
]

function generateHolder(): string {
  return `${pickFrom(FIRST_NAMES)} ${pickFrom(LAST_NAMES)}`
}

function generateExpiry(now: Date = new Date()): string {
  const yearsAhead = 1 + randomInt(5) // 1..5 years from now
  const month = 1 + randomInt(12)
  const year = (now.getFullYear() + yearsAhead) % 100
  return `${String(month).padStart(2, '0')}/${String(year).padStart(2, '0')}`
}

export function generateCard(opts: GenerateOptions, now: Date = new Date()): GeneratedCard {
  const spec = getBrandSpec(opts.brand)
  const number = generateCardNumber(opts)
  return {
    brand: opts.brand,
    number,
    formatted: formatCardNumber(number, opts.brand),
    expiry: generateExpiry(now),
    cvv: randomDigits(spec.cvvLength),
    holder: generateHolder(),
  }
}

export interface ValidationResult {
  input: string
  digits: string
  brand: CardBrand | null
  brandLabel: string | null
  luhnValid: boolean
  lengthValid: boolean
  formatted: string
  cvvLength: number | null
}

export function validateCardNumber(input: string): ValidationResult {
  const digits = normalizeCardNumber(input)
  const brand = detectBrand(digits)
  const spec = brand ? getBrandSpec(brand) : null
  const lengthValid = !!spec && spec.lengths.includes(digits.length)
  return {
    input,
    digits,
    brand,
    brandLabel: spec?.label ?? null,
    luhnValid: digits.length >= 12 && luhnCheck(digits),
    lengthValid,
    formatted: formatCardNumber(digits, brand),
    cvvLength: spec?.cvvLength ?? null,
  }
}
