chrome.runtime.onInstalled.addListener((details) => {
  chrome.contextMenus.create({
    id: "pin-selection",
    title: "Pin selection to GPT Pinboard",
    contexts: ["selection"],
    documentUrlPatterns: ["https://chatgpt.com/*", "https://chat.openai.com/*"]
  });

  // Store installation information for feedback verification
  if (details.reason === 'install') {
    const installationData = {
      extensionId: chrome.runtime.id,
      installDate: new Date().toISOString(),
      installToken: generateInstallToken(),
      version: chrome.runtime.getManifest().version
    };
    
    chrome.storage.local.set({ 
      'gpt-pinboard-install': installationData 
    });

    // Open welcome page on install
    chrome.tabs.create({
      url: 'https://gptpins.dps.codes/welcome.html'
    });
  }
});

// Generate unique installation token
function generateInstallToken() {
  return 'gpt-pin-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Set uninstall URL for feedback
chrome.runtime.setUninstallURL('https://gptpins.dps.codes/goodbye.html');

// Handle requests for installation verification from web pages
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.action === 'verify-installation') {
    // Only respond to requests from our official domains
    const allowedOrigins = [
      'https://gptpins.dps.codes',
      'http://localhost:8080', // for development
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
      return true; // Will respond asynchronously
    }
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'pin-selection') {
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'pin-selection', text: info.selectionText });
    }
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.action === 'open-and-highlight' && msg.pin) {
    const pin = msg.pin;
    const targetUrl = pin.pageUrl || 'https://chatgpt.com/';
    
    // First check if the current active tab is already on the right conversation
    chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
      if (chrome.runtime.lastError) {
        sendResponse({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      
      const activeTab = activeTabs && activeTabs[0];
      
      // Check if active tab is already on the target URL
      if (activeTab && activeTab.url && activeTab.url.startsWith(targetUrl.split('?')[0])) {
        // Just highlight without reloading
        chrome.tabs.sendMessage(activeTab.id, { action: 'highlight-pin', pin }, (resp) => {
          if (chrome.runtime.lastError) {
            sendResponse({ ok: false, error: chrome.runtime.lastError.message });
          } else {
            sendResponse({ ok: true, resp });
          }
        });
        return;
      }
      
      // Not on the right conversation, check if there's a tab with the exact URL
      chrome.tabs.query({ url: targetUrl }, (exactTabs) => {
        if (chrome.runtime.lastError) {
          sendResponse({ ok: false, error: chrome.runtime.lastError.message });
          return;
        }
        
        // If we found the exact conversation tab, use it
        if (exactTabs && exactTabs.length > 0) {
          const t = exactTabs[0];
          chrome.windows.update(t.windowId, { focused: true }, () => {
            chrome.tabs.update(t.id, { active: true }, () => {
              // Don't reload, just wait a bit and highlight
              setTimeout(() => {
                chrome.tabs.sendMessage(t.id, { action: 'highlight-pin', pin }, (resp) => {
                  if (chrome.runtime.lastError) {
                    sendResponse({ ok: false, error: chrome.runtime.lastError.message });
                  } else {
                    sendResponse({ ok: true, resp });
                  }
                });
              }, 300);
            });
          });
        } else {
          // Check if there's any ChatGPT tab open
          chrome.tabs.query({ url: ['https://chatgpt.com/*', 'https://chat.openai.com/*'] }, (chatTabs) => {
            if (chatTabs && chatTabs.length > 0) {
              // Use existing ChatGPT tab but navigate to the correct URL
              const t = chatTabs[0];
              chrome.windows.update(t.windowId, { focused: true }, () => {
                chrome.tabs.update(t.id, { active: true, url: targetUrl }, () => {
                  // Wait for navigation to complete
                  const trySend = (attemptsLeft = 20) => {
                    if (attemptsLeft <= 0) {
                      sendResponse({ ok: false, error: 'Timed out waiting for page to load' });
                      return;
                    }
                    setTimeout(() => {
                      chrome.tabs.sendMessage(t.id, { action: 'highlight-pin', pin }, (resp) => {
                        if (chrome.runtime.lastError) {
                          trySend(attemptsLeft - 1);
                        } else {
                          sendResponse({ ok: true, resp });
                        }
                      });
                    }, 400);
                  };
                  trySend(20);
                });
              });
            } else {
              // No ChatGPT tab open, create a new one
              chrome.tabs.create({ url: targetUrl }, (newTab) => {
                const trySend = (attemptsLeft = 20) => {
                  if (attemptsLeft <= 0) {
                    sendResponse({ ok: false, error: 'Timed out waiting for tab' });
                    return;
                  }
                  setTimeout(() => {
                    chrome.tabs.sendMessage(newTab.id, { action: 'highlight-pin', pin }, (resp) => {
                      if (chrome.runtime.lastError) {
                        trySend(attemptsLeft - 1);
                      } else {
                        sendResponse({ ok: true, resp });
                      }
                    });
                  }, 400);
                };
                trySend(20);
              });
            }
          });
        }
      });
    });
    return true; // Will respond asynchronously
  }
});
