// Configure uninstall URL (will be set at startup and on install)
// NOTE: This implements an offline, client-side signature verification flow.
// It avoids sending the install token to an external server. HOWEVER this
// method cannot provide a cryptographically strong guarantee (an attacker
// could craft a signed-looking uninstall URL). For robust verification
// prefer a server-side registration + verification step.
async function configureUninstallUrl() {
  try {
    const installData = await getSetting('gpt-pinboard-install');
    const base = 'https://gptpins.dps.codes/goodbye.html';

    if (installData && installData.installToken && installData.signature && installData.publicJwk) {
      // Build URL with token, signature and public JWK (encoded)
      const params = new URLSearchParams();
      params.set('installToken', installData.installToken);
      params.set('sig', installData.signature);
      // Public JWK as base64url JSON
      params.set('pub', btoa(unescape(encodeURIComponent(JSON.stringify(installData.publicJwk)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''));
      runtimeAPI.setUninstallURL(`${base}?${params.toString()}`);
      debugLog('Pinboard GPT: Uninstall URL configured with local-signed token');
    } else {
      // Fall back to simple uninstall page without any token
      runtimeAPI.setUninstallURL(base);
      debugLog('Pinboard GPT: Uninstall URL configured without token');
    }
  } catch (e) {
    debugLog('Pinboard GPT: Failed to configure uninstall URL', e);
    try { runtimeAPI.setUninstallURL('https://gptpins.dps.codes/goodbye.html'); } catch (err) { /* ignore */ }
  }
}

// Handle extension installation
runtimeAPI.onInstalled.addListener((details) => {
  debugLog('Pinboard GPT: Extension installed/updated', details.reason);
  
  if (details.reason === 'install') {
    (async () => {
      try {
        const installToken = generateInstallToken();

        // Generate an ephemeral ECDSA keypair and sign the install token
        const keyPair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);

        // Sign the token (UTF-8 bytes)
        const encoder = new TextEncoder();
        const data = encoder.encode(installToken);
        const signatureBuf = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, keyPair.privateKey, data);

        // Export public key to JWK and base64url-encode signature
        const publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
        const signatureBase64 = arrayBufferToBase64Url(signatureBuf);

        const installationData = {
          extensionId: runtimeAPI.id,
          installDate: new Date().toISOString(),
          installToken: installToken,
          signature: signatureBase64,
          publicJwk: publicJwk,
          version: runtimeAPI.getManifest().version
        };

        await setSetting('gpt-pinboard-install', installationData);
        await configureUninstallUrl();
        tabsAPI.create({ url: 'https://gptpins.dps.codes/welcome.html' });
      } catch (e) {
        debugLog('Pinboard GPT: Error during install-time signing flow', e);
        // Fallback: persist minimal install record and configure uninstall URL
        const installationData = {
          extensionId: runtimeAPI.id,
          installDate: new Date().toISOString(),
          installToken: generateInstallToken(),
          version: runtimeAPI.getManifest().version
        };
        await setSetting('gpt-pinboard-install', installationData);
        await configureUninstallUrl();
        tabsAPI.create({ url: 'https://gptpins.dps.codes/welcome.html' });
      }
    })();
  }
});

