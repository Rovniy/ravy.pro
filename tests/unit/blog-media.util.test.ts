import { describe, expect, it } from 'vitest'
import {
  ALLOWED_IMAGE_TYPES,
  extensionForType,
  isSafeMediaPath,
  mediaObjectName,
  mediaUrl,
  SANDBOXED_TYPES,
  typeForExtension,
} from '~~/utils/blog-media'

describe('upload types', () => {
  it('maps the types the panel may upload', () => {
    expect(extensionForType('image/webp')).toBe('webp')
    expect(extensionForType('image/jpeg; charset=binary')).toBe('jpg')
    expect(extensionForType('IMAGE/PNG')).toBe('png')
  })

  // A same-origin SVG can run script, so it must never be uploadable — only the
  // two files the archive already carried are served, and those are sandboxed.
  it('refuses svg and pdf uploads', () => {
    expect(extensionForType('image/svg+xml')).toBeNull()
    expect(extensionForType('application/pdf')).toBeNull()
    expect('image/svg+xml' in ALLOWED_IMAGE_TYPES).toBe(false)
  })

  it('serves svg and pdf, but marks both as needing a locked policy', () => {
    expect(typeForExtension('a/b.svg')).toBe('image/svg+xml')
    expect(typeForExtension('a/b.pdf')).toBe('application/pdf')
    expect(SANDBOXED_TYPES.has('image/svg+xml')).toBe(true)
    expect(SANDBOXED_TYPES.has('application/pdf')).toBe(true)
    expect(SANDBOXED_TYPES.has('image/webp')).toBe(false)
  })

  it('has no type for an unknown extension', () => {
    expect(typeForExtension('a/b.exe')).toBeNull()
    expect(typeForExtension('noextension')).toBeNull()
  })
})

describe('isSafeMediaPath', () => {
  it('accepts a slug folder and one filename', () => {
    expect(isSafeMediaPath('a-post/cover-abc123.webp')).toBe(true)
    expect(isSafeMediaPath('legacy/tiny_boo_presentation-0a1b2c3d4e.pdf')).toBe(true)
  })

  it('rejects traversal, absolute paths and extra depth', () => {
    for (const bad of [
      '../secret.webp',
      'a-post/../../etc/passwd',
      '/a-post/x.webp',
      'a-post//x.webp',
      'a-post/nested/x.webp',
      'a-post',
      '',
    ]) {
      expect(isSafeMediaPath(bad), bad).toBe(false)
    }
  })
})

describe('media paths', () => {
  it('prefixes objects and urls consistently', () => {
    expect(mediaObjectName('a-post/x.webp')).toBe('blog/a-post/x.webp')
    expect(mediaUrl('a-post/x.webp')).toBe('/media/blog/a-post/x.webp')
  })
})
