// Content script for ChatGPT pages - handles message pinning and highlighting

let hoveredElement = null;
let pinButton = null;

// Create floating pin button
function createPinButton() {
  if (pinButton) return pinButton;
  
  pinButton = document.createElement('button');
  pinButton.innerHTML = '📌 Pin';
  pinButton.style.cssText = `
    position: absolute;
    z-index: 10000;
    background: #10a37f;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    display: none;
    transition: opacity 0.2s;
  `;
  
  pinButton.addEventListener('mouseenter', () => {
    pinButton.style.opacity = '1';
  });
  
  pinButton.addEventListener('mouseleave', () => {
    pinButton.style.opacity = '0.9';
  });
  
  pinButton.addEventListener('click', async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (hoveredElement) {
      await pinMessage(hoveredElement);
    }
    pinButton.style.display = 'none';
  });
  
  document.body.appendChild(pinButton);
  return pinButton;
}

// Find the message container element
function findMessageContainer(element) {
  let current = element;
  // Look for ChatGPT message containers (adjust selectors based on actual ChatGPT structure)
  while (current && current !== document.body) {
    // Try multiple possible selectors for ChatGPT messages
    if (current.matches('[data-message-author-role], [data-message-id], .group, article') || 
        current.classList.contains('markdown') ||
        current.classList.contains('min-h-8') ||
        current.getAttribute('data-testid')?.includes('conversation-turn') ||
        (current.tagName === 'DIV' && current.querySelector('.markdown')) ||
        (current.tagName === 'DIV' && current.querySelector('[data-message-author-role]'))) {
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
  
  document.addEventListener('mouseover', (e) => {
    // Check if we're hovering over message content
    const target = e.target;
    if (!target.closest || target === pinButton) return;
    
    // Don't show on input areas, buttons, sidebar, or navigation
    if (target.closest('textarea, input, button, form, nav, aside, [role="navigation"]')) return;
    
    // Make sure we're in the main content area
    const mainContent = document.querySelector('main');
    if (mainContent && !mainContent.contains(target)) return;
    
    // Look for message containers
    const messageContainer = findMessageContainer(target);
    if (!messageContainer) return;
    
    // Verify it's actually a message with meaningful content
    const text = (messageContainer.innerText || '').trim();
    if (text.length < 10) return; // Skip elements with very little text
    
    // Don't reposition if we're still on the same element
    if (messageContainer === lastHoveredElement && pinButton && pinButton.style.display === 'block') {
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
    const rect = messageContainer.getBoundingClientRect();
    
    btn.style.display = 'block';
    btn.style.left = (rect.right - 80) + 'px';
    btn.style.top = (rect.top + window.scrollY + 8) + 'px';
    btn.style.opacity = '0.9';
  });
  
  document.addEventListener('mouseout', (e) => {
    const target = e.target;
    if (target === pinButton || target.contains(pinButton)) return;
    
    // Only hide if we're leaving the message container
    const messageContainer = findMessageContainer(target);
    if (messageContainer === lastHoveredElement) {
      hideTimeout = setTimeout(() => {
        if (pinButton && !pinButton.matches(':hover')) {
          pinButton.style.display = 'none';
          lastHoveredElement = null;
        }
      }, 200);
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

// Pin a message
async function pinMessage(element) {
  const messageText = element.innerText || element.textContent || '';
  if (!messageText.trim()) {
    showNotification('⚠️ No text found to pin');
    return;
  }
  
  const name = prompt('Name this pin (optional):', '');
  if (name === null) return; // User cancelled
  
  const tagsInput = prompt('Add tags (comma-separated, optional):', '');
  const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [];
  
  const pin = {
    id: crypto.randomUUID(),
    messageText: messageText.trim(),
    name: name.trim(),
    tags: tags,
    pageUrl: window.location.href,
    site: 'ChatGPT',
    pinnedAt: Date.now(),
    xpath: getXPath(element),
    anchors: getTextAnchors(element)
  };
  
  try {
    // Use the global idbAdd function
    if (typeof idbAdd === 'function') {
      await idbAdd(pin);
      console.log('Pin saved successfully:', pin);
      showNotification('✅ Message pinned successfully!');
    } else {
      throw new Error('idbAdd function not available');
    }
  } catch (err) {
    console.error('Failed to pin:', err);
    showNotification('❌ Failed to save pin: ' + err.message);
  }
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
  const allElements = mainContent.querySelectorAll('[data-message-author-role], [data-message-id], article, .markdown');
  
  for (const el of allElements) {
    const text = (el.innerText || el.textContent || '').trim();
    
    // Try exact match with full anchor text
    if (anchors.full && text.includes(anchors.full.trim())) {
      return el;
    }
    
    // Try prefix match (first 100 chars)
    if (anchors.prefix && text.includes(anchors.prefix.trim())) {
      return el;
    }
    
    // Try suffix match
    if (anchors.suffix && text.includes(anchors.suffix.trim())) {
      return el;
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
      await pinMessage(lastMessage);
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
addManualPinButton();

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
`;
document.head.appendChild(style);
