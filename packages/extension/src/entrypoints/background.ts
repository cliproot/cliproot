export default defineBackground(() => {
  // Initialize default state
  chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ enabled: true })
    updateBadge(true)
  })

  // Sync badge with storage state
  chrome.storage.local.get('enabled', (result: Record<string, unknown>) => {
    updateBadge(result.enabled !== false)
  })

  chrome.storage.onChanged.addListener((changes: Record<string, chrome.storage.StorageChange>) => {
    if (changes.enabled) {
      updateBadge(changes.enabled.newValue !== false)
    }
  })
})

function updateBadge(enabled: boolean) {
  const color = enabled ? '#22c55e' : '#9ca3af' // green active, gray inactive
  const text = enabled ? 'ON' : 'OFF'

  chrome.action.setBadgeBackgroundColor({ color })
  chrome.action.setBadgeText({ text })
}
