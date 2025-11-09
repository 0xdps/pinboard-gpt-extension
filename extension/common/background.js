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
      handleOpenAndHighlight(request.pin, sendResponse);
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
async function handleOpenAndHighlight(pin, sendResponse) {
  try {
    debugLog('GPT Pinboard: Handling open-and-highlight for pin:', pin.id, pin.pageUrl);
    debugLog('GPT Pinboard: Using browser-specific tabsAPI for tab query');
    
    // Check user's tab behavior preference using centralized storage
    const alwaysNewTab = await getSetting('alwaysNewTab');
    const shouldAlwaysNewTab = alwaysNewTab !== false; // Default to true
    debugLog('GPT Pinboard: Tab behavior setting - Always new tab:', shouldAlwaysNewTab);
    
    const pinUrl = new URL(pin.pageUrl);
    let matchingTabs = [];
    
    // If user wants always new tab, skip existing tab check
    if (!shouldAlwaysNewTab) {
      // Check if there's already a tab with this URL or similar ChatGPT URL
      const tabs = await tabsAPI.query({});
      
      debugLog('GPT Pinboard: Pin URL details:', {
        hostname: pinUrl.hostname,
        pathname: pinUrl.pathname,
        href: pinUrl.href
      });
      
      // Find tabs that match the ChatGPT conversation
      matchingTabs = tabs.filter(tab => {
        if (!tab.url) return false;
        try {
          const tabUrl = new URL(tab.url);
          debugLog('GPT Pinboard: Checking tab URL:', {
            hostname: tabUrl.hostname,
            pathname: tabUrl.pathname,
            href: tabUrl.href
          });
          
          // Match ChatGPT domains and conversation paths
          if ((tabUrl.hostname === 'chatgpt.com' || tabUrl.hostname === 'chat.openai.com') &&
              (pinUrl.hostname === 'chatgpt.com' || pinUrl.hostname === 'chat.openai.com')) {
            // For ChatGPT, match the conversation ID in the path
            const pinPath = pinUrl.pathname;
            const tabPath = tabUrl.pathname;
            
            // Try multiple conversation ID patterns:
            // /c/conversation-id (old format)
            // /chat/conversation-id (possible new format)  
            // /conversation/conversation-id (another possible format)
            const conversationPatterns = [
              /\/c\/([^\/\?]+)/,
              /\/chat\/([^\/\?]+)/,
              /\/conversation\/([^\/\?]+)/
            ];
            
            let pinConversationId = null;
            let tabConversationId = null;
            
            // Try to extract conversation ID from pin URL
            for (const pattern of conversationPatterns) {
              const match = pinPath.match(pattern);
              if (match) {
                pinConversationId = match[1];
                break;
              }
            }
            
            // Try to extract conversation ID from tab URL
            for (const pattern of conversationPatterns) {
              const match = tabPath.match(pattern);
              if (match) {
                tabConversationId = match[1];
                break;
              }
            }
            
            debugLog('GPT Pinboard: Conversation ID match attempt:', {
              pinPath,
              tabPath,
              pinConversationId,
              tabConversationId
            });
            
            if (pinConversationId && tabConversationId) {
              const matches = pinConversationId === tabConversationId;
              debugLog('GPT Pinboard: Conversation IDs match:', matches);
              return matches;
            }
            
            // If we're on ChatGPT domains but couldn't extract conversation IDs,
            // and one of the URLs is the main ChatGPT page, consider them as potentially same conversation
            if ((pinPath === '/' || pinPath === '') && (tabPath.includes('/c/') || tabPath.includes('/chat/'))) {
              debugLog('GPT Pinboard: Pin is main page, tab has conversation - treating as same');
              return true;
            }
            if ((tabPath === '/' || tabPath === '') && (pinPath.includes('/c/') || pinPath.includes('/chat/'))) {
              debugLog('GPT Pinboard: Tab is main page, pin has conversation - treating as same');
              return true;
            }
          }
          // Fallback to exact URL match
          const exactMatch = tab.url === pin.pageUrl;
          debugLog('GPT Pinboard: Exact URL match:', exactMatch);
          return exactMatch;
        } catch (e) {
          debugLog('GPT Pinboard: Error parsing tab URL:', e);
          return tab.url === pin.pageUrl;
        }
      });
      
      debugLog('GPT Pinboard: Found matching tabs:', matchingTabs.length);
      
      if (matchingTabs.length > 0) {
        // Tab already exists, switch to it and highlight
        const existingTab = matchingTabs[0];
        debugLog('GPT Pinboard: Switching to existing tab:', existingTab.id);
        await tabsAPI.update(existingTab.id, { active: true });
        
        // Wait a moment for tab to become active, then send highlight message
        setTimeout(() => {
          debugLog('GPT Pinboard: Sending highlight message to existing tab');
          tabsAPI.sendMessage(existingTab.id, {
            action: 'highlight-pin',
            pin: pin
          }, (response) => {
            const lastError = runtimeAPI.lastError;
            if (lastError) {
              debugLog('GPT Pinboard: Error highlighting pin:', lastError.message);
              sendResponse({ success: true, highlighted: false, error: lastError.message });
            } else {
              debugLog('GPT Pinboard: Highlight response from existing tab:', response);
              sendResponse({ success: true, highlighted: response?.found || false });
            }
          });
        }, 1000);
        return; // Exit early since we found and switched to existing tab
      }
    }
    
    // Create new tab with the URL (either no matching tabs found or user wants always new tab)
    debugLog('GPT Pinboard: Creating new tab with URL:', pin.pageUrl);
      
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