// Browser API compatibility
if (typeof browser !== 'undefined' && typeof chrome === 'undefined') {
  window.chrome = browser;
}

// Set uninstall URL
chrome.runtime.setUninstallURL('https://gptpins.dps.codes/goodbye.html');

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('GPT Pinboard: Extension installed/updated', details.reason);
  
  if (details.reason === 'install') {
    const installationData = {
      extensionId: chrome.runtime.id,
      installDate: new Date().toISOString(),
      installToken: generateInstallToken(),
      version: chrome.runtime.getManifest().version
    };
    
    chrome.storage.local.set({ 'gpt-pinboard-install': installationData });
    chrome.tabs.create({ url: 'https://gptpins.dps.codes/welcome.html' });
  }
});

// Generate unique installation token
function generateInstallToken() {
  return 'gpt-pin-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Handle internal messages (from popup, content scripts, etc.)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('GPT Pinboard: Received message:', request.action, request);

  if (request.action === 'open-and-highlight' && request.pin) {
    handleOpenAndHighlight(request.pin, sendResponse);
    return true; // Will respond asynchronously
  }
  
  return false;
});

// Handle open-and-highlight requests
async function handleOpenAndHighlight(pin, sendResponse) {
  try {
    console.log('GPT Pinboard: Handling open-and-highlight for pin:', pin.id, pin.pageUrl);
    // First, check if there's already a tab with this URL or similar ChatGPT URL
    const pinUrl = new URL(pin.pageUrl);
    const tabs = await chrome.tabs.query({});
    
    // Find tabs that match the ChatGPT conversation
    const matchingTabs = tabs.filter(tab => {
      if (!tab.url) return false;
      try {
        const tabUrl = new URL(tab.url);
        // Match ChatGPT domains and conversation paths
        if ((tabUrl.hostname === 'chatgpt.com' || tabUrl.hostname === 'chat.openai.com') &&
            (pinUrl.hostname === 'chatgpt.com' || pinUrl.hostname === 'chat.openai.com')) {
          // For ChatGPT, match the conversation ID in the path
          const pinPath = pinUrl.pathname;
          const tabPath = tabUrl.pathname;
          // Extract conversation ID (format: /c/conversation-id)
          const pinConversationMatch = pinPath.match(/\/c\/([^\/\?]+)/);
          const tabConversationMatch = tabPath.match(/\/c\/([^\/\?]+)/);
          
          if (pinConversationMatch && tabConversationMatch) {
            return pinConversationMatch[1] === tabConversationMatch[1];
          }
        }
        // Fallback to exact URL match
        return tab.url === pin.pageUrl;
      } catch (e) {
        return tab.url === pin.pageUrl;
      }
    });
    
    if (matchingTabs.length > 0) {
      // Tab already exists, switch to it and highlight
      const existingTab = matchingTabs[0];
      console.log('GPT Pinboard: Switching to existing tab:', existingTab.id);
      await chrome.tabs.update(existingTab.id, { active: true });
      
      // Wait a moment for tab to become active, then send highlight message
      setTimeout(() => {
        console.log('GPT Pinboard: Sending highlight message to existing tab');
        chrome.tabs.sendMessage(existingTab.id, {
          action: 'highlight-pin',
          pin: pin
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.log('GPT Pinboard: Error highlighting pin:', chrome.runtime.lastError.message);
            sendResponse({ success: true, highlighted: false, error: chrome.runtime.lastError.message });
          } else {
            console.log('GPT Pinboard: Highlight response from existing tab:', response);
            sendResponse({ success: true, highlighted: response?.found || false });
          }
        });
      }, 1000);
    } else {
      // Create new tab with the URL
      const newTab = await chrome.tabs.create({ url: pin.pageUrl });
      console.log('GPT Pinboard: Created new tab:', newTab.id, pin.pageUrl);
      
      // Set up timeout for the whole operation
      let responseTimeout = setTimeout(() => {
        console.log('GPT Pinboard: Tab load timeout');
        chrome.tabs.onUpdated.removeListener(onTabUpdate);
        sendResponse({ success: true, highlighted: false, error: 'Tab load timeout' });
      }, 15000);
      
      // Wait for tab to load, then send highlight message
      const onTabUpdate = (tabId, changeInfo, tab) => {
        if (tabId === newTab.id && changeInfo.status === 'complete') {
          console.log('GPT Pinboard: Tab loaded, sending highlight message');
          chrome.tabs.onUpdated.removeListener(onTabUpdate);
          clearTimeout(responseTimeout);
          
          // Additional wait for content script to be ready
          setTimeout(() => {
            chrome.tabs.sendMessage(newTab.id, {
              action: 'highlight-pin',
              pin: pin
            }, (response) => {
              if (chrome.runtime.lastError) {
                console.log('GPT Pinboard: Error highlighting pin:', chrome.runtime.lastError.message);
                sendResponse({ success: true, highlighted: false, error: chrome.runtime.lastError.message });
              } else {
                console.log('GPT Pinboard: Highlight response:', response);
                sendResponse({ success: true, highlighted: response?.found || false });
              }
            });
          }, 1500);
        }
      };
      
      chrome.tabs.onUpdated.addListener(onTabUpdate);
    }
  } catch (error) {
    console.log('GPT Pinboard: Error in open-and-highlight:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle external messages (from website)
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.action === 'verify-installation') {
    const allowedOrigins = [
      'https://gptpins.dps.codes',
      'http://localhost:8080',
      'https://localhost:8080'
    ];

    if (allowedOrigins.includes(sender.origin)) {
      chrome.storage.local.get(['gpt-pinboard-install'], (result) => {
        const installData = result['gpt-pinboard-install'];
        if (installData) {
          sendResponse({
            verified: true,
            extensionId: chrome.runtime.id,
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

console.log('GPT Pinboard: Background script loaded');