// Authentication and API integration for Pinboard GPT
// Handles user login, license validation, and cloud sync

const API_BASE_URL = 'https://pinboard-gpt.dps.codes/api';

// Auth state management
async function getAuthToken() {
  try {
    const result = await chrome.storage.local.get(['authToken']);
    return result.authToken || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

async function setAuthToken(token) {
  try {
    await chrome.storage.local.set({ authToken: token });
    return true;
  } catch (error) {
    console.error('Error setting auth token:', error);
    return false;
  }
}

async function clearAuthToken() {
  try {
    await chrome.storage.local.remove(['authToken', 'userData']);
    return true;
  } catch (error) {
    console.error('Error clearing auth token:', error);
    return false;
  }
}

// Check if user is logged in
async function isLoggedIn() {
  const token = await getAuthToken();
  return token !== null;
}

// Google Sign-In using Chrome Identity API
// NOTE: Requires OAuth2 configuration in manifest.json
// See OAUTH_SETUP.md for setup instructions
async function signInWithGoogle() {
  try {
    // Get Google OAuth token using Chrome Identity API
    // This will fail with "Invalid OAuth2 Client ID" if manifest.json
    // doesn't have the oauth2 section configured properly
    const token = await new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(token);
        }
      });
    });

    if (!token) {
      return { success: false, message: 'Google sign-in cancelled' };
    }

    // Send Google token to backend for verification
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: token }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.message || 'Authentication failed' };
    }

    // Store our app's token and user data
    await setAuthToken(data.token);
    await chrome.storage.local.set({ 
      userData: {
        email: data.user.email,
        name: data.user.name,
        userId: data.user.id,
        picture: data.user.picture
      }
    });

    // Sync license from server
    await syncLicenseFromServer();

    return { success: true, message: 'Signed in successfully!', user: data.user };
  } catch (error) {
    console.error('Google sign-in error:', error.message);
    return { success: false, message: 'Google sign-in failed. Please try again.' };
  }
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
    console.error('Logout error:', error);
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

    const response = await fetch(`${API_BASE_URL}/user/license`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // Token might be expired
      if (response.status === 401) {
        await clearAuthToken();
        return { success: false, message: 'Session expired. Please login again.' };
      }
      return { success: false, message: data.message || 'Failed to fetch license' };
    }

    // Update local license based on server data
    const licenseType = data.licenseType || LICENSE_TYPES.FREE;
    const licenseData = {
      type: licenseType,
      key: null, // No manual key needed when logged in
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

    return { 
      success: true, 
      licenseType: licenseType,
      expiresAt: data.expiresAt 
    };
  } catch (error) {
    console.error('License sync error:', error);
    return { success: false, message: 'Network error. Using cached license.' };
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
    console.error('License validation error:', error);
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

    const response = await fetch(`${API_BASE_URL}/pins/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pins }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.message || 'Sync failed' };
    }

    return { success: true, message: 'Pins synced to cloud' };
  } catch (error) {
    console.error('Cloud sync error:', error);
    return { success: false, message: 'Network error. Pins saved locally.' };
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

    const response = await fetch(`${API_BASE_URL}/pins/sync`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.message || 'Fetch failed' };
    }

    return { success: true, pins: data.pins || [] };
  } catch (error) {
    console.error('Cloud fetch error:', error);
    return { success: false, message: 'Network error. Using local pins.' };
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
    console.error('Auth initialization error:', error);
  }
}

// Schedule daily license validation
chrome.alarms.create('validateLicense', { periodInMinutes: 60 * 24 }); // Every 24 hours

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'validateLicense') {
    validateLicense();
  }
});
