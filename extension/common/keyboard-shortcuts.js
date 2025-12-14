/**
 * Keyboard Shortcuts Manager
 * Handles global keyboard shortcuts for the extension.
 * 
 * Shortcuts:
 * - Ctrl+Shift+P: Pin selected text or first user message
 * - Ctrl+Shift+B: Open extension popup (via background message)
 * - Ctrl+Shift+O: Toggle chat outline dropdown
 * 
 * Features:
 * - Smart input field detection (prevents triggering while typing)
 * - Proper cleanup on page unload
 * - Extensible shortcut definition system
 * - Cross-browser compatible
 * 
 * Usage:
 * ```javascript
 * // Shortcuts are auto-initialized
 * // Manual control:
 * KeyboardShortcuts.init();
 * KeyboardShortcuts.cleanup();
 * ```
 * 
 * @module keyboard-shortcuts
 * @version 1.0.0
 */

const SHORTCUTS = {
  PIN_SELECTED: { key: 'p', ctrlKey: true, shiftKey: true },  // Ctrl+Shift+P
  OPEN_POPUP: { key: 'b', ctrlKey: true, shiftKey: true },     // Ctrl+Shift+B (Pinboard)
  CHAT_OUTLINE: { key: 'o', ctrlKey: true, shiftKey: true }    // Ctrl+Shift+O (Outline)
};

// Track registered listeners for cleanup
let keyboardListeners = [];

/**
 * Check if keyboard event matches a shortcut
 * @param {KeyboardEvent} event - Keyboard event
 * @param {Object} shortcut - Shortcut definition
 * @returns {boolean} True if event matches shortcut
 */
function matchesShortcut(event, shortcut) {
  return event.key.toLowerCase() === shortcut.key &&
         event.ctrlKey === (shortcut.ctrlKey || false) &&
         event.shiftKey === (shortcut.shiftKey || false) &&
         event.altKey === (shortcut.altKey || false) &&
         event.metaKey === (shortcut.metaKey || false);
}

/**
 * Initialize keyboard shortcuts
 */
function initKeyboardShortcuts() {
  // Prevent duplicate initialization
  if (keyboardListeners.length > 0) {
    debugLog('Keyboard shortcuts already initialized');
    return;
  }

  debugLog('Initializing keyboard shortcuts...');

  const handleKeydown = (event) => {
    // Don't trigger shortcuts if user is typing in an input field
    const activeElement = document.activeElement;
    if (activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.isContentEditable
    )) {
      return;
    }

    // Ctrl+Shift+P: Pin selected text or first user message
    if (matchesShortcut(event, SHORTCUTS.PIN_SELECTED)) {
      event.preventDefault();
      event.stopPropagation();
      debugLog('Keyboard shortcut: Pin selected (Ctrl+Shift+P)');
      
      // Check if there's selected text
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      if (selectedText) {
        // Find the message containing the selection
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const messageEl = container.nodeType === Node.ELEMENT_NODE 
          ? container.closest('[data-message-author-role]')
          : container.parentElement?.closest('[data-message-author-role]');
        
        if (messageEl) {
          debugLog('Found message for selection, opening pin dialog');
          // Trigger the pin button if it exists
          const pinButton = messageEl.querySelector('.pingpt-pin-button');
          if (pinButton) {
            pinButton.click();
          } else {
            showNotification('⚠️ Pin button not found for this message');
          }
        } else {
          showNotification('⚠️ Please select text within a message');
        }
      } else {
        // No selection - pin the first user message
        debugLog('No selection, attempting to pin first user message');
        const firstUserMessage = getFirstUserMessage();
        
        if (firstUserMessage) {
          const pinButton = firstUserMessage.querySelector('.pingpt-pin-button');
          if (pinButton) {
            pinButton.click();
          } else {
            showNotification('⚠️ Pin button not found');
          }
        } else {
          showNotification('⚠️ No messages found. Try scrolling or asking a question first.');
        }
      }
    }
    
    // Ctrl+Shift+B: Open extension popup (via message to background)
    else if (matchesShortcut(event, SHORTCUTS.OPEN_POPUP)) {
      event.preventDefault();
      event.stopPropagation();
      debugLog('Keyboard shortcut: Open popup (Ctrl+Shift+B)');
      
      // Send message to background to open popup
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action: 'openPopup' }).catch(err => {
          debugError('Failed to open popup:', err);
        });
      }
    }
    
    // Ctrl+Shift+O: Toggle chat outline
    else if (matchesShortcut(event, SHORTCUTS.CHAT_OUTLINE)) {
      event.preventDefault();
      event.stopPropagation();
      debugLog('Keyboard shortcut: Chat outline (Ctrl+Shift+O)');
      
      const manualBtn = document.getElementById('pingpt-manual-pin');
      if (manualBtn) {
        manualBtn.click();
      } else {
        showNotification('⚠️ Chat outline button not found');
      }
    }
  };

  // Add listener
  document.addEventListener('keydown', handleKeydown);
  keyboardListeners.push({ type: 'keydown', handler: handleKeydown });
  
  debugLog('Keyboard shortcuts registered:', Object.keys(SHORTCUTS));
}

/**
 * Cleanup keyboard shortcut listeners
 */
function cleanupKeyboardShortcuts() {
  keyboardListeners.forEach(({ type, handler }) => {
    document.removeEventListener(type, handler);
  });
  keyboardListeners = [];
  debugLog('Keyboard shortcuts cleaned up');
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initKeyboardShortcuts);
} else {
  // DOM already loaded
  setTimeout(initKeyboardShortcuts, 1000);
}

// Cleanup on unload
window.addEventListener('beforeunload', cleanupKeyboardShortcuts);

// Export for use in modules
if (typeof window !== 'undefined') {
  window.KeyboardShortcuts = {
    init: initKeyboardShortcuts,
    cleanup: cleanupKeyboardShortcuts,
    shortcuts: SHORTCUTS,
    setupModalKeyboardNavigation: setupModalKeyboardNavigation
  };
}

/**
 * Setup keyboard navigation for modals/dialogs
 * Implements focus trap and ESC to close
 * @param {HTMLElement} modal - The modal element
 * @param {string} closeButtonSelector - Selector for close button (optional)
 * @returns {Function} Cleanup function to remove listeners
 */
function setupModalKeyboardNavigation(modal, closeButtonSelector = '.modal-close, #closeEditModal, #closeSettings, #closeUpgrade') {
  const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const allFocusable = Array.from(modal.querySelectorAll(focusableSelectors))
    .filter(el => !el.hasAttribute('disabled'));
  
  if (allFocusable.length === 0) return () => {};
  
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
      const closeBtn = modal.querySelector(closeButtonSelector);
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
