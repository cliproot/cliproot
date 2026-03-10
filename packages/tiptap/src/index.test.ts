import { describe, it, expect } from 'vitest'
import { AttributionExtension, clipboardPluginKey } from './index.js'

describe('AttributionExtension', () => {
    it('has the correct name', () => {
        expect(AttributionExtension.name).toBe('attribution')
    })

    it('can be configured with options', () => {
        const extension = AttributionExtension.configure({
            onReuseDetected: () => { }
        })
        expect(extension.options.onReuseDetected).toBeDefined()
    })
})

describe('Clipboard Plugin', () => {
    it('has a plugin key', () => {
        expect(clipboardPluginKey.key).toBe('attributionClipboard$')
    })
})
