// Use Chrome Storage API for cross-context and cross-device access
// Uses chrome.storage.sync for automatic syncing across devices
// Falls back to chrome.storage.local if sync quota is exceeded

const STORAGE_KEY = 'pins';
const SYNC_ENABLED_KEY = 'sync_enabled';

// Chrome sync quota limits
const SYNC_QUOTA_BYTES = 102400; // 100KB total
const SYNC_QUOTA_BYTES_PER_ITEM = 8192; // 8KB per item
const SYNC_MAX_ITEMS = 512;

// Check if sync is enabled (default: true)
async function isSyncEnabled() {
  try {
    const result = await chrome.storage.local.get([SYNC_ENABLED_KEY]);
    return result[SYNC_ENABLED_KEY] !== false; // Default to true
  } catch (err) {
    return true;
  }
}

// Get the appropriate storage area (sync or local)
async function getStorageArea() {
  const syncEnabled = await isSyncEnabled();
  return syncEnabled ? chrome.storage.sync : chrome.storage.local;
}

// Check if data fits within sync quota
function canUseSync(pins) {
  const dataSize = new Blob([JSON.stringify(pins)]).size;
  return pins.length <= SYNC_MAX_ITEMS && dataSize <= SYNC_QUOTA_BYTES;
}

async function idbAdd(pin) {
  try {
    const storage = await getStorageArea();
    
    // Get existing pins
    const result = await storage.get([STORAGE_KEY]);
    const pins = result[STORAGE_KEY] || [];
    
    // Find and update existing pin or add new one
    const existingIndex = pins.findIndex(p => p.id === pin.id);
    if (existingIndex >= 0) {
      pins[existingIndex] = pin;
    } else {
      pins.push(pin);
    }
    
    // Check if we need to fallback to local storage
    if (storage === chrome.storage.sync && !canUseSync(pins)) {
      // Quota exceeded, disable sync and use local
      await chrome.storage.local.set({ [SYNC_ENABLED_KEY]: false });
      await chrome.storage.local.set({ [STORAGE_KEY]: pins });
      return pin;
    }
    
    // Save back to storage
    await storage.set({ [STORAGE_KEY]: pins });
    return pin;
  } catch (err) {
    // If sync fails, fallback to local
    if (err.message && err.message.includes('QUOTA')) {
      await chrome.storage.local.set({ [SYNC_ENABLED_KEY]: false });
      const result = await chrome.storage.local.get([STORAGE_KEY]);
      const pins = result[STORAGE_KEY] || [];
      const existingIndex = pins.findIndex(p => p.id === pin.id);
      if (existingIndex >= 0) {
        pins[existingIndex] = pin;
      } else {
        pins.push(pin);
      }
      await chrome.storage.local.set({ [STORAGE_KEY]: pins });
      return pin;
    }
    throw err;
  }
}

async function idbGetAll() {
  try {
    const storage = await getStorageArea();
    const result = await storage.get([STORAGE_KEY]);
    return result[STORAGE_KEY] || [];
  } catch (err) {
    return [];
  }
}

async function idbDelete(id) {
  try {
    const storage = await getStorageArea();
    const result = await storage.get([STORAGE_KEY]);
    const pins = result[STORAGE_KEY] || [];
    const filtered = pins.filter(p => p.id !== id);
    await storage.set({ [STORAGE_KEY]: filtered });
  } catch (err) {
    throw err;
  }
}

async function idbClear() {
  try {
    const storage = await getStorageArea();
    await storage.set({ [STORAGE_KEY]: [] });
  } catch (err) {
    throw err;
  }
}

// Toggle sync on/off
async function toggleSync(enabled) {
  try {
    await chrome.storage.local.set({ [SYNC_ENABLED_KEY]: enabled });
    
    if (enabled) {
      // Migrate from local to sync
      const localResult = await chrome.storage.local.get([STORAGE_KEY]);
      const pins = localResult[STORAGE_KEY] || [];
      
      if (canUseSync(pins)) {
        await chrome.storage.sync.set({ [STORAGE_KEY]: pins });
      } else {
        throw new Error('Too much data to sync. Please reduce the number of pins.');
      }
    } else {
      // Migrate from sync to local
      const syncResult = await chrome.storage.sync.get([STORAGE_KEY]);
      const pins = syncResult[STORAGE_KEY] || [];
      await chrome.storage.local.set({ [STORAGE_KEY]: pins });
    }
    
    return true;
  } catch (err) {
    throw err;
  }
}

// Get sync status and quota info
async function getSyncStatus() {
  try {
    const enabled = await isSyncEnabled();
    const storage = enabled ? chrome.storage.sync : chrome.storage.local;
    const result = await storage.get([STORAGE_KEY]);
    const pins = result[STORAGE_KEY] || [];
    const dataSize = new Blob([JSON.stringify(pins)]).size;
    
    return {
      enabled,
      pinCount: pins.length,
      dataSize,
      quotaUsed: ((dataSize / SYNC_QUOTA_BYTES) * 100).toFixed(2),
      canSync: canUseSync(pins),
      maxPins: SYNC_MAX_ITEMS,
      maxSize: SYNC_QUOTA_BYTES
    };
  } catch (err) {
    return null;
  }
}

// Legacy function for compatibility (not used with Chrome Storage)
function openDB() {
  return Promise.resolve(null);
}

