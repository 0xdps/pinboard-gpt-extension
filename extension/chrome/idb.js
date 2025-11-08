/**
 * Chrome Storage API wrapper
 * Uses chrome.storage.sync for automatic syncing across devices
 * Chrome extension specific - no cross-browser compatibility
 */

const STORAGE_KEY = 'pins';
const SETTINGS_KEY = 'settings';

// Chrome sync quota limits (for reference)
const SYNC_QUOTA_BYTES = 102400; // 100KB total
const SYNC_MAX_ITEMS = 512;

async function idbAdd(pin) {
  const result = await chrome.storage.sync.get([STORAGE_KEY]);
  const pins = result[STORAGE_KEY] || [];
  
  // Find and update existing pin or add new one
  const existingIndex = pins.findIndex(p => p.id === pin.id);
  if (existingIndex >= 0) {
    pins[existingIndex] = pin;
  } else {
    pins.push(pin);
  }
  
  await chrome.storage.sync.set({ [STORAGE_KEY]: pins });
  return pin;
}

async function idbGetAll() {
  const result = await chrome.storage.sync.get([STORAGE_KEY]);
  return result[STORAGE_KEY] || [];
}

async function idbDelete(id) {
  const result = await chrome.storage.sync.get([STORAGE_KEY]);
  const pins = result[STORAGE_KEY] || [];
  const filtered = pins.filter(p => p.id !== id);
  await chrome.storage.sync.set({ [STORAGE_KEY]: filtered });
}

async function idbClear() {
  await chrome.storage.sync.set({ [STORAGE_KEY]: [] });
}

// Get a single pin by ID
async function idbGet(id) {
  const pins = await idbGetAll();
  return pins.find(p => p.id === id) || null;
}

// Settings management using browser.storage.local (for non-synced preferences)
async function getSettings() {
  const result = await chrome.storage.local.get([SETTINGS_KEY]);
  return result[SETTINGS_KEY] || {
    theme: 'dark'
  };
}

async function updateSettings(newSettings) {
  const currentSettings = await getSettings();
  const updatedSettings = { ...currentSettings, ...newSettings };
  await chrome.storage.local.set({ [SETTINGS_KEY]: updatedSettings });
  return updatedSettings;
}

// Get storage statistics
async function getStorageStats() {
  const pins = await idbGetAll();
  const dataSize = new Blob([JSON.stringify(pins)]).size;
  
  return {
    pinCount: pins.length,
    dataSize,
    quotaUsed: ((dataSize / SYNC_QUOTA_BYTES) * 100).toFixed(2),
    maxPins: SYNC_MAX_ITEMS,
    maxSize: SYNC_QUOTA_BYTES
  };
}