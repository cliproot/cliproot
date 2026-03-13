import {
  createTextHash,
  createClipHash,
  CRP_PROTOCOL_VERSION,
  toBase64Url,
} from '@cliproot/protocol'
import { sha256 } from '@noble/hashes/sha2.js'
import { utf8ToBytes } from '@noble/hashes/utils.js'
import type { CrpBundle } from '@cliproot/protocol'
import type { CapturedSelection, DocumentInfo } from './types.js'

function generateDocumentId(uri: string): string {
  const digest = sha256(utf8ToBytes(uri))
  const hash = toBase64Url(digest)
  // Use first 16 chars, replacing any characters not matching id pattern
  const safe = hash.slice(0, 16).replace(/[^A-Za-z0-9._:-]/g, '_')
  return `doc-${safe}`
}

/**
 * Build a CRP clipboard bundle from a captured selection and document info.
 */
export function buildClipboardBundle(params: {
  captured: CapturedSelection
  documentInfo: DocumentInfo
  derivedFromClipHashes?: string[]
}): CrpBundle {
  const { captured, documentInfo, derivedFromClipHashes } = params

  const documentId = generateDocumentId(documentInfo.uri)
  const sourceId = 'src-page'
  const textHash = createTextHash(captured.text)

  const clipHashInput: {
    textHash: `sha256-${string}`
    textQuoteExact: string
    sourceRefs: string[]
    derivedFrom?: string[]
  } = {
    textHash,
    textQuoteExact: captured.textQuote.exact,
    sourceRefs: [sourceId],
  }
  if (derivedFromClipHashes && derivedFromClipHashes.length > 0) {
    clipHashInput.derivedFrom = derivedFromClipHashes
  }
  const clipHash = createClipHash(clipHashInput)

  const now = new Date().toISOString()

  // Build selectors
  const selectors: Record<string, unknown> = {
    textQuote: captured.textQuote,
  }

  if (captured.textPosition) {
    selectors.textPosition = captured.textPosition
  }

  if (captured.domSelector) {
    selectors.dom = captured.domSelector
  }

  // Build clip
  const clip: Record<string, unknown> = {
    clipHash,
    textHash,
    sourceRefs: [sourceId],
    selectors,
  }

  if (derivedFromClipHashes && derivedFromClipHashes.length > 0) {
    clip.derivedFrom = derivedFromClipHashes.map((h) => ({ clipHash: h }))
  }

  // Build document
  const document: Record<string, unknown> = {
    id: documentId,
    uri: documentInfo.uri,
  }
  if (documentInfo.title) {
    document.title = documentInfo.title
  }

  const bundle: CrpBundle = {
    protocolVersion: CRP_PROTOCOL_VERSION as '0.0.1',
    bundleType: 'clipboard',
    createdAt: now,
    document,
    sources: [
      {
        id: sourceId,
        sourceType: 'unknown',
      },
    ],
    clips: [clip],
  } as CrpBundle

  return bundle
}
