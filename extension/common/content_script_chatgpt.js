// Content script for ChatGPT pages - handles message pinning and highlighting

// LICENSE_TYPES and LICENSE_LIMITS imported from license.js (loaded before this script)

async function getLicense() {
  try {
    const result = await chrome.storage.local.get(['license']);
    const license = result.license;
    
    // Handle both string format ("pro") and object format ({type: "pro"})
    if (typeof license === 'string') {
      return license;
    } else if (license?.type) {
      return license.type;
    }
    
    return LICENSE_TYPES.FREE;
  } catch (error) {
    console.error('Error getting license:', error);
    return LICENSE_TYPES.FREE;
  }
}

async function canAddPin() {
  try {
    const license = await getLicense();
    console.log('[DEBUG] canAddPin - license:', license);
    console.log('[DEBUG] Available LICENSE_LIMITS keys:', Object.keys(LICENSE_LIMITS));
    
    // Handle both string format ("pro") and object format ({type: "pro"})
    let licenseType;
    if (typeof license === 'string') {
      licenseType = license.toLowerCase();
    } else if (license?.type) {
      licenseType = String(license.type).toLowerCase();
    } else {
      licenseType = LICENSE_TYPES.FREE;
    }
    
    const limits = LICENSE_LIMITS[licenseType] || LICENSE_LIMITS[LICENSE_TYPES.FREE];
    
    console.log('[DEBUG] canAddPin - normalized type:', licenseType);
    console.log('[DEBUG] canAddPin - limits:', limits);
    
    if (limits.maxPins === Infinity) {
      console.log('[DEBUG] canAddPin - Unlimited pins (PRO/PRO+)');
      return true;
    }
    
    // Count current pins
    const pins = await idbGetAll();
    console.log('[DEBUG] canAddPin - current pins:', pins.length, 'max:', limits.maxPins);
    return pins.length < limits.maxPins;
  } catch (error) {
    console.error('Error checking pin limit:', error);
    return false;
  }
}

async function getRemainingPins() {
  try {
    const license = await getLicense();
    
    // Handle both string format ("pro") and object format ({type: "pro"})
    let licenseType;
    if (typeof license === 'string') {
      licenseType = license.toLowerCase();
    } else if (license?.type) {
      licenseType = String(license.type).toLowerCase();
    } else {
      licenseType = LICENSE_TYPES.FREE;
    }
    
    const limits = LICENSE_LIMITS[licenseType] || LICENSE_LIMITS[LICENSE_TYPES.FREE];
    
    if (limits.maxPins === Infinity) {
      return Infinity;
    }
    
    const pins = await idbGetAll();
    return Math.max(0, limits.maxPins - pins.length);
  } catch (error) {
    console.error('Error getting remaining pins:', error);
    return 0;
  }
}

// Check license and show appropriate message if limit reached
async function checkPinLimitAndNotify() {
  const canAdd = await canAddPin();
  if (!canAdd) {
    const license = await getLicense();
    const licenseType = typeof license === 'string' ? license : (license?.type || LICENSE_TYPES.FREE);
    
    if (licenseType === LICENSE_TYPES.FREE || licenseType.toLowerCase() === 'free') {
      showUpgradeNotification();
    } else {
      showNotification('⚠️ Pin limit reached');
    }
    return false;
  }
  return true;
}

// Get theme colors based on dark mode setting
async function getThemeColors() {
  let isDarkMode = false;
  try {
    const result = await chrome.storage.local.get(['theme']);
    isDarkMode = result.theme === 'dark';
  } catch (err) {
    debugLog('Could not load theme setting:', err);
  }

  return isDarkMode ? {
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
}

// Create dialog header with icon
function createDialogHeader(title, colors) {
  const header = document.createElement('h2');
  header.style.cssText = `margin: 0 0 20px 0; font-size: 20px; color: ${colors.headingText}; display: flex; align-items: center; gap: 8px;`;
  
  // Use extension icon
  try {
    const runtime = chrome.runtime || browser.runtime;
    if (runtime && runtime.getURL) {
      const iconImg = document.createElement('img');
      iconImg.src = runtime.getURL('icons/icon-32.png');
      iconImg.width = 24;
      iconImg.height = 24;
      iconImg.style.cssText = 'display: block; flex-shrink: 0;';
      header.appendChild(iconImg);
    }
  } catch (error) {
    debugLog('Pinboard GPT: Could not load icon for dialog');
  }
  
  const headerText = document.createElement('span');
  headerText.textContent = title;
  header.appendChild(headerText);
  
  return header;
}

// Debug logging system for content script
let debugEnabled = false;

// Initialize debug setting on script load
(async function initializeContentDebug() {
  try {
    // Check if chrome extension context is available
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      // Send message to background to get debug setting
      chrome.runtime.sendMessage({ action: 'get-debug-setting' }, (response) => {
        if (response && typeof response.debugEnabled === 'boolean') {
          debugEnabled = response.debugEnabled;
        }
      });
    }
  } catch (error) {
    // Ignore errors during initialization
  }
})();

function debugLog(...args) {
  if (debugEnabled) {
    console.log(...args);
  }
}

function debugError(...args) {
  if (debugEnabled) {
    console.error(...args);
  }
}

/**
 * Pinboard GPT Content Script
 * Optimized for performance and reliability
 */

// Performance monitoring
const performanceMetrics = {
  scriptsLoaded: Date.now(),
  buttonsCreated: 0,
  errorsEncountered: 0
};

// Error boundary for better debugging
window.addEventListener('error', (event) => {
  if (event.filename?.includes('content_script_chatgpt')) {
    debugError('Pinboard GPT: Uncaught error:', event.error);
    performanceMetrics.errorsEncountered++;
  }
});

// Check database availability with better error handling
try {
  debugLog('Pinboard GPT: Content script loaded successfully');
  debugLog('Pinboard GPT: Database functions available:', {
    idbAdd: typeof idbAdd,
    idbGet: typeof idbGet,
    idbGetAll: typeof idbGetAll,
    idbDelete: typeof idbDelete
  });
  
  // Validate required functions
  const requiredFunctions = ['idbAdd', 'idbGet', 'idbGetAll', 'idbDelete'];
  const missingFunctions = requiredFunctions.filter(fn => typeof window[fn] !== 'function');
  
  if (missingFunctions.length > 0) {
    debugError('Pinboard GPT: Missing required database functions:', missingFunctions);
  }
  
} catch (error) {
  debugError('Pinboard GPT: Error checking database functions:', error);
}

/**
 * Create a pin button for a specific message with optimized performance
 * @param {Element} messageContainer - The message container element
 * @returns {Element|null} The created button element or null if failed
 */
function createPinButtonForMessage(messageContainer) {
  try {
    // Early validation checks
    if (!messageContainer || messageContainer.nodeType !== 1) {
      return null;
    }
    
    // Check if button already exists (more efficient check)
    if (messageContainer.querySelector('.pingpt-pin-button')) {
      return null;
    }
    
    // Validate extension context  
    const runtime = chrome.runtime;
    
    if (!runtime?.getURL) {
      console.warn('Pinboard GPT: Extension context not available');
      return null;
    }
    
    // Create button with optimized approach
    const pinButton = document.createElement('button');
    pinButton.className = 'pingpt-pin-button';
    pinButton.title = 'Pin this message (Pinboard GPT)';
    pinButton.setAttribute('aria-label', 'Pin this message');
    
    // Create icon with error handling
    try {
      const img = document.createElement('img');
      img.src = runtime.getURL('icons/icon-32.png');
      img.width = 24;
      img.height = 24;
      img.style.display = 'block';
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      
      // Handle image load errors
      img.onerror = () => {
        // Fallback to text icon
        pinButton.textContent = '📌';
        pinButton.style.fontSize = '14px';
      };
      
      pinButton.appendChild(img);
    } catch (error) {
      // Fallback to text icon
      pinButton.textContent = '📌';
      pinButton.style.fontSize = '14px';
    }
    
    // Apply optimized styles
    pinButton.style.cssText = `
      position: absolute;
      z-index: 10000;
      color: #6b7280;
      border-radius: 8px;
      padding: 4px;
      width: 32px;
      height: 32px;
      cursor: pointer;
      opacity: 0;
      transition: all 0.2s ease;
      pointer-events: auto;
      left: -40px;
      top: 4px;
      backdrop-filter: blur(4px);
    `;
    
    // Enhanced hover effects
    const handleMouseEnter = () => {
      // pinButton.style.background = '#3b82f6';
      // pinButton.style.color = 'white';
      // pinButton.style.borderColor = '#3b82f6';
      pinButton.style.transform = 'scale(1.05)';
    };
    
    const handleMouseLeave = () => {
      // pinButton.style.background = 'rgba(255, 255, 255, 0.9)';
      // pinButton.style.color = '#6b7280';
      // pinButton.style.borderColor = '#e5e7eb';
      pinButton.style.transform = 'scale(1)';
    };
    
    // Optimized event handling with passive listeners where possible
    pinButton.addEventListener('mouseenter', handleMouseEnter, { passive: true });
    pinButton.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    
    // Click handler with better error handling
    pinButton.addEventListener('click', async (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      try {
        // Visual feedback
        pinButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
          pinButton.style.transform = 'scale(1)';
        }, 150);
        
        await openPinDialog(messageContainer);
      } catch (error) {
        debugError('Pinboard GPT: Error opening pin dialog:', error);
      }
    });
    
    // Optimize container positioning
    try {
      const computedPosition = getComputedStyle(messageContainer).position;
      if (computedPosition === 'static') {
        messageContainer.style.position = 'relative';
      }
      
      // Show button on message hover with better performance
      const showButton = () => pinButton.style.opacity = '1';
      const hideButton = () => pinButton.style.opacity = '0';
      
      messageContainer.addEventListener('mouseenter', showButton, { passive: true });
      messageContainer.addEventListener('mouseleave', hideButton, { passive: true });
      
      messageContainer.appendChild(pinButton);
      
    } catch (error) {
      console.warn('Pinboard GPT: Error setting up button container:', error);
      return null;
    }
    
    return pinButton;
    
  } catch (error) {
    console.warn('Pinboard GPT: Error creating pin button:', error);
    return null;
  }
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

// Robust helper to find all message elements across ChatGPT DOM variations
function getAllMessageElements(root = document) {
  const selectors = [
    '[data-message-author-role]',
    '[data-author]',
    '[data-user-type]',
    '.message',
    '.chat-message',
    '[role="article"]',
    '.msg',
    '.conversation-item'
  ];

  const seen = new Set();
  const results = [];

  for (const sel of selectors) {
    try {
      const nodes = root.querySelectorAll(sel);
      nodes.forEach(n => {
        if (n && n.nodeType === 1 && !seen.has(n)) {
          seen.add(n);
          results.push(n);
        }
      });
    } catch (e) {
      // ignore invalid selectors or errors
    }
  }

  return results;
}

// Add pin buttons to all existing messages and observe for new ones
function initializePinButtons() {
  
  // Find all message containers
  function findAllMessages() {
    // Use robust helper that checks multiple selectors
    return getAllMessageElements(document);
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
            const newMessages = getAllMessageElements(node);
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
  
  while (current && current !== document.documentElement) {
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
  
  // Add html element at the beginning
  parts.unshift('html[1]');
  
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
    
    // Get theme colors (consolidated)
    const colors = await getThemeColors();
    
    // Show the pin dialog with pre-filled data
    createPinDialog(messageText, pinData, colors, resolve, reject);
  });
}

