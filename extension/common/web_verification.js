// Web verification content script for cross-browser extension detection
// This script runs on our website pages to help identify extension installation

(function() {
    'use strict';
    
    // Debug logging helper (only logs in development)
    const debugLog = (message, data) => {
        if (typeof console !== 'undefined') {
            console.log(`[Pinboard] ${message}`, data || '');
        }
    };
    
    // Only run on our domains
    const allowedDomains = ['pinboard-gpt.dps.codes', 'localhost'];
    const currentDomain = window.location.hostname;
    
    if (!allowedDomains.some(domain => currentDomain.includes(domain))) {
        return;
    }
    
    debugLog('Web verification script loaded');
    
    // Get runtime reference (Chrome only)
    if (!chrome?.runtime) {
        debugLog('Chrome extension runtime not available');
        return;
    }
    
    const runtime = chrome.runtime;
    
    // Inject extension identification into the page
    function injectExtensionIdentifier() {
        // Get installation data from storage
        
        chrome.storage.local.get(['gpt-pinboard-install'], (result) => {
            const installData = result['gpt-pinboard-install'];
            
            if (installData) {
                // Create a marker element that the webpage can detect
                const marker = document.createElement('div');
                marker.id = 'pingpt-extension-marker';
                marker.style.display = 'none';
                marker.setAttribute('data-extension-id', runtime.id);
                marker.setAttribute('data-install-token', installData.installToken);
                marker.setAttribute('data-install-date', installData.installDate);
                marker.setAttribute('data-version', installData.version);
                
                // Add to document head
                document.head.appendChild(marker);
                
                // Also set a global variable for immediate detection
                window.pingptExtensionData = {
                    extensionId: runtime.id,
                    installToken: installData.installToken,
                    installDate: installData.installDate,
                    version: installData.version,
                    browser: 'chrome'
                };
                
                debugLog('Extension marker injected successfully');
                
                // Dispatch a custom event to notify the page
                const event = new CustomEvent('pingptExtensionDetected', {
                    detail: window.pingptExtensionData
                });
                document.dispatchEvent(event);
            }
        });
    }
    
    // Inject identifier when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectExtensionIdentifier);
    } else {
        injectExtensionIdentifier();
    }
    
    // Also listen for page messages and respond with verification
    window.addEventListener('message', (event) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data && event.data.type === 'pingpt-verify-extension') {
            // Respond with extension verification
            if (window.pingptExtensionData) {
                window.postMessage({
                    type: 'pingpt-extension-verified',
                    data: window.pingptExtensionData
                }, window.location.origin);
            }
        }
        
        // Listen for authentication token from website
        if (event.data && event.data.type === 'pingpt-auth-token') {
            const { token, userData, licenseData } = event.data;
            
            debugLog('Received auth token from website');
            
            // Store token and user data in extension storage
            chrome.storage.local.set({
                authToken: token,
                userData: userData,
                license: licenseData?.type || 'FREE',
                licenseData: licenseData
            }, () => {
                debugLog('Auth token saved successfully');
                
                // Notify the webpage that token was saved
                window.postMessage({
                    type: 'pingpt-auth-saved',
                    success: true
                }, window.location.origin);
                
                // Show success notification (will be visible in extension)
                chrome.runtime.sendMessage({
                    action: 'auth-success',
                    userData: userData
                });
            });
        }
    });
    
})();