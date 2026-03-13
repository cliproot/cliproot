import { buildClipboardBundle } from '../src/bundle-builder.js'
import { validateBundle } from '@cliproot/protocol'
import type { CapturedSelection, DocumentInfo } from '../src/types.js'

describe('buildClipboardBundle', () => {
  const captured: CapturedSelection = {
    text: 'Hello, world!',
    textQuote: {
      exact: 'Hello, world!',
      prefix: 'prefix text ',
      suffix: ' suffix text',
    },
    textPosition: {
      start: 12,
      end: 25,
    },
    domSelector: {
      elementId: 'main-content',
    },
  }

  const documentInfo: DocumentInfo = {
    uri: 'https://example.com/article',
    title: 'Test Article',
  }

  it('produces a valid CRP bundle', () => {
    const bundle = buildClipboardBundle({ captured, documentInfo })
    const result = validateBundle(bundle)
    expect(result.ok).toBe(true)
  })

  it('sets bundleType to clipboard', () => {
    const bundle = buildClipboardBundle({ captured, documentInfo })
    expect(bundle.bundleType).toBe('clipboard')
  })

  it('includes document info', () => {
    const bundle = buildClipboardBundle({ captured, documentInfo })
    expect(bundle.document).toBeDefined()
    expect((bundle.document as Record<string, unknown>).uri).toBe('https://example.com/article')
    expect((bundle.document as Record<string, unknown>).title).toBe('Test Article')
  })

  it('includes clip with textQuote selector', () => {
    const bundle = buildClipboardBundle({ captured, documentInfo })
    expect(bundle.clips).toHaveLength(1)
    const clip = (bundle.clips as Record<string, unknown>[])[0]!
    expect(clip.clipHash).toMatch(/^sha256-/)
    expect(clip.textHash).toMatch(/^sha256-/)
    const selectors = clip.selectors as Record<string, unknown>
    expect(selectors.textQuote).toEqual({
      exact: 'Hello, world!',
      prefix: 'prefix text ',
      suffix: ' suffix text',
    })
  })

  it('includes derivedFrom when provided', () => {
    const bundle = buildClipboardBundle({
      captured,
      documentInfo,
      derivedFromClipHashes: ['sha256-abc123'],
    })
    const clip = (bundle.clips as Record<string, unknown>[])[0]!
    expect(clip.derivedFrom).toEqual([{ clipHash: 'sha256-abc123' }])
  })

  it('omits derivedFrom when not provided', () => {
    const bundle = buildClipboardBundle({ captured, documentInfo })
    const clip = (bundle.clips as Record<string, unknown>[])[0]!
    expect(clip.derivedFrom).toBeUndefined()
  })

  it('produces valid bundle without optional fields', () => {
    const minimal: CapturedSelection = {
      text: 'test',
      textQuote: { exact: 'test' },
    }
    const bundle = buildClipboardBundle({
      captured: minimal,
      documentInfo: { uri: 'https://example.com' },
    })
    const result = validateBundle(bundle)
    expect(result.ok).toBe(true)
  })
})
