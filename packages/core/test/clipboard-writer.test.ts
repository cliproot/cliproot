import { writeProvenanceToClipboard } from '../src/clipboard-writer.js'
import type { CrpBundle } from '@cliproot/protocol'

function createMockDataTransfer(): DataTransfer {
  const data = new Map<string, string>()
  return {
    getData(type: string) {
      return data.get(type) ?? ''
    },
    setData(type: string, value: string) {
      data.set(type, value)
    },
  } as unknown as DataTransfer
}

const mockBundle: CrpBundle = {
  protocolVersion: '0.0.1',
  bundleType: 'clipboard',
  createdAt: '2026-01-01T00:00:00.000Z',
  clips: [
    {
      clipHash: 'sha256-test',
      textHash: 'sha256-test',
      sourceRefs: ['src-1'],
      selectors: { textQuote: { exact: 'test' } },
    },
  ],
  sources: [{ id: 'src-1', sourceType: 'unknown' }],
} as CrpBundle

describe('writeProvenanceToClipboard', () => {
  it('appends provenance div to existing HTML', () => {
    const dt = createMockDataTransfer()
    dt.setData('text/html', '<b>Hello</b>')
    dt.setData('text/plain', 'Hello')

    writeProvenanceToClipboard(mockBundle, dt)

    const html = dt.getData('text/html')
    expect(html).toContain('<b>Hello</b>')
    expect(html).toContain('data-crp-bundle=')
    expect(html).toContain('display:none')
  })

  it('wraps plain text in span when no HTML exists', () => {
    const dt = createMockDataTransfer()
    dt.setData('text/plain', 'Hello')

    writeProvenanceToClipboard(mockBundle, dt)

    const html = dt.getData('text/html')
    expect(html).toContain('<span>Hello</span>')
    expect(html).toContain('data-crp-bundle=')
  })

  it('bundle JSON is parseable from the data-crp-bundle attribute', () => {
    const dt = createMockDataTransfer()
    dt.setData('text/plain', 'Hello')

    writeProvenanceToClipboard(mockBundle, dt)

    const html = dt.getData('text/html')
    const match = html.match(/data-crp-bundle="([^"]*)"/)
    expect(match).not.toBeNull()

    // Unescape the attribute value
    const escaped = match![1]!
    const unescaped = escaped
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
    const parsed = JSON.parse(unescaped)
    expect(parsed.bundleType).toBe('clipboard')
    expect(parsed.protocolVersion).toBe('0.0.1')
  })

  it('does nothing when skipHtml is true', () => {
    const dt = createMockDataTransfer()
    dt.setData('text/plain', 'Hello')

    writeProvenanceToClipboard(mockBundle, dt, { skipHtml: true })

    expect(dt.getData('text/html')).toBe('')
  })

  it('does not modify text/plain', () => {
    const dt = createMockDataTransfer()
    dt.setData('text/plain', 'original text')

    writeProvenanceToClipboard(mockBundle, dt)

    expect(dt.getData('text/plain')).toBe('original text')
  })
})
