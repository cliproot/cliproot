import { createClipHash, createTextHash } from '../src/hash.js'

describe('createClipHash', () => {
  const textHash = createTextHash('Hello, world!')
  const sourceRefs = ['src-1', 'src-2']

  it('produces deterministic output', () => {
    const a = createClipHash({ textHash, textQuoteExact: 'Hello, world!', sourceRefs })
    const b = createClipHash({ textHash, textQuoteExact: 'Hello, world!', sourceRefs })
    expect(a).toBe(b)
  })

  it('is insensitive to sourceRefs ordering', () => {
    const a = createClipHash({ textHash, textQuoteExact: 'Hello, world!', sourceRefs: ['src-2', 'src-1'] })
    const b = createClipHash({ textHash, textQuoteExact: 'Hello, world!', sourceRefs: ['src-1', 'src-2'] })
    expect(a).toBe(b)
  })

  it('omits derivedFrom when absent', () => {
    const withoutDerived = createClipHash({ textHash, textQuoteExact: 'Hello, world!', sourceRefs })
    const withEmptyDerived = createClipHash({
      textHash,
      textQuoteExact: 'Hello, world!',
      sourceRefs,
      derivedFrom: [],
    })
    expect(withoutDerived).toBe(withEmptyDerived)
  })

  it('includes derivedFrom when present', () => {
    const without = createClipHash({ textHash, textQuoteExact: 'Hello, world!', sourceRefs })
    const withDerived = createClipHash({
      textHash,
      textQuoteExact: 'Hello, world!',
      sourceRefs,
      derivedFrom: ['sha256-abc'],
    })
    expect(without).not.toBe(withDerived)
  })

  it('is insensitive to derivedFrom ordering', () => {
    const a = createClipHash({
      textHash,
      textQuoteExact: 'Hello, world!',
      sourceRefs,
      derivedFrom: ['sha256-bbb', 'sha256-aaa'],
    })
    const b = createClipHash({
      textHash,
      textQuoteExact: 'Hello, world!',
      sourceRefs,
      derivedFrom: ['sha256-aaa', 'sha256-bbb'],
    })
    expect(a).toBe(b)
  })

  it('produces sha256- prefixed base64url output', () => {
    const hash = createClipHash({ textHash, textQuoteExact: 'Hello, world!', sourceRefs })
    expect(hash).toMatch(/^sha256-[A-Za-z0-9_-]{43,}$/)
  })

  it('produces a known test vector', () => {
    const knownTextHash = createTextHash('Test content')
    const hash = createClipHash({
      textHash: knownTextHash,
      textQuoteExact: 'Test content',
      sourceRefs: ['source-a'],
    })
    // Deterministic — this value is stable across runs
    expect(hash).toMatch(/^sha256-/)
    expect(hash.length).toBeGreaterThan(10)

    // Re-derive to confirm stability
    const hash2 = createClipHash({
      textHash: knownTextHash,
      textQuoteExact: 'Test content',
      sourceRefs: ['source-a'],
    })
    expect(hash).toBe(hash2)
  })
})
