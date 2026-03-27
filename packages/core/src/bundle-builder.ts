import { createTextHash, createClipHash, toBase64Url } from '@cliproot/protocol/hash'
import { CRP_PROTOCOL_VERSION } from '@cliproot/protocol/schema-meta'
import { sha256 } from '@noble/hashes/sha2.js'
import { utf8ToBytes } from '@noble/hashes/utils.js'
import type { CrpBundle } from '@cliproot/protocol/types'
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

  const clipHash = createClipHash({
    textHash,
    textQuoteExact: captured.textQuote.exact,
    sourceRefs: [sourceId]
  })

  const now = new Date().toISOString()

  // Build selectors
  const selectors: Record<string, unknown> = {
    textQuote: captured.textQuote
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
    selectors
  }

  // Build derivationEdges at bundle level instead of clip-level derivedFrom
  let derivationEdges: Record<string, unknown>[] | undefined
  if (derivedFromClipHashes && derivedFromClipHashes.length > 0) {
    derivationEdges = derivedFromClipHashes.map((parentHash, i) => ({
      id: `edge-${i}`,
      childClipHash: clipHash,
      parentClipHash: parentHash,
      transformationType: 'verbatim',
      createdAt: now
    }))
  }

  // Build document
  const document: Record<string, unknown> = {
    id: documentId,
    uri: documentInfo.uri
  }
  if (documentInfo.title) {
    document.title = documentInfo.title
  }

  const bundle: CrpBundle = {
    protocolVersion: CRP_PROTOCOL_VERSION as '0.0.2',
    bundleType: 'clipboard',
    createdAt: now,
    document,
    sources: [
      {
        id: sourceId,
        sourceType: 'unknown',
        sourceUri: documentInfo.uri,
        ...(documentInfo.title ? { title: documentInfo.title } : {})
      }
    ],
    clips: [clip],
    ...(derivationEdges ? { derivationEdges } : {})
  } as CrpBundle

  return bundle
}
