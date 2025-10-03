// Content script for ChatGPT pages - handles message pinning and highlighting

let hoveredElement = null;
let pinButton = null;

// Create floating pin button
function createPinButton() {
  if (pinButton) return pinButton;
  
  pinButton = document.createElement('button');
  // SVG pin icon matching ChatGPT's style
  pinButton.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 12V4H17V2H7V4H8V12L6 14V16H11V22H13V16H18V14L16 12Z" fill="currentColor"/>
    </svg>
  `;
  pinButton.title = 'Pin this message';
  pinButton.className = 'pingpt-pin-button';
  pinButton.style.cssText = `
    position: absolute;
    z-index: 10000;
    background: transparent;
    color: #6e6e80;
    border: none;
    border-radius: 6px;
    padding: 4px;
    width: 28px;
    height: 28px;
    cursor: pointer;
    display: none;
    transition: background 0.15s, color 0.15s;
    pointer-events: auto;
    left: -36px;
    top: 8px;
  `;
  
  pinButton.addEventListener('mouseenter', () => {
    pinButton.style.background = 'rgba(0, 0, 0, 0.1)';
    pinButton.style.color = '#000';
  });
  
  pinButton.addEventListener('mouseleave', () => {
    pinButton.style.background = 'transparent';
    pinButton.style.color = '#6e6e80';
  });
  
  pinButton.addEventListener('click', async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (hoveredElement) {
      await openPinDialog(hoveredElement);
    }
    pinButton.style.display = 'none';
  });
  
  document.body.appendChild(pinButton);
  return pinButton;
}

// Find the message container element
function findMessageContainer(element) {
  let current = element;
  // Look for ChatGPT message containers - specifically those with data-message-author-role
  while (current && current !== document.body) {
    // Primary selector: actual message containers with author role
    if (current.getAttribute('data-message-author-role')) {
      return current;
    }
    // Fallback: div containing a child with data-message-author-role
    if (current.tagName === 'DIV' && current.querySelector('[data-message-author-role]')) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

// Show pin button on hover
function attachHoverListeners() {
  let hideTimeout = null;
  let lastHoveredElement = null;
  
  console.log('PinGPT: Hover listeners attached');
  
  document.addEventListener('mouseover', (e) => {
    const target = e.target;
    
    // Skip if hovering over the button itself or its children
    if (target === pinButton || pinButton?.contains(target)) {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
      return;
    }
    
    // Don't show on input areas, buttons, sidebar, navigation, footer, or header
    if (target.closest && target.closest('textarea, input, button, form, nav, aside, header, footer, [role="navigation"], [role="banner"], [role="contentinfo"]')) {
      return;
    }
    
    // Make sure we're in the main content area
    const mainContent = document.querySelector('main');
    if (!mainContent || !mainContent.contains(target)) {
      return;
    }
    
    // Skip footer disclaimers and UI elements
    const textContent = target.textContent || '';
    if (textContent.includes('ChatGPT can make mistakes') || 
        textContent.includes('Share') || 
        target.closest('.sticky, [class*="footer"], [class*="disclaimer"]')) {
      return;
    }
    
    // Look for message containers
    const messageContainer = findMessageContainer(target);
    if (!messageContainer) {
      return;
    }
    
    // Verify it's actually a message with meaningful content
    const text = (messageContainer.innerText || '').trim();
    if (text.length < 10) {
      return;
    }
    
    // Don't reposition if we're still on the same element and button is visible
    if (messageContainer === lastHoveredElement && pinButton && pinButton.style.display === 'flex') {
      return;
    }
    
    // Clear any pending hide
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
    
    lastHoveredElement = messageContainer;
    hoveredElement = messageContainer;
    
    const btn = createPinButton();
    
    console.log('PinGPT: Showing button for message:', text.slice(0, 50));
    
    // Set position relative on container if needed
    const computedPosition = window.getComputedStyle(messageContainer).position;
    if (computedPosition === 'static') {
      messageContainer.style.position = 'relative';
    }
    
    // Append button to the message container
    if (btn.parentElement !== messageContainer) {
      messageContainer.appendChild(btn);
    }
    
    // Button position is set in CSS (left: -36px, top: 8px)
    btn.style.display = 'flex';
  });
  
  document.addEventListener('mouseout', (e) => {
    const relatedTarget = e.relatedTarget;
    
    // Don't hide if moving to the button
    if (relatedTarget === pinButton || pinButton?.contains(relatedTarget)) {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
      return;
    }
    
    // Only hide if we're leaving the message container
    const messageContainer = findMessageContainer(e.target);
    if (messageContainer === lastHoveredElement) {
      // Check if the related target is still within the same message
      const newMessageContainer = relatedTarget ? findMessageContainer(relatedTarget) : null;
      if (newMessageContainer === messageContainer) {
        return; // Still within same message
      }
      
      // Delay hiding to allow moving to button
      hideTimeout = setTimeout(() => {
        // Check if button is being hovered or if cursor returned to message
        if (pinButton && !pinButton.matches(':hover')) {
          const currentHover = document.querySelector(':hover');
          const hoveredMessage = currentHover ? findMessageContainer(currentHover) : null;
          if (hoveredMessage !== lastHoveredElement) {
            pinButton.style.display = 'none';
            lastHoveredElement = null;
          }
        }
      }, 200);
    }
  });
  
  // Also hide button when it's not hovered anymore and mouse leaves it
  document.addEventListener('mouseover', (e) => {
    if (e.target === pinButton || pinButton?.contains(e.target)) {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
    }
  });
}

// Get XPath for an element
function getXPath(element) {
  if (!element || element === document.body) return '';
  
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }
  
  const parts = [];
  let current = element;
  
  while (current && current !== document.body) {
    let index = 1;
    let sibling = current.previousSibling;
    
    while (sibling) {
      if (sibling.nodeType === 1 && sibling.nodeName === current.nodeName) {
        index++;
      }
      sibling = sibling.previousSibling;
    }
    
    const tagName = current.nodeName.toLowerCase();
    const part = `${tagName}[${index}]`;
    parts.unshift(part);
    current = current.parentElement;
  }
  
  return '/' + parts.join('/');
}

// Get text anchors for fuzzy matching
function getTextAnchors(element) {
  const text = element.innerText || element.textContent || '';
  const words = text.trim().split(/\s+/);
  return {
    prefix: words.slice(0, 10).join(' ').slice(0, 100),
    suffix: words.slice(-10).join(' ').slice(-100),
    full: text.slice(0, 500)
  };
}

// Create and show pin dialog
function openPinDialog(element) {
  return new Promise((resolve) => {
    const messageText = element.innerText || element.textContent || '';
    if (!messageText.trim()) {
      showNotification('⚠️ No text found to pin');
      resolve();
      return;
    }
    
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 100000;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
    `;
    
    // Create dialog
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      font-family: system-ui, -apple-system, sans-serif;
    `;
    
    const messagePreview = messageText.length > 300 ? messageText.slice(0, 300) + '...' : messageText;
    
    dialog.innerHTML = `
      <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #202124;">📌 Pin Message</h2>
      
      <div style="margin-bottom: 16px;">
        <label style="display: block; font-weight: 600; margin-bottom: 6px; color: #5f6368; font-size: 14px;">
          Preview
        </label>
        <div style="
          background: #f8f9fa;
          border: 1px solid #e8eaed;
          border-radius: 6px;
          padding: 12px;
          max-height: 150px;
          overflow-y: auto;
          font-size: 13px;
          color: #5f6368;
          white-space: pre-wrap;
          line-height: 1.5;
        ">${escapeHtml(messagePreview)}</div>
      </div>
      
      <div style="margin-bottom: 16px;">
        <label for="pin-name" style="display: block; font-weight: 600; margin-bottom: 6px; color: #5f6368; font-size: 14px;">
          Name (optional)
        </label>
        <input 
          type="text" 
          id="pin-name" 
          placeholder="Give this pin a memorable name..."
          style="
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #dadce0;
            border-radius: 6px;
            font-size: 14px;
            box-sizing: border-box;
            transition: border-color 0.2s;
          "
        />
      </div>
      
      <div style="margin-bottom: 24px;">
        <label for="pin-tags" style="display: block; font-weight: 600; margin-bottom: 6px; color: #5f6368; font-size: 14px;">
          Tags (optional)
        </label>
        <input 
          type="text" 
          id="pin-tags" 
          placeholder="python, tutorial, code (comma-separated)"
          style="
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #dadce0;
            border-radius: 6px;
            font-size: 14px;
            box-sizing: border-box;
            transition: border-color 0.2s;
          "
        />
        <div style="font-size: 12px; color: #80868b; margin-top: 4px;">
          Separate tags with commas
        </div>
      </div>
      
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button 
          id="pin-cancel" 
          style="
            padding: 10px 20px;
            border: 1px solid #dadce0;
            border-radius: 6px;
            background: white;
            color: #5f6368;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
          "
        >Cancel</button>
        <button 
          id="pin-save" 
          style="
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            background: #10a37f;
            color: white;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
          "
        >Save Pin</button>
      </div>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // Focus on name input
    setTimeout(() => {
      const nameInput = document.getElementById('pin-name');
      if (nameInput) nameInput.focus();
    }, 100);
    
    // Add hover effects
    const cancelBtn = dialog.querySelector('#pin-cancel');
    const saveBtn = dialog.querySelector('#pin-save');
    
    cancelBtn.addEventListener('mouseenter', () => {
      cancelBtn.style.background = '#f8f9fa';
    });
    cancelBtn.addEventListener('mouseleave', () => {
      cancelBtn.style.background = 'white';
    });
    
    saveBtn.addEventListener('mouseenter', () => {
      saveBtn.style.background = '#0d8a6a';
    });
    saveBtn.addEventListener('mouseleave', () => {
      saveBtn.style.background = '#10a37f';
    });
    
    // Handle input focus
    const inputs = dialog.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        input.style.borderColor = '#10a37f';
        input.style.outline = 'none';
      });
      input.addEventListener('blur', () => {
        input.style.borderColor = '#dadce0';
      });
    });
    
    // Handle cancel
    const closeDialog = () => {
      overlay.remove();
      resolve();
    };
    
    cancelBtn.addEventListener('click', closeDialog);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeDialog();
    });
    
    // Handle save
    saveBtn.addEventListener('click', async () => {
      const nameInput = document.getElementById('pin-name');
      const tagsInput = document.getElementById('pin-tags');
      
      const name = nameInput.value.trim();
      const tagsText = tagsInput.value.trim();
      const tags = tagsText ? tagsText.split(',').map(t => t.trim()).filter(Boolean) : [];
      
      const pin = {
        id: crypto.randomUUID(),
        messageText: messageText.trim(),
        name: name,
        tags: tags,
        pageUrl: window.location.href,
        site: 'ChatGPT',
        pinnedAt: Date.now(),
        xpath: getXPath(element),
        anchors: getTextAnchors(element)
      };
      
      try {
        if (typeof idbAdd === 'function') {
          await idbAdd(pin);
          console.log('Pin saved successfully:', pin);
          overlay.remove();
          showNotification('✅ Message pinned successfully!');
          resolve();
        } else {
          throw new Error('idbAdd function not available');
        }
      } catch (err) {
        console.error('Failed to pin:', err);
        showNotification('❌ Failed to save pin: ' + err.message);
        overlay.remove();
        resolve();
      }
    });
    
    // Handle Enter key to save
    inputs.forEach(input => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          saveBtn.click();
        }
      });
    });
    
    // Handle Escape key to cancel
    document.addEventListener('keydown', function escapeHandler(e) {
      if (e.key === 'Escape') {
        closeDialog();
        document.removeEventListener('keydown', escapeHandler);
      }
    });
  });
}

// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Pin a message (legacy function for context menu)
async function pinMessage(element) {
  // Just call the dialog
  return openPinDialog(element);
}

// Show temporary notification
function showNotification(message) {
  const notif = document.createElement('div');
  notif.textContent = message;
  notif.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10001;
    background: #10a37f;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(notif);
  
  setTimeout(() => {
    notif.style.opacity = '0';
    notif.style.transition = 'opacity 0.3s';
    setTimeout(() => notif.remove(), 300);
  }, 2000);
}

// Find element by XPath
function findByXPath(xpath) {
  try {
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return result.singleNodeValue;
  } catch (err) {
    console.warn('XPath lookup failed:', err);
    return null;
  }
}

// Find element by text content (fuzzy match)
function findByTextAnchors(anchors) {
  if (!anchors) return null;
  
  // Try to find in main content area first
  const mainContent = document.querySelector('main') || document.body;
  const allElements = mainContent.querySelectorAll('[data-message-author-role], [data-message-id], article, .markdown, [class*="group"]');
  
  // Normalize text for better matching
  const normalizeText = (text) => text.trim().replace(/\s+/g, ' ');
  
  for (const el of allElements) {
    const text = normalizeText(el.innerText || el.textContent || '');
    
    if (text.length < 10) continue; // Skip empty elements
    
    // Try exact match with full anchor text
    if (anchors.full) {
      const normalizedFull = normalizeText(anchors.full);
      if (text.includes(normalizedFull)) {
        return el;
      }
    }
    
    // Try prefix match (first 100 chars)
    if (anchors.prefix) {
      const normalizedPrefix = normalizeText(anchors.prefix);
      if (text.includes(normalizedPrefix)) {
        return el;
      }
    }
    
    // Try suffix match
    if (anchors.suffix) {
      const normalizedSuffix = normalizeText(anchors.suffix);
      if (text.includes(normalizedSuffix)) {
        return el;
      }
    }
  }
  
  return null;
}

