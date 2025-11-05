// Content script for ChatGPT pages - handles message pinning and highlighting

// Check if database functions are available
console.log('GPT Pinboard: Content script loaded');
console.log('GPT Pinboard: idbAdd available:', typeof idbAdd);
console.log('GPT Pinboard: idbGet available:', typeof idbGet);

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
    // Use PNG icon for compatibility - create image element safely
    const img = document.createElement('img');
    img.src = runtime.getURL('icons/icon-16.png');
    img.width = 16;
    img.height = 16;
    img.style.display = 'block';
    img.alt = 'GPT Pinboard';
    pinButton.appendChild(img);
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
  
  // If this is a message container with data-message-author-role, avoid using it directly
  // Instead, create a more specific path that includes the element within the message
  if (element.getAttribute('data-message-author-role')) {
    // This is too broad - don't use message container directly
    // Fall through to create specific element path
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

// Get text anchors for fuzzy matching (optimized for storage)
function getTextAnchors(element) {
  const text = element.innerText || element.textContent || '';
  const words = text.trim().split(/\s+/);
  return {
    prefix: words.slice(0, 5).join(' ').slice(0, 50), // Reduced from 10 words/100 chars
    suffix: words.slice(-5).join(' ').slice(-50), // Reduced from 10 words/100 chars
    full: text.slice(0, 80) // Proportional to 120 char message limit
  };
}

// Create and show pin dialog with pre-filled data
function openPinDialogWithData(pinData) {
  return new Promise(async (resolve, reject) => {
    if (!pinData.messageText || !pinData.messageText.trim()) {
      reject(new Error('No text provided to pin'));
      return;
    }
    
    const messageText = pinData.messageText;
    
    // Get theme setting from storage
    let isDarkMode = false;
    try {
      // Check extension context before accessing storage
      if (!isExtensionContextValid()) {
        console.log('GPT Pinboard: Extension context invalidated, using default theme');
      } else {
        const runtime = typeof chrome !== 'undefined' ? chrome : browser;
        const result = await runtime.storage.local.get(['theme']);
        isDarkMode = result.theme === 'dark';
      }
    } catch (err) {
      console.log('Could not load theme setting:', err);
      
      // Check if this is due to extension context invalidation
      if (err.message && err.message.includes('Extension context invalidated')) {
        console.log('GPT Pinboard: Extension context invalidated while accessing storage');
        window.location.reload();
        return;
      }
    }
    
    // Show the pin dialog with pre-filled data
    createPinDialog(messageText, pinData, isDarkMode, resolve, reject);
  });
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
    
    // Create pin data from element
    const pinData = {
      id: crypto.randomUUID(),
      messageText: messageText.trim().slice(0, 120),
      name: '',
      tags: [],
      pageUrl: window.location.href,
      site: 'ChatGPT',
      pinnedAt: Date.now(),
      xpath: getXPath(element),
      anchors: getTextAnchors(element),
      selectionType: 'full-message', // Flag to indicate this is a full message pin
      selectionText: null // No specific selection for hover pins
    };
    
    // Get theme setting from storage
    let isDarkMode = false;
    try {
      const runtime = typeof chrome !== 'undefined' ? chrome : browser;
      const result = await runtime.storage.local.get(['theme']);
      isDarkMode = result.theme === 'dark';
    } catch (err) {
      console.log('Could not load theme setting:', err);
    }
    
    // Show the pin dialog
    createPinDialog(messageText, pinData, isDarkMode, resolve, resolve);
  });
}

