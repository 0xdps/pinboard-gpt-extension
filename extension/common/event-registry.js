/**
 * Event Listener Registry
 * Central management for event listeners to prevent memory leaks.
 * 
 * Features:
 * - Track all registered event listeners
 * - Automatic cleanup by scope (dialog, global, temporary)
 * - Prevent duplicate listener registration
 * - Support for capture and passive options
 * 
 * Usage:
 * ```javascript
 * // Register with automatic cleanup
 * EventRegistry.add(button, 'click', handler, { scope: 'pin-dialog' });
 * 
 * // Cleanup all listeners in a scope
 * EventRegistry.cleanup('pin-dialog');
 * 
 * // Cleanup all
 * EventRegistry.cleanupAll();
 * ```
 * 
 * @module event-registry
 * @version 1.0.0
 */

const EventRegistry = (() => {
  // Store all registered listeners grouped by scope
  const registry = new Map(); // scope -> Set of listener objects
  let listenerIdCounter = 0;

  /**
   * Add an event listener with tracking
   * @param {Element|Window|Document} target - Event target
   * @param {string} type - Event type
   * @param {Function} handler - Event handler
   * @param {Object} options - Options object
   * @param {string} options.scope - Cleanup scope (default: 'global')
   * @param {boolean} options.capture - Use capture phase
   * @param {boolean} options.passive - Mark as passive
   * @param {boolean} options.once - Fire once and auto-remove
   * @returns {number} Listener ID for manual removal
   */
  function add(target, type, handler, options = {}) {
    const {
      scope = 'global',
      capture = false,
      passive = false,
      once = false
    } = options;

    // Create listener metadata
    const listenerId = ++listenerIdCounter;
    const listenerOptions = { capture, passive, once };
    
    // Wrapped handler for cleanup tracking
    const wrappedHandler = once 
      ? (event) => {
          handler(event);
          remove(listenerId);
        }
      : handler;

    const listenerMeta = {
      id: listenerId,
      target,
      type,
      handler: wrappedHandler,
      originalHandler: handler,
      options: listenerOptions,
      scope,
      timestamp: Date.now()
    };

    // Add to registry
    if (!registry.has(scope)) {
      registry.set(scope, new Set());
    }
    registry.get(scope).add(listenerMeta);

    // Actually add the event listener
    target.addEventListener(type, wrappedHandler, listenerOptions);

    debugLog(`[EventRegistry] Added ${type} listener (ID: ${listenerId}, scope: ${scope})`);
    return listenerId;
  }

  /**
   * Remove a specific listener by ID
   * @param {number} listenerId - Listener ID returned from add()
   * @returns {boolean} True if removed
   */
  function remove(listenerId) {
    for (const [scope, listeners] of registry.entries()) {
      for (const listener of listeners) {
        if (listener.id === listenerId) {
          listener.target.removeEventListener(
            listener.type,
            listener.handler,
            listener.options
          );
          listeners.delete(listener);
          debugLog(`[EventRegistry] Removed listener ${listenerId} from scope ${scope}`);
          
          // Cleanup empty scopes
          if (listeners.size === 0) {
            registry.delete(scope);
          }
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Cleanup all listeners in a scope
   * @param {string} scope - Scope to cleanup
   * @returns {number} Number of listeners removed
   */
  function cleanup(scope) {
    const listeners = registry.get(scope);
    if (!listeners) return 0;

    let count = 0;
    for (const listener of listeners) {
      listener.target.removeEventListener(
        listener.type,
        listener.handler,
        listener.options
      );
      count++;
    }

    registry.delete(scope);
    debugLog(`[EventRegistry] Cleaned up ${count} listeners from scope: ${scope}`);
    return count;
  }

  /**
   * Cleanup all registered listeners
   * @returns {number} Total listeners removed
   */
  function cleanupAll() {
    let total = 0;
    for (const scope of registry.keys()) {
      total += cleanup(scope);
    }
    debugLog(`[EventRegistry] Cleaned up all ${total} listeners`);
    return total;
  }

  /**
   * Get statistics about registered listeners
   * @returns {Object} Statistics object
   */
  function getStats() {
    const stats = {
      totalListeners: 0,
      scopes: {},
      oldestTimestamp: Date.now(),
      newestTimestamp: 0
    };

    for (const [scope, listeners] of registry.entries()) {
      stats.scopes[scope] = listeners.size;
      stats.totalListeners += listeners.size;

      for (const listener of listeners) {
        if (listener.timestamp < stats.oldestTimestamp) {
          stats.oldestTimestamp = listener.timestamp;
        }
        if (listener.timestamp > stats.newestTimestamp) {
          stats.newestTimestamp = listener.timestamp;
        }
      }
    }

    return stats;
  }

  /**
   * Check if a handler is already registered on target
   * @param {Element|Window|Document} target - Event target
   * @param {string} type - Event type
   * @param {Function} handler - Original handler function
   * @returns {boolean} True if already registered
   */
  function isRegistered(target, type, handler) {
    for (const listeners of registry.values()) {
      for (const listener of listeners) {
        if (
          listener.target === target &&
          listener.type === type &&
          listener.originalHandler === handler
        ) {
          return true;
        }
      }
    }
    return false;
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', cleanupAll);

  return {
    add,
    remove,
    cleanup,
    cleanupAll,
    getStats,
    isRegistered
  };
})();

// Export for modules
if (typeof window !== 'undefined') {
  window.EventRegistry = EventRegistry;
}
