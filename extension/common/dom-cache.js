/**
 * DOM Element Cache Manager
 * Efficient caching of message elements with automatic updates via MutationObserver
 * Reduces redundant DOM queries and improves performance
 */

const DOMCache = (() => {
  // Private cache storage
  let messageCache = [];
  let lastUpdateTime = 0;
  let cacheValid = false;
  let observer = null;

  // Selectors for message detection
  const messageSelectors = [
    '[data-message-author-role]',
    '[data-author]',
    '[data-user-type]',
    '.message',
    '.chat-message',
    '[role="article"]',
    '.msg',
    '.conversation-item'
  ];

  /**
   * Find all message elements using multiple selectors
   * @param {Element} root - Root element to search from (default: document)
   * @returns {Array<Element>} Array of message elements
   */
  function findAllMessages(root = document) {
    const seen = new Set();
    const results = [];

    for (const sel of messageSelectors) {
      try {
        const nodes = root.querySelectorAll(sel);
        nodes.forEach(n => {
          if (n && n.nodeType === 1 && !seen.has(n)) {
            seen.add(n);
            results.push(n);
          }
        });
      } catch (e) {
        // Ignore invalid selectors
      }
    }

    return results;
  }

  /**
   * Invalidate cache when DOM changes
   */
  function invalidateCache() {
    cacheValid = false;
    debugLog('Pinboard GPT: DOM cache invalidated');
  }

  /**
   * Initialize MutationObserver for automatic cache invalidation
   */
  function initObserver() {
    if (observer) return; // Already initialized

    try {
      observer = new MutationObserver((mutations) => {
        // Only invalidate on structural changes, not text/attribute changes
        const hasStructuralChanges = mutations.some(m => 
          m.type === 'childList' || 
          (m.type === 'attributes' && m.attributeName === 'data-message-author-role')
        );

        if (hasStructuralChanges) {
          invalidateCache();
        }
      });

      // Observe main content area for changes
      const mainContent = document.querySelector('main') || document.body;
      observer.observe(mainContent, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-message-author-role'],
        attributeOldValue: false,
        characterData: false
      });

      debugLog('Pinboard GPT: DOM cache observer initialized');
    } catch (err) {
      debugError('Pinboard GPT: Failed to initialize DOM cache observer:', err);
    }
  }

  /**
   * Get cached message elements (updates cache if invalid)
   * @returns {Array<Element>} Array of message elements
   */
  function getMessages() {
    if (!cacheValid) {
      messageCache = findAllMessages();
      cacheValid = true;
      lastUpdateTime = Date.now();
      debugLog(`Pinboard GPT: Cache updated - ${messageCache.length} messages`);
    }
    return messageCache;
  }

  /**
   * Get a specific message by index
   * @param {number} index - Message index (0-based)
   * @returns {Element|null} Message element or null
   */
  function getMessageByIndex(index) {
    const messages = getMessages();
    return messages[index] || null;
  }

  /**
   * Get message count
   * @returns {number} Total number of messages
   */
  function getMessageCount() {
    return getMessages().length;
  }

  /**
   * Force cache refresh
   */
  function refresh() {
    cacheValid = false;
    return getMessages();
  }

  /**
   * Clear cache (use when script is being unloaded)
   */
  function clear() {
    messageCache = [];
    cacheValid = false;
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    debugLog('Pinboard GPT: DOM cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  function getStats() {
    return {
      messageCount: messageCache.length,
      cacheValid,
      lastUpdateTime,
      cacheAge: Date.now() - lastUpdateTime
    };
  }

  // Public API
  return {
    getMessages,
    getMessageByIndex,
    getMessageCount,
    refresh,
    clear,
    getStats,
    initObserver
  };
})();

// Initialize observer when script loads
document.addEventListener('DOMContentLoaded', () => {
  DOMCache.initObserver();
});

// Also try immediate initialization in case DOMContentLoaded already fired
if (document.readyState !== 'loading') {
  DOMCache.initObserver();
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DOMCache };
}