// Create the pin dialog UI (shared function)
function createPinDialog(messageText, pinData, isDarkMode, resolve, reject = resolve) {
  try {
    console.log('GPT Pinboard: Creating pin dialog with data:', pinData);
    
    // Get theme colors
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
    
    // Create dialog elements safely with DOM methods
    
    // Header with SVG icon
    const header = document.createElement('h2');
    header.style.cssText = `margin: 0 0 20px 0; font-size: 20px; color: ${colors.headingText}; display: flex; align-items: center; gap: 8px;`;
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('viewBox', '0 0 24 24');
    
    const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    ellipse.setAttribute('cx', '12');
    ellipse.setAttribute('cy', '8');
    ellipse.setAttribute('rx', '6');
    ellipse.setAttribute('ry', '5');
    ellipse.setAttribute('fill', '#febf00');
    ellipse.setAttribute('stroke', '#999');
    ellipse.setAttribute('stroke-width', '0.5');
    ellipse.setAttribute('opacity', '0.9');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M 12 13 L 10 20 L 14 20 Z');
    path.setAttribute('fill', '#333');
    
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '12');
    text.setAttribute('y', '9.5');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-family', 'Arial, sans-serif');
    text.setAttribute('font-size', '3.5');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('fill', '#4a71f6');
    text.textContent = 'PIN';
    
    svg.appendChild(ellipse);
    svg.appendChild(path);
    svg.appendChild(text);
    
    header.appendChild(svg);
    header.appendChild(document.createTextNode('Pin Message'));
    
    // Preview section
    const previewSection = document.createElement('div');
    previewSection.style.cssText = 'margin-bottom: 16px;';
    
    const previewLabel = document.createElement('label');
    previewLabel.style.cssText = `display: block; font-weight: 600; margin-bottom: 6px; color: ${colors.labelText}; font-size: 14px;`;
    
    // Set label based on selection type
    if (pinData.selectionType === 'full-message-with-highlight') {
      previewLabel.textContent = `Full Message Preview (will highlight: "${pinData.selectionText}")`;
    } else if (pinData.selectionType === 'selection-only') {
      previewLabel.textContent = 'Selected Text Preview';
    } else {
      previewLabel.textContent = 'Preview';
    }
    
    const previewDiv = document.createElement('div');
    previewDiv.style.cssText = `
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
    `;
    previewDiv.textContent = messagePreview;
    
    previewSection.appendChild(previewLabel);
    previewSection.appendChild(previewDiv);
    
    // Name input section
    const nameSection = document.createElement('div');
    nameSection.style.cssText = 'margin-bottom: 16px;';
    
    const nameLabel = document.createElement('label');
    nameLabel.setAttribute('for', 'pin-name');
    nameLabel.style.cssText = `display: block; font-weight: 600; margin-bottom: 6px; color: ${colors.labelText}; font-size: 14px;`;
    nameLabel.textContent = 'Name (optional)';
    
    const nameInputEl = document.createElement('input');
    nameInputEl.type = 'text';
    nameInputEl.id = 'pin-name';
    nameInputEl.placeholder = 'Give this pin a memorable name...';
    nameInputEl.style.cssText = `
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
    `;
    
    nameSection.appendChild(nameLabel);
    nameSection.appendChild(nameInputEl);
    
    // Tags section
    const tagsSection = document.createElement('div');
    tagsSection.style.cssText = 'margin-bottom: 24px;';
    
    const tagsLabel = document.createElement('label');
    tagsLabel.style.cssText = `display: block; font-weight: 600; margin-bottom: 6px; color: ${colors.labelText}; font-size: 14px;`;
    tagsLabel.textContent = 'Tags (optional, max 3)';
    
    const tagsContainerEl = document.createElement('div');
    tagsContainerEl.id = 'tags-container';
    tagsContainerEl.style.cssText = `
      min-height: 40px;
      border: 1px solid ${colors.inputBorder};
      border-radius: 6px;
      padding: 8px;
      background: ${colors.inputBg};
      margin-bottom: 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    `;
    
    const tagInputEl = document.createElement('input');
    tagInputEl.type = 'text';
    tagInputEl.id = 'tag-input';
    tagInputEl.placeholder = 'Add a tag...';
    tagInputEl.style.cssText = `
      border: none;
      outline: none;
      flex: 1;
      min-width: 100px;
      font-size: 14px;
      color: ${colors.inputText};
      background: transparent;
      font-family: system-ui, -apple-system, sans-serif;
      border-radius: 6px;
    `;
    
    tagsContainerEl.appendChild(tagInputEl);
    
    const tagsHelp = document.createElement('div');
    tagsHelp.style.cssText = `font-size: 12px; color: ${colors.helpText};`;
    tagsHelp.textContent = 'Press Enter to add tags or type and press Enter';
    
    tagsSection.appendChild(tagsLabel);
    tagsSection.appendChild(tagsContainerEl);
    tagsSection.appendChild(tagsHelp);
    
    // Buttons section
    const buttonsSection = document.createElement('div');
    buttonsSection.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end;';
    
    const cancelBtnEl = document.createElement('button');
    cancelBtnEl.id = 'pin-cancel';
    cancelBtnEl.textContent = 'Cancel';
    cancelBtnEl.style.cssText = `
      padding: 10px 20px;
      border: 1px solid ${colors.cancelBorder};
      border-radius: 6px;
      background: ${colors.cancelBg};
      color: ${colors.cancelText};
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    `;
    
    const saveBtnEl = document.createElement('button');
    saveBtnEl.id = 'pin-save';
    saveBtnEl.textContent = 'Save Pin';
    saveBtnEl.style.cssText = `
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      background: ${colors.saveBg};
      color: ${colors.saveText};
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    `;
    
    buttonsSection.appendChild(cancelBtnEl);
    buttonsSection.appendChild(saveBtnEl);
    
    // Append all sections to dialog
    dialog.appendChild(header);
    dialog.appendChild(previewSection);
    dialog.appendChild(nameSection);
    dialog.appendChild(tagsSection);
    dialog.appendChild(buttonsSection);
    
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
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        gap: 4px;
        margin: 2px 0;
      `;
      
      const textSpan = document.createElement('span');
      textSpan.textContent = tagText;
      
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '×';
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
      
      // Use the pre-filled pin data and update with user input
      const pin = {
        ...pinData,
        name: name,
        tags: currentTags
      };
      
      try {
        console.log('GPT Pinboard: Attempting to save pin:', pin);
        
        if (typeof idbAdd !== 'function') {
          console.error('GPT Pinboard: idbAdd function not available, typeof:', typeof idbAdd);
          throw new Error('Database function not available. Please refresh the page.');
        }
        
        // Validate pin data
        if (!pin.id || !pin.messageText) {
          console.error('GPT Pinboard: Invalid pin data:', pin);
          throw new Error('Invalid pin data - missing required fields');
        }
        
        // Check storage size to prevent quota exceeded
        const pinSize = JSON.stringify(pin).length;
        console.log('GPT Pinboard: Pin storage size:', pinSize, 'bytes');
        if (pinSize > 7000) { // Chrome quota is ~8KB per item, leave buffer
          console.warn('GPT Pinboard: Pin data is large:', pinSize, 'bytes');
          // Trim data if too large
          pin.messageText = pin.messageText.slice(0, 150); // Keep more of the main message
          pin.selectionText = pin.selectionText.slice(0, 50);
          if (pin.anchors) {
            pin.anchors.prefix = pin.anchors.prefix.slice(0, 30);
            pin.anchors.suffix = pin.anchors.suffix.slice(0, 30);
            pin.anchors.full = pin.anchors.full.slice(0, 50);
          }
          console.log('GPT Pinboard: Trimmed pin size:', JSON.stringify(pin).length, 'bytes');
        }
        
        await idbAdd(pin);
        console.log('GPT Pinboard: Pin saved successfully');
        overlay.remove();
        showNotification('✅ Message pinned successfully!');
        resolve();
      } catch (err) {
        console.error('GPT Pinboard: Error saving pin:', err);
        console.error('GPT Pinboard: Pin data that failed:', pin);
        showNotification('❌ Failed to save pin: ' + err.message);
        overlay.remove();
        reject ? reject(err) : resolve();
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
  } catch (error) {
    console.error('GPT Pinboard: Error creating pin dialog:', error);
    showNotification('❌ Failed to create pin dialog: ' + error.message);
    if (reject) reject(error);
    else resolve();
  }
}

// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Highlight specific text within an element
function highlightTextInElement(element, searchText) {
  const highlightClass = 'gpt-pinboard-text-highlight';
  const addedHighlights = [];
  
  // Add CSS for text highlighting if not already added
  if (!document.getElementById('gpt-pinboard-highlight-styles')) {
    const style = document.createElement('style');
    style.id = 'gpt-pinboard-highlight-styles';
    style.textContent = `
      .${highlightClass} {
        background: rgba(255, 235, 59, 0.4) !important;
        color: inherit !important;
        padding: 2px 4px !important;
        border-radius: 3px !important;
        font-weight: 600 !important;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Function to highlight text in text nodes
  function highlightInTextNode(node, text) {
    const nodeText = node.textContent;
    const index = nodeText.toLowerCase().indexOf(text.toLowerCase());
    
    if (index !== -1) {
      const beforeText = nodeText.substring(0, index);
      const highlightText = nodeText.substring(index, index + text.length);
      const afterText = nodeText.substring(index + text.length);
      
      const parent = node.parentNode;
      
      // Create new nodes
      if (beforeText) {
        parent.insertBefore(document.createTextNode(beforeText), node);
      }
      
      const highlightSpan = document.createElement('span');
      highlightSpan.className = highlightClass;
      highlightSpan.textContent = highlightText;
      parent.insertBefore(highlightSpan, node);
      addedHighlights.push(highlightSpan);
      
      if (afterText) {
        parent.insertBefore(document.createTextNode(afterText), node);
      }
      
      parent.removeChild(node);
    }
  }
  
  // Walk through all text nodes
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }
  
  // Highlight text in text nodes (reverse order to avoid issues with DOM changes)
  for (let i = textNodes.length - 1; i >= 0; i--) {
    highlightInTextNode(textNodes[i], searchText);
  }
  
  // Return cleanup function
  return () => {
    addedHighlights.forEach(span => {
      if (span.parentNode) {
        const textNode = document.createTextNode(span.textContent);
        span.parentNode.replaceChild(textNode, span);
      }
    });
  };
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
    console.log('GPT Pinboard: Evaluating XPath:', xpath);
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const element = result.singleNodeValue;
    console.log('GPT Pinboard: XPath result:', element);
    return element;
  } catch (err) {
    console.log('GPT Pinboard: XPath evaluation failed:', err);
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
  
  // Try XPath first (most direct and reliable when available)
  if (pin.xpath) {
    console.log('GPT Pinboard: Trying XPath:', pin.xpath);
    element = findByXPath(pin.xpath);
    if (element) {
      console.log('GPT Pinboard: Found element using XPath:', element.tagName);
      console.log('GPT Pinboard: Element text preview:', (element.innerText || '').slice(0, 100));
      console.log('GPT Pinboard: Element bounds:', element.getBoundingClientRect());
      
      // Verify this element actually contains the pinned text
      const elementText = (element.innerText || element.textContent || '').trim();
      const isFullMessage = pin.selectionType === 'full-message' || pin.selectionType === 'full-message-with-highlight';
      
      let searchText;
      if (isFullMessage) {
        // For full message pins, use first few words for validation
        searchText = pin.messageText.split(/\s+/).slice(0, 5).join(' ');
      } else {
        searchText = pin.selectionText || pin.messageText.slice(0, 50);
      }
      
      if (!elementText.includes(searchText)) {
        console.log('GPT Pinboard: XPath element does not contain expected text, rejecting');
        console.log('GPT Pinboard: Expected:', searchText);
        console.log('GPT Pinboard: Found:', elementText.slice(0, 100));
        element = null;
      }
    }
  }
  
  // Fallback to text anchors if XPath fails
  if (!element && pin.anchors) {
    console.log('GPT Pinboard: XPath failed, trying text anchors');
    element = findByTextAnchors(pin.anchors);
    if (element) {
      console.log('GPT Pinboard: Found element using text anchors:', element.tagName);
      console.log('GPT Pinboard: Anchor element bounds:', element.getBoundingClientRect());
      
      // Try to find a more specific child element if this seems too broad
      const elementText = (element.innerText || element.textContent || '').trim();
      const searchText = pin.selectionText || pin.messageText.slice(0, 50);
      
      if (elementText.length > searchText.length * 3) {
        console.log('GPT Pinboard: Text anchor element seems too broad, searching for specific child');
        const specificChild = findSpecificElementByText(searchText, element);
        if (specificChild && specificChild !== element) {
          console.log('GPT Pinboard: Found more specific child element:', specificChild.tagName);
          element = specificChild;
        }
      }
    }
  }
  
  // Last resort: search by partial text match
  if (!element && pin.messageText) {
    // Choose search text based on pin type
    let searchText;
    const isFullMessage = pin.selectionType === 'full-message' || pin.selectionType === 'full-message-with-highlight';
    
    if (isFullMessage) {
      // For full message pins, use first significant words for better matching
      searchText = pin.messageText.split(/\s+/).slice(0, 8).join(' ').trim();
      console.log('GPT Pinboard: Searching for full message using first 8 words:', searchText);
    } else {
      // For selection-only pins, search by the selected text
      searchText = pin.selectionText || pin.messageText.slice(0, 100).trim();
      console.log('GPT Pinboard: Searching for selection:', searchText);
    }
    
    const mainContent = document.querySelector('main') || document.body;
    // Look specifically for message containers, not large wrapper divs
    const messageContainers = mainContent.querySelectorAll('[data-message-author-role]');
    
    // Find the most precise match - look within each message container for specific elements
    let bestMatch = null;
    let bestMatchScore = Infinity;
    
    for (const container of messageContainers) {
      // First check if the container itself matches
      const containerText = (container.innerText || container.textContent || '').trim();
      if (containerText.includes(searchText)) {
        // Look for meaningful semantic elements containing the search text
        const meaningfulSelectors = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span', 'section', 'li', 'blockquote'];
        const candidateElements = container.querySelectorAll(meaningfulSelectors.join(', '));
        
        let bestCandidate = container; // Default to container
        let bestScore = Infinity;
        
        for (const candidate of candidateElements) {
          const candidateText = (candidate.innerText || candidate.textContent || '').trim();
          if (candidateText.includes(searchText)) {
            // Score based on text length (prefer elements closest in size to search text)
            const lengthDiff = Math.abs(candidateText.length - searchText.length);
            // Bonus for semantic elements (headings get priority)
            const tagBonus = candidate.tagName.match(/^H[1-6]$/) ? -100 : 0;
            const score = lengthDiff + tagBonus;
            
            if (score < bestScore) {
              bestScore = score;
              bestCandidate = candidate;
            }
          }
        }
        
        // Score this container's best match against others
        const matchText = (bestCandidate.innerText || bestCandidate.textContent || '').trim();
        const containerScore = Math.abs(matchText.length - searchText.length);
        if (containerScore < bestMatchScore) {
          bestMatchScore = containerScore;
          bestMatch = bestCandidate;
        }
      }
    }
    
    if (bestMatch) {
      element = bestMatch;
      console.log('GPT Pinboard: Found element via text search:', element.tagName);
      console.log('GPT Pinboard: Text search element bounds:', element.getBoundingClientRect());
    }
  }
  
  if (!element) {
    showNotification('⚠️ Could not find the pinned message on this page');
    return { found: false };
  }
  
  // Final validation: ensure the found element is actually visible and contains the text
  const finalElementText = (element.innerText || element.textContent || '').trim();
  
  // Choose validation text based on pin type
  let expectedText;
  let isFullMessage = pin.selectionType === 'full-message' || pin.selectionType === 'full-message-with-highlight';
  
  if (isFullMessage) {
    // For full message pins, be more lenient - check if significant portion matches
    expectedText = pin.messageText.slice(0, 100); // Use more of the message text
    console.log('GPT Pinboard: Validating full message pin');
  } else {
    // For selection pins, use the selected text or a portion of message text
    expectedText = pin.selectionText || pin.messageText.slice(0, 50);
    console.log('GPT Pinboard: Validating selection pin');
  }
  
  console.log('GPT Pinboard: Final element validation');
  console.log('GPT Pinboard: Pin type:', pin.selectionType);
  console.log('GPT Pinboard: Is full message:', isFullMessage);
  console.log('GPT Pinboard: Expected text:', expectedText.slice(0, 50) + '...');
  console.log('GPT Pinboard: Found element text preview:', finalElementText.slice(0, 100));
  
  const textMatches = finalElementText.includes(expectedText);
  console.log('GPT Pinboard: Element contains expected text:', textMatches);
  
  if (!textMatches) {
    if (isFullMessage) {
      // For full message pins, try a more lenient check
      const messageWords = pin.messageText.split(/\s+/).slice(0, 10).join(' ');
      const lenientMatch = finalElementText.includes(messageWords);
      console.log('GPT Pinboard: Trying lenient match with first 10 words:', lenientMatch);
      
      if (!lenientMatch) {
        console.log('GPT Pinboard: Full message validation failed - even lenient match failed');
        showNotification('⚠️ Found element but text does not match');
        return { found: false };
      }
    } else {
      console.log('GPT Pinboard: Selection validation failed - text not found in element');
      showNotification('⚠️ Found element but text does not match');
      return { found: false };
    }
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
  const elementRect = element.getBoundingClientRect();
  console.log('GPT Pinboard: About to scroll to element at position:', {
    top: elementRect.top,
    left: elementRect.left,
    width: elementRect.width,
    height: elementRect.height
  });
  
  // Scroll to element with retries
  try {
    // Use more precise scrolling - scroll to center of element
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center',  // Changed from 'start' to 'center' for better positioning
      inline: 'nearest' 
    });
  } catch (err) {
    console.log('GPT Pinboard: Scroll error:', err);
  }
  
  // Wait for scroll to complete
  await new Promise(resolve => setTimeout(resolve, 800)); // Increased wait time
  
  // Final check: verify element position after scroll
  const postScrollRect = element.getBoundingClientRect();
  console.log('GPT Pinboard: Element position after scroll:', {
    top: postScrollRect.top,
    left: postScrollRect.left,
    isVisible: postScrollRect.top >= 0 && postScrollRect.top <= window.innerHeight
  });
  
  // Highlight effect with subtle, non-blinding colors
  const originalBg = element.style.background;
  const originalBoxShadow = element.style.boxShadow;
  const originalTransition = element.style.transition;
  const originalBorderRadius = element.style.borderRadius;
  const originalMaxWidth = element.style.maxWidth;
  
  console.log('GPT Pinboard: About to highlight element:', element.tagName);
  console.log('GPT Pinboard: Element text for highlighting:', (element.innerText || '').slice(0, 50));
  
  // Use a very subtle highlight that's easy on the eyes - no border, no margin/padding
  element.style.transition = 'all 0.4s ease';
  element.style.background = 'rgba(16, 163, 127, 0.08)'; // Slightly more visible green tint
  element.style.boxShadow = '0 2px 12px rgba(16, 163, 127, 0.2)'; // Soft shadow glow, no border effect
  element.style.borderRadius = '12px';
  
  // Ensure the element doesn't expand too wide
  if (!originalMaxWidth) {
    element.style.maxWidth = 'min(100%, 800px)';
  }
  
  // Additional highlighting for specific text within the message
  let textHighlightCleanup = null;
  if (pin.selectionText && pin.selectionText.trim().length > 0) {
    textHighlightCleanup = highlightTextInElement(element, pin.selectionText.trim());
  }
  
  // Fade out the highlight after 3 seconds
  setTimeout(() => {
    element.style.transition = 'all 0.6s ease';
    element.style.background = originalBg;
    element.style.boxShadow = originalBoxShadow;
    element.style.borderRadius = originalBorderRadius;
    element.style.maxWidth = originalMaxWidth;
    
    // Clean up text highlighting
    if (textHighlightCleanup) {
      textHighlightCleanup();
    }
    
    // Clean up transition after animation completes
    setTimeout(() => {
      element.style.transition = originalTransition;
    }, 600);
  }, 3000);
  
  showNotification('✅ Found pinned message!');
  return { found: true };
}

