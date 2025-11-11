// Set uninstall URL
runtimeAPI.setUninstallURL('https://gptpins.dps.codes/goodbye.html');

// Handle extension installation
runtimeAPI.onInstalled.addListener((details) => {
  debugLog('GPT Pinboard: Extension installed/updated', details.reason);
  
  if (details.reason === 'install') {
    const installationData = {
      extensionId: runtimeAPI.id,
      installDate: new Date().toISOString(),
      installToken: generateInstallToken(),
      version: runtimeAPI.getManifest().version
    };
    
    setSetting('gpt-pinboard-install', installationData);
    tabsAPI.create({ url: 'https://gptpins.dps.codes/welcome.html' });
  }
});

// Generate unique installation token
function generateInstallToken() {
  return 'gpt-pin-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Handle internal messages (from popup, content scripts, etc.)
runtimeAPI.onMessage.addListener((request, sender, sendResponse) => {
  debugLog('GPT Pinboard: Background received message:', request.action, request);
  debugLog('GPT Pinboard: Browser info:', {
    isFirefox: isFirefox,
    userAgent: navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Chrome/Other'
  });

  if (request.action === 'open-and-highlight' && request.pin) {
    debugLog('GPT Pinboard: About to handle open-and-highlight');
    try {
      handleOpenAndHighlight(request.pin, sendResponse, request.forceNewTab === true);
      return true; // Will respond asynchronously
    } catch (error) {
      debugLog('GPT Pinboard: Error in handleOpenAndHighlight:', error);
      sendResponse({ success: false, error: error.message });
      return false;
    }
  }
  
  if (request.action === 'get-debug-setting') {
    debugLog('GPT Pinboard: Content script requesting debug setting');
    getSetting('debugMode').then(debugMode => {
      sendResponse({ debugEnabled: debugMode === true });
    }).catch(() => {
      sendResponse({ debugEnabled: false });
    });
    return true; // Will respond asynchronously
  }
  
  return false;
});

// Handle open-and-highlight requests
async function handleOpenAndHighlight(pin, sendResponse, forceNewTab = false) {
  try {
    debugLog('GPT Pinboard: Handling open-and-highlight for pin:', pin.id, pin.pageUrl);
    debugLog('GPT Pinboard: Using browser-specific tabsAPI for tab query');
    
    // Check user's tab behavior preference using centralized storage
    const alwaysNewTab = await getSetting('alwaysNewTab');
    const shouldAlwaysNewTab = alwaysNewTab !== false; // Default to true
    // Respect forceNewTab from caller (popup or external) to override preference
    const effectiveAlwaysNewTab = shouldAlwaysNewTab || forceNewTab === true;
    debugLog('GPT Pinboard: Tab behavior - shouldAlwaysNewTab:', shouldAlwaysNewTab, 'forceNewTab:', forceNewTab, 'effectiveAlwaysNewTab:', effectiveAlwaysNewTab);
    
    const pinUrl = new URL(pin.pageUrl);
    let matchingTabs = [];
    
    // Always check for existing tabs first
    const tabs = await tabsAPI.query({});
    
    debugLog('GPT Pinboard: Pin URL details:', {
      hostname: pinUrl.hostname,
      pathname: pinUrl.pathname,
      href: pinUrl.href
    });
      
      // Find tabs that match ChatGPT (ANY ChatGPT tab, not just same conversation)
      matchingTabs = tabs.filter(tab => {
        if (!tab.url) return false;
        try {
          const tabUrl = new URL(tab.url);
          
          // Match ANY ChatGPT tab - regardless of conversation
          if ((tabUrl.hostname === 'chatgpt.com' || tabUrl.hostname === 'chat.openai.com') &&
              (pinUrl.hostname === 'chatgpt.com' || pinUrl.hostname === 'chat.openai.com')) {
            debugLog('GPT Pinboard: ✓ MATCH FOUND - ChatGPT tab', {
              tabId: tab.id,
              tabUrl: tab.url,
              pinUrl: pin.pageUrl
            });
            return true;
          }
          
          // Fallback to exact URL match for non-ChatGPT URLs
          const exactMatch = tab.url === pin.pageUrl;
          if (exactMatch) {
            debugLog('GPT Pinboard: ✓ MATCH FOUND - Exact URL match');
          }
          return exactMatch;
        } catch (e) {
          debugLog('GPT Pinboard: Error parsing tab URL:', e);
          return tab.url === pin.pageUrl;
        }
      });
    
    debugLog('GPT Pinboard: Found matching tabs:', matchingTabs.length, matchingTabs.map(t => ({id: t.id, url: t.url})));
    
    // If we found a matching tab AND effective setting allows reuse, reuse it
    if (matchingTabs.length > 0 && !effectiveAlwaysNewTab) {
      // Tab already exists, navigate to the pin URL and highlight
      const existingTab = matchingTabs[0];
      debugLog('GPT Pinboard: Reusing existing ChatGPT tab:', existingTab.id, 'navigating to:', pin.pageUrl);
      
      // Update the tab with the pin's URL and make it active
      await tabsAPI.update(existingTab.id, { 
        url: pin.pageUrl,
        active: true 
      });
      
      // Set up timeout for the whole operation
      let responseTimeout = setTimeout(() => {
        debugLog('GPT Pinboard: Tab load timeout');
        tabsAPI.onUpdated.removeListener(onTabUpdate);
        sendResponse({ success: true, highlighted: false, error: 'Tab load timeout' });
      }, 15000);
      
      // Wait for tab to load with the new URL, then send highlight message
      const onTabUpdate = (tabId, changeInfo, tab) => {
        if (tabId === existingTab.id && changeInfo.status === 'complete') {
          debugLog('GPT Pinboard: Tab loaded with new URL, sending highlight message');
          tabsAPI.onUpdated.removeListener(onTabUpdate);
          clearTimeout(responseTimeout);
          
          // Additional wait for content script to be ready
          setTimeout(() => {
            tabsAPI.sendMessage(existingTab.id, {
              action: 'highlight-pin',
              pin: pin
            }, (response) => {
              const lastError = runtimeAPI.lastError;
              if (lastError) {
                debugLog('GPT Pinboard: Error highlighting pin:', lastError.message);
                sendResponse({ success: true, highlighted: false, error: lastError.message });
              } else {
                debugLog('GPT Pinboard: Highlight response from reused tab:', response);
                sendResponse({ success: true, highlighted: response?.found || false });
              }
            });
          }, 1500);
        }
      };
      
      tabsAPI.onUpdated.addListener(onTabUpdate);
      return; // Exit early since we're reusing existing tab
    }
    
    // Either no matching tab found, or effectiveAlwaysNewTab requested
    if (matchingTabs.length > 0) {
      debugLog('GPT Pinboard: ChatGPT tab exists but effectiveAlwaysNewTab=true, creating new tab with URL:', pin.pageUrl);
    } else {
      debugLog('GPT Pinboard: No matching tab found, creating new tab with URL:', pin.pageUrl);
    }
      
    let newTab;
    newTab = await tabsAPI.create({ url: pin.pageUrl });
    debugLog('GPT Pinboard: Successfully created new tab:', newTab.id, pin.pageUrl);
      
      // Set up timeout for the whole operation
      let responseTimeout = setTimeout(() => {
        debugLog('GPT Pinboard: Tab load timeout');
        tabsAPI.onUpdated.removeListener(onTabUpdate);
        sendResponse({ success: true, highlighted: false, error: 'Tab load timeout' });
      }, 15000);
      
      // Wait for tab to load, then send highlight message
      const onTabUpdate = (tabId, changeInfo, tab) => {
        if (tabId === newTab.id && changeInfo.status === 'complete') {
          debugLog('GPT Pinboard: Tab loaded, sending highlight message');
          tabsAPI.onUpdated.removeListener(onTabUpdate);
          clearTimeout(responseTimeout);
          
          // Additional wait for content script to be ready
          setTimeout(() => {
            tabsAPI.sendMessage(newTab.id, {
              action: 'highlight-pin',
              pin: pin
            }, (response) => {
              const lastError = runtimeAPI.lastError;
              if (lastError) {
                debugLog('GPT Pinboard: Error highlighting pin:', lastError.message);
                sendResponse({ success: true, highlighted: false, error: lastError.message });
              } else {
                debugLog('GPT Pinboard: Highlight response:', response);
                sendResponse({ success: true, highlighted: response?.found || false });
              }
            });
          }, 1500);
        }
      };
      
      tabsAPI.onUpdated.addListener(onTabUpdate);
  } catch (error) {
    debugLog('GPT Pinboard: Error in open-and-highlight:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle external messages (from website)
runtimeAPI.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.action === 'verify-installation') {
    const allowedOrigins = [
      'https://gptpins.dps.codes',
      'http://localhost:8080',
      'https://localhost:8080'
    ];

    if (allowedOrigins.includes(sender.origin)) {
      getSetting('gpt-pinboard-install').then((installData) => {
        if (installData) {
          sendResponse({
            verified: true,
            extensionId: runtimeAPI.id,
            installToken: installData.installToken,
            installDate: installData.installDate,
            version: installData.version
          });
        } else {
          sendResponse({ verified: false });
        }
      });
      return true;
    }
  }
  
  return false;
});

debugLog('GPT Pinboard: Background script loaded');