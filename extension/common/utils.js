/**
 * Shared Utility Functions
 * Common helpers used across multiple extension scripts
 */

// ============================================================================
// Browser API Compatibility Wrappers
// ============================================================================

const storageAPI = typeof browser !== 'undefined' ? browser.storage : chrome.storage;
const tabsAPI = typeof browser !== 'undefined' ? browser.tabs : chrome.tabs;
const runtimeAPI = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime;
const isFirefox = typeof browser !== 'undefined' && typeof browser.runtime !== 'undefined';

// ============================================================================
// Extension Context Validation
// ============================================================================

/**
 * Check if extension context is still valid
 * Context becomes invalid when extension is updated/reloaded while page is open
 * @returns {boolean} True if context is valid
 */
function isExtensionContextValid() {
  try {
    // Check multiple indicators of valid extension context
    // chrome.runtime.id is the most reliable indicator
    if (!chrome || !chrome.runtime) return false;
    
    // Try to access runtime.id - this will throw if context is invalid
    const id = chrome.runtime.id;
    return !!id;
  } catch (error) {
    // Silent fail - context is invalid
    return false;
  }
}

// ============================================================================
// DOM Utilities
// ============================================================================

/**
 * Safely get computed style property
 * @param {Element} element - DOM element
 * @param {string} property - CSS property name
 * @returns {string} Property value or empty string
 */
function getComputedStyleProperty(element, property) {
  try {
    return window.getComputedStyle(element)[property] || '';
  } catch (error) {
    debugError('Error getting computed style:', error);
    return '';
  }
}

/**
 * Check if element is visible in viewport
 * @param {Element} element - DOM element
 * @returns {boolean} True if visible
 */
function isElementInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Scroll element into view smoothly
 * @param {Element} element - Element to scroll to
 * @param {Object} options - Scroll options
 */
function scrollIntoViewSmooth(element, options = {}) {
  const defaultOptions = {
    behavior: 'smooth',
    block: 'center',
    inline: 'nearest'
  };
  element.scrollIntoView({ ...defaultOptions, ...options });
}

// ============================================================================
// String Utilities
// ============================================================================

/**
 * Truncate string to max length with ellipsis
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
function truncateString(str, maxLength) {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

/**
 * Generate a unique ID
 * @param {string} prefix - Optional prefix
 * @returns {string} Unique ID
 */
function generateUniqueId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sanitize string for use in HTML
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Normalize text for consistent matching
 * Trims whitespace and normalizes internal spacing
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
function normalizeText(text) {
  if (!text) return '';
  return text.trim().replace(/\s+/g, ' ');
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

// ============================================================================
// Array Utilities
// ============================================================================

/**
 * Remove duplicates from array
 * @param {Array} array - Array with potential duplicates
 * @returns {Array} Array with unique values
 */
function uniqueArray(array) {
  return [...new Set(array)];
}

/**
 * Chunk array into smaller arrays
 * @param {Array} array - Array to chunk
 * @param {number} size - Chunk size
 * @returns {Array<Array>} Array of chunks
 */
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// ============================================================================
// Timing Utilities
// ============================================================================

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function execution
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in ms
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Sleep/delay execution
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after delay
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Storage Size Utilities
// ============================================================================

/**
 * Get size of object in bytes (approximate)
 * @param {any} obj - Object to measure
 * @returns {number} Size in bytes
 */
function getObjectSize(obj) {
  const jsonString = JSON.stringify(obj);
  return new Blob([jsonString]).size;
}

/**
 * Format bytes to human readable string
 * @param {number} bytes - Bytes to format
 * @returns {string} Formatted string (e.g., "1.5 KB")
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// ============================================================================
// Date/Time Utilities
// ============================================================================

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {string} Relative time string
 */
function getRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'just now';
}

/**
 * Format date to readable string
 * @param {Date|number} date - Date object or timestamp
 * @param {string} format - Format type: 'short', 'long', 'time'
 * @returns {string} Formatted date
 */
function formatDate(date, format = 'short') {
  const d = date instanceof Date ? date : new Date(date);
  
  if (format === 'short') {
    return d.toLocaleDateString();
  } else if (format === 'long') {
    return d.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } else if (format === 'time') {
    return d.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  }
  return d.toString();
}

// ============================================================================
// Export for modules (if supported)
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // Browser APIs
    storageAPI,
    tabsAPI,
    runtimeAPI,
    isFirefox,
    // DOM
    getComputedStyleProperty,
    isElementInViewport,
    scrollIntoViewSmooth,
    // String
    truncateString,
    generateUniqueId,
    sanitizeHTML,
    normalizeText,
    // Validation
    isValidEmail,
    isValidUrl,
    // Array
    uniqueArray,
    chunkArray,
    // Timing
    debounce,
    throttle,
    sleep,
    // Storage
    getObjectSize,
    formatBytes,
    // Date/Time
    getRelativeTime,
    formatDate,
    // UI Components
    createTagElement,
    renderTags
  };
}
