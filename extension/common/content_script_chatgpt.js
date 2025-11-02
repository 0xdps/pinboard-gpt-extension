// Content script for ChatGPT pages - handles message pinning and highlighting

// Create a pin button for a specific message
function createPinButtonForMessage(messageContainer) {
  // Check if button already exists
  if (messageContainer.querySelector('.pingpt-pin-button')) {
    return;
  }
  
  // Check if extension context is still valid
  let runtime, pinButton;
  try {
    runtime = typeof chrome !== 'undefined' ? chrome.runtime : browser.runtime;
    if (!runtime || !runtime.getURL) {
      console.log('GPT Pinboard: Extension context invalidated, skipping button creation');
      return;
    }
    
    pinButton = document.createElement('button');
    // Use PNG icon for compatibility
    pinButton.innerHTML = `
      <img src="${runtime.getURL('icons/icon-16.png')}" width="16" height="16" style="display: block;" alt="GPT Pinboard"/>
    `;
    pinButton.title = 'Pin this message with GPT Pinboard';
    pinButton.className = 'pingpt-pin-button';
  } catch (error) {
    console.log('GPT Pinboard: Extension context error:', error.message);
    return;
  }
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
    opacity: 0;
    transition: opacity 0.15s, background 0.15s, color 0.15s;
    pointer-events: auto;
    left: -36px;
    top: 2px;
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
    await openPinDialog(messageContainer);
  });
  
  // Set position relative on container if needed
  const computedPosition = window.getComputedStyle(messageContainer).position;
  if (computedPosition === 'static') {
    messageContainer.style.position = 'relative';
  }
  
  messageContainer.appendChild(pinButton);
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

// Add pin buttons to all existing messages and observe for new ones
function initializePinButtons() {
  
  // Find all message containers
  function findAllMessages() {
    // Look for elements with data-message-author-role attribute
    return document.querySelectorAll('[data-message-author-role]');
  }
  
  // Add buttons to existing messages
  function addButtonsToExistingMessages() {
    const messages = findAllMessages();
    messages.forEach(msg => {
      const text = (msg.innerText || '').trim();
      // Only add button to messages with meaningful content
      if (text.length >= 10) {
        createPinButtonForMessage(msg);
      }
    });
  }
  
  // Initial setup
  addButtonsToExistingMessages();
  
  // Observe for new messages
  const observer = new MutationObserver((mutations) => {
    let shouldUpdate = false;
    
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) { // Element node
          // Check if the node itself is a message
          if (node.getAttribute && node.getAttribute('data-message-author-role')) {
            const text = (node.innerText || '').trim();
            if (text.length >= 10) {
              createPinButtonForMessage(node);
              shouldUpdate = true;
            }
          }
          // Check if the node contains messages
          else if (node.querySelectorAll) {
            const newMessages = node.querySelectorAll('[data-message-author-role]');
            newMessages.forEach(msg => {
              const text = (msg.innerText || '').trim();
              if (text.length >= 10 && !msg.querySelector('.pingpt-pin-button')) {
                createPinButtonForMessage(msg);
                shouldUpdate = true;
              }
            });
          }
        }
      });
    });
    
    if (shouldUpdate) {
    }
  });
  
  // Observe the main content area
  const mainContent = document.querySelector('main');
  if (mainContent) {
    observer.observe(mainContent, {
      childList: true,
      subtree: true
    });
  }
  
  // Re-scan periodically for any missed messages
  setInterval(() => {
    addButtonsToExistingMessages();
  }, 3000);
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
    full: text.slice(0, 120)
  };
}

