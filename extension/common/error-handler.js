/**
 * Error Handling Utilities
 * Provides structured error codes and user-friendly messages.
 * 
 * Features:
 * - 30+ predefined error codes for common scenarios
 * - User-friendly error messages with suggested actions
 * - Automatic error code detection from error messages
 * - Structured error objects with metadata
 * 
 * Error Categories:
 * - Storage errors (quota, unavailable, corrupted)
 * - Network errors (timeout, offline, general)
 * - Authentication errors (expired, invalid, required)
 * - License errors (expired, invalid, limit reached)
 * - Extension errors (context invalid, reload required)
 * - Pin/Data errors (too large, duplicate, invalid, not found)
 * - DOM/UI errors (message not found, selection invalid)
 * 
 * Usage:
 * ```javascript
 * // Create structured error
 * throw ErrorHandler.createError(ErrorHandler.ERROR_CODES.PIN_TOO_LARGE, {
 *   pinSize: 9000,
 *   maxSize: 8192
 * });
 * 
 * // Detect error code from message
 * const code = ErrorHandler.detectErrorCode(error);
 * 
 * // Get user-friendly message
 * const message = ErrorHandler.formatErrorForUser(error);
 * ```
 * 
 * @module error-handler
 * @version 1.0.0
 */

// Error codes for different failure scenarios
const ERROR_CODES = {
  // Storage errors
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
  STORAGE_UNAVAILABLE: 'STORAGE_UNAVAILABLE',
  STORAGE_CORRUPTED: 'STORAGE_CORRUPTED',
  
  // Network errors
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  NETWORK_OFFLINE: 'NETWORK_OFFLINE',
  NETWORK_ERROR: 'NETWORK_ERROR',
  
  // Authentication errors
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  
  // License errors
  LICENSE_EXPIRED: 'LICENSE_EXPIRED',
  LICENSE_INVALID: 'LICENSE_INVALID',
  LICENSE_LIMIT_REACHED: 'LICENSE_LIMIT_REACHED',
  
  // Extension errors
  EXTENSION_CONTEXT_INVALID: 'EXTENSION_CONTEXT_INVALID',
  EXTENSION_RELOAD_REQUIRED: 'EXTENSION_RELOAD_REQUIRED',
  
  // Pin/Data errors
  PIN_TOO_LARGE: 'PIN_TOO_LARGE',
  PIN_DUPLICATE: 'PIN_DUPLICATE',
  PIN_INVALID: 'PIN_INVALID',
  PIN_NOT_FOUND: 'PIN_NOT_FOUND',
  
  // DOM/UI errors
  MESSAGE_NOT_FOUND: 'MESSAGE_NOT_FOUND',
  SELECTION_INVALID: 'SELECTION_INVALID',
  
  // General errors
  UNKNOWN: 'UNKNOWN',
  VALIDATION_FAILED: 'VALIDATION_FAILED'
};

// User-friendly error messages
const ERROR_MESSAGES = {
  [ERROR_CODES.STORAGE_QUOTA_EXCEEDED]: {
    title: 'Storage Limit Exceeded',
    message: 'Pin is too large. Try shortening the message or removing some content.',
    action: 'Reduce pin size or upgrade to Pro for more storage'
  },
  [ERROR_CODES.STORAGE_UNAVAILABLE]: {
    title: 'Storage Unavailable',
    message: 'Cannot access browser storage. Please check your browser settings.',
    action: 'Check browser permissions'
  },
  [ERROR_CODES.STORAGE_CORRUPTED]: {
    title: 'Storage Corrupted',
    message: 'Stored data appears to be corrupted.',
    action: 'Contact support or try clearing extension data'
  },
  
  [ERROR_CODES.NETWORK_TIMEOUT]: {
    title: 'Request Timeout',
    message: 'Server took too long to respond.',
    action: 'Check your internet connection and try again'
  },
  [ERROR_CODES.NETWORK_OFFLINE]: {
    title: 'No Internet Connection',
    message: 'You appear to be offline.',
    action: 'Check your internet connection'
  },
  [ERROR_CODES.NETWORK_ERROR]: {
    title: 'Network Error',
    message: 'Failed to connect to server.',
    action: 'Check your internet connection and try again'
  },
  
  [ERROR_CODES.AUTH_EXPIRED]: {
    title: 'Session Expired',
    message: 'Your session has expired. Please log in again.',
    action: 'Log in again'
  },
  [ERROR_CODES.AUTH_INVALID]: {
    title: 'Authentication Invalid',
    message: 'Your credentials are invalid.',
    action: 'Please log in again'
  },
  [ERROR_CODES.AUTH_REQUIRED]: {
    title: 'Login Required',
    message: 'This feature requires you to be logged in.',
    action: 'Log in to continue'
  },
  
  [ERROR_CODES.LICENSE_EXPIRED]: {
    title: 'License Expired',
    message: 'Your Premium subscription has expired.',
    action: 'Renew subscription to continue using Premium features'
  },
  [ERROR_CODES.LICENSE_INVALID]: {
    title: 'Invalid License',
    message: 'Your license key is invalid.',
    action: 'Check your license key or contact support'
  },
  [ERROR_CODES.LICENSE_LIMIT_REACHED]: {
    title: 'Limit Reached',
    message: 'You have reached the limit for your current plan.',
    action: 'Upgrade to Pro or Premium for unlimited pins'
  },
  
  [ERROR_CODES.EXTENSION_CONTEXT_INVALID]: {
    title: 'Extension Reloaded',
    message: 'Extension was updated or reloaded.',
    action: 'Please refresh this page'
  },
  [ERROR_CODES.EXTENSION_RELOAD_REQUIRED]: {
    title: 'Reload Required',
    message: 'Extension needs to be reloaded.',
    action: 'Reload the extension'
  },
  
  [ERROR_CODES.PIN_TOO_LARGE]: {
    title: 'Pin Too Large',
    message: 'This message is too large to pin.',
    action: 'Try selecting a smaller portion of text'
  },
  [ERROR_CODES.PIN_DUPLICATE]: {
    title: 'Already Pinned',
    message: 'This message is already pinned.',
    action: 'Check your pinboard'
  },
  [ERROR_CODES.PIN_INVALID]: {
    title: 'Invalid Pin',
    message: 'Pin data is invalid or incomplete.',
    action: 'Try pinning again'
  },
  [ERROR_CODES.PIN_NOT_FOUND]: {
    title: 'Pin Not Found',
    message: 'The requested pin could not be found.',
    action: 'It may have been deleted'
  },
  
  [ERROR_CODES.MESSAGE_NOT_FOUND]: {
    title: 'Message Not Found',
    message: 'Could not find the message to pin.',
    action: 'Try scrolling to the message or refreshing the page'
  },
  [ERROR_CODES.SELECTION_INVALID]: {
    title: 'Invalid Selection',
    message: 'Please select text within a ChatGPT message.',
    action: 'Select text from a message'
  },
  
  [ERROR_CODES.VALIDATION_FAILED]: {
    title: 'Validation Failed',
    message: 'Data validation failed.',
    action: 'Check your input and try again'
  },
  [ERROR_CODES.UNKNOWN]: {
    title: 'Unknown Error',
    message: 'An unexpected error occurred.',
    action: 'Try again or contact support if the problem persists'
  }
};

