/**
 * Debug Utility Module
 * Consolidated logging and notification functions for all extension scripts
 */

// Global debug flag - can be enabled via console: window.debugEnabled = true
window.debugEnabled = window.debugEnabled || false;

/**
 * Conditional logging function
 * Only logs when debugEnabled is true
 * @param {...any} args - Arguments to log
 */
function debugLog(...args) {
  if (window.debugEnabled) {
    console.log(...args);
  }
}

/**
 * Conditional error logging function
 * Only logs when debugEnabled is true
 * @param {...any} args - Arguments to log as errors
 */
function debugError(...args) {
  if (window.debugEnabled) {
    console.error(...args);
  }
}

/**
 * Show a toast notification
 * Used in content scripts and extension pages
 * @param {string} message - The notification message
 * @param {number} duration - Duration to show notification in ms (default: 2000)
 */
function showNotification(message, duration = 2000) {
  const notif = document.createElement('div');
  notif.textContent = message;
  notif.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    background: #10a37f;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(notif);
  
  setTimeout(() => {
    notif.style.opacity = '0';
    notif.style.transition = 'opacity 0.3s';
    setTimeout(() => notif.remove(), 300);
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
