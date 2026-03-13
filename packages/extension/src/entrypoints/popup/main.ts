const statusEl = document.getElementById('status')!
const toggleBtn = document.getElementById('toggle')!

function updateUI(enabled: boolean) {
  statusEl.textContent = enabled ? 'Provenance capture is active' : 'Provenance capture is paused'
  toggleBtn.textContent = enabled ? 'Disable' : 'Enable'
}

// Load initial state
chrome.storage.local.get('enabled', (result: Record<string, unknown>) => {
  updateUI(result.enabled !== false)
})

// Listen for changes
chrome.storage.onChanged.addListener((changes: Record<string, chrome.storage.StorageChange>) => {
  if (changes.enabled) {
    updateUI(changes.enabled.newValue !== false)
  }
})

// Toggle on click
toggleBtn.addEventListener('click', () => {
  chrome.storage.local.get('enabled', (result: Record<string, unknown>) => {
    const current = result.enabled !== false
    chrome.storage.local.set({ enabled: !current })
  })
})