/**
 * Create a structured error
 * @param {string} code - Error code from ERROR_CODES
 * @param {Object} details - Additional error details
 * @returns {Error} Structured error object
 */
function createError(code, details = {}) {
  const errorInfo = ERROR_MESSAGES[code] || ERROR_MESSAGES[ERROR_CODES.UNKNOWN];
  const error = new Error(errorInfo.message);
  error.code = code;
  error.title = errorInfo.title;
  error.userMessage = errorInfo.message;
  error.suggestedAction = errorInfo.action;
  error.details = details;
  error.timestamp = new Date().toISOString();
  return error;
}

/**
 * Detect error code from error message/object
 * @param {Error|string} error - Error object or message
 * @returns {string} Error code
 */
function detectErrorCode(error) {
  const message = typeof error === 'string' ? error : (error?.message || '');
  const errorLower = message.toLowerCase();
  
  // Storage errors
  if (errorLower.includes('quota') && errorLower.includes('exceeded')) {
    return ERROR_CODES.STORAGE_QUOTA_EXCEEDED;
  }
  if (errorLower.includes('storage') && errorLower.includes('unavailable')) {
    return ERROR_CODES.STORAGE_UNAVAILABLE;
  }
  
  // Network errors
  if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
    return ERROR_CODES.NETWORK_TIMEOUT;
  }
  if (errorLower.includes('offline') || errorLower.includes('network error')) {
    return ERROR_CODES.NETWORK_OFFLINE;
  }
  if (errorLower.includes('fetch') || errorLower.includes('network')) {
    return ERROR_CODES.NETWORK_ERROR;
  }
  
  // Extension errors
  if (errorLower.includes('extension context') && errorLower.includes('invalid')) {
    return ERROR_CODES.EXTENSION_CONTEXT_INVALID;
  }
  if (errorLower.includes('extension') && errorLower.includes('reload')) {
    return ERROR_CODES.EXTENSION_RELOAD_REQUIRED;
  }
  
  // Auth errors
  if (errorLower.includes('401') || errorLower.includes('unauthorized')) {
    return ERROR_CODES.AUTH_EXPIRED;
  }
  if (errorLower.includes('auth') || errorLower.includes('login')) {
    return ERROR_CODES.AUTH_REQUIRED;
  }
  
  // Pin errors
  if (errorLower.includes('too large') || errorLower.includes('size')) {
    return ERROR_CODES.PIN_TOO_LARGE;
  }
  if (errorLower.includes('duplicate') || errorLower.includes('already pinned')) {
    return ERROR_CODES.PIN_DUPLICATE;
  }
  
  return ERROR_CODES.UNKNOWN;
}

/**
 * Get user-friendly error message
 * @param {Error|string} error - Error object or message
 * @returns {Object} User-friendly error info
 */
function getErrorInfo(error) {
  const code = error?.code || detectErrorCode(error);
  const errorInfo = ERROR_MESSAGES[code] || ERROR_MESSAGES[ERROR_CODES.UNKNOWN];
  
  return {
    code,
    title: errorInfo.title,
    message: errorInfo.message,
    action: errorInfo.action,
    originalError: error
  };
}

/**
 * Format error for display to user
 * @param {Error|string} error - Error object or message
 * @returns {string} Formatted error message
 */
function formatErrorForUser(error) {
  const info = getErrorInfo(error);
  return `${info.title}: ${info.message}`;
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.ErrorHandler = {
    ERROR_CODES,
    createError,
    detectErrorCode,
    getErrorInfo,
    formatErrorForUser
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ERROR_CODES,
    createError,
    detectErrorCode,
    getErrorInfo,
    formatErrorForUser
  };
}
