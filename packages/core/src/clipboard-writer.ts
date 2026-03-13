import type { CrpBundle } from '@cliproot/protocol'
import type { ClipboardWriteOptions } from './types.js'
import { escapeAttr } from './html-utils.js'

/**
 * Write provenance data to clipboardData by augmenting the HTML content.
 *
 * Approach A: Appends a hidden div with data-crp-bundle attribute to the HTML.
 * Preserves any existing site-written HTML content.
 */
export function writeProvenanceToClipboard(
  bundle: CrpBundle,
  clipboardData: DataTransfer,
  options?: ClipboardWriteOptions
): void {
  if (options?.skipHtml) {
    return
  }

  const bundleJson = JSON.stringify(bundle)
  const provenanceHtml = `<div style="display:none" data-crp-bundle="${escapeAttr(bundleJson)}"></div>`

  // Get existing HTML or fall back to plain text wrapped in a span
  const existingHtml = clipboardData.getData('text/html')
  const plainText = clipboardData.getData('text/plain')

  let finalHtml: string
  if (existingHtml) {
    finalHtml = existingHtml + provenanceHtml
  } else if (plainText) {
    finalHtml = `<span>${escapeHtmlContent(plainText)}</span>${provenanceHtml}`
  } else {
    finalHtml = provenanceHtml
  }

  clipboardData.setData('text/html', finalHtml)
}

function escapeHtmlContent(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