// Create and show pin dialog (Hover method)
function openPinDialog(element) {
  return new Promise(async (resolve) => {
    const messageText = element.innerText || element.textContent || '';
    if (!messageText.trim()) {
      showNotification('⚠️ No text found to pin');
      resolve();
      return;
    }
    
    // Check license before allowing pin creation (consolidated check)
    if (!(await checkPinLimitAndNotify())) {
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
    
    // Get theme colors (consolidated)
    const colors = await getThemeColors();
    
    // Show the pin dialog
    createPinDialog(messageText, pinData, colors, resolve, resolve);
  });
}

// Create the pin dialog UI (shared function) - now accepts colors directly
function createPinDialog(messageText, pinData, colors, resolve, reject = resolve) {
  try {
    debugLog('Pinboard GPT: Creating pin dialog with data:', pinData);
    
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
    
    // Header (consolidated)
    const header = createDialogHeader('Pin Message', colors);
    
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
    tagInputEl.autocomplete = 'off';
    tagInputEl.spellcheck = false;
    tagInputEl.setAttribute('data-lpignore', 'true'); // Ignore LastPass
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
    tagsHelp.textContent = 'Type to see suggestions from existing tags, or press Enter to add new tags';
    
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
    
    // Popular default tags (shown when no existing tags)
    const POPULAR_TAGS = [
      // Development & Code (28 tags)
      'code-snippet', 'react-hook', 'api-schema', 'javascript', 'typescript', 'python-script',
      'go', 'rust', 'java', 'bash-script', 'sql-query', 'regex', 'cli-command',
      'function', 'class', 'api', 'script', 'implementation', 'syntax', 'c-sharp',
      'php', 'kotlin', 'swift', 'ruby', 'vue', 'angular', 'node', 'express',
      
      // Testing & Quality (14 tags)
      'test-case', 'unit-test', 'e2e-test', 'mock-data', 'debugging', 'error-fix',
      'bug-report', 'stack-trace', 'runtime-error', 'integration-test', 'snapshot-test',
      'load-test', 'stress-test', 'code-review',
      
      // Design & Styling (10 tags)
      'css-trick', 'html-template', 'tailwind', 'design-system', 'accessibility',
      'responsive', 'ui-component', 'ux-pattern', 'animation', 'sass',
      
      // Infrastructure & DevOps (16 tags)
      'deployment', 'infrastructure', 'terraform', 'cloud-config', 'devops',
      'optimization', 'performance', 'setup', 'config', 'workflow', 'automation',
      'docker', 'kubernetes', 'ci-cd', 'aws', 'azure',
      
      // Architecture & Patterns (14 tags)
      'architecture', 'system-design', 'microservices', 'monolith', 'data-model',
      'algorithm', 'pattern', 'best-practice', 'refactor', 'design-pattern',
      'solid-principles', 'clean-code', 'scalability', 'distributed-system',
      
      // AI & ML (8 tags)
      'machine-learning', 'data-science', 'vector-db', 'llm-prompt', 'neural-network',
      'deep-learning', 'nlp', 'computer-vision',
      
      // Issues & Debugging (12 tags)
      'memory-leak', 'latency', 'timeout', 'rate-limit', 'network-issue',
      'cors', 'auth-issue', 'dependency', 'security', 'vulnerability',
      'hotfix', 'patch',
      
      // Documentation & Writing (18 tags)
      'documentation', 'read-me', 'user-story', 'meeting-notes', 'sop', 'proposal',
      'blog-post', 'email-template', 'ad-copy', 'social-media', 'headline',
      'draft-copy', 'marketing-text', 'outline', 'jargon-free', 'changelog',
      'api-docs', 'guide',
      
      // Learning & Reference (18 tags)
      'tutorial', 'explanation', 'example', 'reference', 'cheat-sheet',
      'glossary', 'theory', 'concept-explain', 'deep-dive', 'comparison',
      'definition', 'principles', 'analogy', 'study', 'learning',
      'how-to', 'quickstart', 'course',
      
      // Task Management (16 tags)
      'todo', 'follow-up', 'review-later', 'pending', 'done', 'backlog',
      'critical', 'priority', 'progress', 'schedule', 'goal', 'plan', 'action',
      'milestone', 'deadline', 'sprint',
      
      // Organization (11 tags)
      'important', 'bookmark', 'archive', 'roadmap', 'versioning',
      'future-project', 'project', 'portfolio', 'collection', 'favorite', 'template',
      
      // Ideation & Planning (13 tags)
      'idea', 'big-idea', 'brainstorm', 'creative', 'inspiration', 'concept',
      'thought', 'improvement', 'innovation', 'exploration', 'product-vision',
      'prototype', 'mvp',
      
      // Communication (11 tags)
      'question', 'answer', 'feedback', 'suggestion', 'clarify', 'discussion',
      'comment', 'review', 'client-feedback', 'stakeholder', 'presentation',
      
      // Content & Notes (13 tags)
      'note', 'summary', 'highlight', 'reminder', 'tip', 'draft',
      'insight', 'fact', 'analysis', 'resource', 'must-read', 'takeaway', 'key-point',
      
      // Workflow (12 tags)
      'prompt', 'instruction', 'context', 'response', 'completion',
      'system', 'assistant', 'role', 'query', 'interaction', 'chat', 'conversation',
      
      // Professional (11 tags)
      'work', 'research', 'onboarding', 'interview-prep', 'career',
      'resume', 'daily-log', 'design-review', 'team', 'collaboration', 'leadership',
      
      // Database & Data (8 tags)
      'database', 'mongodb', 'postgres', 'redis', 'migration', 'schema',
      'indexing', 'query-optimization'
    ];

    // Get all existing tags from all pins for autosuggestion
    async function getAllExistingTags() {
      try {
        const allPins = await idbGetAll();
        debugLog('Pinboard GPT: All pins retrieved for message dialog:', allPins.length, 'pins');
        
        const allTags = new Set();
        
        // Add popular tags first
        POPULAR_TAGS.forEach(tag => allTags.add(tag));
        
        // Then add existing tags from pins
        allPins.forEach(pin => {
          if (pin.tags && Array.isArray(pin.tags)) {
            debugLog('Pinboard GPT: Pin tags found for message dialog:', pin.tags);
            pin.tags.forEach(tag => allTags.add(tag.toLowerCase()));
          }
        });
        
        const sortedTags = Array.from(allTags).sort();
        debugLog('Pinboard GPT: Final sorted tags for message dialog (with popular tags):', sortedTags);
        return sortedTags;
      } catch (err) {
        debugError('Pinboard GPT: Error getting existing tags for message dialog:', err);
        return POPULAR_TAGS; // Return popular tags as fallback
      }
    }

    // Create suggestion dropdown for message dialog
    const suggestionDropdown = document.createElement('div');
    suggestionDropdown.id = 'tag-suggestions-message';
    suggestionDropdown.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: ${colors.inputBg};
      border: 1px solid ${colors.inputBorder};
      border-top: none;
      border-radius: 0 0 6px 6px;
      max-height: 150px;
      overflow-y: auto;
      z-index: 10000;
      display: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;
    
    debugLog('Pinboard GPT: Message dialog suggestion dropdown created with colors:', colors);

    // Make tags container relative for absolute positioning of dropdown
    tagsContainer.style.position = 'relative';
    tagsContainer.appendChild(suggestionDropdown);

    let selectedSuggestionIndex = -1;
    let availableSuggestions = [];

    // Fuzzy match scoring function
    function fuzzyMatch(str, pattern) {
      const patternLower = pattern.toLowerCase();
      const strLower = str.toLowerCase();
      
      // Exact match gets highest score
      if (strLower === patternLower) return 1000;
      
      // Starts with pattern gets high score
      if (strLower.startsWith(patternLower)) return 500;
      
      // Contains pattern as substring gets medium score
      if (strLower.includes(patternLower)) return 250;
      
      // Fuzzy character matching
      let patternIdx = 0;
      let score = 0;
      let consecutiveMatches = 0;
      
      for (let i = 0; i < strLower.length && patternIdx < patternLower.length; i++) {
        if (strLower[i] === patternLower[patternIdx]) {
          score += 1 + consecutiveMatches * 5; // Bonus for consecutive matches
          consecutiveMatches++;
          patternIdx++;
        } else {
          consecutiveMatches = 0;
        }
      }
      
      // All pattern characters must be found in order
      return patternIdx === patternLower.length ? score : 0;
    }

    // Show suggestions based on input
    async function showSuggestions(inputValue) {
      debugLog('Pinboard GPT: Message dialog showSuggestions called with:', inputValue);
      
      if (!inputValue.trim()) {
        suggestionDropdown.style.display = 'none';
        return;
      }

      const existingTags = await getAllExistingTags();
      debugLog('Pinboard GPT: Message dialog existing tags found:', existingTags);
      
      const query = inputValue.toLowerCase().trim();
      
      // Score and filter tags using fuzzy matching
      const scoredTags = existingTags
        .map(tag => ({ tag, score: fuzzyMatch(tag, query) }))
        .filter(item => item.score > 0 && !currentTags.includes(item.tag))
        .sort((a, b) => b.score - a.score); // Sort by score descending
      
      availableSuggestions = scoredTags.map(item => item.tag).slice(0, 8); // Limit to 8 suggestions

      debugLog('Pinboard GPT: Message dialog available suggestions:', availableSuggestions, 'for query:', query);

      if (availableSuggestions.length === 0) {
        suggestionDropdown.style.display = 'none';
        debugLog('Pinboard GPT: Message dialog no suggestions found, hiding dropdown');
        return;
      }

      suggestionDropdown.innerHTML = '';
      availableSuggestions.forEach((tag, index) => {
        const suggestionEl = document.createElement('div');
        suggestionEl.className = 'tag-suggestion';
        suggestionEl.style.cssText = `
          padding: 8px 12px;
          cursor: pointer;
          font-size: 14px;
          color: ${colors.inputText};
          border-bottom: 1px solid ${colors.inputBorder};
          transition: background-color 0.2s;
        `;
        suggestionEl.textContent = tag;
        
        suggestionEl.addEventListener('mouseenter', () => {
          selectedSuggestionIndex = index;
          updateSuggestionHighlight();
        });
        
        suggestionEl.addEventListener('click', () => {
          selectSuggestion(tag);
        });
        
        suggestionDropdown.appendChild(suggestionEl);
      });

      suggestionDropdown.style.display = 'block';
      selectedSuggestionIndex = -1;
      updateSuggestionHighlight();
      
      debugLog('Pinboard GPT: Message dialog dropdown shown with', availableSuggestions.length, 'suggestions');
      debugLog('Pinboard GPT: Message dialog dropdown element:', suggestionDropdown);
      debugLog('Pinboard GPT: Message dialog dropdown parent:', suggestionDropdown.parentNode);
    }

    // Update suggestion highlight
    function updateSuggestionHighlight() {
      const suggestions = suggestionDropdown.querySelectorAll('.tag-suggestion');
      suggestions.forEach((el, index) => {
        if (index === selectedSuggestionIndex) {
          el.style.backgroundColor = colors.primary || '#e8f0fe';
          el.style.color = colors.primaryText || '#1a73e8';
        } else {
          el.style.backgroundColor = 'transparent';
          el.style.color = colors.inputText;
        }
      });
    }

    // Select a suggestion
    function selectSuggestion(tag) {
      if (currentTags.length < 3 && !currentTags.includes(tag)) {
        if (addTag(tag)) {
          tagInput.value = '';
          suggestionDropdown.style.display = 'none';
        }
      }
    }

    // Enhanced tag input handlers with autosuggestion
    tagInput.addEventListener('keydown', (e) => {
      if (suggestionDropdown.style.display === 'block' && availableSuggestions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, availableSuggestions.length - 1);
          updateSuggestionHighlight();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
          updateSuggestionHighlight();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (selectedSuggestionIndex >= 0) {
            selectSuggestion(availableSuggestions[selectedSuggestionIndex]);
          } else if (tagInput.value.trim() && currentTags.length < 3) {
            // Add as new tag if no suggestion selected
            const value = tagInput.value.trim();
            if (!addTag(value)) {
              // Flash border red if couldn't add tag
              tagsContainer.style.borderColor = '#ea4335';
              setTimeout(() => {
                tagsContainer.style.borderColor = '#dadce0';
              }, 500);
            }
          }
        } else if (e.key === 'Escape') {
          suggestionDropdown.style.display = 'none';
          selectedSuggestionIndex = -1;
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const value = tagInput.value.trim();
        if (value && currentTags.length < 3) {
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

    // Show suggestions on input
    tagInput.addEventListener('input', (e) => {
      debugLog('Pinboard GPT: Message dialog input event fired, value:', e.target.value);
      showSuggestions(e.target.value);
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!tagsContainer.contains(e.target)) {
        suggestionDropdown.style.display = 'none';
        selectedSuggestionIndex = -1;
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
        debugLog('Pinboard GPT: Attempting to save pin:', pin);
        
        if (typeof idbAdd !== 'function') {
          debugError('Pinboard GPT: idbAdd function not available, typeof:', typeof idbAdd);
          throw new Error('Database function not available. Please refresh the page.');
        }
        
        // Validate pin data
        if (!pin.id || !pin.messageText) {
          debugError('Pinboard GPT: Invalid pin data:', pin);
          throw new Error('Invalid pin data - missing required fields');
        }
        
        // Check storage size to prevent quota exceeded
        const pinSize = JSON.stringify(pin).length;
        debugLog('Pinboard GPT: Pin storage size:', pinSize, 'bytes');
        if (pinSize > 7000) { // Chrome quota is ~8KB per item, leave buffer
          console.warn('Pinboard GPT: Pin data is large:', pinSize, 'bytes');
          // Trim data if too large
          pin.messageText = pin.messageText.slice(0, 150); // Keep more of the main message
          pin.selectionText = pin.selectionText.slice(0, 50);
          if (pin.anchors) {
            pin.anchors.prefix = pin.anchors.prefix.slice(0, 30);
            pin.anchors.suffix = pin.anchors.suffix.slice(0, 30);
            pin.anchors.full = pin.anchors.full.slice(0, 50);
          }
          debugLog('Pinboard GPT: Trimmed pin size:', JSON.stringify(pin).length, 'bytes');
        }
        
        await idbAdd(pin);
        debugLog('Pinboard GPT: Pin saved successfully');
        overlay.remove();
        showNotification('✅ Message pinned successfully!');
        resolve();
      } catch (err) {
        debugError('Pinboard GPT: Error saving pin:', err);
        debugError('Pinboard GPT: Pin data that failed:', pin);
        
        // Provide user-friendly error messages
        let errorMessage = err.message;
        if (err.message.includes('Extension context invalidated') || 
            err.message.includes('Extension context is invalid')) {
          errorMessage = 'Extension was reloaded. Please refresh this page and try again.';
        } else if (err.message.includes('QUOTA_BYTES_PER_ITEM quota exceeded')) {
          errorMessage = 'Pin is too large. Try shortening the message or removing some content.';
        }
        
        showNotification('❌ Failed to save pin: ' + errorMessage);
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
    debugError('Pinboard GPT: Error creating pin dialog:', error);
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

// Unified pin dialog that can handle both message pins and chat pins
function createUnifiedPinDialog(options, resolve, reject = resolve) {
  const {
    messageText = '',
    chatTitle = '',
    pinData = {},
    isDarkMode = false,
    showMessagePreview = true,
    showDescriptionField = false,
    dialogTitle = 'Create Pin',
    onSave = null
  } = options;

  try {
    debugLog('Pinboard GPT: Creating unified pin dialog with options:', options);
    
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
      helpText: '#808080',
      primary: '#e8f0fe',
      primaryText: '#1a73e8'
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
      tagBg: '#e8f0fe',
      tagText: '#1a73e8',
      cancelBg: '#ffffff',
      cancelBorder: '#dadce0',
      cancelText: '#5f6368',
      cancelHover: '#f8f9fa',
      saveBg: '#1a73e8',
      saveText: '#ffffff',
      saveHover: '#1557b0',
      focusBorder: '#1a73e8',
      helpText: '#5f6368',
      primary: '#e8f0fe',
      primaryText: '#1a73e8'
    };

    // Create overlay
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

    // Header with extension icon
    const header = document.createElement('h2');
    header.style.cssText = `margin: 0 0 20px 0; font-size: 20px; color: ${colors.headingText}; display: flex; align-items: center; gap: 8px;`;
    
    // Use extension icon
    try {
      const runtime = chrome.runtime || browser.runtime;
      if (runtime && runtime.getURL) {
        const iconImg = document.createElement('img');
        iconImg.src = runtime.getURL('icons/icon-32.png');
        iconImg.width = 24;
        iconImg.height = 24;
        iconImg.style.cssText = 'display: block; flex-shrink: 0;';
        header.appendChild(iconImg);
      }
    } catch (error) {
      debugLog('Pinboard GPT: Could not load icon for unified dialog');
    }
    
    header.appendChild(document.createTextNode(dialogTitle));

    // Message preview section (conditional)
    let previewSection = null;
    if (showMessagePreview && messageText) {
      previewSection = document.createElement('div');
      previewSection.style.cssText = 'margin-bottom: 16px;';
      
      const previewLabel = document.createElement('label');
      previewLabel.style.cssText = `display: block; font-weight: 600; margin-bottom: 6px; color: ${colors.labelText}; font-size: 14px;`;
      previewLabel.textContent = 'Message Preview';
      
      const previewDiv = document.createElement('div');
      previewDiv.style.cssText = `
        padding: 12px;
        background: ${colors.previewBg};
        border: 1px solid ${colors.previewBorder};
        border-radius: 6px;
        font-size: 14px;
        color: ${colors.previewText};
        max-height: 120px;
        overflow-y: auto;
        white-space: pre-wrap;
        word-break: break-word;
      `;
      
      const messagePreview = messageText.length > 300 ? messageText.slice(0, 300) + '...' : messageText;
      previewDiv.textContent = messagePreview;
      
      previewSection.appendChild(previewLabel);
      previewSection.appendChild(previewDiv);
    }

    // Name input section
    const nameSection = document.createElement('div');
    nameSection.style.cssText = 'margin-bottom: 16px;';

    const nameLabel = document.createElement('label');
    nameLabel.setAttribute('for', 'unified-pin-name');
    nameLabel.style.cssText = `display: block; font-weight: 600; margin-bottom: 6px; color: ${colors.labelText}; font-size: 14px;`;
    nameLabel.textContent = showDescriptionField ? 'Name' : 'Pin Name (optional)';

    const nameInputEl = document.createElement('input');
    nameInputEl.type = 'text';
    nameInputEl.id = 'unified-pin-name';
    nameInputEl.value = pinData.name || chatTitle || '';
    nameInputEl.placeholder = showDescriptionField ? 'Give this pin a name...' : 'Optional name for this pin...';
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

    // Description section (conditional)
    let descSection = null;
    let descInputEl = null;
    if (showDescriptionField) {
      descSection = document.createElement('div');
      descSection.style.cssText = 'margin-bottom: 16px;';

      const descLabel = document.createElement('label');
      descLabel.setAttribute('for', 'unified-pin-desc');
      descLabel.style.cssText = `display: block; font-weight: 600; margin-bottom: 6px; color: ${colors.labelText}; font-size: 14px;`;
      descLabel.textContent = 'Description (optional)';

      descInputEl = document.createElement('textarea');
      descInputEl.id = 'unified-pin-desc';
      descInputEl.value = pinData.description || '';
      descInputEl.placeholder = 'Add a description...';
      descInputEl.rows = 3;
      descInputEl.style.cssText = `
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
        resize: vertical;
      `;

      descSection.appendChild(descLabel);
      descSection.appendChild(descInputEl);
    }

    dialog.appendChild(header);
    if (previewSection) dialog.appendChild(previewSection);
    dialog.appendChild(nameSection);
    if (descSection) dialog.appendChild(descSection);
    
    // Now add the unified tag section with autosuggestion
    // [Tag section will be added here - using the same autosuggestion code]
    
    // For now, let's create a simple version and then enhance it
    const tagsSection = document.createElement('div');
    tagsSection.style.cssText = 'margin-bottom: 24px;';
    
    const tagsLabel = document.createElement('label');
    tagsLabel.style.cssText = `display: block; font-weight: 600; margin-bottom: 6px; color: ${colors.labelText}; font-size: 14px;`;
    tagsLabel.textContent = 'Tags (optional, max 3)';
    
    const tagsContainerEl = document.createElement('div');
    tagsContainerEl.id = 'unified-tags-container';
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
      position: relative;
    `;
    
    const tagInputEl = document.createElement('input');
    tagInputEl.type = 'text';
    tagInputEl.id = 'unified-tag-input';
    tagInputEl.placeholder = 'Add a tag...';
    tagInputEl.autocomplete = 'off';
    tagInputEl.spellcheck = false;
    tagInputEl.setAttribute('data-lpignore', 'true'); // Ignore LastPass
    tagInputEl.style.cssText = `
      border: none;
      outline: none;
      flex: 1;
      min-width: 100px;
      font-size: 14px;
      color: ${colors.inputText};
      background: transparent;
      font-family: system-ui, -apple-system, sans-serif;
    `;
    
    tagsContainerEl.appendChild(tagInputEl);
    
    const tagsHelp = document.createElement('div');
    tagsHelp.style.cssText = `font-size: 12px; color: ${colors.helpText};`;
    tagsHelp.textContent = 'Type to see suggestions from existing tags, or press Enter to add new tags';
    
    tagsSection.appendChild(tagsLabel);
    tagsSection.appendChild(tagsContainerEl);
    tagsSection.appendChild(tagsHelp);
    
    dialog.appendChild(tagsSection);
    
    // TODO: Add the complete autosuggestion functionality here
    // (This would be the same code we have in both dialogs, but unified)
    
    // Buttons section
    const buttonsSection = document.createElement('div');
    buttonsSection.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end;';
    
    const cancelBtnEl = document.createElement('button');
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
    dialog.appendChild(buttonsSection);
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // Handle close
    const closeDialog = () => {
      overlay.remove();
      resolve();
    };
    
    cancelBtnEl.addEventListener('click', closeDialog);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeDialog();
    });
    
    // Handle save
    saveBtnEl.addEventListener('click', async () => {
      const name = nameInputEl.value.trim();
      const description = descInputEl ? descInputEl.value.trim() : '';
      const tags = []; // TODO: Get tags from the tag system
      
      if (onSave) {
        await onSave({
          name,
          description,
          tags,
          pinData
        });
      }
      
      closeDialog();
    });
    
    // Handle Enter key to save (only for name input)
    nameInputEl.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        saveBtnEl.click();
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
    debugError('Pinboard GPT: Error creating unified pin dialog:', error);
    showNotification('❌ Failed to create pin dialog: ' + error.message);
    if (reject) reject(error);
    else resolve();
  }
}

// Helper function to create SVG element safely
function createSVGElement(width, height, viewBox, pathData, styles = {}) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('fill', 'currentColor');
  
  const styleStr = Object.entries(styles).map(([k, v]) => `${k}: ${v}`).join('; ');
  if (styleStr) svg.setAttribute('style', styleStr);
  
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathData);
  svg.appendChild(path);
  
  return svg;
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



// Show temporary notification
function showNotification(message) {
  const notif = document.createElement('div');
  notif.textContent = message;
  notif.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
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

// Show upgrade notification with call-to-action
function showUpgradeNotification() {
  const notif = document.createElement('div');
  notif.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 100001;
    background: white;
    color: #202124;
    padding: 24px;
    border-radius: 12px;
    font-size: 14px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    max-width: 400px;
    text-align: center;
    font-family: system-ui, -apple-system, sans-serif;
  `;
  
  notif.innerHTML = `
    <div style="font-size: 48px; margin-bottom: 16px;">📌</div>
    <h3 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600;">Free Limit Reached</h3>
    <p style="margin: 0 0 20px 0; color: #5f6368; line-height: 1.5;">
      You've used all 10 free pins. Upgrade to Pro for unlimited pins, tags, and export features.
    </p>
    <div style="display: flex; gap: 12px; justify-content: center;">
      <button id="upgrade-btn" style="
        background: #10a37f;
        color: white;
        border: none;
        padding: 10px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      ">Upgrade to Pro</button>
      <button id="close-upgrade-btn" style="
        background: #f8f9fa;
        color: #5f6368;
        border: 1px solid #dadce0;
        padding: 10px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      ">Close</button>
    </div>
  `;
  
  // Create backdrop
  const backdrop = document.createElement('div');
  backdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 100000;
    backdrop-filter: blur(4px);
  `;
  
  document.body.appendChild(backdrop);
  document.body.appendChild(notif);
  
  // Add hover effects
  const upgradeBtn = notif.querySelector('#upgrade-btn');
  const closeBtn = notif.querySelector('#close-upgrade-btn');
  
  upgradeBtn.addEventListener('mouseenter', () => {
    upgradeBtn.style.background = '#0d8a6a';
  });
  upgradeBtn.addEventListener('mouseleave', () => {
    upgradeBtn.style.background = '#10a37f';
  });
  
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.background = '#e8eaed';
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.background = '#f8f9fa';
  });
  
  // Handle upgrade button
  upgradeBtn.addEventListener('click', () => {
    window.open('https://pinboard-gpt.dps.codes/pricing.html?plan=pro', '_blank');
    backdrop.remove();
    notif.remove();
  });
  
  // Handle close button
  closeBtn.addEventListener('click', () => {
    backdrop.remove();
    notif.remove();
  });
  
  // Handle backdrop click
  backdrop.addEventListener('click', () => {
    backdrop.remove();
    notif.remove();
  });
}

// Find element by XPath
function findByXPath(xpath) {
  try {
    debugLog('Pinboard GPT: Evaluating XPath:', xpath);
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const element = result.singleNodeValue;
    debugLog('Pinboard GPT: XPath result:', element);
    return element;
  } catch (err) {
    debugLog('Pinboard GPT: XPath evaluation failed:', err);
    return null;
  }
}

// Find element by text content (fuzzy match)
function findByTextAnchors(anchors) {
  if (!anchors) return null;
  
  debugLog('Pinboard GPT: Starting text anchor search with:', {
    fullLength: anchors.full?.length || 0,
    prefixLength: anchors.prefix?.length || 0,
    suffixLength: anchors.suffix?.length || 0
  });
  
  // Try to find in main content area first
  const mainContent = document.querySelector('main') || document.body;
  // ONLY search actual message containers - be very specific
  const allElements = getAllMessageElements(mainContent);

  debugLog('Pinboard GPT: Found', allElements.length, 'message elements to search (robust selector)');
  
  // Normalize text for better matching
  const normalizeText = (text) => text.trim().replace(/\s+/g, ' ');
  
  for (let i = 0; i < allElements.length; i++) {
    const el = allElements[i];
    const text = normalizeText(el.innerText || el.textContent || '');
    
    if (text.length < 10) continue; // Skip empty elements
    
    // Try exact match with full anchor text
    if (anchors.full) {
      const normalizedFull = normalizeText(anchors.full);
      if (text.includes(normalizedFull)) {
        debugLog('Pinboard GPT: MATCH found via full anchor at element', i);
        debugLog('Pinboard GPT: Element text preview:', text.slice(0, 150));
        return el;
      }
    }
    
    // Try prefix match (first 100 chars)
    if (anchors.prefix) {
      const normalizedPrefix = normalizeText(anchors.prefix);
      if (text.includes(normalizedPrefix)) {
        debugLog('Pinboard GPT: MATCH found via prefix anchor at element', i);
        debugLog('Pinboard GPT: Element text preview:', text.slice(0, 150));
        return el;
      }
    }
    
    // Try suffix match
    if (anchors.suffix) {
      const normalizedSuffix = normalizeText(anchors.suffix);
      if (text.includes(normalizedSuffix)) {
        debugLog('Pinboard GPT: MATCH found via suffix anchor at element', i);
        debugLog('Pinboard GPT: Element text preview:', text.slice(0, 150));
        return el;
      }
    }
  }
  
  return null;
}

// Highlight a pinned message
async function highlightPin(pin) {
  
  // For chat pins, just confirm we're on the right page - don't scroll or highlight
  if (pin.type === 'chat') {
    debugLog('Pinboard GPT: Chat pin opened - no scrolling or highlighting needed');
    showNotification('✅ Chat opened successfully!');
    return { found: true, type: 'chat' };
  }
  
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
    debugLog('Pinboard GPT: Trying XPath:', pin.xpath);
    element = findByXPath(pin.xpath);
    if (element) {
      debugLog('Pinboard GPT: Found element using XPath:', element.tagName);
      debugLog('Pinboard GPT: Element text preview:', (element.innerText || '').slice(0, 100));
      debugLog('Pinboard GPT: Element bounds:', element.getBoundingClientRect());
      
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
        debugLog('Pinboard GPT: XPath element does not contain expected text, rejecting');
        debugLog('Pinboard GPT: Expected:', searchText);
        debugLog('Pinboard GPT: Found:', elementText.slice(0, 100));
        element = null;
      }
    }
  }
  
  // Fallback to text anchors if XPath fails
  if (!element && pin.anchors) {
    debugLog('Pinboard GPT: XPath failed, trying text anchors');
    debugLog('Pinboard GPT: Available anchors:', {
      full: pin.anchors.full ? pin.anchors.full.slice(0, 100) + '...' : 'None',
      prefix: pin.anchors.prefix ? pin.anchors.prefix.slice(0, 50) + '...' : 'None', 
      suffix: pin.anchors.suffix ? pin.anchors.suffix.slice(0, 50) + '...' : 'None'
    });
    debugLog('Pinboard GPT: Looking for selection text:', pin.selectionText?.slice(0, 100) || 'None');
    
    element = findByTextAnchors(pin.anchors);
    if (element) {
      debugLog('Pinboard GPT: Found element using text anchors:', element.tagName);
      debugLog('Pinboard GPT: Anchor element bounds:', element.getBoundingClientRect());
      
      const elementText = (element.innerText || element.textContent || '').trim();
      debugLog('Pinboard GPT: Found element full text preview:', elementText.slice(0, 200) + '...');
      
      // Try to find a more specific child element if this seems too broad
      const searchText = pin.selectionText || pin.messageText.slice(0, 50);
      
      if (elementText.length > searchText.length * 3) {
        debugLog('Pinboard GPT: Text anchor element seems too broad, searching for specific child');
        debugLog('Pinboard GPT: Searching for text:', searchText);
        const specificChild = findSpecificElementByText(searchText, element);
        if (specificChild && specificChild !== element) {
          debugLog('Pinboard GPT: Found more specific child element:', specificChild.tagName);
          debugLog('Pinboard GPT: Child element text preview:', (specificChild.innerText || '').slice(0, 100));
          element = specificChild;
        } else {
          debugLog('Pinboard GPT: No more specific child found, using original element');
        }
      }
    } else {
      debugLog('Pinboard GPT: No element found via text anchors');
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
      debugLog('Pinboard GPT: Searching for full message using first 8 words:', searchText);
    } else {
      // For selection-only pins, search by the selected text
      searchText = pin.selectionText || pin.messageText.slice(0, 100).trim();
      debugLog('Pinboard GPT: Searching for selection:', searchText);
    }
    
    const mainContent = document.querySelector('main') || document.body;
    // Look specifically for message containers, not large wrapper divs
    const messageContainers = getAllMessageElements(mainContent);
    
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
      debugLog('Pinboard GPT: Found element via text search:', element.tagName);
      debugLog('Pinboard GPT: Text search element bounds:', element.getBoundingClientRect());
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
    debugLog('Pinboard GPT: Validating full message pin');
  } else {
    // For selection pins, use the selected text or a portion of message text
    expectedText = pin.selectionText || pin.messageText.slice(0, 50);
    debugLog('Pinboard GPT: Validating selection pin');
  }
  
  debugLog('Pinboard GPT: Final element validation');
  debugLog('Pinboard GPT: Pin type:', pin.selectionType);
  debugLog('Pinboard GPT: Is full message:', isFullMessage);
  debugLog('Pinboard GPT: Expected text:', expectedText.slice(0, 50) + '...');
  debugLog('Pinboard GPT: Found element text preview:', finalElementText.slice(0, 100));
  
  const textMatches = finalElementText.includes(expectedText);
  debugLog('Pinboard GPT: Element contains expected text:', textMatches);
  debugLog('Pinboard GPT: DETAILED COMPARISON:');
  debugLog('Pinboard GPT: Expected text (length ' + expectedText.length + '):', JSON.stringify(expectedText));
  debugLog('Pinboard GPT: Found text (length ' + finalElementText.length + '):', JSON.stringify(finalElementText.slice(0, 200)));
  debugLog('Pinboard GPT: Includes check result:', finalElementText.includes(expectedText));
  
  // If includes returns true, find WHERE in the text the match occurs
  if (finalElementText.includes(expectedText)) {
    const matchIndex = finalElementText.indexOf(expectedText);
    debugLog('Pinboard GPT: Match found at index:', matchIndex);
    debugLog('Pinboard GPT: Context around match:', JSON.stringify(finalElementText.substring(Math.max(0, matchIndex - 50), matchIndex + expectedText.length + 50)));
  }
  
  if (!textMatches) {
    if (isFullMessage) {
      // For full message pins, try a more lenient check
      const messageWords = pin.messageText.split(/\s+/).slice(0, 10).join(' ');
      const lenientMatch = finalElementText.includes(messageWords);
      debugLog('Pinboard GPT: Trying lenient match with first 10 words:', lenientMatch);
      
      if (!lenientMatch) {
        debugLog('Pinboard GPT: Full message validation failed - even lenient match failed');
        showNotification('⚠️ Found element but text does not match');
        return { found: false };
      }
    } else {
      debugLog('Pinboard GPT: Selection validation failed - text not found in element');
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
  
  // Log comprehensive pin and element details
  debugLog('Pinboard GPT: Pin details for scrolling:', {
    pinId: pin.id,
    pinType: pin.type,
    pinXpath: pin.xpath || 'No XPath available',
    hasAnchors: pin.anchors ? 'Yes' : 'No',
    selectionType: pin.selectionType || 'Unknown'
  });
  
  // Create and log the current XPath of the found element
  function getElementXPath(element) {
    if (element.id) {
      return `//*[@id="${element.id}"]`;
    }
    if (element === document.body) {
      return '/html/body';
    }
    
    let ix = 0;
    const siblings = element.parentNode?.childNodes || [];
    for (let i = 0; i < siblings.length; i++) {
      const sibling = siblings[i];
      if (sibling === element) {
        return getElementXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
      }
      if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
        ix++;
      }
    }
  }
  
  const currentElementXPath = getElementXPath(element);
  debugLog('Pinboard GPT: Current element XPath:', currentElementXPath);
  debugLog('Pinboard GPT: About to scroll to element at position:', {
    top: elementRect.top,
    left: elementRect.left,
    width: elementRect.width,
    height: elementRect.height,
    tagName: element.tagName,
    className: element.className || 'No class',
    textPreview: (element.innerText || element.textContent || '').slice(0, 100)
  });
  
  // Scroll to element with instant positioning (same as Chat Outline)
  try {
    // Find the scroll container (ChatGPT uses a div, not window)
    let scrollContainer = element.parentElement;
    while (scrollContainer && scrollContainer !== document.body) {
      const style = window.getComputedStyle(scrollContainer);
      if ((style.overflow === 'auto' || style.overflow === 'scroll' || 
           style.overflowY === 'auto' || style.overflowY === 'scroll') &&
          scrollContainer.scrollHeight > scrollContainer.clientHeight) {
        break;
      }
      scrollContainer = scrollContainer.parentElement;
    }
    
    if (!scrollContainer || scrollContainer === document.body) {
      scrollContainer = null;
    }
    
    // Get current positions
    const messageRect = element.getBoundingClientRect();
    const containerRect = scrollContainer ? scrollContainer.getBoundingClientRect() : { top: 0 };
    const currentScroll = scrollContainer ? scrollContainer.scrollTop : window.scrollY;
    const topGap = 80;
    
    // Calculate target scroll position
    const targetScroll = currentScroll + messageRect.top - containerRect.top - topGap;
    const finalScroll = Math.max(0, targetScroll);
    
    debugLog('Pinboard GPT: Pin navigation scroll calculation:', {
      hasScrollContainer: !!scrollContainer,
      currentScroll,
      messageTop: messageRect.top,
      containerTop: containerRect.top,
      targetScroll: finalScroll
    });
    
    // Use INSTANT scroll to prevent ChatGPT interference
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: finalScroll,
        behavior: 'auto' // INSTANT - no smooth animation
      });
    } else {
      window.scrollTo({
        top: finalScroll,
        behavior: 'auto' // INSTANT - no smooth animation
      });
    }
  } catch (err) {
    debugLog('Pinboard GPT: Scroll error:', err);
    // Fallback
    element.scrollIntoView({ behavior: 'auto', block: 'start', inline: 'nearest' });
  }
  
  // Wait briefly for DOM to settle
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Final check: verify element position after scroll
  const postScrollRect = element.getBoundingClientRect();
  debugLog('Pinboard GPT: Element position after scroll:', {
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
  
  debugLog('Pinboard GPT: About to highlight element:', element.tagName);
  debugLog('Pinboard GPT: Element text for highlighting:', (element.innerText || '').slice(0, 50));
  
  // Use a very subtle highlight that's easy on the eyes - no border, no margin/padding
  element.style.transition = 'all 0.4s ease';
  element.style.background = 'rgba(16, 163, 127, 0.03)'; // Much more subtle green tint
  element.style.boxShadow = '0 1px 6px rgba(16, 163, 127, 0.1)'; // Very soft shadow glow
  element.style.borderRadius = '8px';
  
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
  const allElements = getAllMessageElements(mainContent);
  
  debugLog('Pinboard GPT: Searching through', allElements.length, 'message containers for text:', searchText);
  
  for (const el of allElements) {
    const text = (el.innerText || el.textContent || '').trim();
    if (text.includes(searchText) && text.length > 10) {
      debugLog('Pinboard GPT: Found matching container with', text.length, 'characters');
      return el;
    }
  }
  
  debugLog('Pinboard GPT: No matching container found');
  return null;
}

// Find the specific element containing text using cursor-like approach
function findSpecificElementByText(searchText, messageContainer) {
  if (!messageContainer) return null;
  
  debugLog('Pinboard GPT: findSpecificElementByText called with:', searchText.slice(0, 50));
  debugLog('Pinboard GPT: Container element:', messageContainer.tagName, messageContainer.className);
  
  // Find all text nodes containing the search text
  const walker = document.createTreeWalker(
    messageContainer,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        const nodeText = node.textContent || '';
        const matches = nodeText.includes(searchText);
        if (matches) {
          debugLog('Pinboard GPT: Found matching text node:', JSON.stringify(nodeText.slice(0, 100)));
        }
        return matches ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    }
  );
  
  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }
  
  debugLog('Pinboard GPT: Found', textNodes.length, 'text nodes containing search text');
  
  if (textNodes.length === 0) {
    debugLog('Pinboard GPT: No text nodes found, returning original container');
    return messageContainer;
  }
  
  // Use the first matching text node's parent element
  let targetElement = textNodes[0].parentElement;
  
  // Walk up to find a meaningful semantic element
  const meaningfulTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'LI', 'BLOCKQUOTE', 'CODE', 'PRE', 'SPAN'];
  let current = targetElement;
  
  for (let i = 0; i < 3 && current && messageContainer.contains(current); i++) {
    const elementText = (current.innerText || current.textContent || '').trim();
    const tagName = current.tagName;
    
    if (elementText.includes(searchText) && meaningfulTags.includes(tagName)) {
      debugLog('Pinboard GPT: Found semantic element by text search:', tagName);
      return current;
    }
    current = current.parentElement;
  }
  
  return targetElement;
}

// Check if extension context is still valid
function isExtensionContextValid() {
  try {
    return !!(chrome.runtime && chrome.runtime.id);
  } catch (e) {
    return false;
  }
}

// Add pin option to ChatGPT's native selection popup
function addPinOptionToChatGPTPopup() {
  // Watch for ChatGPT's selection popup to appear
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Look for ChatGPT's selection popup patterns
          let popupFound = false;
          
          // Check if this node contains "Ask ChatGPT" text
          if (node.textContent && node.textContent.includes('Ask ChatGPT')) {
            debugLog('Pinboard GPT: Found popup with "Ask ChatGPT" text');
            addPinButtonToPopup(node);
            popupFound = true;
          }
          
          // Check for common popup container patterns
          if (!popupFound && node.querySelector) {
            // Look for buttons with "Ask" in them
            const askButtons = node.querySelectorAll('button, [role="button"]');
            for (const btn of askButtons) {
              if (btn.textContent && (btn.textContent.includes('Ask ChatGPT') || btn.textContent.includes('Ask'))) {
                debugLog('Pinboard GPT: Found popup with Ask button');
                addPinButtonToPopup(node);
                popupFound = true;
                break;
              }
            }
          }
          
          // Check for tooltip/popup container patterns
          if (!popupFound && (
            node.matches && (
              node.matches('[role="tooltip"]') ||
              node.matches('[role="menu"]') ||
              node.matches('.tooltip') ||
              node.matches('.popup') ||
              node.classList.contains('selection-popup')
            )
          )) {
            // Double-check it's related to text selection
            const selection = window.getSelection();
            if (selection.rangeCount > 0 && selection.toString().trim()) {
              debugLog('Pinboard GPT: Found potential selection popup container');
              addPinButtonToPopup(node);
            }
          }
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function addPinButtonToPopup(popupContainer) {
  // Avoid adding multiple pin buttons
  if (popupContainer.querySelector('.gpt-pinboard-popup-btn')) {
    return;
  }
  
  debugLog('Pinboard GPT: Found ChatGPT selection popup, adding pin button');
  
  // Find existing ChatGPT button to clone
  const existingButton = popupContainer.querySelector('button');
  if (!existingButton) {
    debugLog('Pinboard GPT: No existing button found to clone');
    return;
  }
  
  debugLog('Pinboard GPT: Found existing button to clone:', existingButton);
  
  // Clone the entire button with all its structure and classes
  const pinButton = existingButton.cloneNode(true);
  
  // ADD our class to the existing classes (don't replace them!)
  pinButton.classList.add('gpt-pinboard-popup-btn');
  
  // Remove any existing event listeners by replacing with a fresh clone
  const cleanButton = pinButton.cloneNode(true);
  cleanButton.classList.add('gpt-pinboard-popup-btn');
  
  // Find the nested structure: button > div > span
  const innerDiv = cleanButton.querySelector('div');
  if (!innerDiv) {
    debugLog('Pinboard GPT: Could not find inner div in cloned button');
    return;
  }
  debugLog('Pinboard GPT: Found inner div:', innerDiv);
  
  // Find the span that contains the icon and text
  const contentSpan = innerDiv.querySelector('span');
  if (!contentSpan) {
    debugLog('Pinboard GPT: Could not find content span in cloned button');
    return;
  }
  debugLog('Pinboard GPT: Found content span, current content:', contentSpan.textContent);
  
  // Clear the content span (this is where the icon and text are)
  while (contentSpan.firstChild) {
    contentSpan.removeChild(contentSpan.firstChild);
  }
  debugLog('Pinboard GPT: Cleared content span');
  
  // Create our custom icon
  let iconElement;
  try {
    if (chrome.runtime?.getURL) {
      iconElement = document.createElement('img');
      iconElement.src = chrome.runtime.getURL('icons/icon-32.png');
      iconElement.width = 20;
      iconElement.height = 20;
      iconElement.style.cssText = 'display: block; flex-shrink: 0;';
      iconElement.alt = 'Pinboard GPT';
      
      iconElement.onerror = () => {
        iconElement.style.display = 'none';
        const svgFallback = createSVGElement('20', '20', '0 0 24 24', 
          'M16 12V4H17V2H7V4H8V12L6 14V16H11V22H13V16H18V14L16 12Z',
          {'flex-shrink': '0', 'display': 'block'}
        );
        svgFallback.classList.add('icon');
        contentSpan.insertBefore(svgFallback, contentSpan.firstChild);
      };
    } else {
      throw new Error('Runtime not available');
    }
  } catch (error) {
    iconElement = createSVGElement('20', '20', '0 0 24 24',
      'M16 12V4H17V2H7V4H8V12L6 14V16H11V22H13V16H18V14L16 12Z',
      {'flex-shrink': '0', 'display': 'block'}
    );
    iconElement.classList.add('icon');
  }
  
  // Create text span that matches ChatGPT's structure
  const textSpan = document.createElement('span');
  textSpan.className = 'whitespace-nowrap! select-none max-md:sr-only';
  textSpan.textContent = 'Add to Pinboard GPT';
  
  // Add our content to the content span (maintaining the same structure)
  if (iconElement) {
    contentSpan.appendChild(iconElement);
    debugLog('Pinboard GPT: Added icon element');
  }
  contentSpan.appendChild(textSpan);
  debugLog('Pinboard GPT: Added text span, final content:', contentSpan.innerHTML);
  
  // Apply subtle border customization
  // cleanButton.style.border = '1px solid #ffffff26';
  
  // Use the cleaned cloned button
  const finalButton = cleanButton;
  
  // No hover effect needed - cloned button already has ChatGPT's native hover behavior
  
  finalButton.addEventListener('click', async (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Get current selection
    const selection = window.getSelection();
    if (!selection.rangeCount) {
      showNotification('⚠️ No text selected');
      return;
    }
    
    const selectedText = selection.toString().trim();
    if (selectedText.length < 3) {
      showNotification('⚠️ Please select at least 3 characters to pin');
      return;
    }
    
    debugLog('Pinboard GPT: Pin button clicked from popup, text:', selectedText);
    
    // Hide the popup
    const popup = finalButton.closest('[role="menu"], [role="tooltip"], .popup-container') || popupContainer;
    if (popup) {
      popup.style.display = 'none';
    }
    
    // Create pin using the same logic as other pin methods
    try {
      let messageContainer = getMessageContainerFromSelection();
      
      if (!messageContainer) {
        messageContainer = findMessageContainerByText(selectedText);
      }
      
      if (!messageContainer) {
        showNotification('⚠️ Could not identify the message container');
        return;
      }
      
      // Use cursor position to find target element (same as selection method)
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const x = rect.left + (rect.width / 2);
      const y = rect.top + (rect.height / 2);
      
      let targetElement = document.elementFromPoint(x, y);
      if (targetElement && messageContainer.contains(targetElement)) {
        // Find meaningful parent element
        for (let i = 0; i < 3 && targetElement && messageContainer.contains(targetElement); i++) {
          const elementText = (targetElement.innerText || targetElement.textContent || '').trim();
          if (elementText.includes(selectedText)) {
            break;
          }
          targetElement = targetElement.parentElement;
        }
      } else {
        targetElement = messageContainer;
      }
      
      // Determine pin type (single vs multi-word)
      const wordCount = selectedText.split(/\s+/).filter(word => word.length > 0).length;
      const isSingleWord = wordCount === 1;
      
      let pinContent, pinType;
      if (isSingleWord) {
        const fullMessageText = messageContainer.innerText || messageContainer.textContent || '';
        pinContent = fullMessageText.trim().slice(0, 120);
        pinType = 'full-message-with-highlight';
      } else {
        pinContent = selectedText.slice(0, 120);
        pinType = 'selection-only';
      }
      
      // Create pin object
      const pin = {
        id: crypto.randomUUID(),
        messageText: pinContent,
        name: '',
        tags: [],
        pageUrl: window.location.href,
        site: 'ChatGPT',
        pinnedAt: Date.now(),
        xpath: (() => {
          const xpath = getXPath(targetElement);
          debugLog('Pinboard GPT: Generated XPath:', xpath);
          return xpath;
        })(),
        anchors: getTextAnchors(targetElement),
        selectionText: selectedText.slice(0, 100),
        selectionType: pinType
      };
      
      debugLog('Pinboard GPT: Creating pin from popup:', pin);
      await openPinDialogWithData(pin);
      
    } catch (error) {
      debugError('Pinboard GPT: Error creating pin from popup:', error);
      
      // Provide user-friendly error messages
      let errorMessage = error.message;
      if (error.message.includes('Extension context invalidated') || 
          error.message.includes('Extension context is invalid')) {
        errorMessage = 'Extension was reloaded. Please refresh this page and try again.';
      } else if (error.message.includes('QUOTA_BYTES_PER_ITEM quota exceeded')) {
        errorMessage = 'Pin is too large. Try shortening the message or removing some content.';
      }
      
      showNotification('❌ Failed to create pin: ' + errorMessage);
    }
  });
  
  // Find the best place to insert the pin button
  const askButton = popupContainer.querySelector('button');
  if (askButton && askButton.parentElement) {
    askButton.parentElement.insertBefore(finalButton, askButton.nextSibling);
  } else {
    popupContainer.appendChild(finalButton);
  }
}

// Listen for messages from background script
try {
  if (chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      
      // Check extension context validity first
      if (!isExtensionContextValid()) {
        debugLog('Pinboard GPT: Extension context invalidated, reloading page...');
        window.location.reload();
        return false;
      }
      
      // Handle ping from background script to check if content script is loaded
      if (msg.action === 'ping') {
        sendResponse({ pong: true, ready: true });
        return true;
      }
      
      if (msg.action === 'highlight-pin' && msg.pin) {
        debugLog('Pinboard GPT: Content script received highlight-pin message for pin:', msg.pin.id);
        highlightPin(msg.pin).then(result => {
          debugLog('Pinboard GPT: Highlight result:', result);
          sendResponse(result);
        }).catch(err => {
          debugLog('Pinboard GPT: Highlight error:', err);
          sendResponse({ found: false, error: err.message });
        });
        return true; // Will respond asynchronously
      }
    
    return false;
  });
  }
} catch (error) {
  debugLog('Pinboard GPT: Failed to set up message listener:', error.message);
}

