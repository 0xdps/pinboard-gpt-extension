/**
 * Debug Utility Module
 * Consolidated logging and notification functions for all extension scripts
 */

// Global debug flag - can be enabled via console: window.debugEnabled = true
window.debugEnabled = window.debugEnabled || false;

// Initialize debug mode from storage on page load
if (typeof chrome !== 'undefined' && chrome.storage) {
  try {
    chrome.storage.local.get(['debugMode'], (result) => {
      if (result.debugMode === true) {
        window.debugEnabled = true;
        console.log('[Pinboard GPT] Debug mode ENABLED from storage');
      }
    });
  } catch (e) {
    // Ignore errors during initialization
  }
}

/**
 * Conditional logging function
 * Only logs when debugEnabled is true
 * @param {...any} args - Arguments to log
 */
function debugLog(...args) {
  if (window.debugEnabled) {
    console.log('[Pinboard GPT]', ...args);
  }
}

/**
 * Conditional error logging function
 * Only logs when debugEnabled is true
 * @param {...any} args - Arguments to log as errors
 */
function debugError(...args) {
  if (window.debugEnabled) {
    console.error('[Pinboard GPT]', ...args);
  }
}

/**
 * Show a toast notification
 * Used in content scripts and extension pages
 * @param {string} message - The notification message
 * @param {number} duration - Duration to show notification in ms (default: 2000)
 * @param {string} type - Type of notification: 'success', 'error', 'warning', 'info' (default: 'success')
 */
function showNotification(message, duration = 2000, type = 'success') {
  // Get notification colors from UI_CONFIG
  const typePrefix = type.charAt(0).toUpperCase() + type.slice(1); // success -> Success
  const colors = {
    bg: UI_CONFIG.get(`notification.${type}Bg`),
    text: UI_CONFIG.get(`notification.${type}Text`),
    border: UI_CONFIG.get(`notification.${type}Border`)
  };
  
  const notif = document.createElement('div');
  notif.textContent = message;
  notif.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    background: ${colors.bg};
    color: ${colors.text};
    padding: 12px 20px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: ${UI_CONFIG.get('notification.boxShadow')};
    animation: slideIn 0.3s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    max-width: 400px;
    word-wrap: break-word;
    border: 1px solid ${colors.border};
  `;
  
  document.body.appendChild(notif);
  
  setTimeout(() => {
    notif.style.opacity = '0';
    notif.style.transition = 'opacity 0.3s';
    setTimeout(() => notif.remove(), UI_CONFIG.timing.notificationRemoveDelay);
  }, duration);
}

/**
 * Export functions for use in modules
 * Note: These are also available globally in the window object
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    debugLog,
    debugError,
    showNotification
  };
}
