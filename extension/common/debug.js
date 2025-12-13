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
  // Detect ChatGPT's dark mode
  const isDarkMode = document.documentElement.classList.contains('dark') ||
                     document.body.classList.contains('dark');
  
  // Theme colors that match ChatGPT's palette
  const themeColors = {
    success: isDarkMode 
      ? { bg: '#ff6b35', text: '#ffffff', border: '#d65a2b' }
      : { bg: '#ff6b35', text: '#ffffff', border: '#d65a2b' },
    error: isDarkMode 
      ? { bg: '#d33b27', text: '#ffffff', border: '#b03020' }
      : { bg: '#d33b27', text: '#ffffff', border: '#b03020' },
    warning: isDarkMode 
      ? { bg: '#f57c00', text: '#ffffff', border: '#d46b00' }
      : { bg: '#f57c00', text: '#ffffff', border: '#d46b00' },
    info: isDarkMode 
      ? { bg: '#1a73e8', text: '#ffffff', border: '#1557b0' }
      : { bg: '#1a73e8', text: '#ffffff', border: '#1557b0' }
  };
  
  const colors = themeColors[type] || themeColors.success;
  
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
    box-shadow: 0 8px 24px ${isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'};
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