// Highlight a pinned message
async function highlightPin(pin) {
  console.log('Attempting to highlight pin:', pin);
  console.log('Pin text preview:', pin.messageText?.slice(0, 100));
  
  // Wait for page to be fully loaded and rendered
  await new Promise(resolve => {
    if (document.readyState === 'complete') {
      setTimeout(resolve, 500); // Extra wait for dynamic content
    } else {
      window.addEventListener('load', () => {
        setTimeout(resolve, 500);
      }, { once: true });
    }
  });
  
  // Additional wait for ChatGPT's dynamic content to render
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  let element = null;
  
  // Try text anchors first (most reliable for ChatGPT)
  if (pin.anchors) {
    console.log('Trying text anchor search...');
    element = findByTextAnchors(pin.anchors);
  }
  
  // Fallback to XPath
  if (!element && pin.xpath) {
    console.log('Trying XPath search...');
    element = findByXPath(pin.xpath);
  }
  
  // Last resort: search by partial text match
  if (!element && pin.messageText) {
    console.log('Trying direct text search...');
    const searchText = pin.messageText.slice(0, 100).trim();
    const mainContent = document.querySelector('main') || document.body;
    const allElements = mainContent.querySelectorAll('[data-message-author-role], article, [data-testid*="conversation"]');
    
    for (const el of allElements) {
      const text = (el.innerText || el.textContent || '').trim();
      if (text.includes(searchText)) {
        element = el;
        console.log('Found via direct text search');
        break;
      }
    }
  }
  
  if (!element) {
    console.warn('Could not find element for pin after all attempts');
    showNotification('⚠️ Could not find the pinned message on this page');
    return { found: false };
  }
  
  console.log('Found element, scrolling and highlighting...');
  
  // Scroll to element with retries
  try {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (err) {
    console.error('Scroll error:', err);
  }
  
  // Wait for scroll to complete
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Highlight effect
  const originalBg = element.style.background;
  const originalOutline = element.style.outline;
  const originalTransition = element.style.transition;
  const originalBorderRadius = element.style.borderRadius;
  
  element.style.transition = 'background 0.3s ease';
  element.style.background = '#fffacd';
  element.style.outline = '3px solid #10a37f';
  element.style.borderRadius = '8px';
  
  setTimeout(() => {
    element.style.background = originalBg;
    element.style.outline = originalOutline;
    element.style.transition = originalTransition;
    element.style.borderRadius = originalBorderRadius;
  }, 3000);
  
  showNotification('📌 Found pinned message!');
  return { found: true };
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('Content script received message:', msg);
  
  if (msg.action === 'pin-selection' && msg.text) {
    // Find element containing this text
    const allElements = document.querySelectorAll('[data-message-author-role], .group, article');
    for (const el of allElements) {
      const text = el.innerText || el.textContent || '';
      if (text.includes(msg.text)) {
        pinMessage(el);
        break;
      }
    }
    sendResponse({ ok: true });
    return true;
  } else if (msg.action === 'highlight-pin' && msg.pin) {
    console.log('Highlighting pin...');
    highlightPin(msg.pin).then(result => {
      console.log('Highlight result:', result);
      sendResponse(result);
    }).catch(err => {
      console.error('Error highlighting:', err);
      sendResponse({ found: false, error: err.message });
    });
    return true; // Will respond asynchronously
  }
  
  return false;
});