// Get recent messages for the floating pin button
function getRecentMessages(limit = 5) {
  const mainContent = document.querySelector('main') || document.body;
  const messages = getAllMessageElements(mainContent);
  
  return Array.from(messages)
    .filter(el => {
      const text = (el.innerText || '').trim();
      return text.length > 10; // Must have meaningful content
    })
    .slice(-limit) // Get the last N messages
    .reverse(); // Most recent first
}

// Create message selection dropdown
// Create message navigation dropdown (shows all messages, navigates on click)
function createMessageNavigationDropdown(messages) {
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
    max-height: 400px;
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
    position: sticky;
    top: 0;
    z-index: 1;
  `;
  header.textContent = `Navigate to message (${messages.length} total):`;
  dropdown.appendChild(header);
  
  // Message options - show in chronological order
  messages.forEach((message, index) => {
    const authorRole = message.getAttribute('data-message-author-role');
    const isAssistant = authorRole === 'assistant';
    
    // Try to get text from the actual content area
    let messageText = '';
    const contentDiv = message.querySelector('[data-message-id]');
    if (contentDiv) {
      messageText = (contentDiv.innerText || contentDiv.textContent || '').trim();
    } else {
      messageText = (message.innerText || message.textContent || '').trim();
    }
    
    // For empty messages (like code execution results), show a placeholder
    let preview = messageText;
    if (!preview || preview.length === 0) {
      preview = isAssistant ? '[Response content]' : '[Empty message]';
    } else if (preview.length > 80) {
      preview = preview.slice(0, 80) + '...';
    }
    
    const option = document.createElement('div');
    option.style.cssText = `
      padding: 10px 16px;
      border-bottom: 1px solid #f1f3f4;
      cursor: pointer;
      transition: background 0.2s;
      font-size: 12px;
      line-height: 1.4;
    `;
    
    const headerRow = document.createElement('div');
    headerRow.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    `;
    
    const roleLabel = document.createElement('span');
    roleLabel.style.cssText = `
      font-weight: 600;
      font-size: 10px;
      color: ${isAssistant ? '#10a37f' : '#1a73e8'};
      text-transform: uppercase;
    `;
    roleLabel.textContent = isAssistant ? '🤖 Assistant' : '👤 You';
    
    const messageNumber = document.createElement('span');
    messageNumber.style.cssText = `
      font-size: 10px;
      color: #9aa0a6;
      font-weight: 500;
    `;
    messageNumber.textContent = `#${index + 1}`;
    
    headerRow.appendChild(roleLabel);
    headerRow.appendChild(messageNumber);
    
    const previewDiv = document.createElement('div');
    previewDiv.style.cssText = `
      color: #5f6368;
      overflow: hidden;
    `;
    previewDiv.textContent = preview;
    
    option.appendChild(headerRow);
    option.appendChild(previewDiv);
    
    option.addEventListener('mouseenter', () => {
      option.style.background = '#f8f9fa';
    });
    
    option.addEventListener('mouseleave', () => {
      option.style.background = 'transparent';
    });
    
    option.addEventListener('click', () => {
      // Close dropdown first
      dropdown.remove();
      
      // Small delay to ensure dropdown is closed before scrolling
      setTimeout(() => {
        try {
          // Check if message element is still in DOM
          if (!document.body.contains(message)) {
            debugLog('Pinboard GPT: Message element no longer in DOM');
            return;
          }
          
          // Find the scroll container (ChatGPT uses a div, not window)
          let scrollContainer = message.parentElement;
          while (scrollContainer && scrollContainer !== document.body) {
            const style = window.getComputedStyle(scrollContainer);
            if ((style.overflow === 'auto' || style.overflow === 'scroll' || 
                 style.overflowY === 'auto' || style.overflowY === 'scroll') &&
                scrollContainer.scrollHeight > scrollContainer.clientHeight) {
              break;
            }
            scrollContainer = scrollContainer.parentElement;
          }
          
          if (!scrollContainer || scrollContainer === document.body) {
            scrollContainer = null;
          }
          
          // Get current positions
          const messageRect = message.getBoundingClientRect();
          const containerRect = scrollContainer ? scrollContainer.getBoundingClientRect() : { top: 0 };
          const currentScroll = scrollContainer ? scrollContainer.scrollTop : window.scrollY;
          const topGap = 80;
          
          // Calculate target scroll position
          const targetScroll = currentScroll + messageRect.top - containerRect.top - topGap;
          const finalScroll = Math.max(0, targetScroll);
          
          debugLog('Pinboard GPT: Chat outline scroll calculation:', {
            hasScrollContainer: !!scrollContainer,
            currentScroll,
            messageTop: messageRect.top,
            containerTop: containerRect.top,
            targetScroll: finalScroll
          });
          
          // Use INSTANT scroll to prevent ChatGPT interference
          if (scrollContainer) {
            scrollContainer.scrollTo({
              top: finalScroll,
              behavior: 'auto' // INSTANT - no smooth animation
            });
          } else {
            window.scrollTo({
              top: finalScroll,
              behavior: 'auto' // INSTANT - no smooth animation
            });
          }
        } catch (error) {
          debugLog('Pinboard GPT: Chat outline scroll error:', error);
          message.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
        
        // Highlight the message briefly with subtle styling
        const originalBg = message.style.background;
        const originalBoxShadow = message.style.boxShadow;
        const originalBorderRadius = message.style.borderRadius;
        const originalTransition = message.style.transition;
        
        message.style.transition = 'all 0.4s ease';
        message.style.background = 'rgba(255, 193, 7, 0.03)'; // Very subtle yellow tint
        message.style.boxShadow = '0 1px 6px rgba(255, 193, 7, 0.1)'; // Soft yellow shadow
        message.style.borderRadius = '8px';
        
        setTimeout(() => {
          message.style.transition = 'all 0.6s ease';
          message.style.background = originalBg;
          message.style.boxShadow = originalBoxShadow;
          message.style.borderRadius = originalBorderRadius;
          
          // Clean up transition after animation completes
          setTimeout(() => {
            message.style.transition = originalTransition;
          }, 600);
        }, 2000);
      }, 100);
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
    position: sticky;
    bottom: 0;
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
  
  // Scroll to show the last message by default
  setTimeout(() => {
    // Find the last message that's currently visible in the viewport
    let lastVisibleIndex = messages.length - 1;
    for (let i = messages.length - 1; i >= 0; i--) {
      const rect = messages[i].getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        lastVisibleIndex = i;
        break;
      }
    }
    
    // Scroll the dropdown to show this message
    const options = dropdown.querySelectorAll('div[style*="cursor: pointer"]');
    if (options[lastVisibleIndex]) {
      options[lastVisibleIndex].scrollIntoView({ block: 'center' });
    }
  }, 50);
  
  return dropdown;
}

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

// Get current chat ID from URL
function getChatId() {
  const path = window.location.pathname;
  const match = path.match(/\/c\/([a-zA-Z0-9-]+)/);
  return match ? match[1] : null;
}

// Get first user message from chat
function getFirstUserMessage() {
  const mainContent = document.querySelector('main') || document.body;
  const messages = mainContent.querySelectorAll('[data-message-author-role="user"]');
  
  if (messages.length > 0) {
    const firstMessage = messages[0];
    const text = (firstMessage.innerText || firstMessage.textContent || '').trim();
    // Return first 200 chars
    return text.length > 200 ? text.slice(0, 200) + '...' : text;
  }
  
  return '';
}

// Get chat title from page - prioritize sidebar active item
function getChatTitle() {
  // Find the active chat in sidebar using data-active attribute
  const activeLink = document.querySelector('a[data-active]');
  
  if (activeLink) {
    // Get all text content from the link, excluding nested elements we don't want
    const textContent = activeLink.textContent || activeLink.innerText;
    if (textContent && textContent.trim()) {
      const title = textContent.trim();
      debugLog('Pinboard GPT: Found chat title from sidebar:', title);
      return title;
    }
  }
  
  // Fallback to page title selectors
  const titleSelectors = [
    'h1',
    '[class*="title"]',
    'main h1',
    'main [role="heading"]'
  ];
  
  for (const selector of titleSelectors) {
    const element = document.querySelector(selector);
    if (element && element.innerText && element.innerText.trim()) {
      debugLog('Pinboard GPT: Found chat title from page:', element.innerText.trim());
      return element.innerText.trim();
    }
  }
  
  debugLog('Pinboard GPT: No chat title found, using default');
  return 'Untitled Chat';
}

// Check if current chat is pinned
async function isChatPinned(chatId) {
  if (!chatId) return false;
  const pins = await idbGetAll();
  return pins.some(pin => pin.type === 'chat' && pin.chatId === chatId);
}

// Pin current chat - opens dialog for name and tags
async function pinChat(chatId, chatTitle) {
  if (!chatId) {
    showNotification('⚠️ Cannot pin this chat. Please navigate to a specific conversation.');
    return;
  }
  
  // Check license before allowing pin creation (consolidated check)
  if (!(await checkPinLimitAndNotify())) {
    return;
  }
  
  // Open dialog to get name and tags from user
  await openChatPinDialog(chatId, chatTitle);
}

// Open dialog for pinning chat with name and tags
function openChatPinDialog(chatId, chatTitle) {
  return new Promise(async (resolve) => {
    // Get theme colors (consolidated)
    const colors = await getThemeColors();

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
    `;

    // Header (consolidated)
    const header = createDialogHeader('Pin Chat', colors);

    // Name input section
    const nameSection = document.createElement('div');
    nameSection.style.cssText = 'margin-bottom: 16px;';

    const nameLabel = document.createElement('label');
    nameLabel.setAttribute('for', 'chat-pin-name');
    nameLabel.style.cssText = `display: block; font-weight: 600; margin-bottom: 6px; color: ${colors.labelText}; font-size: 14px;`;
    nameLabel.textContent = 'Chat Name';

    const nameInputEl = document.createElement('input');
    nameInputEl.type = 'text';
    nameInputEl.id = 'chat-pin-name';
    nameInputEl.value = chatTitle || 'Untitled Chat';
    nameInputEl.placeholder = 'Give this chat a name...';
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

    // Description input section
    const descSection = document.createElement('div');
    descSection.style.cssText = 'margin-bottom: 16px;';

    const descLabel = document.createElement('label');
    descLabel.setAttribute('for', 'chat-pin-desc');
    descLabel.style.cssText = `display: block; font-weight: 600; margin-bottom: 6px; color: ${colors.labelText}; font-size: 14px;`;
    descLabel.textContent = 'Description (optional)';

    const descInputEl = document.createElement('textarea');
    descInputEl.id = 'chat-pin-desc';
    const firstMessage = getFirstUserMessage();
    descInputEl.value = firstMessage;
    descInputEl.placeholder = 'Add a description or first prompt...';
    descInputEl.rows = 3;
    descInputEl.style.cssText = `
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
      resize: vertical;
    `;

    descSection.appendChild(descLabel);
    descSection.appendChild(descInputEl);

    // Tags section
    const tagsSection = document.createElement('div');
    tagsSection.style.cssText = 'margin-bottom: 24px;';

    const tagsLabel = document.createElement('label');
    tagsLabel.style.cssText = `display: block; font-weight: 600; margin-bottom: 6px; color: ${colors.labelText}; font-size: 14px;`;
    tagsLabel.textContent = 'Tags (optional, max 3)';

    const tagsContainerEl = document.createElement('div');
    tagsContainerEl.id = 'chat-tags-container';
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
    tagInputEl.id = 'chat-tag-input';
    tagInputEl.placeholder = 'Add a tag...';
    tagInputEl.autocomplete = 'off';
    tagInputEl.spellcheck = false;
    tagInputEl.setAttribute('data-lpignore', 'true'); // Ignore LastPass
    tagInputEl.style.cssText = `
      border: none;
      outline: none;
      flex: 1;
      min-width: 100px;
      font-size: 14px;
      color: ${colors.inputText};
      background: transparent;
      font-family: system-ui, -apple-system, sans-serif;
    `;

    tagsContainerEl.appendChild(tagInputEl);

    const tagsHelp = document.createElement('div');
    tagsHelp.style.cssText = `font-size: 12px; color: ${colors.helpText};`;
    tagsHelp.textContent = 'Type to see suggestions from existing tags, or press Enter to add new tags';

    tagsSection.appendChild(tagsLabel);
    tagsSection.appendChild(tagsContainerEl);
    tagsSection.appendChild(tagsHelp);

    // Tags array
    const tags = [];

    // Get all existing tags from all pins for autosuggestion
    async function getAllExistingTags() {
      try {
        const allPins = await idbGetAll();
        debugLog('Pinboard GPT: All pins retrieved:', allPins.length, 'pins');
        
        const allTags = new Set();
        allPins.forEach(pin => {
          if (pin.tags && Array.isArray(pin.tags)) {
            debugLog('Pinboard GPT: Pin tags found:', pin.tags);
            pin.tags.forEach(tag => allTags.add(tag.toLowerCase()));
          }
        });
        
        const sortedTags = Array.from(allTags).sort();
        debugLog('Pinboard GPT: Final sorted tags:', sortedTags);
        return sortedTags;
      } catch (err) {
        debugError('Pinboard GPT: Error getting existing tags:', err);
        return [];
      }
    }

    // Create suggestion dropdown
    const suggestionDropdown = document.createElement('div');
    suggestionDropdown.id = 'tag-suggestions';
    suggestionDropdown.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: ${colors.inputBg};
      border: 1px solid ${colors.inputBorder};
      border-top: none;
      border-radius: 0 0 6px 6px;
      max-height: 150px;
      overflow-y: auto;
      z-index: 10000;
      display: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;
    
    debugLog('Pinboard GPT: Suggestion dropdown created with colors:', colors);

    // Make tags container relative for absolute positioning of dropdown
    tagsContainerEl.style.position = 'relative';
    tagsContainerEl.appendChild(suggestionDropdown);

    let selectedSuggestionIndex = -1;
    let availableSuggestions = [];

    // Show suggestions based on input
    async function showSuggestions(inputValue) {
      debugLog('Pinboard GPT: showSuggestions called with:', inputValue);
      
      if (!inputValue.trim()) {
        suggestionDropdown.style.display = 'none';
        return;
      }

      const existingTags = await getAllExistingTags();
      debugLog('Pinboard GPT: Existing tags found:', existingTags);
      
      const query = inputValue.toLowerCase().trim();
      availableSuggestions = existingTags
        .filter(tag => tag.includes(query) && !tags.includes(tag))
        .slice(0, 8); // Limit to 8 suggestions

      debugLog('Pinboard GPT: Available suggestions:', availableSuggestions, 'for query:', query);

      if (availableSuggestions.length === 0) {
        suggestionDropdown.style.display = 'none';
        debugLog('Pinboard GPT: No suggestions found, hiding dropdown');
        return;
      }

      suggestionDropdown.innerHTML = '';
      availableSuggestions.forEach((tag, index) => {
        const suggestionEl = document.createElement('div');
        suggestionEl.className = 'tag-suggestion';
        suggestionEl.style.cssText = `
          padding: 8px 12px;
          cursor: pointer;
          font-size: 14px;
          color: ${colors.inputText};
          border-bottom: 1px solid ${colors.inputBorder};
          transition: background-color 0.2s;
        `;
        suggestionEl.textContent = tag;
        
        suggestionEl.addEventListener('mouseenter', () => {
          selectedSuggestionIndex = index;
          updateSuggestionHighlight();
        });
        
        suggestionEl.addEventListener('click', () => {
          selectSuggestion(tag);
        });
        
        suggestionDropdown.appendChild(suggestionEl);
      });

      suggestionDropdown.style.display = 'block';
      selectedSuggestionIndex = -1;
      updateSuggestionHighlight();
      
      debugLog('Pinboard GPT: Dropdown shown with', availableSuggestions.length, 'suggestions');
      debugLog('Pinboard GPT: Dropdown element:', suggestionDropdown);
      debugLog('Pinboard GPT: Dropdown parent:', suggestionDropdown.parentNode);
    }

    // Update suggestion highlight
    function updateSuggestionHighlight() {
      const suggestions = suggestionDropdown.querySelectorAll('.tag-suggestion');
      suggestions.forEach((el, index) => {
        if (index === selectedSuggestionIndex) {
          el.style.backgroundColor = colors.primary || '#e8f0fe';
          el.style.color = colors.primaryText || '#1a73e8';
        } else {
          el.style.backgroundColor = 'transparent';
          el.style.color = colors.inputText;
        }
      });
    }

    // Select a suggestion
    function selectSuggestion(tag) {
      if (tags.length < 3 && !tags.includes(tag)) {
        tags.push(tag);
        
        const tagEl = document.createElement('span');
        tagEl.style.cssText = `
          background: ${colors.tagBg};
          color: ${colors.tagText};
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        `;
        tagEl.textContent = tag;
        
        const removeBtn = document.createElement('button');
        removeBtn.textContent = '×';
        removeBtn.style.cssText = `
          background: none;
          border: none;
          color: ${colors.tagText};
          font-size: 18px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
          width: 16px;
          height: 16px;
        `;
        removeBtn.onclick = () => {
          const index = tags.indexOf(tag);
          if (index > -1) tags.splice(index, 1);
          tagEl.remove();
          if (tags.length < 3) tagInputEl.disabled = false;
        };
        
        tagEl.appendChild(removeBtn);
        tagsContainerEl.insertBefore(tagEl, tagInputEl);
        tagInputEl.value = '';
        suggestionDropdown.style.display = 'none';
        
        if (tags.length >= 3) tagInputEl.disabled = true;
      }
    }

    // Enhanced tag input handler with autosuggestion
    tagInputEl.addEventListener('keydown', (e) => {
      if (suggestionDropdown.style.display === 'block' && availableSuggestions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, availableSuggestions.length - 1);
          updateSuggestionHighlight();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
          updateSuggestionHighlight();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (selectedSuggestionIndex >= 0) {
            selectSuggestion(availableSuggestions[selectedSuggestionIndex]);
          } else if (tagInputEl.value.trim() && tags.length < 3) {
            // Add as new tag if no suggestion selected
            const tag = tagInputEl.value.trim().toLowerCase();
            if (!tags.includes(tag)) {
              selectSuggestion(tag);
            }
          }
        } else if (e.key === 'Escape') {
          suggestionDropdown.style.display = 'none';
          selectedSuggestionIndex = -1;
        }
      } else if (e.key === 'Enter' && tagInputEl.value.trim() && tags.length < 3) {
        e.preventDefault();
        const tag = tagInputEl.value.trim().toLowerCase();
        if (!tags.includes(tag)) {
          selectSuggestion(tag);
        }
      }
    });

    // Show suggestions on input
    tagInputEl.addEventListener('input', (e) => {
      debugLog('Pinboard GPT: Input event fired, value:', e.target.value);
      showSuggestions(e.target.value);
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!tagsContainerEl.contains(e.target)) {
        suggestionDropdown.style.display = 'none';
        selectedSuggestionIndex = -1;
      }
    });

    // Buttons
    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.cssText = 'display: flex; gap: 12px; justify-content: flex-end;';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = `
      padding: 10px 20px;
      border: 1px solid ${colors.cancelBorder};
      background: ${colors.cancelBg};
      color: ${colors.cancelText};
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    `;
    cancelBtn.onmouseover = () => cancelBtn.style.background = colors.cancelHover;
    cancelBtn.onmouseout = () => cancelBtn.style.background = colors.cancelBg;
    cancelBtn.onclick = () => {
      overlay.remove();
      resolve();
    };

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Pin Chat';
    saveBtn.style.cssText = `
      padding: 10px 20px;
      border: none;
      background: ${colors.saveBg};
      color: ${colors.saveText};
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    `;
    saveBtn.onmouseover = () => saveBtn.style.background = colors.saveHover;
    saveBtn.onmouseout = () => saveBtn.style.background = colors.saveBg;
    saveBtn.onclick = async () => {
      const chatName = nameInputEl.value.trim() || chatTitle || 'Untitled Chat';
      const description = descInputEl.value.trim();
      
      const pin = {
        id: `chat_${chatId}`,
        type: 'chat',
        chatId: chatId,
        chatTitle: chatName,
        name: chatName,
        description: description,
        messageText: description, // For search compatibility
        tags: tags,
        pageUrl: window.location.href,
        timestamp: Date.now(),
        pinnedAt: Date.now()
      };
      
      await idbAdd(pin);
      showNotification('✅ Chat pinned successfully!');
      updateChatPinButton();
      overlay.remove();
      resolve();
    };

    buttonsDiv.appendChild(cancelBtn);
    buttonsDiv.appendChild(saveBtn);

    // Assemble dialog
    dialog.appendChild(header);
    dialog.appendChild(nameSection);
    dialog.appendChild(descSection);
    dialog.appendChild(tagsSection);
    dialog.appendChild(buttonsDiv);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Focus name input and select text
    nameInputEl.focus();
    nameInputEl.select();

    // Close on escape
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        overlay.remove();
        resolve();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
        resolve();
      }
    });
  });
}

// Unpin current chat
async function unpinChat(chatId) {
  if (!chatId) return;
  await idbDelete(`chat_${chatId}`);
  showNotification('📌 Chat unpinned');
  updateChatPinButton();
}

// Update the chat pin button appearance based on current state
async function updateChatPinButton() {
  const chatId = getChatId();
  const button = document.getElementById('pingpt-chat-pin');
  if (!button) return;
  
  if (!chatId) {
    button.style.display = 'none';
    return;
  }
  
  const isPinned = await isChatPinned(chatId);
  button.style.display = 'flex';
  
  const icon = button.querySelector('.chat-pin-icon');
  const text = button.querySelector('.chat-pin-text');
  
  if (isPinned) {
    // Use extension icon for unpinned state
    icon.textContent = '';
    try {
      const runtime = chrome.runtime || browser.runtime;
      if (runtime && runtime.getURL) {
        const img = document.createElement('img');
        img.src = runtime.getURL('icons/icon-32.png');
        img.style.display = 'block';
        img.style.borderRadius = '50%';
        icon.appendChild(img);
      }
    } catch (error) {
      const svg = createSVGElement('16', '16', '0 0 16 16',
        'M9.828 3a3.002 3.002 0 0 1-4.243 0L3 1.414 1.414 3l1.828 1.828a3.002 3.002 0 0 0 0 4.243L2 10.414 5.414 14l1.343-1.242a3.002 3.002 0 0 0 4.243 0L13.586 14 15 12.586l-1.828-1.828a3.002 3.002 0 0 0 0-4.243L14.586 5 11.172 1.586 9.828 3z',
        {'display': 'block'}
      );
      icon.appendChild(svg);
    }
    text.textContent = 'Unpin Chat';
    button.style.background = '#10a37f';
  } else {
    // Use extension icon for unpinned state
    icon.textContent = '';
    try {
      const runtime = chrome.runtime || browser.runtime;
      if (runtime && runtime.getURL) {
        const img = document.createElement('img');
        img.src = runtime.getURL('icons/icon-32.png');
        img.style.borderRadius = '50%';
        img.style.display = 'block';
        icon.appendChild(img);
      }
    } catch (error) {
      const svg = createSVGElement('16', '16', '0 0 16 16',
        'M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707L11.707 10l2.647 2.646a.5.5 0 0 1-.708.708L11 10.707l-3.525 3.525a.5.5 0 0 1-.707 0L1.818 9.282a.5.5 0 0 1 0-.707l3.525-3.525L2.697 2.404a.5.5 0 0 1 .708-.708L6.05 4.343 9.474.92a.5.5 0 0 1 .354-.146z',
        {'display': 'block'}
      );
      icon.appendChild(svg);
    }
    text.textContent = 'Pin Chat';
    button.style.background = '#2d3748';
  }
}

// Add chat pin button
function addChatPinButton() {
  setTimeout(() => {
    if (document.getElementById('pingpt-chat-pin')) return;
    
    const chatPinBtn = document.createElement('button');
    chatPinBtn.id = 'pingpt-chat-pin';
    
    const icon = document.createElement('span');
    icon.className = 'chat-pin-icon';
    icon.style.cssText = 'display: flex; align-items: center; justify-content: center; flex-shrink: 0;';
    
    const text = document.createElement('span');
    text.className = 'chat-pin-text pingpt-tooltip';
    text.style.cssText = `
      position: absolute;
      right: 58px;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(30, 41, 59, 0.95);
      color: white;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s, visibility 0.2s;
      pointer-events: none;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    
    // Create tooltip arrow
    const tooltipArrow = document.createElement('span');
    tooltipArrow.className = 'pingpt-tooltip-arrow';
    tooltipArrow.style.cssText = `
      position: absolute;
      right: -6px;
      top: 50%;
      transform: translateY(-50%);
      width: 0;
      height: 0;
      border-left: 6px solid rgba(30, 41, 59, 0.95);
      border-top: 6px solid transparent;
      border-bottom: 6px solid transparent;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s, visibility 0.2s;
    `;
    
    chatPinBtn.appendChild(icon);
    chatPinBtn.appendChild(text);
    chatPinBtn.appendChild(tooltipArrow);
    
    chatPinBtn.title = '';
    chatPinBtn.style.cssText = `
      position: fixed;
      bottom: 40px;
      right: 20px;
      z-index: 10000;
      background: #2d3748;
      color: white;
      border: none;
      border-radius: 50%;
      width: 48px;
      height: 48px;
      padding: 0;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    chatPinBtn.addEventListener('mouseenter', () => {
      chatPinBtn.style.transform = 'scale(1.05)';
      chatPinBtn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)';
      text.style.opacity = '1';
      text.style.visibility = 'visible';
      tooltipArrow.style.opacity = '1';
      tooltipArrow.style.visibility = 'visible';
    });
    
    chatPinBtn.addEventListener('mouseleave', () => {
      chatPinBtn.style.transform = 'scale(1)';
      chatPinBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
      text.style.opacity = '0';
      text.style.visibility = 'hidden';
      tooltipArrow.style.opacity = '0';
      tooltipArrow.style.visibility = 'hidden';
    });
    
    chatPinBtn.addEventListener('click', async () => {
      const chatId = getChatId();
      if (!chatId) {
        showNotification('⚠️ Cannot pin this page. Please navigate to a specific chat conversation.');
        return;
      }
      
      const isPinned = await isChatPinned(chatId);
      
      if (isPinned) {
        await unpinChat(chatId);
      } else {
        const chatTitle = getChatTitle();
        await pinChat(chatId, chatTitle);
      }
    });
    
    document.body.appendChild(chatPinBtn);
    
    // Initial update
    updateChatPinButton();
    
    // Update when URL changes (for SPA navigation)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        updateChatPinButton();
      }
    }).observe(document, { subtree: true, childList: true });
  }, 1500);
}

// Add a manual pin button to the page for easier access
function addManualPinButton() {
  // Wait for page to load
  setTimeout(() => {
    // Check if button already exists
    if (document.getElementById('pingpt-manual-pin')) return;
    
    const manualBtn = document.createElement('button');
    manualBtn.id = 'pingpt-manual-pin';
    
    // Use list icon for outline
    const iconSpan = document.createElement('span');
    const svg = createSVGElement('16', '16', '0 0 16 16',
      'M2.5 3.5a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11zm0 3a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11zm0 3a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11zm0 3a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11z',
      {'display': 'block'}
    );
    iconSpan.appendChild(svg);
    iconSpan.style.cssText = 'display: flex; align-items: center; justify-content: center; flex-shrink: 0;';
    manualBtn.appendChild(iconSpan);
    
    const buttonText = document.createElement('span');
    buttonText.textContent = 'Chat Outline';
    buttonText.className = 'pingpt-tooltip';
    buttonText.style.cssText = `
      position: absolute;
      right: 58px;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(30, 41, 59, 0.95);
      color: white;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s, visibility 0.2s;
      pointer-events: none;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    
    // Create tooltip arrow
    const tooltipArrow = document.createElement('span');
    tooltipArrow.className = 'pingpt-tooltip-arrow';
    tooltipArrow.style.cssText = `
      position: absolute;
      right: -6px;
      top: 50%;
      transform: translateY(-50%);
      width: 0;
      height: 0;
      border-left: 6px solid rgba(30, 41, 59, 0.95);
      border-top: 6px solid transparent;
      border-bottom: 6px solid transparent;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s, visibility 0.2s;
    `;
    
    manualBtn.appendChild(buttonText);
    manualBtn.appendChild(tooltipArrow);
    
    manualBtn.title = '';
    manualBtn.style.cssText = `
      position: fixed;
      bottom: 100px;
      right: 20px;
      z-index: 10000;
      background: #10a37f;
      color: white;
      border: none;
      border-radius: 50%;
      width: 48px;
      height: 48px;
      padding: 0;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    manualBtn.addEventListener('mouseenter', () => {
      manualBtn.style.transform = 'scale(1.05)';
      manualBtn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)';
      buttonText.style.opacity = '1';
      buttonText.style.visibility = 'visible';
      tooltipArrow.style.opacity = '1';
      tooltipArrow.style.visibility = 'visible';
    });
    
    manualBtn.addEventListener('mouseleave', () => {
      manualBtn.style.transform = 'scale(1)';
      manualBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
      buttonText.style.opacity = '0';
      buttonText.style.visibility = 'hidden';
      tooltipArrow.style.opacity = '0';
      tooltipArrow.style.visibility = 'hidden';
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
      // Get ALL messages in the conversation (not just recent 5)
      const allMessages = getAllMessageElements(document);
      
      if (allMessages.length === 0) {
        showNotification('⚠️ No messages found. Try scrolling or asking ChatGPT a question first.');
        return;
      }
      
      // Show selection dropdown for navigating to messages
      const existingDropdown = document.querySelector('#pingpt-message-dropdown');
      if (existingDropdown) {
        existingDropdown.remove();
        return;
      }
      
      const dropdown = createMessageNavigationDropdown(allMessages);
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

// Add chat pin button (top-right)
addChatPinButton();

// Add manual pin button
addManualPinButton();

// Add pin option to ChatGPT's native selection popup
addPinOptionToChatGPTPopup();

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
    opacity: 1 !important;
  }
  
  .pingpt-pin-button svg {
    pointer-events: none;
  }
`;
document.head.appendChild(style);
