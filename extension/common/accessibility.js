/**
 * Accessibility Utilities
 * Provides screen reader announcements and ARIA support.
 * 
 * Features:
 * - ARIA live region for screen reader announcements
 * - Polite and assertive announcement modes
 * - Pre-built announcement functions for common actions
 * - ARIA label helpers for interactive elements
 * - Keyboard accessibility utilities
 * - Skip link support
 * 
 * Announcement Functions:
 * - announcePinCreated(name) - "Pin created: {name}"
 * - announcePinDeleted(name) - "Pin deleted: {name}"
 * - announcePinUpdated(name) - "Pin updated: {name}"
 * - announcePinOpened(name) - "Opening pin: {name}"
 * - announceSearchResults(count) - "{count} pins found"
 * - announceError(message) - "Error: {message}" (assertive)
 * 
 * Usage:
 * ```javascript
 * // Announce to screen readers
 * Accessibility.announcePinCreated('My Important Note');
 * 
 * // Add ARIA labels
 * Accessibility.addPinButtonLabels(button, 'Message preview text...');
 * 
 * // Make element keyboard accessible
 * Accessibility.makeKeyboardAccessible(element, () => {
 *   console.log('Clicked via keyboard!');
 * });
 * ```
 * 
 * @module accessibility
 * @version 1.0.0
 */

// Create a live region for screen reader announcements
let liveRegion = null;

/**
 * Initialize ARIA live region
 */
function initLiveRegion() {
  if (liveRegion) return; // Already initialized
  
  liveRegion = document.createElement('div');
  liveRegion.id = 'pingpt-aria-live';
  liveRegion.setAttribute('role', 'status');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.style.cssText = `
    position: absolute;
    left: -10000px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  `;
  
  document.body.appendChild(liveRegion);
  debugLog('ARIA live region initialized');
}

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' (default) or 'assertive'
 */
function announce(message, priority = 'polite') {
  if (!liveRegion) {
    initLiveRegion();
  }
  
  // Update aria-live attribute if priority changed
  if (liveRegion.getAttribute('aria-live') !== priority) {
    liveRegion.setAttribute('aria-live', priority);
  }
  
  // Clear and set message (double-setting ensures announcement even if same text)
  liveRegion.textContent = '';
  setTimeout(() => {
    liveRegion.textContent = message;
    debugLog('Screen reader announcement:', message);
  }, 100);
}

/**
 * Announce pin creation
 * @param {string} pinName - Name of the created pin
 */
function announcePinCreated(pinName) {
  announce(`Pin created: ${pinName}`, 'polite');
}

/**
 * Announce pin deletion
 * @param {string} pinName - Name of the deleted pin
 */
function announcePinDeleted(pinName) {
  announce(`Pin deleted: ${pinName}`, 'polite');
}

/**
 * Announce pin updated
 * @param {string} pinName - Name of the updated pin
 */
function announcePinUpdated(pinName) {
  announce(`Pin updated: ${pinName}`, 'polite');
}

/**
 * Announce navigation to pin
 * @param {string} pinName - Name of the pin being navigated to
 */
function announcePinOpened(pinName) {
  announce(`Opening pin: ${pinName}`, 'polite');
}

/**
 * Announce search results
 * @param {number} count - Number of results found
 */
function announceSearchResults(count) {
  if (count === 0) {
    announce('No pins found', 'polite');
  } else if (count === 1) {
    announce('1 pin found', 'polite');
  } else {
    announce(`${count} pins found`, 'polite');
  }
}

/**
 * Announce error
 * @param {string} errorMessage - Error message
 */
function announceError(errorMessage) {
  announce(`Error: ${errorMessage}`, 'assertive');
}

/**
 * Add ARIA labels to pin buttons
 * @param {HTMLElement} button - Button element
 * @param {string} messagePreview - Preview of message content
 */
function addPinButtonLabels(button, messagePreview) {
  const preview = messagePreview.substring(0, 100);
  button.setAttribute('aria-label', `Pin this message: ${preview}`);
  button.setAttribute('role', 'button');
  button.setAttribute('tabindex', '0');
}

/**
 * Add ARIA labels to tag elements
 * @param {HTMLElement} tagElement - Tag element
 * @param {string} tagName - Tag name
 */
function addTagLabels(tagElement, tagName) {
  tagElement.setAttribute('role', 'button');
  tagElement.setAttribute('aria-label', `Tag: ${tagName}. Click to filter by this tag`);
  tagElement.setAttribute('tabindex', '0');
}

/**
 * Make element focusable with keyboard
 * @param {HTMLElement} element - Element to make focusable
 * @param {Function} onClick - Click handler
 */
function makeKeyboardAccessible(element, onClick) {
  if (!element.hasAttribute('tabindex')) {
    element.setAttribute('tabindex', '0');
  }
  
  element.addEventListener('keydown', (e) => {
    // Trigger click on Enter or Space
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(e);
    }
  });
}

/**
 * Add skip link for keyboard navigation
 */
function addSkipLink() {
  const skipLink = document.createElement('a');
  skipLink.href = '#pingpt-main-content';
  skipLink.textContent = 'Skip to pins';
  skipLink.id = 'pingpt-skip-link';
  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 0;
    background: var(--bg-primary, #ffffff);
    color: var(--text-primary, #0d0d0d);
    padding: 8px;
    text-decoration: none;
    z-index: 100;
  `;
  
  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '0';
  });
  
  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
  });
  
  document.body.insertBefore(skipLink, document.body.firstChild);
}

/**
 * Cleanup live region
 */
function cleanup() {
  if (liveRegion && liveRegion.parentNode) {
    liveRegion.parentNode.removeChild(liveRegion);
    liveRegion = null;
    debugLog('ARIA live region cleaned up');
  }
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLiveRegion);
} else {
  initLiveRegion();
}

// Cleanup on unload
window.addEventListener('beforeunload', cleanup);

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.Accessibility = {
    announce,
    announcePinCreated,
    announcePinDeleted,
    announcePinUpdated,
    announcePinOpened,
    announceSearchResults,
    announceError,
    addPinButtonLabels,
    addTagLabels,
    makeKeyboardAccessible,
    addSkipLink,
    cleanup
  };
}
