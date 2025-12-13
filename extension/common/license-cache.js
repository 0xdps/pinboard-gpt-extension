/**
 * License Caching Module
 * Reduces repeated chrome.storage calls by caching license in memory
 */

const LICENSE_CACHE = (() => {
  let cachedLicense = null;
  let cacheTimestamp = 0;
  const CACHE_TTL = 10000; // 10 seconds

  // Listen for storage changes to invalidate cache
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes.license) {
        debugLog('License changed in storage, invalidating cache');
        cachedLicense = null;
        cacheTimestamp = 0;
      }
    });
  }

  /**
   * Get license with caching
   * @returns {Promise<string>} License type
   */
  async function getLicenseWithCache() {
    const now = Date.now();
    
    // Return cached value if still valid
    if (cachedLicense !== null && (now - cacheTimestamp) < CACHE_TTL) {
      debugLog('Returning cached license:', cachedLicense);
      return cachedLicense;
    }

    // Fetch from storage
    try {
      const result = await chrome.storage.local.get(['license']);
      const license = result.license;
      
      // Handle both string format ("pro") and object format ({type: "pro"})
      let licenseType;
      if (typeof license === 'string') {
        licenseType = license;
      } else if (license?.type) {
        licenseType = license.type;
      } else {
        licenseType = LICENSE_TYPES.FREE;
      }

      // Update cache
      cachedLicense = licenseType;
      cacheTimestamp = now;
      
      debugLog('Fetched and cached license:', licenseType);
      return licenseType;
    } catch (error) {
      debugError('Error getting license:', error);
      return LICENSE_TYPES.FREE;
    }
  }

  /**
   * Invalidate the cache manually
   */
  function invalidateCache() {
    cachedLicense = null;
    cacheTimestamp = 0;
    debugLog('License cache manually invalidated');
  }

  /**
   * Get cache stats
   */
  function getCacheStats() {
    return {
      cached: cachedLicense !== null,
      value: cachedLicense,
      age: cachedLicense !== null ? Date.now() - cacheTimestamp : null,
      ttl: CACHE_TTL
    };
  }

  return {
    getLicense: getLicenseWithCache,
    invalidate: invalidateCache,
    getStats: getCacheStats
  };
})();

// Export for use in content scripts and popup
if (typeof window !== 'undefined') {
  window.LICENSE_CACHE = LICENSE_CACHE;
}
