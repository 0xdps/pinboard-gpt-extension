/**
 * Storage API wrapper (browser-agnostic)
 * Uses storage.local for free users, storage.sync for Pro/Pro+ users
 * Works with both Chrome and Firefox
 * 
 * Note: storageAPI and isExtensionContextValid are defined in utils.js which is loaded before this file
 * Note: getLicense() is defined in license.js which is loaded before this file
 */

const STORAGE_KEY = 'pins';
const SETTINGS_KEY = 'settings';

// License types are defined in license.js

// Chrome sync quota limits (for reference)
const SYNC_QUOTA_BYTES = 102400; // 100KB total
const SYNC_MAX_ITEMS = 512;

// Determine which storage to use based on license
async function getStorage() {
  const license = await getLicense();
  // Pro and Premium get storageAPI.sync, Free uses storageAPI.local
  if (license === LICENSE_TYPES.PRO || license === LICENSE_TYPES.PREMIUM) {
    return storageAPI.sync;
  }
  return storageAPI.local;
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
  const result = await storageAPI.local.get([SETTINGS_KEY]);
  return result[SETTINGS_KEY] || {
    theme: 'dark'
  };
}

async function updateSettings(newSettings) {
  const currentSettings = await getSettings();
  const updatedSettings = { ...currentSettings, ...newSettings };
  await storageAPI.local.set({ [SETTINGS_KEY]: updatedSettings });
  return updatedSettings;
}

// Settings storage functions
async function getSetting(key) {
  if (!isExtensionContextValid()) {
    debugLog('Extension context invalid, returning undefined for setting:', key);
    return undefined;
  }
  
  try {
    const result = await storageAPI.local.get([key]);
    return result[key];
  } catch (error) {
    debugError('Error getting setting:', key, error);
    return undefined;
  }
}

async function setSetting(key, value) {
  if (!isExtensionContextValid()) {
    debugLog('Extension context invalid, cannot save setting:', key);
    return undefined;
  }
  
  try {
    await storageAPI.local.set({ [key]: value });
    return value;
  } catch (error) {
    debugError('Error setting:', key, value, error);
    return undefined;
  }
}

async function getSettings(keys = []) {
  if (!isExtensionContextValid()) {
    throw new Error('Extension context is invalid. Please reload the page and try again.');
  }
  
  try {
    const result = await storageAPI.local.get(keys);
    return result;
  } catch (error) {
    debugError('Error getting settings:', keys, error);
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