// Create and show pin dialog
function openPinDialog(element) {
  return new Promise(async (resolve) => {
    const messageText = element.innerText || element.textContent || '';
    if (!messageText.trim()) {
      showNotification('⚠️ No text found to pin');
      resolve();
      return;
    }
    
    // Get theme setting from storage
    let isDarkMode = false;
    try {
      const runtime = typeof chrome !== 'undefined' ? chrome : browser;
      const result = await runtime.storage.local.get(['theme']);
      isDarkMode = result.theme === 'dark';
    } catch (err) {
      console.log('Could not load theme setting:', err);
    }
    
    // Theme colors
    const colors = isDarkMode ? {
      overlay: 'rgba(0, 0, 0, 0.7)',
      dialogBg: '#2d2d2d',
      dialogText: '#e4e4e4',
      headingText: '#ffffff',
      labelText: '#b8b8b8',
      previewBg: '#1a1a1a',
      previewBorder: '#404040',
      previewText: '#b8b8b8',
      inputBg: '#1a1a1a',
      inputBorder: '#404040',
      inputText: '#e4e4e4',
      inputPlaceholder: '#808080',
      tagBg: '#1a3d5f',
      tagText: '#5da5da',
      cancelBg: '#1a1a1a',
      cancelBorder: '#404040',
      cancelText: '#b8b8b8',
      cancelHover: '#2d2d2d',
      saveBg: '#10a37f',
      saveText: '#ffffff',
      saveHover: '#0d8a6a',
      focusBorder: '#10a37f',
      helpText: '#808080'
    } : {
      overlay: 'rgba(0, 0, 0, 0.5)',
      dialogBg: '#ffffff',
      dialogText: '#202124',
      headingText: '#202124',
      labelText: '#5f6368',
      previewBg: '#f8f9fa',
      previewBorder: '#e8eaed',
      previewText: '#5f6368',
      inputBg: '#ffffff',
      inputBorder: '#dadce0',
      inputText: '#202124',
      inputPlaceholder: '#80868b',
      tagBg: '#e8f0fe',
      tagText: '#1a73e8',
      cancelBg: '#ffffff',
      cancelBorder: '#dadce0',
      cancelText: '#5f6368',
      cancelHover: '#f8f9fa',
      saveBg: '#10a37f',
      saveText: '#ffffff',
      saveHover: '#0d8a6a',
      focusBorder: '#10a37f',
      helpText: '#80868b'
    };
    
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: ${colors.overlay};
      z-index: 100000;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
    `;
    
    // Create dialog
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: ${colors.dialogBg};
      border-radius: 12px;
      padding: 24px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      font-family: system-ui, -apple-system, sans-serif;
      color: ${colors.dialogText};
    `;
    
    const messagePreview = messageText.length > 300 ? messageText.slice(0, 300) + '...' : messageText;
    
    dialog.innerHTML = `
      <h2 style="margin: 0 0 20px 0; font-size: 20px; color: ${colors.headingText}; display: flex; align-items: center; gap: 8px;">
        <svg width="20" height="20" viewBox="0 0 24 24">
          <ellipse cx="12" cy="8" rx="6" ry="5" fill="#febf00" stroke="#999" stroke-width="0.5" opacity="0.9"/>
          <path d="M 12 13 L 10 20 L 14 20 Z" fill="#333"/>
          <text x="12" y="9.5" text-anchor="middle" font-family="Arial, sans-serif" font-size="3.5" font-weight="bold" fill="#4a71f6">PIN</text>
        </svg>
        Pin Message
      </h2>
      
      <div style="margin-bottom: 16px;">
        <label style="display: block; font-weight: 600; margin-bottom: 6px; color: ${colors.labelText}; font-size: 14px;">
          Preview
        </label>
        <div style="
          background: ${colors.previewBg};
          border: 1px solid ${colors.previewBorder};
          border-radius: 6px;
          padding: 12px;
          max-height: 150px;
          overflow-y: auto;
          font-size: 13px;
          color: ${colors.previewText};
          white-space: pre-wrap;
          line-height: 1.5;
        ">${escapeHtml(messagePreview)}</div>
      </div>
      
      <div style="margin-bottom: 16px;">
        <label for="pin-name" style="display: block; font-weight: 600; margin-bottom: 6px; color: ${colors.labelText}; font-size: 14px;">
          Name (optional)
        </label>
        <input 
          type="text" 
          id="pin-name" 
          placeholder="Give this pin a memorable name..."
          style="
            width: 100%;
            padding: 10px 12px;
            border: 1px solid ${colors.inputBorder};
            border-radius: 6px;
            font-size: 14px;
            color: ${colors.inputText};
            background: ${colors.inputBg};
            font-family: system-ui, -apple-system, sans-serif;
            box-sizing: border-box;
            transition: border-color 0.2s;
          "
        />
      </div>
      
      <div style="margin-bottom: 24px;">
        <label style="display: block; font-weight: 600; margin-bottom: 6px; color: ${colors.labelText}; font-size: 14px;">
          Tags (optional, max 3)
        </label>
        <div id="tags-container" style="
          min-height: 40px;
          border: 1px solid ${colors.inputBorder};
          border-radius: 6px;
          padding: 8px;
          background: ${colors.inputBg};
          margin-bottom: 8px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: flex-start;
        ">
          <input 
            type="text" 
            id="tag-input" 
            placeholder="Add a tag..."
            style="
              border: none;
              outline: none;
              flex: 1;
              min-width: 100px;
              font-size: 14px;
              color: ${colors.inputText};
              background: transparent;
              font-family: system-ui, -apple-system, sans-serif;
            "
          />
        </div>
        <div style="font-size: 12px; color: ${colors.helpText};">
          Press Enter to add tags or type and press Enter
        </div>
      </div>
      
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button 
          id="pin-cancel" 
          style="
            padding: 10px 20px;
            border: 1px solid ${colors.cancelBorder};
            border-radius: 6px;
            background: ${colors.cancelBg};
            color: ${colors.cancelText};
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
            background: ${colors.saveBg};
            color: ${colors.saveText};
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
      cancelBtn.style.background = colors.cancelHover;
    });
    cancelBtn.addEventListener('mouseleave', () => {
      cancelBtn.style.background = colors.cancelBg;
    });
    
    saveBtn.addEventListener('mouseenter', () => {
      saveBtn.style.background = colors.saveHover;
    });
    saveBtn.addEventListener('mouseleave', () => {
      saveBtn.style.background = colors.saveBg;
    });
    
    // Handle input focus
    const inputs = dialog.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        input.style.borderColor = colors.focusBorder;
        input.style.outline = 'none';
      });
      input.addEventListener('blur', () => {
        input.style.borderColor = colors.inputBorder;
      });
    });
    
    // Tag management functionality
    const tagsContainer = document.getElementById('tags-container');
    const tagInput = document.getElementById('tag-input');
    let currentTags = [];
    
    function createTagElement(tagText) {
      const tagEl = document.createElement('span');
      tagEl.style.cssText = `
        display: inline-flex;
        align-items: center;
        background: ${colors.tagBg};
        color: ${colors.tagText};
        padding: 4px 8px;
        border-radius: 16px;
        font-size: 12px;
        font-weight: 500;
        gap: 4px;
        margin: 2px 0;
      `;
      
      const textSpan = document.createElement('span');
      textSpan.textContent = tagText;
      
      const removeBtn = document.createElement('button');
      removeBtn.innerHTML = '×';
      removeBtn.style.cssText = `
        background: none;
        border: none;
        color: ${colors.tagText};
        cursor: pointer;
        font-size: 14px;
        line-height: 1;
        padding: 0;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      
      removeBtn.addEventListener('mouseenter', () => {
        removeBtn.style.background = isDarkMode ? 'rgba(93, 165, 218, 0.15)' : 'rgba(26, 115, 232, 0.1)';
      });
      
      removeBtn.addEventListener('mouseleave', () => {
        removeBtn.style.background = 'none';
      });
      
      removeBtn.addEventListener('click', () => {
        removeTag(tagText);
      });
      
      tagEl.appendChild(textSpan);
      tagEl.appendChild(removeBtn);
      return tagEl;
    }
    
    function addTag(tagText) {
      const trimmed = tagText.trim().toLowerCase();
      if (!trimmed || currentTags.includes(trimmed) || currentTags.length >= 3) {
        return false;
      }
      
      currentTags.push(trimmed);
      renderTags();
      tagInput.value = '';
      return true;
    }
    
    function removeTag(tagText) {
      const index = currentTags.indexOf(tagText.toLowerCase());
      if (index > -1) {
        currentTags.splice(index, 1);
        renderTags();
      }
    }
    
    function renderTags() {
      // Clear existing tags
      const existingTags = tagsContainer.querySelectorAll('span');
      existingTags.forEach(tag => tag.remove());
      
      // Add current tags before input
      currentTags.forEach(tag => {
        const tagEl = createTagElement(tag);
        tagsContainer.insertBefore(tagEl, tagInput);
      });
      
      // Update input placeholder and state
      if (currentTags.length >= 3) {
        tagInput.placeholder = 'Maximum 3 tags';
        tagInput.disabled = true;
        tagInput.style.opacity = '0.5';
      } else {
        tagInput.placeholder = 'Add a tag...';
        tagInput.disabled = false;
        tagInput.style.opacity = '1';
      }
    }
    
    // Tag input handlers
    tagInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const value = tagInput.value.trim();
        if (value) {
          if (!addTag(value)) {
            // Flash border red if couldn't add tag
            tagsContainer.style.borderColor = '#ea4335';
            setTimeout(() => {
              tagsContainer.style.borderColor = '#dadce0';
            }, 500);
          }
        }
      }
    });
    
    // Focus border handling for tags container
    tagInput.addEventListener('focus', () => {
      tagsContainer.style.borderColor = '#10a37f';
    });
    
    tagInput.addEventListener('blur', () => {
      tagsContainer.style.borderColor = '#dadce0';
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
      
      const name = nameInput.value.trim();
      // Add any remaining text in tag input
      const remainingTag = tagInput.value.trim();
      if (remainingTag && currentTags.length < 3) {
        addTag(remainingTag);
      }
      
      const pin = {
        id: crypto.randomUUID(),
        messageText: messageText.trim().slice(0, 120),
        name: name,
        tags: currentTags,
        pageUrl: window.location.href,
        site: 'ChatGPT',
        pinnedAt: Date.now(),
        xpath: getXPath(element),
        anchors: getTextAnchors(element)
      };
      
      try {
        if (typeof idbAdd === 'function') {
          await idbAdd(pin);
          overlay.remove();
          showNotification('✅ Message pinned successfully!');
          resolve();
        } else {
          throw new Error('idbAdd function not available');
        }
      } catch (err) {
        showNotification('❌ Failed to save pin: ' + err.message);
        overlay.remove();
        resolve();
      }
    });
    
    // Handle Enter key to save (only for name input)
    const nameInput = document.getElementById('pin-name');
    nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        saveBtn.click();
      }
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
    return null;
  }
}

