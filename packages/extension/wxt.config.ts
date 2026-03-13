import { defineConfig } from 'wxt'

export default defineConfig({
  srcDir: 'src',
  manifest: {
    name: 'ClipRoot',
    description: 'Capture clipboard provenance with the ClipRoot Protocol',
    permissions: ['clipboardWrite', 'activeTab', 'storage'],
    host_permissions: ['<all_urls>'],
  },
})
