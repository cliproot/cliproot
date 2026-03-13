import { sha256 } from '@noble/hashes/sha2.js'
import { utf8ToBytes } from '@noble/hashes/utils.js'
import canonicalizeModule from 'canonicalize'
// canonicalize is CJS; under NodeNext the default export wraps the module
const canonicalize = canonicalizeModule as unknown as (input: unknown) => string | undefined

export function toBase64Url(input: Uint8Array): string {
  const maybeBuffer = (
    globalThis as {
      Buffer?: {
        from(data: Uint8Array): { toString(encoding: 'base64'): string }
      }
    }
  ).Buffer

  if (maybeBuffer) {
    return maybeBuffer
      .from(input)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '')
  }

  const maybeBtoa = (globalThis as { btoa?: (value: string) => string }).btoa
  if (!maybeBtoa) {
    throw new Error('No base64 encoder is available in this runtime.')
  }

  let binary = ''
  for (const byte of input) {
    binary += String.fromCharCode(byte)
  }

  return maybeBtoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function normalizeForHash(text: string): string {
  return text.normalize('NFC').replace(/\r\n?/g, '\n')
}

export function createTextHash(text: string): `sha256-${string}` {
  const normalized = normalizeForHash(text)
  const digest = sha256(utf8ToBytes(normalized))
  return `sha256-${toBase64Url(digest)}`
}

export function createClipHash(input: {
  textHash: `sha256-${string}`
  textQuoteExact: string
  sourceRefs: string[]
  derivedFrom?: string[]
}): `sha256-${string}` {
  const canonical: Record<string, unknown> = {
    textHash: input.textHash,
    textQuoteExact: input.textQuoteExact,
    sourceRefs: [...input.sourceRefs].sort(),
  }
  if (input.derivedFrom && input.derivedFrom.length > 0) {
    canonical.derivedFrom = [...input.derivedFrom].sort()
  }
  const jcsString = canonicalize(canonical)
  if (jcsString === undefined) throw new Error('JCS canonicalization failed')
  const bytes = utf8ToBytes(jcsString)
  const digest = sha256(bytes)
  return `sha256-${toBase64Url(digest)}`
}
