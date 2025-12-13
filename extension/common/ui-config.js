/**
 * UI Configuration Constants
 * Centralized configuration for all UI-related values including z-indexes, timeouts, colors, and animations
 */

const UI_CONFIG = {
  // Z-Index Levels (follow stacking context hierarchy)
  zIndex: {
    pinButton: 10000,              // Pin button on ChatGPT
    chatOutlineButton: 10000,      // Chat outline button
    dropdown: 10001,               // Dropdown menus
    dialog: 100000,                // Main dialogs and modals
    modal: 100000,                 // Modal overlays
    upgradeNotification: 100001,   // Upgrade notifications (above dialogs)
    tooltip: 1                     // Tooltips (relative positioning)
  },

  // Animation & Timing (in milliseconds)
  timing: {
    notificationDuration: 2000,    // How long notifications are shown
    navigationWait: 500,            // Wait time before smooth scroll after jump to message
    navigationPolling: 1500,        // Total polling time for navigation
    navigationPollInterval: 100,    // Interval between poll attempts
    debounceDelay: 150,            // Debounce delay for UI interactions
    fadeOutDuration: 300,          // Fade out animation duration
    slideInDuration: 300,          // Slide in animation duration
    transitionDuration: 200,       // General transition duration
    windowCloseDelay: 1500,        // Delay before closing popup window after action
    notificationRemoveDelay: 300,  // Delay before removing notification from DOM
    messageButtonScanInterval: 3000, // Interval to periodically scan for new messages
    errorFeedbackDuration: 500     // How long to show error feedback (red border, etc.)
  },

  // Dialog & Modal Styling
  dialog: {
    maxWidth: '500px',
    padding: '24px',
    borderRadius: '12px',
    boxShadowBlur: '60px',
    backdropFilter: 'blur(4px)',
    zIndex: 100000,
    previewMaxHeight: '150px'
  },

  // Button Styling
  button: {
    zIndex: 10000
  },

  // Toast Notification Styling
  toast: {
    duration: 2000,
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    slideInDuration: '0.3s',
    fadeOutDuration: '0.3s'
  },

  // Modal/Dialog Colors (Light Mode)
  lightMode: {
    dialogBg: '#ffffff',
    dialogText: '#202124',
    headingText: '#202124',
    labelText: '#5f6368',
    inputBg: '#ffffff',
    inputBorder: '#dadce0',
    inputText: '#202124',
    inputPlaceholder: '#9aa0a6',
    previewBg: '#f8f9fa',
    previewBorder: '#e8eaed',
    previewText: '#202124',
    buttonPrimary: '#10a37f',
    buttonPrimaryHover: '#0d8a6a',
    buttonSecondary: '#f8f9fa',
    buttonSecondaryText: '#5f6368',
    buttonSecondaryBorder: '#dadce0',
    buttonSecondaryHover: '#e8eaed',
    backdropBg: 'rgba(0, 0, 0, 0.5)',
    tagBg: '#e8f0fe',
    tagText: '#1a73e8',
    tagBorder: '#aecbfa',
    successColor: '#10a37f',
    errorColor: '#d33b27',
    warningColor: '#f57c00',
    infoColor: '#1a73e8'
  },

  // Modal/Dialog Colors (Dark Mode)
  darkMode: {
    dialogBg: '#2d2d2d',
    dialogText: '#e4e4e4',
    headingText: '#ffffff',
    labelText: '#b8b8b8',
    inputBg: '#1a1a1a',
    inputBorder: '#404040',
    inputText: '#e4e4e4',
    inputPlaceholder: '#808080',
    previewBg: '#1a1a1a',
    previewBorder: '#404040',
    previewText: '#e4e4e4',
    buttonPrimary: '#10a37f',
    buttonPrimaryHover: '#0d8a6a',
    buttonSecondary: '#404040',
    buttonSecondaryText: '#e4e4e4',
    buttonSecondaryBorder: '#505050',
    buttonSecondaryHover: '#505050',
    backdropBg: 'rgba(0, 0, 0, 0.7)',
    tagBg: '#1a3d5f',
    tagText: '#64b5f6',
    tagBorder: '#1565c0',
    successColor: '#10a37f',
    errorColor: '#ef4444',
    warningColor: '#f59e0b',
    infoColor: '#3b82f6'
  },

  // Colors (Light Mode)
  colors: {
    light: {
      // Primary
      primary: '#1a73e8',
      primaryLight: '#e8f0fe',
      primaryText: '#ffffff',
      
      // Neutral
      background: '#ffffff',
      surface: '#f8f9fa',
      border: '#dadce0',
      text: '#202124',
      textSecondary: '#5f6368',
      textTertiary: '#80868b',
      
      // Backgrounds
      inputBg: '#ffffff',
      previewBg: '#f8f9fa',
      tagBg: '#e8f0fe',
      cancelBg: '#ffffff',
      
      // Borders
      inputBorder: '#dadce0',
      previewBorder: '#e8eaed',
      
      // Semantic
      success: '#10a37f',
      error: '#d33b27',
      warning: '#f57c00',
      info: '#1a73e8'
    },
    dark: {
      // Primary
      primary: '#4f46e5',
      primaryLight: '#1e3a8a',
      primaryText: '#ffffff',
      
      // Neutral
      background: '#2d2d2d',
      surface: '#1a1a1a',
      border: '#404040',
      text: '#e4e4e4',
      textSecondary: '#b8b8b8',
      textTertiary: '#808080',
      
      // Backgrounds
      inputBg: '#1a1a1a',
      previewBg: '#1a1a1a',
      tagBg: '#1a3d5f',
      cancelBg: '#1a1a1a',
      
      // Borders
      inputBorder: '#404040',
      previewBorder: '#404040',
      
      // Semantic
      success: '#10a37f',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    }
  },

  // Button Styling
  button: {
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    transitionDuration: '0.2s'
  },

  // Input Styling
  input: {
    padding: '10px 12px',
    fontSize: '14px',
    borderRadius: '6px',
    transitionDuration: '0.2s'
  },

  // Tag System
  tags: {
    maxPerPin: 3,
    maxLengthPerTag: 50,
    minLengthPerTag: 1
  },

  // Message Navigation
  navigation: {
    messageContainerSelector: '[data-message-author-role]',
    mainContentSelector: 'main',
    pollingAttempts: 5,
    scrollBehavior: 'smooth'
  },

  // Text Truncation & Preview Lengths
  textLengths: {
    messagePreviewMax: 300,         // Max characters for message preview in dialogs
    messageTextTrimWhenLarge: 150,  // Trim messageText when pin is too large for storage
    selectionTextTrimWhenLarge: 50, // Trim selectionText when pin is too large for storage
    anchorTextTrim: 30,             // Trim anchor prefix/suffix when large
    anchorFullTrim: 50,             // Trim full anchor when large
    debugLogPreview: 150,           // Max characters for debug log previews
    tagPreview: 20,                 // Max characters to show in validation error
    initialWordsForSearch: 8,       // Number of first words to use for full message search
    selectionSearchMax: 100         // Max characters for selection search text
  },

  // Storage & Size Limits
  storage: {
    maxPinSize: 7000,               // Chrome quota is ~8KB per item, we use 7KB buffer
    maxStoragePerItem: 8192         // Chrome's actual limit per item
  },

  // Message Element Selectors
  messageSelectors: {
    // All message container selectors combined with :is()
    combined: ':is([data-message-author-role], [data-author], [data-user-type], .message, .chat-message, [role="article"], .msg, .conversation-item)',
    // Semantic element selectors for content matching
    semantic: ':is(h1, h2, h3, h4, h5, h6, p, div, span, section, li, blockquote)',
    // Button-like elements
    buttons: ':is(button, [role="button"])'
  },

  // DOM Traversal
  dom: {
    maxTraversalDepth: 20,          // Max depth to traverse DOM when finding elements
    mutationObserverDebounce: 500   // Debounce time for mutation observer
  },

  // Network & API Configuration
  network: {
    apiTimeout: 10000,              // API request timeout in milliseconds (10 seconds)
    retryMaxAttempts: 3,            // Maximum number of retry attempts
    retryInitialDelay: 1000,        // Initial delay for retry in milliseconds (1 second)
    retryBackoffMultiplier: 2,      // Multiply delay by this for exponential backoff
    retryMaxDelay: 16000            // Maximum delay between retries (16 seconds = 1s*2^4)
  },

  // Performance Monitoring Configuration
  performance: {
    enabled: false,                 // Enable performance tracking (set via debug mode)
    slowOperationThreshold: 1000,   // Log operations slower than this (ms)
    trackPinCreation: true,         // Track pin creation performance
    trackStorageOps: true,          // Track storage operations
    trackDOMQueries: true,          // Track DOM query performance
    trackAPIcalls: true             // Track API call performance
  }
};

