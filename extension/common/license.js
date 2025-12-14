// License management for Pinboard GPT
// Plans: FREE (10 pins), PRO (unlimited), PRO_PLUS, PREMIUM_CLOUD

const LICENSE_TYPES = {
  FREE: 'free',
  PRO: 'pro',
  PREMIUM: 'premium'
};

const LICENSE_LIMITS = {
  [LICENSE_TYPES.FREE]: {
    maxPins: 10,
    tags: true,
    export: true,
    sync: false
  },
  [LICENSE_TYPES.PRO]: {
    maxPins: Infinity,
    tags: true,
    export: true,
    sync: true,
    multiAI: true
  },
  [LICENSE_TYPES.PREMIUM]: {
    maxPins: Infinity,
    tags: true,
    export: true,
    sync: true,
    multiAI: true,
    cloudSync: true,
    crossBrowser: true
  }
};

// Get current license
async function getLicense() {
  try {
    const result = await chrome.storage.local.get(['license', 'licenseData']);
    
    // Check if complementary access has expired
    if (result.licenseData?.complementary) {
      if (result.licenseData.complementaryExpiry < Date.now()) {
        // Expired - revert to free
        await chrome.storage.local.set({ 
          license: LICENSE_TYPES.FREE,
          licenseData: null
        });
        return LICENSE_TYPES.FREE;
      }
    }
    
    return result.license || LICENSE_TYPES.FREE;
  } catch (error) {
    debugError('Error getting license:', error);
    return LICENSE_TYPES.FREE;
  }
}

// Generate deterministic hash from string (for validation)
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// Validate license key format and checksum
function validateLicenseKey(key, licenseType) {
  if (!key || typeof key !== 'string') return false;
  
  // Format: PINGPT-{TYPE}-{RANDOM}-{CHECKSUM}
  // Example: PINGPT-PRO-ABC123-XYZ
  const parts = key.split('-');
  if (parts.length !== 4) return false;
  if (parts[0] !== 'PINGPT') return false;
  if (parts[1] !== licenseType.toUpperCase()) return false;
  
  // Validate checksum (last part should be hash of first 3 parts + secret)
  const payload = parts.slice(0, 3).join('-');
  const secret = 'pingpt_secret_2025'; // Keep this secret in production
  const expectedChecksum = simpleHash(payload + secret).substring(0, 6).toUpperCase();
  
  return parts[3] === expectedChecksum;
}

// Check if user has complementary access (for beta testers, team, etc.)
async function hasComplementaryAccess() {
  try {
    const result = await chrome.storage.local.get(['licenseData']);
    if (!result.licenseData) return false;
    
    return result.licenseData.complementary === true && 
           result.licenseData.complementaryExpiry > Date.now();
  } catch (error) {
    debugError('Error checking complementary access:', error);
    return false;
  }
}

// Set license (for upgrade)
async function setLicense(licenseType, licenseKey = null) {
  try {
    // If no key provided, just set the type (for internal testing only)
    if (!licenseKey) {
      const licenseData = {
        type: licenseType,
        key: null,
        activatedAt: Date.now(),
        complementary: false
      };
      await chrome.storage.local.set({ license: licenseData.type, licenseData });
      return { success: true, message: 'License set' };
    }
    
    // Validate license key
    if (!validateLicenseKey(licenseKey, licenseType)) {
      return { success: false, message: 'Invalid license key format' };
    }
    
    // Allow unlimited activations - users can use the same key on all their devices
    // (Chrome desktop, laptop, Firefox, Edge, etc.)
    // Keys are still validated by checksum to prevent fake keys
    
    // Set the license
    const licenseData = {
      type: licenseType,
      key: licenseKey,
      activatedAt: Date.now(),
      complementary: false
    };
    
    await chrome.storage.local.set({ license: licenseData.type, licenseData });
    return { success: true, message: 'License activated successfully! You can use this key on all your devices.' };
  } catch (error) {
    debugError('Error setting license:', error);
    return { success: false, message: 'Error activating license' };
  }
}

// Set complementary access (for beta testers, friends, family)
async function setComplementaryAccess(licenseType, durationDays = 365, reason = '') {
  try {
    const expiryDate = Date.now() + (durationDays * 24 * 60 * 60 * 1000);
    const licenseData = {
      type: licenseType,
      key: null,
      activatedAt: Date.now(),
      complementary: true,
      complementaryReason: reason,
      complementaryExpiry: expiryDate
    };
    
    await chrome.storage.local.set({ license: licenseData.type, licenseData });
    return { success: true, message: `Complementary access granted until ${new Date(expiryDate).toLocaleDateString()}` };
  } catch (error) {
    debugError('Error setting complementary access:', error);
    return { success: false, message: 'Error granting access' };
  }
}

// Check if user can add more pins
async function canAddPin() {
  try {
    const license = await getLicense();
    const pins = await getPins();
    const limit = LICENSE_LIMITS[license]?.maxPins || 10;
    return pins.length < limit;
  } catch (error) {
    debugError('Error checking pin limit:', error);
    return false;
  }
}

// Get remaining pins count
async function getRemainingPins() {
  try {
    const license = await getLicense();
    const pins = await getPins();
    const limit = LICENSE_LIMITS[license]?.maxPins || 10;
    
    if (limit === Infinity) {
      return { remaining: Infinity, limit: Infinity, current: pins.length };
    }
    
    return {
      remaining: Math.max(0, limit - pins.length),
      limit,
      current: pins.length
    };
  } catch (error) {
    debugError('Error getting remaining pins:', error);
    return { remaining: 0, limit: 10, current: 0 };
  }
}

// Check if feature is available for current license
async function hasFeature(feature) {
  try {
    const license = await getLicense();
    const limits = LICENSE_LIMITS[license] || LICENSE_LIMITS[LICENSE_TYPES.FREE];
    return limits[feature] === true;
  } catch (error) {
    debugError('Error checking feature:', error);
    return false;
  }
}
