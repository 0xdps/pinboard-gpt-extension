// Use Chrome Storage API instead of IndexedDB for cross-context access
// This allows both content scripts and popup to access the same data

const STORAGE_KEY = 'pins';

async function idbAdd(pin) {
  try {
    // Get existing pins
    const result = await chrome.storage.local.get([STORAGE_KEY]);
    const pins = result[STORAGE_KEY] || [];
    
    // Find and update existing pin or add new one
    const existingIndex = pins.findIndex(p => p.id === pin.id);
    if (existingIndex >= 0) {
      pins[existingIndex] = pin;
    } else {
      pins.push(pin);
    }
    
    // Save back to storage
    await chrome.storage.local.set({ [STORAGE_KEY]: pins });
    return pin;
  } catch (err) {
    throw err;
  }
}

async function idbGetAll() {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEY]);
    return result[STORAGE_KEY] || [];
  } catch (err) {
    return [];
  }
}

async function idbDelete(id) {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEY]);
    const pins = result[STORAGE_KEY] || [];
    const filtered = pins.filter(p => p.id !== id);
    await chrome.storage.local.set({ [STORAGE_KEY]: filtered });
  } catch (err) {
    throw err;
  }
}

async function idbClear() {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: [] });
  } catch (err) {
    throw err;
  }
}

// Legacy function for compatibility (not used with Chrome Storage)
function openDB() {
  return Promise.resolve(null);
}