// Add a manual pin button to the page for easier access
function addManualPinButton() {
  // Wait for page to load
  setTimeout(() => {
    // Check if button already exists
    if (document.getElementById('pingpt-manual-pin')) return;
    
    const manualBtn = document.createElement('button');
    manualBtn.id = 'pingpt-manual-pin';
    manualBtn.innerHTML = '📌 Pin Last Message';
    manualBtn.title = 'Pin the last assistant message';
    manualBtn.style.cssText = `
      position: fixed;
      bottom: 100px;
      right: 20px;
      z-index: 10000;
      background: #10a37f;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 10px 16px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      transition: all 0.2s;
    `;
    
    manualBtn.addEventListener('mouseenter', () => {
      manualBtn.style.transform = 'scale(1.05)';
      manualBtn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)';
    });
    
    manualBtn.addEventListener('mouseleave', () => {
      manualBtn.style.transform = 'scale(1)';
      manualBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    });
    
    // Function to check and toggle button visibility
    const updateButtonVisibility = () => {
      const mainContent = document.querySelector('main') || document.body;
      const messages = mainContent.querySelectorAll('[data-message-author-role], article');
      const hasMessages = Array.from(messages).some(el => (el.innerText || '').trim().length > 10);
      manualBtn.style.display = hasMessages ? 'block' : 'none';
    };
    
    // Initial check
    updateButtonVisibility();
    
    // Observe DOM changes to show/hide button
    const observer = new MutationObserver(updateButtonVisibility);
    const mainContent = document.querySelector('main') || document.body;
    observer.observe(mainContent, { childList: true, subtree: true });
    
    manualBtn.addEventListener('click', async () => {
      // Find all assistant messages in the main conversation area
      const mainContent = document.querySelector('main') || document.body;
      const possibleSelectors = [
        '[data-message-author-role="assistant"]',
        'article[data-testid*="conversation"]'
      ];
      
      let messages = [];
      for (const selector of possibleSelectors) {
        const elements = mainContent.querySelectorAll(selector);
        if (elements.length > 0) {
          messages = Array.from(elements).filter(el => {
            const text = (el.innerText || '').trim();
            return text.length > 10; // Must have some meaningful content
          });
          break;
        }
      }
      
      if (messages.length === 0) {
        showNotification('⚠️ No messages found. Try scrolling or asking ChatGPT a question first.');
        return;
      }
      
      // Get the last message
      const lastMessage = messages[messages.length - 1];
      await openPinDialog(lastMessage);
    });
    
    document.body.appendChild(manualBtn);
    console.log('PinGPT: Manual pin button added');
  }, 1500);
}

