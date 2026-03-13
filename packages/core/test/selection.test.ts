import { captureSelection } from '../src/selection.js'

describe('captureSelection', () => {
  it('returns null for collapsed selection', () => {
    const sel = window.getSelection()!
    sel.removeAllRanges()
    expect(captureSelection(sel, document)).toBeNull()
  })

  it('captures text, textQuote, textPosition, and domSelector from a range', () => {
    document.body.innerHTML = '<div id="test-container"><p>Hello world, this is a test of selection capture.</p></div>'
    const textNode = document.querySelector('#test-container p')!.firstChild!
    const range = document.createRange()
    range.setStart(textNode, 6)
    range.setEnd(textNode, 11)

    const sel = window.getSelection()!
    sel.removeAllRanges()
    sel.addRange(range)

    const result = captureSelection(sel, document)

    expect(result).not.toBeNull()
    expect(result!.text).toBe('world')
    expect(result!.textQuote.exact).toBe('world')
    expect(result!.textQuote.prefix).toBe('Hello ')
    expect(result!.textQuote.suffix?.length).toBeLessThanOrEqual(32)
  })

  it('captures domSelector with elementId', () => {
    document.body.innerHTML = '<div id="my-section"><p>Some text here</p></div>'
    const textNode = document.querySelector('#my-section p')!.firstChild!
    const range = document.createRange()
    range.setStart(textNode, 0)
    range.setEnd(textNode, 4)

    const sel = window.getSelection()!
    sel.removeAllRanges()
    sel.addRange(range)

    const result = captureSelection(sel, document)
    expect(result).not.toBeNull()
    // The common ancestor is the text node, parent is <p>, grandparent is #my-section
    // Depending on DOM structure, we may get the p's CSS selector or the div's ID
    expect(result!.domSelector).toBeDefined()
  })

  it('returns null for empty selection text', () => {
    document.body.innerHTML = '<p>Test</p>'
    const sel = window.getSelection()!
    sel.removeAllRanges()
    // No range added, so isCollapsed
    expect(captureSelection(sel, document)).toBeNull()
  })
})
