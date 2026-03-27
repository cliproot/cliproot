import type { CrpBundle } from '@cliproot/protocol/types'

/**
 * Extract a CRP bundle from an HTML string by reading the hidden
 * `<div data-crp-bundle="...">` element written by the extension.
 *
 * Performs a lightweight structural check rather than full AJV schema
 * validation, so this function is safe to use in contexts where CSP
 * forbids `unsafe-eval` (e.g. extension content scripts).
 */
export function parseBundleFromHtml(html: string): CrpBundle | null {
  try {
    // Try DOMParser first — it handles entity decoding automatically and
    // works reliably when the Async Clipboard API returns DOM-parsed HTML
    // where &quot; has already been resolved to literal " characters.
    let bundleJson: string | null = null

    if (typeof DOMParser !== 'undefined') {
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const el = doc.querySelector('[data-crp-bundle]')
      bundleJson = el?.getAttribute('data-crp-bundle') ?? null
    }

    // Regex fallback for environments without DOMParser (e.g. Node/tests).
    // Only works when attribute entities are still encoded (raw HTML).
    if (!bundleJson) {
      const match = html.match(/data-crp-bundle="([^"]*)"/)
      if (!match) return null
      bundleJson = (match[1] ?? '')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
    }

    const parsed = JSON.parse(bundleJson)

    // Lightweight structural check — the data was written by our own
    // extension so full schema validation is unnecessary, and AJV's
    // compiled validators use `new Function()` which is blocked by CSP
    // in extension content scripts.
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.protocolVersion === 'string' &&
      Array.isArray(parsed.clips)
    ) {
      return parsed as CrpBundle
    }

    return null
  } catch {
    return null
  }
}