// Generate unique installation token
function generateInstallToken() {
  return 'gpt-pin-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Helpers for base64url encoding
function arrayBufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const b64 = btoa(binary);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Handle internal messages (from popup, content scripts, etc.)
runtimeAPI.onMessage.addListener((request, sender, sendResponse) => {
  debugLog('Pinboard GPT: Background received message:', request.action, request);
  debugLog('Pinboard GPT: Browser info:', {
    isFirefox: isFirefox,
    userAgent: navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Chrome/Other'
  });

  if (request.action === 'open-and-highlight' && request.pin) {
    debugLog('Pinboard GPT: About to handle open-and-highlight');
    try {
      handleOpenAndHighlight(request.pin, sendResponse, request.forceNewTab === true);
      return true; // Will respond asynchronously
    } catch (error) {
      debugLog('Pinboard GPT: Error in handleOpenAndHighlight:', error);
      sendResponse({ success: false, error: error.message });
      return false;
    }
  }
  
  if (request.action === 'get-debug-setting') {
    debugLog('Pinboard GPT: Content script requesting debug setting');
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
    debugLog('Pinboard GPT: Handling open-and-highlight for pin:', pin.id, pin.pageUrl);
    debugLog('Pinboard GPT: Using browser-specific tabsAPI for tab query');
    
    // New semantics: `reuseSameWindow` (boolean)
    // - true  => reuse an existing ChatGPT tab (do not force new tab)
    // - false => always open a new tab
    let reuseSameWindowRaw = await getSetting('reuseSameWindow');
    debugLog('Pinboard GPT: Raw reuseSameWindow setting:', reuseSameWindowRaw, typeof reuseSameWindowRaw);

    // Default to reuse same window when unset
    let reuseSameWindow = reuseSameWindowRaw === undefined ? true : !!reuseSameWindowRaw;
    // Persist default when not set
    if (reuseSameWindowRaw === undefined) {
      try {
        await setSetting('reuseSameWindow', reuseSameWindow);
        debugLog('Pinboard GPT: Defaulted reuseSameWindow to true');
      } catch (e) {
        debugLog('Pinboard GPT: Failed to persist default reuseSameWindow:', e);
      }
    }

    // If caller sets forceNewTab, it overrides reuse behavior
    const effectiveReuseSameWindow = forceNewTab === true ? false : reuseSameWindow;
    debugLog('Pinboard GPT: Tab behavior - reuseSameWindow:', reuseSameWindow, 'forceNewTab:', forceNewTab, 'effectiveReuseSameWindow:', effectiveReuseSameWindow);
    
    const pinUrl = new URL(pin.pageUrl);
    let matchingTabs = [];
    
    // Always check for existing tabs first
    const tabs = await tabsAPI.query({});
    
    debugLog('Pinboard GPT: Pin URL details:', {
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
            debugLog('Pinboard GPT: ✓ MATCH FOUND - ChatGPT tab', {
              tabId: tab.id,
              tabUrl: tab.url,
              pinUrl: pin.pageUrl
            });
            return true;
          }
          
          // Fallback to exact URL match for non-ChatGPT URLs
          const exactMatch = tab.url === pin.pageUrl;
          if (exactMatch) {
            debugLog('Pinboard GPT: ✓ MATCH FOUND - Exact URL match');
          }
          return exactMatch;
        } catch (e) {
          debugLog('Pinboard GPT: Error parsing tab URL:', e);
          return tab.url === pin.pageUrl;
        }
      });
    
    debugLog('Pinboard GPT: Found matching tabs:', matchingTabs.length, matchingTabs.map(t => ({id: t.id, url: t.url})));
    
    // If we found a matching tab AND effective setting allows reuse, reuse it
    if (matchingTabs.length > 0 && effectiveReuseSameWindow) {
      // Tab already exists, navigate to the pin URL and highlight
      const existingTab = matchingTabs[0];
      debugLog('Pinboard GPT: Reusing existing ChatGPT tab:', existingTab.id, 'navigating to:', pin.pageUrl);
      
      // Update the tab with the pin's URL and make it active
      await tabsAPI.update(existingTab.id, { 
        url: pin.pageUrl,
        active: true 
      });
      
      // Set up timeout for the whole operation
      let responseTimeout = setTimeout(() => {
        debugLog('Pinboard GPT: Tab load timeout');
        tabsAPI.onUpdated.removeListener(onTabUpdate);
        sendResponse({ success: true, highlighted: false, error: 'Tab load timeout' });
      }, 15000);
      
      // Wait for tab to load with the new URL, then send highlight message
      const onTabUpdate = (tabId, changeInfo, tab) => {
        if (tabId === existingTab.id && changeInfo.status === 'complete') {
          debugLog('Pinboard GPT: Tab loaded with new URL, sending highlight message');
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
                debugLog('Pinboard GPT: Error highlighting pin:', lastError.message);
                sendResponse({ success: true, highlighted: false, error: lastError.message });
              } else {
                debugLog('Pinboard GPT: Highlight response from reused tab:', response);
                sendResponse({ success: true, highlighted: response?.found || false });
              }
            });
          }, 1500);
        }
      };
      
      tabsAPI.onUpdated.addListener(onTabUpdate);
      return; // Exit early since we're reusing existing tab
    }
    
    // Either no matching tab found, or effectiveReuseSameWindow=false (force new tab)
    if (matchingTabs.length > 0) {
      debugLog('Pinboard GPT: ChatGPT tab exists but effectiveReuseSameWindow=false, creating new tab with URL:', pin.pageUrl);
    } else {
      debugLog('Pinboard GPT: No matching tab found, creating new tab with URL:', pin.pageUrl);
    }
      
    let newTab;
    newTab = await tabsAPI.create({ url: pin.pageUrl });
    debugLog('Pinboard GPT: Successfully created new tab:', newTab.id, pin.pageUrl);
      
      // Set up timeout for the whole operation
      let responseTimeout = setTimeout(() => {
        debugLog('Pinboard GPT: Tab load timeout');
        tabsAPI.onUpdated.removeListener(onTabUpdate);
        sendResponse({ success: true, highlighted: false, error: 'Tab load timeout' });
      }, 15000);
      
      // Wait for tab to load, then send highlight message
      const onTabUpdate = (tabId, changeInfo, tab) => {
        if (tabId === newTab.id && changeInfo.status === 'complete') {
          debugLog('Pinboard GPT: Tab loaded, sending highlight message');
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
                debugLog('Pinboard GPT: Error highlighting pin:', lastError.message);
                sendResponse({ success: true, highlighted: false, error: lastError.message });
              } else {
                debugLog('Pinboard GPT: Highlight response:', response);
                sendResponse({ success: true, highlighted: response?.found || false });
              }
            });
          }, 1500);
        }
      };
      
      tabsAPI.onUpdated.addListener(onTabUpdate);
  } catch (error) {
    debugLog('Pinboard GPT: Error in open-and-highlight:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle external messages (from website)
runtimeAPI.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.action === 'verify-installation') {
    const allowedOrigins = [
      'https://gptpins.dps.codes'
    ];

    if (allowedOrigins.includes(sender.origin)) {
      getSetting('gpt-pinboard-install').then((installData) => {
        if (installData) {
          sendResponse({
            verified: true,
            extensionId: runtimeAPI.id,
            installToken: installData.installToken,
            signature: installData.signature,
            publicJwk: installData.publicJwk,
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

debugLog('Pinboard GPT: Background script loaded');

// Ensure uninstall URL is configured on startup (if possible)
try { configureUninstallUrl(); } catch (e) { /* ignore */ }