// Find element by text content (fuzzy match)
function findByTextAnchors(anchors) {
  if (!anchors) return null;
  
  // Try to find in main content area first
  const mainContent = document.querySelector('main') || document.body;
  // ONLY search actual message containers - be very specific
  const allElements = mainContent.querySelectorAll('[data-message-author-role]');
  
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
    element = findByTextAnchors(pin.anchors);
  }
  
  // Fallback to XPath
  if (!element && pin.xpath) {
    element = findByXPath(pin.xpath);
  }
  
  // Last resort: search by partial text match
  if (!element && pin.messageText) {
    const searchText = pin.messageText.slice(0, 100).trim();
    const mainContent = document.querySelector('main') || document.body;
    // Look specifically for message containers, not large wrapper divs
    const allElements = mainContent.querySelectorAll('[data-message-author-role]');
    
    for (const el of allElements) {
      const text = (el.innerText || el.textContent || '').trim();
      if (text.includes(searchText)) {
        element = el;
        break;
      }
    }
  }
  
  if (!element) {
    showNotification('⚠️ Could not find the pinned message on this page');
    return { found: false };
  }
  
  // Verify we found a reasonably-sized element, not the whole page
  const elementHeight = element.offsetHeight;
  const viewportHeight = window.innerHeight;
  
  // If the element is larger than the viewport, try to find a more specific child
  if (elementHeight > viewportHeight * 0.8) {
    // Look for a more specific message container within this element
    const messageContent = element.querySelector('.markdown, [class*="message"], [class*="content"]');
    if (messageContent) {
      element = messageContent;
    }
  }
  
  // Store reference to ensure we're highlighting the same element we scroll to
  const targetElement = element;
  
  // Ensure element is visible and in DOM before scrolling
  if (!document.body.contains(targetElement)) {
    showNotification('⚠️ Element no longer in page');
    return { found: false };
  }
  
  // Get element position before scroll
  // Scroll to element with retries
  try {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
  }
  
  // Wait for scroll to complete
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Highlight effect with subtle, non-blinding colors
  const originalBg = element.style.background;
  const originalBoxShadow = element.style.boxShadow;
  const originalTransition = element.style.transition;
  const originalBorderRadius = element.style.borderRadius;
  const originalMaxWidth = element.style.maxWidth;
  
  // Use a very subtle highlight that's easy on the eyes - no border, no margin/padding
  element.style.transition = 'all 0.4s ease';
  element.style.background = 'rgba(16, 163, 127, 0.08)'; // Slightly more visible green tint
  element.style.boxShadow = '0 2px 12px rgba(16, 163, 127, 0.2)'; // Soft shadow glow, no border effect
  element.style.borderRadius = '12px';
  
  // Ensure the element doesn't expand too wide
  if (!originalMaxWidth) {
    element.style.maxWidth = 'min(100%, 800px)';
  }
  
  // Fade out the highlight after 3 seconds
  setTimeout(() => {
    element.style.transition = 'all 0.6s ease';
    element.style.background = originalBg;
    element.style.boxShadow = originalBoxShadow;
    element.style.borderRadius = originalBorderRadius;
    element.style.maxWidth = originalMaxWidth;
    
    // Clean up transition after animation completes
    setTimeout(() => {
      element.style.transition = originalTransition;
    }, 600);
  }, 3000);
  
  showNotification('✅ Found pinned message!');
  return { found: true };
}

