/**
 * Build a DOM selector for the common ancestor of a Range.
 * Prefers element IDs, falls back to a basic CSS selector.
 */
export function buildDomSelector(range: Range): { elementId?: string; cssSelector?: string } {
  let container: Node | null = range.commonAncestorContainer
  // Walk up to nearest Element
  if (container.nodeType !== Node.ELEMENT_NODE) {
    container = container.parentElement
  }

  if (!container || !(container instanceof Element)) {
    return {}
  }

  if (container.id) {
    return { elementId: container.id }
  }

  return { cssSelector: buildCssSelector(container) }
}

function buildCssSelector(el: Element): string {
  const parts: string[] = []
  let current: Element | null = el

  while (current && current !== current.ownerDocument?.body) {
    let selector = current.tagName.toLowerCase()

    if (current.id) {
      parts.unshift(`#${current.id}`)
      break
    }

    const parentEl: Element | null = current.parentElement
    if (parentEl) {
      const tag = current.tagName
      const siblings = Array.from(parentEl.children).filter(
        (c: Element) => c.tagName === tag
      )
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1
        selector += `:nth-of-type(${index})`
      }
    }

    parts.unshift(selector)
    current = parentEl
  }

  return parts.join(' > ')
}
