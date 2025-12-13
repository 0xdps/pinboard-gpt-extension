// Browser API compatibility wrapper
const storageAPI = typeof browser !== 'undefined' ? browser.storage : chrome.storage;
const tabsAPI = typeof browser !== 'undefined' ? browser.tabs : chrome.tabs;
const runtimeAPI = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime;
const identityAPI = typeof chrome !== 'undefined' && chrome.identity ? chrome.identity : null;

// Modal/Dialog keyboard navigation helper
function setupModalKeyboardNavigation(modal) {
  const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const allFocusable = Array.from(modal.querySelectorAll(focusableSelectors))
    .filter(el => !el.hasAttribute('disabled'));
  
  if (allFocusable.length === 0) return;
  
  const firstFocusable = allFocusable[0];
  const lastFocusable = allFocusable[allFocusable.length - 1];
  
  // Focus first element on modal open
  setTimeout(() => {
    firstFocusable.focus();
  }, 50);
  
  // Handle Tab key for focus trap
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        // Shift+Tab - go backward
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // Tab - go forward
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    }
    
    // Escape key to close
    if (e.key === 'Escape') {
      e.preventDefault();
      // Trigger the close button click
      const closeBtn = modal.querySelector('.modal-close, #closeEditModal, #closeSettings, #closeUpgrade');
      if (closeBtn) {
        closeBtn.click();
      }
    }
  };
  
  modal.addEventListener('keydown', handleKeyDown);
  
  // Return function to remove listeners when modal closes
  return () => {
    modal.removeEventListener('keydown', handleKeyDown);
  };
}