/**
 * Retry a function with exponential backoff
 * Exponential backoff delays: 1s → 2s → 4s → 8s → 16s (capped)
 * 
 * @param {Function} operation - Async function to retry
 * @param {Object} options - Configuration options
 * @param {number} options.maxAttempts - Max number of attempts (default: 3)
 * @param {number} options.initialDelay - Initial delay in ms (default: 1000)
 * @param {Function} options.shouldRetry - Function to determine if error is retryable (optional)
 * @returns {Promise} - Result from successful operation
 */
async function retryWithBackoff(operation, options = {}) {
  const maxAttempts = options.maxAttempts ?? UI_CONFIG.network.retryMaxAttempts;
  const initialDelay = options.initialDelay ?? UI_CONFIG.network.retryInitialDelay;
  const shouldRetry = options.shouldRetry ?? (() => true);

  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry this error
      if (!shouldRetry(error) || attempt === maxAttempts) {
        throw error;
      }

      // Calculate delay with exponential backoff, capped at retryMaxDelay
      const delay = Math.min(
        initialDelay * Math.pow(UI_CONFIG.network.retryBackoffMultiplier, attempt - 1),
        UI_CONFIG.network.retryMaxDelay
      );

      debugLog(`Retry attempt ${attempt}/${maxAttempts} in ${delay}ms`, error.message);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Wrap a promise with a timeout
 * Aborts the operation if it takes longer than specified
 * 
 * @param {Promise} promise - Promise to wrap with timeout
 * @param {number} timeoutMs - Timeout in milliseconds (default: 10000)
 * @param {string} timeoutMessage - Custom timeout error message
 * @returns {Promise} - Result or timeout error
 */
async function withTimeout(promise, timeoutMs = UI_CONFIG.network.apiTimeout, timeoutMessage = 'Request timed out') {
  let timeoutId;
  
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error(timeoutMessage);
      error.isTimeout = true;
      error.code = 'TIMEOUT';
      reject(error);
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Determine if an error is retryable (transient)
 * Some errors are permanent and shouldn't be retried
 * 
 * @param {Error} error - The error to check
 * @param {number} statusCode - HTTP status code if available
 * @returns {boolean} - True if the error should be retried
 */
function isRetryableError(error, statusCode) {
  // Timeout and network errors are retryable
  if (error.isTimeout || error.code === 'TIMEOUT') return true;
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) return true;
  if (error instanceof TypeError && error.message.includes('Network')) return true;

  // HTTP status code based decisions
  if (statusCode) {
    // 401 Unauthorized - don't retry, user needs to login
    if (statusCode === 401) return false;
    
    // 403 Forbidden - don't retry, user doesn't have permission
    if (statusCode === 403) return false;
    
    // 404 Not Found - don't retry, resource doesn't exist
    if (statusCode === 404) return false;
    
    // 400 Bad Request - don't retry, request is invalid
    if (statusCode === 400) return false;
    
    // 429 Too Many Requests - retry with backoff
    if (statusCode === 429) return true;
    
    // 5xx Server errors - retry
    if (statusCode >= 500) return true;
  }

  return true;
}

/**
 * Format a user-friendly error message based on error type
 * 
 * @param {Error} error - The error object
 * @param {number} statusCode - HTTP status code if available
 * @returns {string} - User-friendly error message
 */
function formatNetworkErrorMessage(error, statusCode) {
  if (error.isTimeout || error.code === 'TIMEOUT') {
    return 'Request timed out. Please check your internet connection.';
  }

  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    return 'Network connection error. Please check your internet connection.';
  }

  if (statusCode === 401) {
    return 'Session expired. Please log in again.';
  }

  if (statusCode === 403) {
    return 'You do not have permission to perform this action.';
  }

  if (statusCode === 404) {
    return 'The requested resource was not found.';
  }

  if (statusCode === 429) {
    return 'Too many requests. Please try again in a few moments.';
  }

  if (statusCode >= 500) {
    return 'Server error. Please try again later.';
  }

  return error.message || 'An unexpected error occurred.';
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UI_CONFIG, retryWithBackoff, withTimeout, isRetryableError, formatNetworkErrorMessage };}