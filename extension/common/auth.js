// Authentication and API integration for Pinboard GPT
// Handles user login, license validation, and cloud sync

const API_BASE_URL = 'https://pinboard-gpt.dps.codes/api';

// Auth state management
async function getAuthToken() {
  try {
    const result = await chrome.storage.local.get(['authToken']);
    return result.authToken || null;
  } catch (error) {
    debugError('Error getting auth token:', error);
    return null;
  }
}

async function setAuthToken(token) {
  try {
    await chrome.storage.local.set({ authToken: token });
    return true;
  } catch (error) {
    debugError('Error setting auth token:', error);
    return false;
  }
}

async function clearAuthToken() {
  try {
    await chrome.storage.local.remove(['authToken', 'userData']);
    return true;
  } catch (error) {
    debugError('Error clearing auth token:', error);
    return false;
  }
}

// Check if user is logged in
async function isLoggedIn() {
  const token = await getAuthToken();
  return token !== null;
}

// Google Sign-In using web-based OAuth flow
// This works for both Chrome and Firefox by redirecting to website
// The website will send the access token back via postMessage
// NOTE: Token is stored by web_verification.js content script
async function signInWithGoogle() {
  // This function is no longer used directly
  // The popup opens the website where user signs in
  // The website sends the token back via postMessage to web_verification.js
  // which stores it in chrome.storage.local
  
  // Check if we already have a token (signed in via website)
  const token = await getAuthToken();
  if (token) {
    return { success: true, message: 'Already signed in' };
  }
  
  return { 
    success: false, 
    message: 'Please sign in via the website' 
  };
}

// User logout
async function logoutUser() {
  try {
    await clearAuthToken();
    
    // Keep pins locally but clear license
    await chrome.storage.local.set({ 
      license: LICENSE_TYPES.FREE,
      licenseData: null 
    });
    
    return { success: true, message: 'Logged out successfully' };
  } catch (error) {
    debugError('Logout error:', error);
    return { success: false, message: 'Logout failed' };
  }
}

// Fetch user's license from server
async function syncLicenseFromServer() {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, message: 'Not logged in' };
    }

    let response;
    let lastError;
    
    // Retry with backoff for network errors only
    // HTTP errors (including 401) are returned as successful Response objects, not thrown
    for (let attempt = 1; attempt <= UI_CONFIG.network.retryMaxAttempts; attempt++) {
      try {
        response = await withTimeout(
          fetch(`${API_BASE_URL}/user/license`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }),
          UI_CONFIG.network.apiTimeout
        );
        // Success - exit retry loop
        break;
      } catch (error) {
        lastError = error;
        // Only retry on network/timeout errors
        if (attempt === UI_CONFIG.network.retryMaxAttempts) {
          throw error;
        }
        if (!isRetryableError(error)) {
          throw error;
        }
        const delay = Math.min(
          UI_CONFIG.network.retryInitialDelay * Math.pow(UI_CONFIG.network.retryBackoffMultiplier, attempt - 1),
          UI_CONFIG.network.retryMaxDelay
        );
        debugLog(`Pinboard GPT: License sync retry ${attempt}/${UI_CONFIG.network.retryMaxAttempts} in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    const data = await response.json();

    if (!response.ok) {
      // Token might be expired
      if (response.status === 401) {
        await clearAuthToken();
        return { success: false, message: 'Session expired. Please login again.' };
      }
      const errorMsg = data.message || formatNetworkErrorMessage(new Error(), response.status);
      return { success: false, message: errorMsg };
    }

    // Update local license based on server data
    // API returns 'type', not 'licenseType'
    const licenseType = data.type || LICENSE_TYPES.FREE;
    const licenseData = {
      type: licenseType,
      key: data.licenseKey || null,
      activatedAt: data.activatedAt || Date.now(),
      complementary: false,
      serverManaged: true,
      expiresAt: data.expiresAt || null, // For Premium subscriptions
      lastValidated: Date.now()
    };

    await chrome.storage.local.set({ 
      license: licenseType, 
      licenseData: licenseData 
    });

    debugLog('Pinboard GPT: License synced successfully:', licenseType);
    return { 
      success: true, 
      licenseType: licenseType,
      expiresAt: data.expiresAt 
    };
  } catch (error) {
    debugError('License sync error:', error);
    const errorMsg = formatNetworkErrorMessage(error);
    return { success: false, message: '⚠️ ' + errorMsg + ' Using cached license.' };
  }
}

// Validate license periodically (called daily)
async function validateLicense() {
  try {
    const result = await chrome.storage.local.get(['licenseData']);
    const licenseData = result.licenseData;

    // Skip validation if using manual key (offline mode)
    if (licenseData && !licenseData.serverManaged) {
      return { success: true, valid: true };
    }

    // If not logged in, ensure we're on free plan
    const token = await getAuthToken();
    if (!token) {
      await chrome.storage.local.set({ 
        license: LICENSE_TYPES.FREE,
        licenseData: null 
      });
      return { success: true, valid: false, message: 'Not logged in' };
    }

    // Check if last validation was recent (< 24 hours ago)
    if (licenseData && licenseData.lastValidated) {
      const hoursSinceValidation = (Date.now() - licenseData.lastValidated) / (1000 * 60 * 60);
      if (hoursSinceValidation < 24) {
        return { success: true, valid: true, cached: true };
      }
    }

    // Validate with server
    return await syncLicenseFromServer();
  } catch (error) {
    debugError('License validation error:', error);
    // On error, keep existing license (graceful degradation)
    return { success: false, message: 'Validation failed, using cached license' };
  }
}

// Sync pins to cloud (for Premium users)
async function syncPinsToCloud(pins) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, message: 'Not logged in' };
    }

    const license = await getLicense();
    if (license !== LICENSE_TYPES.PREMIUM) {
      return { success: false, message: 'Cloud sync requires Premium plan' };
    }

    let response;
    
    // Retry with backoff for network errors only
    for (let attempt = 1; attempt <= UI_CONFIG.network.retryMaxAttempts; attempt++) {
      try {
        response = await withTimeout(
          fetch(`${API_BASE_URL}/pins/sync`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pins }),
          }),
          UI_CONFIG.network.apiTimeout
        );
        break; // Success - exit retry loop
      } catch (error) {
        if (attempt === UI_CONFIG.network.retryMaxAttempts) {
          throw error;
        }
        if (!isRetryableError(error)) {
          throw error;
        }
        const delay = Math.min(
          UI_CONFIG.network.retryInitialDelay * Math.pow(UI_CONFIG.network.retryBackoffMultiplier, attempt - 1),
          UI_CONFIG.network.retryMaxDelay
        );
        debugLog(`Pinboard GPT: Cloud sync retry ${attempt}/${UI_CONFIG.network.retryMaxAttempts} in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        await clearAuthToken();
        return { success: false, message: 'Session expired. Please login again.' };
      }
      const errorMsg = data.message || formatNetworkErrorMessage(new Error(), response.status);
      return { success: false, message: errorMsg };
    }

    debugLog('Pinboard GPT: Pins synced to cloud successfully');
    return { success: true, message: 'Pins synced to cloud' };
  } catch (error) {
    debugError('Cloud sync error:', error);
    const errorMsg = formatNetworkErrorMessage(error);
    return { success: false, message: '⚠️ ' + errorMsg + ' Pins saved locally.' };
  }
}

