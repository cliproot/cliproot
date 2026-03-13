import type { CapturedSelection } from './types.js'
import { buildDomSelector } from './dom-selector.js'

const CONTEXT_CHARS = 32

/**
 * Capture a browser Selection into a CapturedSelection with text quote,
 * text position, and DOM selector information.
 */
export function captureSelection(selection: Selection, doc: Document): CapturedSelection | null {
  if (selection.rangeCount === 0 || selection.isCollapsed) {
    return null
  }

  const range = selection.getRangeAt(0)!
  const exact = selection.toString()

  if (!exact) {
    return null
  }

  // Text position: character offsets relative to <body>
  const textPosition = computeTextPosition(range, doc.body)

  // Text quote: extract prefix/suffix context
  const textQuote = computeTextQuote(exact, textPosition, doc.body)

  // DOM selector
  const domSelector = buildDomSelector(range)

  const result: CapturedSelection = {
    text: exact,
    textQuote,
  }

  if (textPosition) {
    result.textPosition = textPosition
  }

  if (domSelector.elementId || domSelector.cssSelector) {
    result.domSelector = domSelector
  }

  return result
}

function computeTextPosition(
  range: Range,
  root: Node
): { start: number; end: number } | undefined {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let charOffset = 0
  let start: number | undefined
  let end: number | undefined

  while (walker.nextNode()) {
    const node = walker.currentNode as Text
    const nodeLength = node.textContent?.length ?? 0

    if (node === range.startContainer) {
      start = charOffset + range.startOffset
    }

    if (node === range.endContainer) {
      end = charOffset + range.endOffset
      break
    }

    charOffset += nodeLength
  }

  if (start !== undefined && end !== undefined) {
    return { start, end }
  }
  return undefined
}

function computeTextQuote(
  exact: string,
  textPosition: { start: number; end: number } | undefined,
  root: Node
): { exact: string; prefix?: string; suffix?: string } {
  if (!textPosition) {
    return { exact }
  }

  const fullText = root.textContent ?? ''
  const prefixStart = Math.max(0, textPosition.start - CONTEXT_CHARS)
  const prefix = fullText.slice(prefixStart, textPosition.start)
  const suffix = fullText.slice(textPosition.end, textPosition.end + CONTEXT_CHARS)

  const quote: { exact: string; prefix?: string; suffix?: string } = { exact }
  if (prefix) quote.prefix = prefix
  if (suffix) quote.suffix = suffix

  return quote
}
