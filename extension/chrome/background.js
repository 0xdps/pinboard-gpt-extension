chrome.runtime.onInstalled.addListener(async (details) => {
  // Check if context menu should be enabled (default to false)
  const { enableContextMenu } = await chrome.storage.local.get(['enableContextMenu']);
  
  if (enableContextMenu === true) {
    createContextMenu();
  }

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

// Function to create context menu
function createContextMenu() {
  chrome.contextMenus.create({
    id: "pin-selection",
    title: "Pin selection to GPT Pinboard",
    contexts: ["selection"],
    documentUrlPatterns: ["https://chatgpt.com/*", "https://chat.openai.com/*"]
  }, () => {
    if (chrome.runtime.lastError) {
      console.log('Context menu already exists or error:', chrome.runtime.lastError.message);
    }
  });
}

// Function to remove context menu
function removeContextMenu() {
  chrome.contextMenus.remove("pin-selection", () => {
    if (chrome.runtime.lastError) {
      console.log('Context menu not found or error:', chrome.runtime.lastError.message);
    }
  });
}

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
  console.log('GPT Pinboard: Context menu clicked', info);
  if (info.menuItemId === 'pin-selection') {
    console.log('GPT Pinboard: Pin selection clicked, text:', info.selectionText);
    
    if (!tab?.id) {
      console.error('GPT Pinboard: No active tab found');
      return;
    }

    // Check if the tab is a valid ChatGPT page
    const validUrls = ['https://chatgpt.com/', 'https://chat.openai.com/'];
    const isValidPage = validUrls.some(url => tab.url && tab.url.startsWith(url));
    
    if (!isValidPage) {
      console.error('GPT Pinboard: Context menu triggered on non-ChatGPT page:', tab.url);
      return;
    }

    // First check if content script is loaded by sending a ping
    chrome.tabs.sendMessage(tab.id, { action: 'ping' }, (pingResponse) => {
      if (chrome.runtime.lastError) {
        console.log('GPT Pinboard: Content script not ready, injecting...');
        
        // Content script not loaded, try to inject it
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['idb.js', 'content_script_chatgpt.js']
        }, () => {
          if (chrome.runtime.lastError) {
            console.error('GPT Pinboard: Failed to inject content script:', chrome.runtime.lastError.message);
            return;
          }
          
          // Wait a bit for script to initialize, then send the message
          setTimeout(() => {
            sendPinMessage(tab.id, info.selectionText);
          }, 1000);
        });
      } else {
        // Content script is ready, send the message directly
        sendPinMessage(tab.id, info.selectionText);
      }
    });
  }
});

function sendPinMessage(tabId, selectionText) {
  sendMessageWithRetry(tabId, { action: 'pin-selection', text: selectionText }, (result) => {
    if (result.error) {
      console.error('GPT Pinboard: Error sending pin message:', result.error);
    } else {
      console.log('GPT Pinboard: Pin message sent successfully, response:', result.data);
    }
  });
}

function sendMessageWithRetry(tabId, message, callback, maxRetries = 3, currentRetry = 0) {
  chrome.tabs.sendMessage(tabId, message, (response) => {
    if (chrome.runtime.lastError) {
      const error = chrome.runtime.lastError.message;
      console.log(`GPT Pinboard: Message attempt ${currentRetry + 1} failed:`, error);
      
      if (currentRetry < maxRetries && error.includes('Could not establish connection')) {
        // Retry after a delay
        setTimeout(() => {
          sendMessageWithRetry(tabId, message, callback, maxRetries, currentRetry + 1);
        }, 500);
      } else {
        callback({ error: error });
      }
    } else {
      callback({ data: response });
    }
  });
}

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
        sendMessageWithRetry(activeTab.id, { action: 'highlight-pin', pin }, (resp) => {
          if (resp.error) {
            sendResponse({ ok: false, error: resp.error });
          } else {
            sendResponse({ ok: true, resp: resp.data });
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
                sendMessageWithRetry(t.id, { action: 'highlight-pin', pin }, (result) => {
                  if (result.error) {
                    sendResponse({ ok: false, error: result.error });
                  } else {
                    sendResponse({ ok: true, resp: result.data });
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
                  // Wait for navigation to complete, then send message with retry
                  setTimeout(() => {
                    sendMessageWithRetry(t.id, { action: 'highlight-pin', pin }, (result) => {
                      if (result.error) {
                        sendResponse({ ok: false, error: result.error });
                      } else {
                        sendResponse({ ok: true, resp: result.data });
                      }
                    }, 5); // More retries for navigation case
                  }, 1000);
                });
              });
            } else {
              // No ChatGPT tab open, create a new one
              chrome.tabs.create({ url: targetUrl }, (newTab) => {
                // Wait longer for new tab to load, then send message with retry
                setTimeout(() => {
                  sendMessageWithRetry(newTab.id, { action: 'highlight-pin', pin }, (result) => {
                    if (result.error) {
                      sendResponse({ ok: false, error: result.error });
                    } else {
                      sendResponse({ ok: true, resp: result.data });
                    }
                  }, 8); // Even more retries for new tab case
                }, 2000);
              });
            }
          });
        }
      });
    });
    return true; // Will respond asynchronously
  }
  
  // Handle context menu toggle from popup
  if (msg?.action === 'update-context-menu') {
    if (msg.enabled) {
      createContextMenu();
    } else {
      removeContextMenu();
    }
    sendResponse({ ok: true });
    return true;
  }
});