// Fetch pins from cloud (for Premium users)
async function fetchPinsFromCloud() {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, message: 'Not logged in' };
    }

    const license = await getLicense();
    if (license !== LICENSE_TYPES.PREMIUM) {
      return { success: false, message: 'Cloud sync requires Premium plan' };
    }

    let response;
    
    // Retry with backoff for network errors only
    for (let attempt = 1; attempt <= UI_CONFIG.network.retryMaxAttempts; attempt++) {
      try {
        response = await withTimeout(
          fetch(`${API_BASE_URL}/pins/sync`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }),
          UI_CONFIG.network.apiTimeout
        );
        break; // Success - exit retry loop
      } catch (error) {
        if (attempt === UI_CONFIG.network.retryMaxAttempts) {
          throw error;
        }
        if (!isRetryableError(error)) {
          throw error;
        }
        const delay = Math.min(
          UI_CONFIG.network.retryInitialDelay * Math.pow(UI_CONFIG.network.retryBackoffMultiplier, attempt - 1),
          UI_CONFIG.network.retryMaxDelay
        );
        debugLog(`Pinboard GPT: Cloud fetch retry ${attempt}/${UI_CONFIG.network.retryMaxAttempts} in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        await clearAuthToken();
        return { success: false, message: 'Session expired. Please login again.' };
      }
      const errorMsg = data.message || formatNetworkErrorMessage(new Error(), response.status);
      return { success: false, message: errorMsg };
    }

    debugLog('Pinboard GPT: Pins fetched from cloud successfully');
    return { success: true, pins: data.pins || [] };
  } catch (error) {
    debugError('Cloud fetch error:', error);
    const errorMsg = formatNetworkErrorMessage(error);
    return { success: false, message: '⚠️ ' + errorMsg + ' Using local pins.' };
  }
}

// Initialize auth on extension load
async function initializeAuth() {
  try {
    const isUserLoggedIn = await isLoggedIn();
    
    if (isUserLoggedIn) {
      // Validate license on startup
      await validateLicense();
    } else {
      // Ensure free plan if not logged in
      await chrome.storage.local.set({ 
        license: LICENSE_TYPES.FREE,
        licenseData: null 
      });
    }
  } catch (error) {
    debugError('Auth initialization error:', error);
  }
}

// Schedule daily license validation
chrome.alarms.create('validateLicense', { periodInMinutes: 60 * 24 }); // Every 24 hours

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'validateLicense') {
    validateLicense();
  }
});
