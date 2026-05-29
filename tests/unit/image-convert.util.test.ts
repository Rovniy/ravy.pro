import { describe, expect, it } from 'vitest'
import {
  buildOutputName,
  formatBytes,
  FORMATS,
  getFormat,
  isSupportedInput,
  savingsPercent,
} from '../../utils/image-convert'

describe('fORMATS registry', () => {
  it('has exactly the three supported formats with unique ids', () => {
    expect(FORMATS).toHaveLength(3)
    const ids = FORMATS.map(f => f.id)
    expect(new Set(ids)).toEqual(new Set(['png', 'jpeg', 'webp']))
  })

  it('maps mime, extension, and lossiness correctly', () => {
    expect(getFormat('png')).toMatchObject({ mime: 'image/png', extension: 'png', lossy: false })
    expect(getFormat('jpeg')).toMatchObject({ mime: 'image/jpeg', extension: 'jpg', lossy: true })
    expect(getFormat('webp')).toMatchObject({ mime: 'image/webp', extension: 'webp', lossy: true })
  })

  it('every entry has a non-empty extension and label', () => {
    for (const f of FORMATS) {
      expect(f.extension).toBeTruthy()
      expect(f.label).toBeTruthy()
    }
  })
})

describe('isSupportedInput', () => {
  it('accepts png, jpeg, and webp by MIME', () => {
    expect(isSupportedInput({ type: 'image/png', name: 'a.png' })).toBe(true)
    expect(isSupportedInput({ type: 'image/jpeg', name: 'a.jpg' })).toBe(true)
    expect(isSupportedInput({ type: 'image/webp', name: 'a.webp' })).toBe(true)
  })

  it('falls back to extension when type is empty', () => {
    expect(isSupportedInput({ type: '', name: 'photo.WEBP' })).toBe(true)
    expect(isSupportedInput({ type: '', name: 'photo.JPEG' })).toBe(true)
  })

  it('rejects gif, pdf, and unknown types', () => {
    expect(isSupportedInput({ type: 'image/gif', name: 'a.gif' })).toBe(false)
    expect(isSupportedInput({ type: 'application/pdf', name: 'a.pdf' })).toBe(false)
    expect(isSupportedInput({ type: '', name: 'a.txt' })).toBe(false)
    expect(isSupportedInput({ type: '', name: 'noext' })).toBe(false)
  })
})

describe('buildOutputName', () => {
  it('appends an extension when there is none', () => {
    expect(buildOutputName('photo', 'png')).toBe('photo.png')
  })

  it('replaces an uppercase extension', () => {
    expect(buildOutputName('IMG.JPEG', 'png')).toBe('IMG.png')
  })

  it('only strips the final segment with multiple dots', () => {
    expect(buildOutputName('my.photo.final.png', 'webp')).toBe('my.photo.final.webp')
  })

  it('treats a leading dot as part of the name (dotfile)', () => {
    expect(buildOutputName('.gitignore', 'png')).toBe('.gitignore.png')
  })

  it('falls back to a default name when empty', () => {
    expect(buildOutputName('', 'webp')).toBe('image.webp')
    expect(buildOutputName('   ', 'webp')).toBe('image.webp')
  })
})

describe('formatBytes', () => {
  it('handles zero and invalid input', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(-5)).toBe('0 B')
    expect(formatBytes(Number.NaN)).toBe('0 B')
  })

  it('formats bytes, KB, MB, GB', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(1048576)).toBe('1.0 MB')
    expect(formatBytes(1073741824)).toBe('1.0 GB')
  })
})

describe('savingsPercent', () => {
  it('returns a positive percent when output is smaller', () => {
    expect(savingsPercent(1000, 600)).toBe(40)
  })

  it('returns a negative percent when output is larger', () => {
    expect(savingsPercent(100, 150)).toBe(-50)
  })

  it('returns 0 for equal sizes', () => {
    expect(savingsPercent(100, 100)).toBe(0)
  })

  it('guards against a zero original size', () => {
    expect(savingsPercent(0, 10)).toBe(0)
  })
})
