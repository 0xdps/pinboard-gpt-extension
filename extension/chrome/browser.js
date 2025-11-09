// ============================================================================
// Chrome browser code (auto-appended during build)
// ============================================================================

// Chrome storage API wrapper
const STORAGE_KEY = 'gpt-pinboard-pins';
const SETTINGS_KEY = 'gpt-pinboard-settings';

function isExtensionContextValid() {
  try {
    return !!(chrome.runtime && chrome.runtime.id);
  } catch (e) {
    return false;
  }
}

// Chrome storage functions
async function getAllPins() {
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

async function savePin(pin) {
  if (!isExtensionContextValid()) {
    throw new Error('Extension context is invalid. Please reload the page and try again.');
  }
  
  try {
    const result = await chrome.storage.sync.get([STORAGE_KEY]);
    const pins = result[STORAGE_KEY] || [];
    
    const existingIndex = pins.findIndex(p => p.id === pin.id);
    if (existingIndex >= 0) {
      pins[existingIndex] = pin;
    } else {
      pins.push(pin);
    }
    
    await chrome.storage.sync.set({ [STORAGE_KEY]: pins });
    return pin;
  } catch (error) {
    if (error.message.includes('Extension context invalidated')) {
      throw new Error('Extension context is invalid. Please reload the page and try again.');
    }
    throw error;
  }
}

async function deletePin(pinId) {
  if (!isExtensionContextValid()) {
    throw new Error('Extension context is invalid. Please reload the page and try again.');
  }
  
  try {
    const result = await chrome.storage.sync.get([STORAGE_KEY]);
    const pins = result[STORAGE_KEY] || [];
    
    const filteredPins = pins.filter(pin => pin.id !== pinId);
    await chrome.storage.sync.set({ [STORAGE_KEY]: filteredPins });
    
    return true;
  } catch (error) {
    if (error.message.includes('Extension context invalidated')) {
      throw new Error('Extension context is invalid. Please reload the page and try again.');
    }
    throw error;
  }
}

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

async function getSetting(key) {
  if (!isExtensionContextValid()) {
    throw new Error('Extension context is invalid. Please reload the page and try again.');
  }
  
  try {
    const result = await chrome.storage.local.get([key]);
    return result[key];
  } catch (error) {
    console.error('Error getting setting:', key, error);
    throw error;
  }
}

async function setSetting(key, value) {
  if (!isExtensionContextValid()) {
    throw new Error('Extension context is invalid. Please reload the page and try again.');
  }
  
  try {
    await chrome.storage.local.set({ [key]: value });
    return value;
  } catch (error) {
    console.error('Error setting:', key, value, error);
    throw error;
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

// Chrome browser APIs
const tabsAPI = chrome.tabs;
const runtimeAPI = chrome.runtime;
const isFirefox = false;