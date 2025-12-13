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
 * @param {string} type - Type of notification: 'success', 'error', 'warning', 'info' (default: 'success')
 */
function showNotification(message, duration = 2000, type = 'success') {
  // Determine theme colors
  const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const themeColors = {
    success: { bg: '#10a37f', text: '#ffffff' },
    error: { bg: '#d33b27', text: '#ffffff' },
    warning: { bg: '#f57c00', text: '#ffffff' },
    info: { bg: '#1a73e8', text: '#ffffff' }
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
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease;
    font-family: system-ui, -apple-system, sans-serif;
    max-width: 400px;
    word-wrap: break-word;
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