// Get the message container from current text selection
function getMessageContainerFromSelection() {
  const selection = window.getSelection();
  if (!selection.rangeCount) return null;
  
  const range = selection.getRangeAt(0);
  let element = range.commonAncestorContainer;
  
  // If it's a text node, get its parent element
  if (element.nodeType === Node.TEXT_NODE) {
    element = element.parentElement;
  }
  
  // Traverse up to find the message container
  return findMessageContainer(element);
}

// Find message container by searching for text content
function findMessageContainerByText(searchText) {
  const mainContent = document.querySelector('main') || document.body;
  const allElements = mainContent.querySelectorAll('[data-message-author-role]');
  
  console.log('GPT Pinboard: Searching through', allElements.length, 'message containers for text:', searchText);
  
  for (const el of allElements) {
    const text = (el.innerText || el.textContent || '').trim();
    if (text.includes(searchText) && text.length > 10) {
      console.log('GPT Pinboard: Found matching container with', text.length, 'characters');
      return el;
    }
  }
  
  console.log('GPT Pinboard: No matching container found');
  return null;
}

// Find the specific element containing text using cursor-like approach
function findSpecificElementByText(searchText, messageContainer) {
  if (!messageContainer) return null;
  
  // Find all text nodes containing the search text
  const walker = document.createTreeWalker(
    messageContainer,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        return node.textContent.includes(searchText) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    }
  );
  
  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }
  
  if (textNodes.length === 0) return messageContainer;
  
  // Use the first matching text node's parent element
  let targetElement = textNodes[0].parentElement;
  
  // Walk up to find a meaningful semantic element
  const meaningfulTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'LI', 'BLOCKQUOTE', 'CODE', 'PRE', 'SPAN'];
  let current = targetElement;
  
  for (let i = 0; i < 3 && current && messageContainer.contains(current); i++) {
    const elementText = (current.innerText || current.textContent || '').trim();
    const tagName = current.tagName;
    
    if (elementText.includes(searchText) && meaningfulTags.includes(tagName)) {
      console.log('GPT Pinboard: Found semantic element by text search:', tagName);
      return current;
    }
    current = current.parentElement;
  }
  
  return targetElement;
}