// Initialize
console.log('PinGPT content script loaded on:', window.location.href);
console.log('PinGPT: idbAdd function available:', typeof idbAdd === 'function');
console.log('PinGPT: idbGetAll function available:', typeof idbGetAll === 'function');

// Expose debug functions to global window object
if (typeof idbGetAll === 'function') {
  // Create a script tag to inject functions into page context
  const script = document.createElement('script');
  script.textContent = `
    // Inject DB access into page context
    window.PinGPT_CheckDB = async function() {
      const DB_NAME = 'chat_pinner_db';
      const STORE = 'pins';
      
      return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME);
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction(STORE, 'readonly');
          const store = tx.objectStore(STORE);
          const r = store.getAll();
          r.onsuccess = () => {
            console.log('📌 All pins in database:', r.result);
            console.log('📊 Total pins:', r.result.length);
            resolve(r.result);
          };
          r.onerror = () => reject(r.error);
        };
        req.onerror = () => reject(req.error);
      });
    };
    
    console.log('%c✅ PinGPT Debug: Run this command to check database:', 'color: #10a37f; font-weight: bold');
    console.log('✅ PinGPT Debug: Run this command to check database:', 'color: #10a37f; font-weight: bold');
    console.log('%cawait PinGPT_CheckDB()', 'color: #10a37f; font-size: 14px; background: #f0f0f0; padding: 4px');
  `;
  document.documentElement.appendChild(script);
  script.remove();

  // Also keep content script debug tools
  window.PinGPT_ContentDebug = {
    getAllPins: async function() {
      const pins = await idbGetAll();
      console.log('All pins in database (content script):', pins);
      return pins;
    },
    addTestPin: async function() {
      const pin = {
        id: crypto.randomUUID(),
        messageText: 'This is a test pin created from console',
        name: 'Console Test Pin',
        tags: ['test', 'debug'],
        pageUrl: window.location.href,
        site: 'ChatGPT',
        pinnedAt: Date.now()
      };
      await idbAdd(pin);
      console.log('Test pin added:', pin);
      return pin;
    }
  };
} else {
  console.error('❌ PinGPT: idb.js not loaded properly!');
}

attachHoverListeners();

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .pingpt-pin-button {
    display: flex !important;
    align-items: center;
    justify-content: center;
  }
  
  .pingpt-pin-button:hover {
    background: rgba(0, 0, 0, 0.1) !important;
  }
  
  .pingpt-pin-button svg {
    pointer-events: none;
  }
`;
document.head.appendChild(style);
