/**
 * Chrome Storage API wrapper
 * Uses chrome.storage.local for free users, chrome.storage.sync for Pro/Pro+ users
 * Chrome extension specific - no cross-browser compatibility
 */

const STORAGE_KEY = 'pins';
const SETTINGS_KEY = 'settings';

// License types are defined in license.js

// Chrome sync quota limits (for reference)
const SYNC_QUOTA_BYTES = 102400; // 100KB total
const SYNC_MAX_ITEMS = 512;

// Check if extension context is still valid
function isExtensionContextValid() {
  try {
    // Check if chrome.runtime.id exists (undefined means context invalidated)
    return chrome && chrome.runtime && chrome.runtime.id !== undefined;
  } catch (e) {
    return false;
  }
}

// Get current license
async function getLicense() {
  try {
    const result = await chrome.storage.local.get(['license']);
    return result.license || LICENSE_TYPES.FREE;
  } catch (error) {
    console.error('Error getting license:', error);
    return LICENSE_TYPES.FREE;
  }
}

// Determine which storage to use based on license
async function getStorage() {
  const license = await getLicense();
  // Pro and Premium get chrome.storage.sync, Free uses chrome.storage.local
  if (license === LICENSE_TYPES.PRO || license === LICENSE_TYPES.PREMIUM) {
    return chrome.storage.sync;
  }
  return chrome.storage.local;
}

async function idbAdd(pin) {
  // Check if extension context is valid before attempting storage operations
  if (!isExtensionContextValid()) {
    throw new Error('Extension context is invalid. Please reload the page and try again.');
  }
  
  try {
    const storage = await getStorage();
    const result = await storage.get([STORAGE_KEY]);
    const pins = result[STORAGE_KEY] || [];
    
    // Find and update existing pin or add new one
    const existingIndex = pins.findIndex(p => p.id === pin.id);
    if (existingIndex >= 0) {
      pins[existingIndex] = pin;
    } else {
      pins.push(pin);
    }
    
    await storage.set({ [STORAGE_KEY]: pins });
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
    const storage = await getStorage();
    const result = await storage.get([STORAGE_KEY]);
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
    const storage = await getStorage();
    const result = await storage.get([STORAGE_KEY]);
    const pins = result[STORAGE_KEY] || [];
    const filtered = pins.filter(p => p.id !== id);
    await storage.set({ [STORAGE_KEY]: filtered });
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
    const storage = await getStorage();
    await storage.set({ [STORAGE_KEY]: [] });
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

// Settings storage functions
async function getSetting(key) {
  if (!isExtensionContextValid()) {
    console.warn('Extension context invalid, returning undefined for setting:', key);
    return undefined;
  }
  
  try {
    const result = await chrome.storage.local.get([key]);
    return result[key];
  } catch (error) {
    console.error('Error getting setting:', key, error);
    return undefined;
  }
}

async function setSetting(key, value) {
  if (!isExtensionContextValid()) {
    console.warn('Extension context invalid, cannot save setting:', key);
    return undefined;
  }
  
  try {
    await chrome.storage.local.set({ [key]: value });
    return value;
  } catch (error) {
    console.error('Error setting:', key, value, error);
    return undefined;
  }
}

async function getSettings(keys = []) {
  if (!isExtensionContextValid()) {
    throw new Error('Extension context is invalid. Please reload the page and try again.');
  }
  
  try {
    const result = await chrome.storage.local.get(keys);
    return result;
  } catch (error) {
    console.error('Error getting settings:', keys, error);
    throw error;
  }
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