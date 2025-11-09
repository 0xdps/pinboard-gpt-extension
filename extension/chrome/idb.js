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

// Check if extension context is still valid
function isExtensionContextValid() {
  try {
    return chrome && chrome.runtime && !chrome.runtime.lastError;
  } catch (e) {
    return false;
  }
}

async function idbAdd(pin) {
  // Check if extension context is valid before attempting storage operations
  if (!isExtensionContextValid()) {
    throw new Error('Extension context is invalid. Please reload the page and try again.');
  }
  
  try {
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
  } catch (error) {
    // Re-throw with more context if it's an extension context error
    if (error.message.includes('Extension context invalidated')) {
      throw new Error('Extension context is invalid. Please reload the page and try again.');
    }
    throw error;
  }
}

async function idbGetAll() {
  if (!isExtensionContextValid()) {
    throw new Error('Extension context is invalid. Please reload the page and try again.');
  }
  
  try {
    const result = await chrome.storage.sync.get([STORAGE_KEY]);
    return result[STORAGE_KEY] || [];
  } catch (error) {
    if (error.message.includes('Extension context invalidated')) {
      throw new Error('Extension context is invalid. Please reload the page and try again.');
    }
    throw error;
  }
}

async function idbDelete(id) {
  if (!isExtensionContextValid()) {
    throw new Error('Extension context is invalid. Please reload the page and try again.');
  }
  
  try {
    const result = await chrome.storage.sync.get([STORAGE_KEY]);
    const pins = result[STORAGE_KEY] || [];
    const filtered = pins.filter(p => p.id !== id);
    await chrome.storage.sync.set({ [STORAGE_KEY]: filtered });
  } catch (error) {
    if (error.message.includes('Extension context invalidated')) {
      throw new Error('Extension context is invalid. Please reload the page and try again.');
    }
    throw error;
  }
}

async function idbClear() {
  if (!isExtensionContextValid()) {
    throw new Error('Extension context is invalid. Please reload the page and try again.');
  }
  
  try {
    await chrome.storage.sync.set({ [STORAGE_KEY]: [] });
  } catch (error) {
    if (error.message.includes('Extension context invalidated')) {
      throw new Error('Extension context is invalid. Please reload the page and try again.');
    }
    throw error;
  }
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