// Check if extension context is still valid
function isExtensionContextValid() {
  try {
    const runtime = typeof chrome !== 'undefined' ? chrome.runtime : browser.runtime;
    return !!(runtime && runtime.id);
  } catch (e) {
    return false;
  }
}

// Listen for messages from background script
try {
  const runtime = typeof chrome !== 'undefined' ? chrome.runtime : browser.runtime;
  if (runtime && runtime.onMessage) {
    runtime.onMessage.addListener((msg, sender, sendResponse) => {
      
      // Check extension context validity first
      if (!isExtensionContextValid()) {
        console.log('GPT Pinboard: Extension context invalidated, reloading page...');
        window.location.reload();
        return false;
      }
      
      // Handle ping from background script to check if content script is loaded
      if (msg.action === 'ping') {
        sendResponse({ pong: true, ready: true });
        return true;
      }
      
      if (msg.action === 'pin-selection' && msg.text) {
        const selectedText = msg.text.trim();
        console.log('GPT Pinboard: Received selection to pin:', selectedText.length, 'characters');
        
        if (selectedText.length < 3) {
          showNotification('⚠️ Please select at least 3 characters to pin');
          sendResponse({ ok: false, error: 'Selection too short' });
          return true;
        }
        
        // Get the message container first (always needed)
        // When message comes from background script, there's no active selection,
        // so we need to find the container by searching for the text
        let messageContainer = getMessageContainerFromSelection();
        
        if (!messageContainer) {
          // Fallback: search for the message container by text content
          console.log('GPT Pinboard: No active selection, searching by text content');
          messageContainer = findMessageContainerByText(selectedText);
        }
        
        if (!messageContainer) {
          console.error('GPT Pinboard: Could not find message container for text:', selectedText);
          showNotification('⚠️ Could not identify the message container');
          sendResponse({ ok: false, error: 'Message container not found' });
          return true;
        }
        
        console.log('GPT Pinboard: Found message container:', messageContainer);
        
        // Find the specific target element for scrolling
        const selection = window.getSelection();
        let targetElement = messageContainer; // Default fallback
        
        if (selection.rangeCount > 0) {
          // Use cursor position to find the exact element containing the selection
          const range = selection.getRangeAt(0);
          
          // Get cursor position coordinates
          const rect = range.getBoundingClientRect();
          const x = rect.left + (rect.width / 2); // Middle of selection
          const y = rect.top + (rect.height / 2);
          
          console.log('GPT Pinboard: Cursor position:', x, y);
          
          // Find element at cursor position
          let elementAtCursor = document.elementFromPoint(x, y);
          console.log('GPT Pinboard: Element at cursor:', elementAtCursor?.tagName, elementAtCursor);
          
          if (elementAtCursor && messageContainer.contains(elementAtCursor)) {
            // Walk up from cursor element to find the best target
            let current = elementAtCursor;
            let bestTarget = elementAtCursor;
            
            // Meaningful content elements we want to target
            const meaningfulTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'LI', 'BLOCKQUOTE', 'CODE', 'PRE'];
            
            // Walk up to find a meaningful container, but don't go too far
            for (let i = 0; i < 3 && current && messageContainer.contains(current); i++) {
              const tagName = current.tagName;
              const elementText = (current.innerText || current.textContent || '').trim();
              
              // Check if this element contains our selected text and is meaningful
              if (elementText.includes(selectedText)) {
                if (meaningfulTags.includes(tagName)) {
                  // Perfect - found a meaningful semantic element
                  bestTarget = current;
                  console.log('GPT Pinboard: Found semantic element at cursor:', tagName);
                  break;
                } else if (tagName !== 'DIV' || elementText.length < bestTarget.innerText?.length) {
                  // Use this if it's not a generic div, or if it's smaller than current best
                  bestTarget = current;
                }
              }
              
              current = current.parentElement;
            }
            
            targetElement = bestTarget;
          }
        } else {
          // No active selection (e.g., from context menu) - use text-based element finding
          targetElement = findSpecificElementByText(selectedText, messageContainer);
        }
        
        console.log('GPT Pinboard: Target element for scrolling:', targetElement);
        console.log('GPT Pinboard: Target element tag:', targetElement.tagName);
        console.log('GPT Pinboard: Target element text preview:', (targetElement.innerText || '').slice(0, 100));
        
        // Determine if this is a single word or multi-word selection
        const wordCount = selectedText.split(/\s+/).filter(word => word.length > 0).length;
        const isSingleWord = wordCount === 1;
        
        console.log('GPT Pinboard: Selection analysis - words:', wordCount, 'isSingleWord:', isSingleWord);
        
        let pinContent, pinType;
        
        if (isSingleWord) {
          // Single word: pin the entire message but store the selected word for highlighting
          const fullMessageText = messageContainer.innerText || messageContainer.textContent || '';
          pinContent = fullMessageText.trim().slice(0, 120);
          pinType = 'full-message-with-highlight';
          console.log('GPT Pinboard: Single word selected, pinning full message with highlight');
        } else {
          // Multi-word: pin only the selected text
          pinContent = selectedText.slice(0, 120);
          pinType = 'selection-only';
          console.log('GPT Pinboard: Multi-word selected, pinning selection only');
        }
        
        // Create pin object with hybrid approach (optimized for storage quota)
        const pin = {
          id: crypto.randomUUID(),
          messageText: pinContent,
          name: '',
          tags: [],
          pageUrl: window.location.href,
          site: 'ChatGPT',
          pinnedAt: Date.now(),
          // Store the specific target element for precise scrolling
          xpath: (() => {
            const xpath = getXPath(targetElement);
            console.log('GPT Pinboard: Generated XPath:', xpath);
            return xpath;
          })(),
          anchors: getTextAnchors(targetElement),
          // Store selection metadata for highlighting (limited to prevent quota issues)
          selectionText: selectedText.slice(0, 100), // Limit to 100 chars
          selectionType: pinType
          // Removed fullMessageText to reduce storage size
        };
        
        // Open pin dialog with the selected text
        console.log('GPT Pinboard: Creating pin with data:', pin);
        
        // Handle async operation properly
        (async () => {
          try {
            // Check extension context before proceeding
            if (!isExtensionContextValid()) {
              console.log('GPT Pinboard: Extension context invalidated during pin creation');
              window.location.reload();
              return;
            }
            
            await openPinDialogWithData(pin);
            console.log('GPT Pinboard: Pin dialog completed successfully');
            sendResponse({ ok: true, found: true });
          } catch (err) {
            console.error('GPT Pinboard: Failed to create pin:', err);
            
            // Check if error is due to extension context invalidation
            if (err.message.includes('Extension context invalidated')) {
              console.log('GPT Pinboard: Extension context invalidated, reloading page...');
              window.location.reload();
              return;
            }
            
            showNotification('❌ Failed to create pin: ' + err.message);
            sendResponse({ ok: false, error: err.message });
          }
        })();
        
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

// Get recent messages for the floating pin button
function getRecentMessages(limit = 5) {
  const mainContent = document.querySelector('main') || document.body;
  const messages = mainContent.querySelectorAll('[data-message-author-role]');
  
  return Array.from(messages)
    .filter(el => {
      const text = (el.innerText || '').trim();
      return text.length > 10; // Must have meaningful content
    })
    .slice(-limit) // Get the last N messages
    .reverse(); // Most recent first
}

// Create message selection dropdown
function createMessageSelectionDropdown(messages, onSelect) {
  const dropdown = document.createElement('div');
  dropdown.style.cssText = `
    position: fixed;
    bottom: 160px;
    right: 20px;
    z-index: 10001;
    background: white;
    border: 1px solid #dadce0;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    max-width: 400px;
    max-height: 300px;
    overflow-y: auto;
    font-family: system-ui, -apple-system, sans-serif;
  `;
  
  // Header
  const header = document.createElement('div');
  header.style.cssText = `
    padding: 12px 16px;
    border-bottom: 1px solid #e8eaed;
    font-weight: 600;
    font-size: 14px;
    color: #202124;
    background: #f8f9fa;
    border-radius: 8px 8px 0 0;
  `;
  header.textContent = 'Select message to pin:';
  dropdown.appendChild(header);
  
  // Message options
  messages.forEach((message, index) => {
    const messageText = (message.innerText || '').trim();
    const preview = messageText.length > 100 ? messageText.slice(0, 100) + '...' : messageText;
    const authorRole = message.getAttribute('data-message-author-role');
    const isAssistant = authorRole === 'assistant';
    
    const option = document.createElement('div');
    option.style.cssText = `
      padding: 12px 16px;
      border-bottom: 1px solid #f1f3f4;
      cursor: pointer;
      transition: background 0.2s;
      font-size: 13px;
      line-height: 1.4;
    `;
    
    const roleLabel = document.createElement('div');
    roleLabel.style.cssText = `
      font-weight: 600;
      font-size: 11px;
      color: ${isAssistant ? '#10a37f' : '#1a73e8'};
      margin-bottom: 4px;
      text-transform: uppercase;
    `;
    roleLabel.textContent = isAssistant ? '🤖 Assistant' : '👤 You';
    
    const previewDiv = document.createElement('div');
    previewDiv.style.cssText = `
      color: #5f6368;
      overflow: hidden;
    `;
    previewDiv.textContent = preview;
    
    option.appendChild(roleLabel);
    option.appendChild(previewDiv);
    
    option.addEventListener('mouseenter', () => {
      option.style.background = '#f8f9fa';
    });
    
    option.addEventListener('mouseleave', () => {
      option.style.background = 'transparent';
    });
    
    option.addEventListener('click', () => {
      onSelect(message);
      dropdown.remove();
    });
    
    dropdown.appendChild(option);
  });
  
  // Cancel option
  const cancelOption = document.createElement('div');
  cancelOption.style.cssText = `
    padding: 12px 16px;
    cursor: pointer;
    font-size: 13px;
    color: #5f6368;
    text-align: center;
    border-top: 1px solid #e8eaed;
    background: #f8f9fa;
    border-radius: 0 0 8px 8px;
  `;
  cancelOption.textContent = 'Cancel';
  
  cancelOption.addEventListener('mouseenter', () => {
    cancelOption.style.background = '#e8eaed';
  });
  
  cancelOption.addEventListener('mouseleave', () => {
    cancelOption.style.background = '#f8f9fa';
  });
  
  cancelOption.addEventListener('click', () => {
    dropdown.remove();
  });
  
  dropdown.appendChild(cancelOption);
  
  return dropdown;
}

// Add a manual pin button to the page for easier access
function addManualPinButton() {
  // Wait for page to load
  setTimeout(() => {
    // Check if button already exists
    if (document.getElementById('pingpt-manual-pin')) return;
    
    const manualBtn = document.createElement('button');
    manualBtn.id = 'pingpt-manual-pin';
    
    // Create SVG element safely
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.style.cssText = 'margin-right: 6px; vertical-align: middle;';
    
    const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    ellipse.setAttribute('cx', '12');
    ellipse.setAttribute('cy', '8');  
    ellipse.setAttribute('rx', '6');
    ellipse.setAttribute('ry', '5');
    ellipse.setAttribute('fill', '#febf00');
    ellipse.setAttribute('stroke', '#fff');
    ellipse.setAttribute('stroke-width', '0.5');
    ellipse.setAttribute('opacity', '0.9');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M 12 13 L 10 20 L 14 20 Z');
    path.setAttribute('fill', '#fff');
    
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '12');
    text.setAttribute('y', '9.5');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-family', 'Arial, sans-serif');
    text.setAttribute('font-size', '3.5');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('fill', '#4a71f6');
    text.textContent = 'PIN';
    
    svg.appendChild(ellipse);
    svg.appendChild(path);
    svg.appendChild(text);
    
    manualBtn.appendChild(svg);
    manualBtn.appendChild(document.createTextNode('Pin Message'));
    manualBtn.title = 'Pin a message from this conversation';
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
      const messages = getRecentMessages(1);
      manualBtn.style.display = messages.length > 0 ? 'block' : 'none';
    };
    
    // Initial check
    updateButtonVisibility();
    
    // Observe DOM changes to show/hide button
    const observer = new MutationObserver(updateButtonVisibility);
    const mainContent = document.querySelector('main') || document.body;
    if (mainContent) {
      observer.observe(mainContent, { childList: true, subtree: true });
    }
    
    manualBtn.addEventListener('click', async () => {
      const recentMessages = getRecentMessages(5);
      
      if (recentMessages.length === 0) {
        showNotification('⚠️ No messages found. Try scrolling or asking ChatGPT a question first.');
        return;
      }
      
      // If only one message, pin it directly
      if (recentMessages.length === 1) {
        await openPinDialog(recentMessages[0]);
        return;
      }
      
      // Show selection dropdown for multiple messages
      const existingDropdown = document.querySelector('#pingpt-message-dropdown');
      if (existingDropdown) {
        existingDropdown.remove();
        return;
      }
      
      const dropdown = createMessageSelectionDropdown(recentMessages, async (selectedMessage) => {
        await openPinDialog(selectedMessage);
      });
      dropdown.id = 'pingpt-message-dropdown';
      
      document.body.appendChild(dropdown);
      
      // Close dropdown when clicking outside
      const closeOnClickOutside = (e) => {
        if (!dropdown.contains(e.target) && e.target !== manualBtn) {
          dropdown.remove();
          document.removeEventListener('click', closeOnClickOutside);
        }
      };
      
      setTimeout(() => {
        document.addEventListener('click', closeOnClickOutside);
      }, 100);
    });
    
    document.body.appendChild(manualBtn);
  }, 1500);
}

// Initialize
initializePinButtons();

// Add manual pin button
addManualPinButton();

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