// Initialize debug setting on popup load
async function initializePopupDebug() {
  try {
    const debugMode = await getSetting('debugMode');
    window.debugEnabled = debugMode === true;
  } catch (error) {
    // Ignore errors during initialization
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const listEl = document.getElementById('list');
  const search = document.getElementById('search');
  const searchContainer = document.querySelector('.search-box');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');
  const debugText = document.getElementById('debugText');
  const debugToggle = document.getElementById('debugToggle');
  
  // Filter tabs
  const filterAll = document.getElementById('filterAll');
  const filterChats = document.getElementById('filterChats');
  const filterMessages = document.getElementById('filterMessages');
  let currentFilter = 'all'; // 'all', 'chats', 'messages'
  
  // Settings Modal Elements
  const upgradeBtn = document.getElementById('upgradeBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const coffeeBtn = document.getElementById('coffeeBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettings = document.getElementById('closeSettings');
  const versionNumber = document.getElementById('versionNumber');
  const deleteAllBtn = document.getElementById('deleteAllBtn');
  
  // Upgrade Modal Elements
  const upgradeModal = document.getElementById('upgradeModal');
  const closeUpgrade = document.getElementById('closeUpgrade');
  const upgradeButtons = document.querySelectorAll('.upgrade-btn[data-plan]');

  // Initialize theme
  async function initializeTheme() {
    try {
      // Detect and apply ChatGPT's accent color and theme
      const detectedTheme = await detectAndApplyAccentColor();
      
      // Use detected theme, fallback to stored, then default to dark
      let isDark = true; // default
      
      if (detectedTheme) {
        isDark = detectedTheme === 'dark';
      } else {
        // Check stored theme
        const stored = await storageAPI.local.get(['chatgpt-theme']);
        if (stored['chatgpt-theme']) {
          isDark = stored['chatgpt-theme'] === 'dark';
        }
      }
      
      // Apply theme to popup
      document.body.classList.toggle('dark-mode', isDark);
      debugLog('Applied theme:', isDark ? 'dark' : 'light');
    } catch (err) {
      debugError('Error loading theme:', err);
      // Default to dark mode on error (matches ChatGPT default)
      document.body.classList.add('dark-mode');
    }
  }

  // Detect and apply ChatGPT's accent color from the page
  async function detectAndApplyAccentColor() {
    try {
      // Check if we're on a ChatGPT tab first
      const tabs = await tabsAPI.query({ active: true, currentWindow: true });
      const isOnChatGPT = tabs && tabs[0] && tabs[0].url && tabs[0].url.includes('chatgpt.com');
      
      // Load saved values from storage
      const stored = await storageAPI.local.get(['chatgpt-accent-color', 'chatgpt-accent-hover', 'chatgpt-accent-light', 'chatgpt-theme']);
      
      // Apply stored values if available
      if (stored['chatgpt-accent-color']) {
        // Batch CSS updates to reduce reflows
        const updates = [
          ['--accent', stored['chatgpt-accent-color']],
          ['--accent-hover', stored['chatgpt-accent-hover']],
          ['--accent-light', stored['chatgpt-accent-light']]
        ];
        
        // Apply all at once using requestAnimationFrame for smooth updates
        requestAnimationFrame(() => {
          updates.forEach(([prop, value]) => {
            document.documentElement.style.setProperty(prop, value);
          });
        });
        
        debugLog('Applied stored accent color:', stored['chatgpt-accent-color']);
      }
      
      // Only try to detect fresh values if on ChatGPT tab
      if (isOnChatGPT) {
        // Send message to content script to get accent color and theme
        const response = await new Promise((resolve) => {
          tabsAPI.sendMessage(tabs[0].id, { action: 'get-accent-color' }, (response) => {
            if (runtimeAPI.lastError) {
              resolve(null);
            } else {
              resolve(response);
            }
          });
        });
        
        if (response && response.accentColor) {
          // Batch CSS updates to reduce reflows
          const updates = [
            ['--accent', response.accentColor],
            ['--accent-hover', response.accentHover || response.accentColor],
            ['--accent-light', response.accentLight || response.accentColor + '33']
          ];
          
          requestAnimationFrame(() => {
            updates.forEach(([prop, value]) => {
              document.documentElement.style.setProperty(prop, value);
            });
          });
          
          // Save to storage for future use
          await storageAPI.local.set({
            'chatgpt-accent-color': response.accentColor,
            'chatgpt-accent-hover': response.accentHover,
            'chatgpt-accent-light': response.accentLight,
            'chatgpt-theme': response.theme
          });
          
          debugLog('Detected and saved ChatGPT accent color:', response.accentColor, 'theme:', response.theme);
          
          // Return the detected theme
          return response.theme;
        }
      }
      
      // Return stored theme if available
      return stored['chatgpt-theme'] || null;
    } catch (err) {
      debugLog('Could not detect ChatGPT accent color, using stored/default:', err);
      return null;
    }
  }

  // Initialize debug mode setting
  async function initializeDebugMode() {
    try {
      debugLog('Loading debug mode setting...');
      
      const debugMode = await getSetting('debugMode');
      debugLog('Loaded debug mode setting:', debugMode);
      
      // Default to false if not set
      const isDebugEnabled = debugMode === true;
      debugToggle.checked = isDebugEnabled;
      updateDebugText(isDebugEnabled);
      debugLog('Set debug toggle to:', isDebugEnabled);
      
      // Save default setting if not set
      if (debugMode === undefined) {
        debugLog('Setting default debug mode to false');
        await setSetting('debugMode', false);
      }
    } catch (err) {
      debugError('Error loading debug mode:', err);
      // Default to false on error
      debugToggle.checked = false;
      updateDebugText(false);
    }
  }

  function updateDebugText(isEnabled) {
    if (isEnabled) {
      debugText.textContent = 'Debug mode';
      debugText.style.color = 'var(--danger)';
    } else {
      debugText.textContent = 'Debug mode';
      debugText.style.color = 'var(--text-primary)';
    }
  }

  // Debug mode toggle handler
  debugToggle.onchange = async () => {
    const isDebugEnabled = debugToggle.checked;
    debugLog('Debug mode changed to:', isDebugEnabled);
    updateDebugText(isDebugEnabled);
    
    try {
      await setSetting('debugMode', isDebugEnabled);
      debugLog('Successfully saved debug mode setting:', isDebugEnabled);
      
      // Verify it was saved
      const debugMode = await getSetting('debugMode');
      debugLog('Verified saved debug setting:', debugMode);
    } catch (err) {
      debugError('Error saving debug mode:', err);
    }
  };

  // Load version from manifest
  function loadVersion() {
    const manifest = runtimeAPI.getManifest();
    if (versionNumber && manifest.version) {
      versionNumber.textContent = manifest.version;
    }
  }

  // Initialize theme and debug mode on load
  await initializePopupDebug(); // Initialize debug first so other logs work
  await initializeTheme();
  await initializeDebugMode();
  loadVersion();

  // Settings Modal Handlers
  if (settingsBtn) {
    settingsBtn.onclick = async () => {
      try {
        await updateAuthDisplay();
        await updateLicenseDisplay();
        settingsModal.style.display = 'flex';
      // Setup keyboard navigation for the modal
      setupModalKeyboardNavigation(settingsModal);
    } catch (error) {
      debugError('Error opening settings:', error);
      showNotification('❌ Failed to open settings', 'error');
    }
  };
  }

  // Coffee Button Handler
  if (coffeeBtn) {
    coffeeBtn.onclick = () => {
      tabsAPI.create({ url: 'https://www.buymeacoffee.com/0xdps' });
    };
  }

  // Auth Modal Elements
  const authModal = document.getElementById('authModal');
  const closeAuthModal = document.getElementById('closeAuthModal');
  const authModalTitle = document.getElementById('authModalTitle');
  const authEmail = document.getElementById('authEmail');
  const authPassword = document.getElementById('authPassword');
  const authName = document.getElementById('authName');
  const authNameField = document.getElementById('authNameField');
  const authSubmitBtn = document.getElementById('authSubmitBtn');
  const authToggleLink = document.getElementById('authToggleLink');
  const authToggleText = document.getElementById('authToggleText');
  
  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  const googleSignInBtn = document.getElementById('googleSignInBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const syncLicenseBtn = document.getElementById('syncLicenseBtn');
  
  let authMode = 'login'; // 'login' or 'signup'

  // Google Sign-In handler - opens website for authentication
  if (googleSignInBtn) {
    googleSignInBtn.onclick = () => {
      // Open the web-based authentication page
      tabsAPI.create({ url: 'https://pinboard-gpt.dps.codes/auth/login' });
      
      // Show a message
      showNotification('Please sign in on the opened page. Your access will sync automatically.', 'info');
    };
  }

  // Email/password authentication removed - only Google Sign-In supported
  // Login and signup modals no longer needed

  // Logout handler
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      try {
        const result = await logoutUser();
        if (result.success) {
          showNotification(result.message, 'success');
          await updateAuthDisplay();
          await updateLicenseDisplay();
          await updateLicenseBadge();
        } else {
          showNotification(result.message || 'Logout failed', 'error');
        }
      } catch (error) {
        debugError('Error during logout:', error);
        showNotification('❌ Logout failed', 'error');
      }
    };
  }

  // Sync license handler
  if (syncLicenseBtn) {
    syncLicenseBtn.onclick = async () => {
      try {
        syncLicenseBtn.disabled = true;
        syncLicenseBtn.textContent = 'Syncing...';
        
        const result = await syncLicenseFromServer();
        
        syncLicenseBtn.disabled = false;
        syncLicenseBtn.innerHTML = '<span class="btn-icon">🔄</span><span>Sync License</span>';
        
        if (result.success) {
          showNotification('License synced successfully!', 'success');
          await updateLicenseDisplay();
          await updateLicenseBadge();
        } else {
          showNotification(result.message || 'Sync failed', 'error');
        }
      } catch (error) {
        debugError('Error syncing license:', error);
        syncLicenseBtn.disabled = false;
        syncLicenseBtn.innerHTML = '<span class="btn-icon">🔄</span><span>Sync License</span>';
        showNotification('❌ License sync failed', 'error');
      }
    };
  }

  // Update auth display (show/hide login vs account sections)
  async function updateAuthDisplay() {
    const authSection = document.getElementById('authSection');
    const accountSection = document.getElementById('accountSection');
    const userEmailEl = document.getElementById('userEmail');
    
    const loggedIn = await isLoggedIn();
    
    if (loggedIn) {
      const result = await storageAPI.local.get(['userData']);
      const userData = result.userData;
      
      authSection.style.display = 'none';
      accountSection.style.display = 'block';
      if (userEmailEl && userData) {
        userEmailEl.textContent = userData.email;
      }
    } else {
      authSection.style.display = 'block';
      accountSection.style.display = 'none';
    }
  }

  // License key activation removed - licenses managed server-side
  // Update license display in settings
  async function updateLicenseDisplay() {
    const currentPlanEl = document.getElementById('currentPlan');
    const licenseDetailsEl = document.getElementById('licenseDetails');
    
    if (!currentPlanEl || !licenseDetailsEl) return;

    const license = await getLicense();
    const result = await storageAPI.local.get(['licenseData']);
    const licenseData = result.licenseData;

    let planText = 'Free';
    let detailsText = 'Up to 10 pins, local storage only';

    if (license === LICENSE_TYPES.PRO) {
      planText = 'Pro • <a href="#" id="upgradeToPremiumLink" style="color: var(--primary); cursor: pointer;">Upgrade to Premium</a>';
      if (licenseData?.complementary) {
        const expiryDate = new Date(licenseData.complementaryExpiry);
        detailsText = `✨ Complementary access (expires ${expiryDate.toLocaleDateString()})`;
      } else {
        detailsText = 'Unlimited pins, sync, export, multi-AI';
      }
    } else if (license === LICENSE_TYPES.PREMIUM) {
      planText = 'Premium';
      if (licenseData?.complementary) {
        const expiryDate = new Date(licenseData.complementaryExpiry);
        detailsText = `✨ Complementary access (expires ${expiryDate.toLocaleDateString()})`;
      } else {
        detailsText = 'Unlimited pins, cloud sync, cross-browser';
      }
    }

    currentPlanEl.innerHTML = planText;
    licenseDetailsEl.textContent = detailsText;
    
    // Add event listener for upgrade to premium link if it exists
    const upgradeToPremiumLink = document.getElementById('upgradeToPremiumLink');
    if (upgradeToPremiumLink) {
      upgradeToPremiumLink.onclick = (e) => {
        e.preventDefault();
        tabsAPI.create({ url: 'https://pinboard-gpt.dps.codes/pricing.html?plan=premium' });
      };
    }
  }

  // Delete All Pins Handler
  deleteAllBtn.onclick = () => {
    deleteAllPins();
  };

  closeSettings.onclick = () => {
    settingsModal.style.display = 'none';
  };

  // Close modal when clicking on overlay
  const settingsOverlay = settingsModal.querySelector('.modal-overlay');
  if (settingsOverlay) {
    settingsOverlay.addEventListener('click', () => {
      settingsModal.style.display = 'none';
    });
  }

  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && settingsModal.style.display !== 'none') {
      settingsModal.style.display = 'none';
    }
  });

  async function getPins() { 
    try {
      const pins = await idbGetAll();
      return pins;
    } catch (err) {
      return [];
    }
  }

  // Helper function for relative time display
  function getRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return days === 1 ? '1 day ago' : `${days} days ago`;
    } else if (hours > 0) {
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    } else if (minutes > 0) {
      return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
    } else {
      return 'Just now';
    }
  }

  // Centralized pin opening function
  async function openPin(pinId) {
    const stored = (await getPins()).find(x => x.id === pinId);
    if (stored?.pageUrl) {
      debugLog('Opening pin:', stored.id, stored.pageUrl);
      runtimeAPI.sendMessage({ action: 'open-and-highlight', pin: stored }, (resp) => {
        debugLog('Response from background script:', resp, 'Error:', runtimeAPI.lastError);
        if (runtimeAPI.lastError) {
          debugLog('Background script error:', runtimeAPI.lastError.message);
          showNotification('Error communicating with background script', 'error');
          return;
        } else if (resp?.success) {
          if (resp.highlighted) {
            // Success - pin was highlighted
            window.close();
          } else {
            // Pin was opened but not highlighted
            showNotification('Pin opened but message not found on page', 'warning');
            setTimeout(() => window.close(), UI_CONFIG.timing.windowCloseDelay);
          }
        } else {
          // Error response from background script
          debugLog('Highlighting failed:', resp?.error);
          showNotification('Pin opened but highlighting failed', 'warning');
          setTimeout(() => window.close(), UI_CONFIG.timing.windowCloseDelay);
        }
      });
    } else {
      showNotification('No original page URL saved for this pin.', 'error');
    }
  }

  // Open pin always in a new tab (popup action)
  async function openPinInNewTab(pinId) {
    const stored = (await getPins()).find(x => x.id === pinId);
    if (!stored?.pageUrl) {
      showNotification('No original page URL saved for this pin.', 'error');
      return;
    }
    // Delegate to background script for centralized tab handling
    runtimeAPI.sendMessage({ action: 'open-and-highlight', pin: stored, forceNewTab: true }, (resp) => {
      if (runtimeAPI.lastError) {
        debugLog('Error sending open-and-highlight from popup:', runtimeAPI.lastError.message);
        showNotification('Failed to open pin', 'error');
        return;
      }
      if (resp?.success) {
        if (resp.highlighted) {
          window.close();
        } else {
          showNotification('Opened in new tab but message not found', 'warning');
          setTimeout(() => window.close(), UI_CONFIG.timing.windowCloseDelay);
        }
      } else {
        debugLog('Background failed to open-and-highlight:', resp?.error);
        showNotification('Failed to open pin', 'error');
      }
    });
  }

  // Custom confirmation modal
  function showConfirmation(title, message) {
    return new Promise((resolve) => {
      const modal = document.getElementById('confirmModal');
      const titleEl = document.getElementById('confirmTitle');
      const messageEl = document.getElementById('confirmMessage');
      const cancelBtn = document.getElementById('confirmCancel');
      const exportBtn = document.getElementById('confirmExport');
      const okBtn = document.getElementById('confirmOK');
      const overlay = modal.querySelector('.modal-overlay');
      
      titleEl.textContent = title;
      messageEl.textContent = message;
      
      // Hide export button by default
      exportBtn.style.display = 'none';
      
      modal.style.display = 'flex';
      
      // Setup keyboard navigation for the modal
      setupModalKeyboardNavigation(modal);
      
      function cleanup() {
        modal.style.display = 'none';
        cancelBtn.removeEventListener('click', handleCancel);
        exportBtn.removeEventListener('click', handleExport);
        okBtn.removeEventListener('click', handleOK);
        if (overlay) {
          overlay.removeEventListener('click', handleCancel);
        }
      }
      
      function handleCancel() {
        cleanup();
        resolve('cancel');
      }
      
      function handleExport() {
        cleanup();
        resolve('export');
      }
      
      function handleOK() {
        cleanup();
        resolve('delete');
      }
      
      cancelBtn.addEventListener('click', handleCancel);
      exportBtn.addEventListener('click', handleExport);
      okBtn.addEventListener('click', handleOK);
      if (overlay) {
        overlay.addEventListener('click', handleCancel);
      }
    });
  }

  // Enhanced confirmation modal with export option for delete all
  function showDeleteAllConfirmation(title, message) {
    return new Promise((resolve) => {
      const modal = document.getElementById('confirmModal');
      const titleEl = document.getElementById('confirmTitle');
      const messageEl = document.getElementById('confirmMessage');
      const cancelBtn = document.getElementById('confirmCancel');
      const exportBtn = document.getElementById('confirmExport');
      const okBtn = document.getElementById('confirmOK');
      
      titleEl.textContent = title;
      messageEl.textContent = message;
      
      // Show export button for delete all
      exportBtn.style.display = 'inline-block';
      
      modal.style.display = 'flex';
      
      // Setup keyboard navigation for the modal
      setupModalKeyboardNavigation(modal);
      
      function cleanup() {
        modal.style.display = 'none';
        cancelBtn.removeEventListener('click', handleCancel);
        exportBtn.removeEventListener('click', handleExport);
        okBtn.removeEventListener('click', handleOK);
      }
      
      function handleCancel() {
        cleanup();
        resolve('cancel');
      }
      
      function handleExport() {
        cleanup();
        resolve('export');
      }
      
      function handleOK() {
        cleanup();
        resolve('delete');
      }
      
      cancelBtn.addEventListener('click', handleCancel);
      exportBtn.addEventListener('click', handleExport);
      okBtn.addEventListener('click', handleOK);
    });
  }

  // Centralized pin deletion function with confirmation
  async function deletePin(pinId) {
    const pin = (await getPins()).find(x => x.id === pinId);
    if (!pin) return;
    
    const title = pin.name || pin.messageText.slice(0, UI_CONFIG.textLengths.selectionTextTrimWhenLarge) + (pin.messageText.length > UI_CONFIG.textLengths.selectionTextTrimWhenLarge ? '...' : '');
    
    const confirmed = await showConfirmation('Delete Pin', `Delete "${title}"?`);
    if (confirmed) {
      try {
        await idbDelete(pinId);
        await render();
      } catch (err) {
        debugError('Failed to delete pin:', err);
      }
    }
  }

  // Delete all pins function with confirmation
  async function deleteAllPins() {
    try {
      const pins = await getPins();
      if (pins.length === 0) {
        showNotification('No pins to delete.', 'info');
        return;
      }

      const result = await showDeleteAllConfirmation(
        'Delete All Pins', 
        `Are you sure you want to delete all ${pins.length} pins? This action cannot be undone. Consider exporting first to create a backup.`
      );
      
      if (result === 'export') {
        // Export pins first, then ask again
        try {
          const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            pinCount: pins.length,
            pins: pins
          };
          
          const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const dateStr = new Date().toISOString().split('T')[0];
          a.download = `gpt-pinboard-backup-${dateStr}.json`;
          a.click();
          URL.revokeObjectURL(url);
          
          showNotification(`Exported ${pins.length} pins successfully. You can now safely delete all pins.`, 'success');
          
          // Ask again after export
          setTimeout(() => deleteAllPins(), 1000);
        } catch (err) {
          debugError('Export failed:', err);
          showNotification('Export failed. Please try again.', 'error');
        }
      } else if (result === 'delete') {
        // Delete all pins using the proper IndexedDB clear function
        await idbClear();
        
        // Close settings modal
        settingsModal.style.display = 'none';
        
        // Re-render the UI
        await render();
        
        showNotification(`Successfully deleted all ${pins.length} pins.`, 'success');
      }
      // If result === 'cancel', do nothing
    } catch (err) {
      debugError('Failed to delete all pins:', err);
      showNotification('Failed to delete all pins.', 'error');
    }
  }

  // Simple notification system
  function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification status-indicator ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: var(--space-4);
      right: var(--space-4);
      z-index: 1001;
      box-shadow: var(--shadow-lg);
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
      }, UI_CONFIG.timing.notificationDuration);
  }

  function escapeHtml(s){ return (s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

  // Calculate search relevance for better sorting
  function getSearchRelevance(pin, query) {
    if (!query) return 0;
    
    let score = 0;
    const q = query.toLowerCase();
    
    // Title matches get highest score
    if (pin.name && pin.name.toLowerCase().includes(q)) {
      score += pin.name.toLowerCase() === q ? 100 : 50;
    }
    
    // Tag matches get high score
    if (pin.tags) {
      const exactTagMatch = pin.tags.some(tag => tag.toLowerCase() === q);
      const partialTagMatch = pin.tags.some(tag => tag.toLowerCase().includes(q));
      if (exactTagMatch) score += 80;
      else if (partialTagMatch) score += 40;
    }
    
    // Message content matches get moderate score
    if (pin.messageText && pin.messageText.toLowerCase().includes(q)) {
      // Boost if query appears near the beginning
      const index = pin.messageText.toLowerCase().indexOf(q);
      score += index < 100 ? 30 : 20;
    }
    
    return score;
  }

  function renderPin(pin) {
    // Clone the template
    const template = document.getElementById('pinTemplate');
    const pinElement = template.cloneNode(true);
    
    // Remove the template ID and make it visible
    pinElement.removeAttribute('id');
    pinElement.style.display = 'flex';
    pinElement.setAttribute('data-pin-id', pin.id);
    pinElement.setAttribute('data-pin-type', pin.type || 'message');
    
    // Add visual indicator for chat pins
    if (pin.type === 'chat') {
      pinElement.classList.add('chat-pin');
    }
    
    // Add click handler to the entire card (for opening)
    pinElement.style.cursor = 'pointer';
    pinElement.addEventListener('click', async (e) => {
      // Don't trigger if clicking on action buttons
      if (e.target.closest('.pin-actions')) {
        return;
      }
      // Open the pin
      try {
        await openPin(pin.id);
      } catch (error) {
        debugError('Error opening pin:', error);
        showNotification('❌ Failed to open pin', 'error');
      }
    });
    
    // Get elements to populate
    const titleEl = pinElement.querySelector('.pin-title');
    const previewEl = pinElement.querySelector('.pin-preview');
    const tagsEl = pinElement.querySelector('.pin-tags');
    const openBtn = pinElement.querySelector('.open-btn');
    const editBtn = pinElement.querySelector('.edit-btn');
    const deleteBtn = pinElement.querySelector('.delete-btn');
    
    // Handle different pin types
    let title, messagePreview;
    
    if (pin.type === 'chat') {
      // Chat pin
      title = '💬 ' + (pin.chatTitle || 'Untitled Chat');
      // Show description if available, otherwise show default text
      messagePreview = pin.description || pin.messageText || 'Entire conversation pinned';
    } else {
      // Message pin
      title = pin.name ? escapeHtml(pin.name.trim()) : '';
      const messageLength = 200;
      messagePreview = pin.messageText && pin.messageText.length > messageLength 
        ? pin.messageText.slice(0, messageLength).trim() + '…' 
        : (pin.messageText || '');
    }
    
    // Set title (hide if empty)
    if (title) {
      titleEl.textContent = title;
      titleEl.style.display = 'block';
    } else {
      titleEl.style.display = 'none';
    }
    
    // Set preview with better formatting
    if (previewEl) {
      previewEl.textContent = messagePreview;
    }
    
    // Set tags with improved design
    if (pin.tags?.length) {
      // Clear existing tags safely
      while (tagsEl.firstChild) {
        tagsEl.removeChild(tagsEl.firstChild);
      }
      
      // Create tag elements safely using DocumentFragment for better performance
      const fragment = document.createDocumentFragment();
      pin.tags.slice(0, 5).forEach(tag => { // Limit to 5 tags for UI
        const tagSpan = document.createElement('span');
        tagSpan.className = 'pin-tag';
        tagSpan.setAttribute('data-tag', tag);
        tagSpan.textContent = tag;
        tagSpan.title = `Search for "${tag}"`;
        tagSpan.style.cursor = 'pointer';
        tagSpan.addEventListener('click', (e) => {
          e.stopPropagation();
          search.value = tag;
          search.dispatchEvent(new Event('input', { bubbles: true }));
        });
        fragment.appendChild(tagSpan);
      });
      tagsEl.appendChild(fragment);
    } else {
      tagsEl.style.display = 'none';
    }
    
    // Set button data and enhanced tooltips
    openBtn.setAttribute('data-id', pin.id);
    openBtn.setAttribute('data-tooltip', 'Open pin in new tab');
    openBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await openPinInNewTab(pin.id);
      } catch (error) {
        debugError('Error opening pin in new tab:', error);
        showNotification('❌ Failed to open pin', 'error');
      }
    });

    // Edit button - open edit modal
    if (editBtn) {
      editBtn.setAttribute('data-id', pin.id);
      editBtn.setAttribute('data-tooltip', 'Edit pin');
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        try {
          openEditModal(pin.id);
        } catch (error) {
          debugError('Error opening edit modal:', error);
          showNotification('❌ Failed to open editor', 'error');
        }
      });
    }
    
    deleteBtn.setAttribute('data-id', pin.id);
    deleteBtn.setAttribute('data-tooltip', 'Delete pin (Del)');
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await deletePin(pin.id);
      } catch (error) {
        debugError('Error deleting pin:', error);
        showNotification('❌ Failed to delete pin', 'error');
      }
    });
    
    // Add keyboard navigation
    pinElement.setAttribute('tabindex', '0');
    pinElement.addEventListener('keydown', async (e) => {
      try {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          await openPin(pin.id);
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          await deletePin(pin.id);
        }
      } catch (error) {
        debugError('Error handling keyboard navigation:', error);
        showNotification('❌ Action failed', 'error');
      }
    });
    
    return pinElement;
  }

  // --- Edit modal handling ---
  function initEditModal() {
    const editModal = document.getElementById('editModal');
    const closeBtn = document.getElementById('closeEditModal');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const saveBtn = document.getElementById('saveEditBtn');
    const titleInput = document.getElementById('editTitle');
    const descInput = document.getElementById('editDesc');
    const tagsInput = document.getElementById('editTags');
    const editOverlay = editModal.querySelector('.modal-overlay');

    let currentEditingId = null;
    let removeKeyboardHandler = null;

    function close() {
      editModal.style.display = 'none';
      currentEditingId = null;
      if (removeKeyboardHandler) {
        removeKeyboardHandler();
      }
    }

    closeBtn.addEventListener('click', close);
    cancelBtn.addEventListener('click', close);
    if (editOverlay) {
      editOverlay.addEventListener('click', close);
    }

    saveBtn.addEventListener('click', async () => {
      if (!currentEditingId) return;
      const pins = await getPins();
      const pin = pins.find(p => p.id === currentEditingId);
      if (!pin) {
        showNotification('Pin not found', 'error');
        close();
        return;
      }

      pin.name = titleInput.value.trim();
      pin.description = descInput.value.trim();
      const rawTags = tagsInput.value.split(',').map(t => t.trim()).filter(Boolean);
      // Normalize: lowercase and remove duplicates
      const normalized = Array.from(new Set(rawTags.map(t => t.toLowerCase())));
      pin.tags = normalized;

      try {
        await idbAdd(pin);
        await render();
        showNotification('Pin updated', 'success');
      } catch (err) {
        debugLog('Failed to save edited pin:', err);
        showNotification('Failed to update pin', 'error');
      }
      close();
    });

    return {
      open: async (pinId) => {
        const pins = await getPins();
        const pin = pins.find(p => p.id === pinId);
        if (!pin) return;
        currentEditingId = pinId;
        titleInput.value = pin.name || '';
        descInput.value = pin.description || (pin.messageText && pin.messageText.slice(0, UI_CONFIG.textLengths.messagePreviewMax)) || '';
        tagsInput.value = (pin.tags || []).join(', ');
        editModal.style.display = 'flex';
        
        // Setup keyboard navigation for the modal
        removeKeyboardHandler = setupModalKeyboardNavigation(editModal);
      }
    };
  }

  const editModalController = initEditModal();

  function openEditModal(pinId) {
    editModalController.open(pinId);
  }

  async function render() {
    // Show loading state for long operations
    const isLoading = listEl.children.length === 0;
    if (isLoading) {
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'loading-state';
      loadingDiv.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--space-8);
        gap: var(--space-3);
        color: var(--text-tertiary);
      `;
      const loadingSpinner = document.createElement('div');
      loadingSpinner.className = 'loading';
      const loadingText = document.createElement('span');
      loadingText.textContent = 'Loading pins...';
      loadingDiv.appendChild(loadingSpinner);
      loadingDiv.appendChild(loadingText);
      listEl.appendChild(loadingDiv);
    }
    
    const pins = await getPins();
    const q = search.value.trim().toLowerCase();
    
    // Clear list safely
    while (listEl.firstChild) {
      listEl.removeChild(listEl.firstChild);
    }
    
    const filtered = pins.filter(p => {
      // Apply filter type
      if (currentFilter === 'chats' && p.type !== 'chat') return false;
      if (currentFilter === 'messages' && p.type === 'chat') return false;
      
      if (!q) return true;
      
      // Handle tag-specific search
      if (q.startsWith('tag:')) {
        const tagQuery = q.substring(4).trim();
        return p.tags && p.tags.some(tag => tag.toLowerCase().includes(tagQuery));
      }
      
      // Enhanced search - include partial matches and better relevance
      const searchTerms = q.split(' ').filter(term => term.length > 0);
      return searchTerms.every(term => 
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.chatTitle && p.chatTitle.toLowerCase().includes(term)) ||
        (p.messageText && p.messageText.toLowerCase().includes(term)) ||
        (p.tags && p.tags.join(' ').toLowerCase().includes(term)) ||
        (p.site && p.site.toLowerCase().includes(term))
      );
    }).sort((a,b) => {
      // Better sorting: prioritize recent pins, but boost exact matches
      const aRelevance = getSearchRelevance(a, q);
      const bRelevance = getSearchRelevance(b, q);
      
      if (aRelevance !== bRelevance) {
        return bRelevance - aRelevance;
      }
      
      // Sort by pinnedAt (most recent first), fallback to timestamp
      const aTime = a.pinnedAt || a.timestamp || 0;
      const bTime = b.pinnedAt || b.timestamp || 0;
      return bTime - aTime;
    });
    
    // Only show counter when actively searching, not when using filter tabs
    if (q) {
      updateSearchResults(filtered.length, pins.length, q);
    } else {
      // Remove counter when not searching (including filter tabs)
      const existingCounter = document.querySelector('.search-results-counter');
      if (existingCounter) {
        existingCounter.remove();
      }
    }
    
    
    if (!filtered.length) {
      // Create modern empty state
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'empty-state';
      
      const iconDiv = document.createElement('div');
      
      const img = document.createElement('img');
      img.src = 'icons/icon-32.png';
      img.width = 32;
      img.height = 32;
      img.alt = 'Pinboard GPT';
      
      iconDiv.appendChild(img);
      
      const messageP = document.createElement('p');
      
      if (q) {
        // Search found no results
        messageP.textContent = 'No pins found for "';
        const strongEl = document.createElement('strong');
        strongEl.textContent = q;
        messageP.appendChild(strongEl);
        messageP.appendChild(document.createTextNode('"'));
      } else if (currentFilter === 'chats') {
        // No chat pins
        messageP.textContent = 'No chat pins yet!\n\nVisit ChatGPT and click the "Pin Chat" button to save entire conversations here.';
        messageP.style.whiteSpace = 'pre-line';
      } else if (currentFilter === 'messages') {
        // No message pins
        messageP.textContent = 'No message pins yet!\n\nVisit ChatGPT and click the pin button next to any message to save it here.';
        messageP.style.whiteSpace = 'pre-line';
      } else {
        // No pins at all
        messageP.textContent = 'No pins yet!\n\nVisit ChatGPT and click the pin button next to any message to save it here.';
        messageP.style.whiteSpace = 'pre-line';
      }
      
      emptyDiv.appendChild(iconDiv);
      emptyDiv.appendChild(messageP);
      
      listEl.appendChild(emptyDiv);
      return;
    }
    
    // Render pins using DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    filtered.forEach(p => {
      const el = renderPin(p);
      fragment.appendChild(el);
    });
    listEl.appendChild(fragment);

    // Add event listeners for tag links
    document.querySelectorAll('.pin-tag').forEach(tagEl => {
      tagEl.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const tag = e.target.dataset.tag;
        search.value = `tag:${tag}`;
        updateClearButton();
        render(); // Re-render with new search
      };
    });

    // Event listeners are now attached in renderPin function for better performance
    // and to avoid memory leaks from repeated event listener attachments
  }

  // Function to update clear button visibility
  function updateClearButton() {
    if (searchContainer) {
      if (search.value.trim()) {
        searchContainer.classList.add('has-content');
      } else {
        searchContainer.classList.remove('has-content');
      }
    }
  }

  // Add search result counter
  function updateSearchResults(filteredCount, totalCount, query) {
    // Remove existing counter
    const existingCounter = document.querySelector('.search-results-counter');
    if (existingCounter) {
      existingCounter.remove();
    }
    
    if (query || filteredCount !== totalCount) {
      const counter = document.createElement('div');
      counter.className = 'search-results-counter';
      counter.style.cssText = `
        margin-top: var(-1 * --space-2);
        padding: var(--space-2) var(--space-5);
        font-size: var(--font-size-xs);
        color: var(--text-tertiary);
        border-bottom: 1px solid var(--border-color);
        background: var(--bg-secondary);
      `;
      
      if (query) {
        if (filteredCount === 0) {
          counter.textContent = `No results for "${query}"`;
        } else {
          counter.textContent = `${filteredCount} result${filteredCount !== 1 ? 's' : ''} for "${query}"`;
        }
      } else {
        counter.textContent = `Showing ${filteredCount} of ${totalCount} pins`;
      }
      
      // Insert after search container
      if (searchContainer) {
        searchContainer.insertAdjacentElement('afterend', counter);
      } else {
        listEl.insertAdjacentElement('beforebegin', counter);
      }
    }
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Escape key clears search or closes modal
    if (e.key === 'Escape') {
      if (search.value) {
        search.value = '';
        updateClearButton();
        render();
        e.preventDefault();
      } else if (settingsModal.style.display === 'flex') {
        settingsModal.style.display = 'none';
        e.preventDefault();
      }
    }
    
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      search.focus();
      search.select();
      e.preventDefault();
    }
    
    // Ctrl/Cmd + , to open settings
    if ((e.ctrlKey || e.metaKey) && e.key === ',') {
      settingsModal.style.display = 'flex';
      e.preventDefault();
    }
  });

  // Debounce search for better performance
  let searchTimeout;
  search.addEventListener('input', () => {
    updateClearButton();
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Show instant feedback for clearing search
    if (!search.value.trim()) {
      render();
      return;
    }
    
    // Debounce other searches
    searchTimeout = setTimeout(() => {
      render();
    }, UI_CONFIG.timing.transitionDuration);
  });

  exportBtn.onclick = async () => {
    try {
      const pins = await getPins();
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        pinCount: pins.length,
        pins: pins
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `gpt-pinboard-backup-${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      showNotification(`Exported ${pins.length} pins successfully`, 'success');
    } catch (err) {
      showNotification('Export failed: ' + err.message, 'error');
    }
  };

  importBtn.onclick = () => importFile.click();
  importFile.onchange = async (ev) => {
    const f = ev.target.files[0];
    if (!f) return;
    
    try {
      const text = await f.text();
      const data = JSON.parse(text);
      
      // Only support structured export format (v1.0+)
      if (!data.pins || !Array.isArray(data.pins)) {
        throw new Error('Invalid file format. Please use a file exported from Pinboard GPT v1.0 or later.');
      }
      
      const pins = data.pins;
      
      if (pins.length === 0) {
        showNotification('No pins found in file', 'warning');
        return;
      }
      
      // Validate and import pins
      let imported = 0;
      let skipped = 0;
      
      for (const p of pins) {
        try {
          // Validate required fields
          if (!p.messageText) {
            skipped++;
            continue;
          }
          
          // Generate ID if missing
          p.id = p.id || crypto.randomUUID();
          
          // Set default values for missing fields
          p.pinnedAt = p.pinnedAt || Date.now();
          p.site = p.site || 'ChatGPT';
          p.tags = p.tags || [];
          
          await idbAdd(p);
          imported++;
        } catch (err) {
          debugError('Failed to import pin:', err);
          skipped++;
        }
      }
      
      await render();
      
      if (imported > 0) {
        let message = `Imported ${imported} pin${imported !== 1 ? 's' : ''} successfully`;
        if (skipped > 0) {
          message += ` (${skipped} skipped)`;
        }
        showNotification(message, 'success');
      } else {
        showNotification('No valid pins could be imported', 'error');
      }
      
    } catch (err) {
      showNotification('Import failed: ' + err.message, 'error');
    }
    
    // Reset file input
    ev.target.value = '';
  };

  // Help link handler
  document.addEventListener('click', (e) => {
    if (e.target.id === 'helpLink') {
      e.preventDefault();
      tabsAPI.create({ url: 'https://pinboard-gpt.dps.codes/support.html' });
    }
  });

  // Filter tab handlers
  function setActiveFilter(filter) {
    currentFilter = filter;
    filterAll.classList.toggle('active', filter === 'all');
    filterChats.classList.toggle('active', filter === 'chats');
    filterMessages.classList.toggle('active', filter === 'messages');
    render();
  }
  
  filterAll.addEventListener('click', () => setActiveFilter('all'));
  filterChats.addEventListener('click', () => setActiveFilter('chats'));
  filterMessages.addEventListener('click', () => setActiveFilter('messages'));

  // License Badge Display
  async function updateLicenseBadge() {
    const license = await getLicense();
    const headerActions = document.querySelector('.header-actions');
    const syncStatus = document.getElementById('syncStatus');
    const upgradeBtn = document.getElementById('upgradeBtn');
    const coffeeBtn = document.getElementById('coffeeBtn');
    
    // Remove existing badge
    const existingBadge = document.querySelector('.license-badge');
    if (existingBadge) existingBadge.remove();
    
    // Add badge for Pro and above
    if (license !== LICENSE_TYPES.FREE) {
      const badge = document.createElement('span');
      badge.className = `license-badge ${license}`;
      badge.textContent = license === LICENSE_TYPES.PRO ? 'PRO' : 'PREMIUM';
      headerActions.prepend(badge);

      syncStatus.textContent = license === LICENSE_TYPES.PRO ? 'Pro' : 'Premium';
      syncStatus.classList.add('pro');
      // Hide upgrade button for PRO/PREMIUM users
      if (upgradeBtn) upgradeBtn.style.display = 'none';
      if (license === LICENSE_TYPES.PREMIUM && coffeeBtn) coffeeBtn.style.display = 'none';
    } else {
      syncStatus.textContent = 'Free';
      syncStatus.classList.remove('pro');
      // Show upgrade button for FREE users
      if (upgradeBtn) upgradeBtn.style.display = 'block';
    }
  }

  // Upgrade Modal Handlers
  if (upgradeBtn) {
    upgradeBtn.onclick = () => {
      tabsAPI.create({ url: 'https://pinboard-gpt.dps.codes/pricing.html' });
    };
  }

  closeUpgrade.onclick = () => {
    upgradeModal.style.display = 'none';
  };

  const upgradeOverlay = upgradeModal.querySelector('.modal-overlay');
  if (upgradeOverlay) {
    upgradeOverlay.addEventListener('click', () => {
      upgradeModal.style.display = 'none';
    });
  }

  upgradeButtons.forEach(btn => {
    btn.onclick = async () => {
      const plan = btn.dataset.plan;
      
      if (plan === 'pro') {
        // Open payment link for Pro
        tabsAPI.create({ url: 'https://pinboard-gpt.dps.codes/upgrade?plan=pro' });
      } else if (plan === 'premium') {
        // Open payment link for Premium
        tabsAPI.create({ url: 'https://pinboard-gpt.dps.codes/upgrade?plan=premium' });
      }
      
      upgradeModal.style.display = 'none';
    };
  });

  // Show upgrade modal function (now opens pricing page in tab)
  async function showUpgradeModal() {
    const license = await getLicense();
    let url = 'https://pinboard-gpt.dps.codes/pricing.html';
    
    // Add plan parameter based on current license
    if (license === LICENSE_TYPES.FREE) {
      url += '?plan=pro';
    } else if (license === LICENSE_TYPES.PRO) {
      url += '?plan=premium';
    }
    
    tabsAPI.create({ url });
  }

  // Check license before certain actions
  exportBtn.onclick = async () => {
    const hasExport = await hasFeature('export');
    if (!hasExport) {
      tabsAPI.create({ url: 'https://pinboard-gpt.dps.codes/pricing.html?plan=pro' });
      return;
    }
    
    const pins = await getPins();
    if (!pins.length) {
      showNotification('No pins to export.', 'info');
      return;
    }

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      pinCount: pins.length,
      pins: pins
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `pinboard-gpt-backup-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showNotification(`Exported ${pins.length} pins successfully.`, 'success');
  };

  await updateLicenseBadge();
  updateClearButton();
  await render();
});