// Listen for messages from background script
try {
  const runtime = typeof chrome !== 'undefined' ? chrome.runtime : browser.runtime;
  if (runtime && runtime.onMessage) {
    runtime.onMessage.addListener((msg, sender, sendResponse) => {
      
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
    highlightPin(msg.pin).then(result => {
      sendResponse(result);
      }).catch(err => {
        sendResponse({ found: false, error: err.message });
      });
      return true; // Will respond asynchronously
    }
    
    return false;
  });
  }
} catch (error) {
  console.log('GPT Pinboard: Failed to set up message listener:', error.message);
}

// Add a manual pin button to the page for easier access
function addManualPinButton() {
  // Wait for page to load
  setTimeout(() => {
    // Check if button already exists
    if (document.getElementById('pingpt-manual-pin')) return;
    
    const manualBtn = document.createElement('button');
    manualBtn.id = 'pingpt-manual-pin';
    manualBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" style="margin-right: 6px; vertical-align: middle;">
        <ellipse cx="12" cy="8" rx="6" ry="5" fill="#febf00" stroke="#fff" stroke-width="0.5" opacity="0.9"/>
        <path d="M 12 13 L 10 20 L 14 20 Z" fill="#fff"/>
        <text x="12" y="9.5" text-anchor="middle" font-family="Arial, sans-serif" font-size="3.5" font-weight="bold" fill="#4a71f6">PIN</text>
      </svg>
      Pin Last Message
    `;
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
  }, 1500);
}

// Initialize
initializePinButtons();

// Add CSS for pin button hover effects
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
  
  /* Show pin button on message hover */
  [data-message-author-role]:hover .pingpt-pin-button {
    opacity: 1 !important;
  }
  
  .pingpt-pin-button {
    display: flex !important;
    align-items: center;
    justify-content: center;
  }
  
  .pingpt-pin-button:hover {
    background: rgba(0, 0, 0, 0.1) !important;
    opacity: 1 !important;
  }
  
  .pingpt-pin-button svg {
    pointer-events: none;
  }
`;
document.head.appendChild(style);
