/**
 * Performance Monitoring Utilities
 * Track and log slow operations to identify bottlenecks.
 * 
 * Features:
 * - Start/end measurement pairs with unique IDs
 * - Automatic slow operation detection (>1000ms threshold)
 * - Synchronous and asynchronous operation tracking
 * - Metadata support for contextual information
 * - Debug mode integration
 * 
 * Usage:
 * ```javascript
 * const id = PERF_MONITOR.start('savePin', { pinSize: 1234 });
 * // ... perform operation ...
 * PERF_MONITOR.end(id, { success: true });
 * 
 * // Or use wrapper functions:
 * const result = await PERF_MONITOR.measureAsync('fetchData', async () => {
 *   return await fetch('/api/data');
 * });
 * ```
 * 
 * @module perf-monitor
 * @version 1.0.0
 */

const PERF_MONITOR = (() => {
  const measurements = new Map();

  /**
   * Start measuring an operation
   * @param {string} operationName - Name of the operation
   * @param {Object} metadata - Optional metadata about the operation
   * @returns {string} Measurement ID
   */
  function start(operationName, metadata = {}) {
    const id = `${operationName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    measurements.set(id, {
      name: operationName,
      startTime: performance.now(),
      metadata
    });
    return id;
  }

  /**
   * End measurement and log if slow
   * @param {string} measurementId - ID returned from start()
   * @param {Object} additionalData - Optional additional data to log
   */
  function end(measurementId, additionalData = {}) {
    if (!UI_CONFIG.performance.enabled && !window.debugEnabled) {
      measurements.delete(measurementId);
      return;
    }

    const measurement = measurements.get(measurementId);
    if (!measurement) {
      debugLog('⚠️ Performance measurement not found:', measurementId);
      return;
    }

    const duration = performance.now() - measurement.startTime;
    const isSlow = duration > UI_CONFIG.performance.slowOperationThreshold;

    if (isSlow || window.debugEnabled) {
      const logData = {
        operation: measurement.name,
        duration: `${Math.round(duration)}ms`,
        ...measurement.metadata,
        ...additionalData
      };

      if (isSlow) {
        debugLog('🐌 SLOW OPERATION:', logData);
      } else {
        debugLog('⚡ Performance:', logData);
      }
    }

    measurements.delete(measurementId);
    return duration;
  }

  /**
   * Measure a synchronous function
   * @param {string} operationName - Name of the operation
   * @param {Function} fn - Function to measure
   * @param {Object} metadata - Optional metadata
   * @returns {any} Return value of fn
   */
  function measureSync(operationName, fn, metadata = {}) {
    const id = start(operationName, metadata);
    try {
      const result = fn();
      end(id, { success: true });
      return result;
    } catch (error) {
      end(id, { success: false, error: error.message });
      throw error;
    }
  }

  /**
   * Measure an async function
   * @param {string} operationName - Name of the operation
   * @param {Function} fn - Async function to measure
   * @param {Object} metadata - Optional metadata
   * @returns {Promise<any>} Return value of fn
   */
  async function measureAsync(operationName, fn, metadata = {}) {
    const id = start(operationName, metadata);
    try {
      const result = await fn();
      end(id, { success: true });
      return result;
    } catch (error) {
      end(id, { success: false, error: error.message });
      throw error;
    }
  }

  /**
   * Get all active measurements (for debugging)
   * @returns {Array} Active measurements
   */
  function getActiveMeasurements() {
    return Array.from(measurements.entries()).map(([id, data]) => ({
      id,
      ...data,
      elapsed: performance.now() - data.startTime
    }));
  }

  /**
   * Clear all measurements
   */
  function clear() {
    measurements.clear();
  }

  return {
    start,
    end,
    measureSync,
    measureAsync,
    getActiveMeasurements,
    clear
  };
})();

// Export for use in modules
if (typeof window !== 'undefined') {
  window.PERF_MONITOR = PERF_MONITOR;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PERF_MONITOR };
}
