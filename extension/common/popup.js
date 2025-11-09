// Browser API compatibility (for Firefox)
if (typeof browser !== 'undefined' && typeof chrome === 'undefined') {
  window.chrome = browser;
}

// Debug logging system for popup
let debugEnabled = false;

// Initialize debug setting on popup load
async function initializePopupDebug() {
  try {
    const debugMode = await getSetting('debugMode');
    debugEnabled = debugMode === true;
  } catch (error) {
    // Ignore errors during initialization
  }
}

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

document.addEventListener('DOMContentLoaded', async () => {
  const listEl = document.getElementById('list');
  const search = document.getElementById('search');
  const searchContainer = document.querySelector('.search-container');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');
  const syncText = document.getElementById('syncText');
  const syncToggle = document.getElementById('syncToggle');
  const themeText = document.getElementById('themeText');
  const themeToggle = document.getElementById('themeToggle');
  const tabBehaviorText = document.getElementById('tabBehaviorText');
  const tabBehaviorToggle = document.getElementById('tabBehaviorToggle');
  const debugText = document.getElementById('debugText');
  const debugToggle = document.getElementById('debugToggle');
  
  // Filter tabs
  const filterAll = document.getElementById('filterAll');
  const filterChats = document.getElementById('filterChats');
  const filterMessages = document.getElementById('filterMessages');
  let currentFilter = 'all'; // 'all', 'chats', 'messages'
  
  // Settings Modal Elements
  const settingsBtn = document.getElementById('settingsBtn');
  const coffeeBtn = document.getElementById('coffeeBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettings = document.getElementById('closeSettings');
  const versionNumber = document.getElementById('versionNumber');
  const deleteAllBtn = document.getElementById('deleteAllBtn');

  // Initialize theme
  async function initializeTheme() {
    try {
      const { theme } = await chrome.storage.local.get(['theme']);
      // Default to dark mode if no theme is set
      const isDark = theme !== 'light';
      themeToggle.checked = isDark;
      document.body.classList.toggle('dark-mode', isDark);
      updateThemeText(isDark);
      
      // Save default theme if not set
      if (theme === undefined) {
        await chrome.storage.local.set({ theme: 'dark' });
      }
    } catch (err) {
      debugError('Error loading theme:', err);
      // Default to dark mode on error
      themeToggle.checked = true;
      document.body.classList.add('dark-mode');
      updateThemeText(true);
    }
  }

  // Initialize tab behavior setting
  async function initializeTabBehavior() {
    try {
      debugLog('GPT Pinboard: Loading tab behavior setting...');
      
      const alwaysNewTab = await getSetting('alwaysNewTab');
      debugLog('GPT Pinboard: Loaded alwaysNewTab setting:', alwaysNewTab);
      
      // Default to always new tab (true) if not set
      const useNewTab = alwaysNewTab !== false;
      tabBehaviorToggle.checked = useNewTab;
      updateTabBehaviorText(useNewTab);
      debugLog('GPT Pinboard: Set tab behavior toggle to:', useNewTab);
      
      // Save default setting if not set
      if (alwaysNewTab === undefined) {
        debugLog('GPT Pinboard: Setting default alwaysNewTab to true');
        await setSetting('alwaysNewTab', true);
      }
    } catch (err) {
      debugError('GPT Pinboard: Error loading tab behavior:', err);
      // Default to new tab on error
      tabBehaviorToggle.checked = true;
      updateTabBehaviorText(true);
    }
  }

  // Initialize debug mode setting
  async function initializeDebugMode() {
    try {
      debugLog('GPT Pinboard: Loading debug mode setting...');
      
      const debugMode = await getSetting('debugMode');
      debugLog('GPT Pinboard: Loaded debug mode setting:', debugMode);
      
      // Default to false if not set
      const isDebugEnabled = debugMode === true;
      debugToggle.checked = isDebugEnabled;
      updateDebugText(isDebugEnabled);
      debugLog('GPT Pinboard: Set debug toggle to:', isDebugEnabled);
      
      // Save default setting if not set
      if (debugMode === undefined) {
        debugLog('GPT Pinboard: Setting default debug mode to false');
        await setSetting('debugMode', false);
      }
    } catch (err) {
      debugError('GPT Pinboard: Error loading debug mode:', err);
      // Default to false on error
      debugToggle.checked = false;
      updateDebugText(false);
    }
  }

  function updateTabBehaviorText(useNewTab) {
    if (useNewTab) {
      tabBehaviorText.textContent = '🗂️ Always open in new tab';
      tabBehaviorText.style.color = '#19c37d';
    } else {
      tabBehaviorText.textContent = '♻️ Reuse existing tab';
      tabBehaviorText.style.color = '#10a37f';
    }
  }

  function updateDebugText(isEnabled) {
    if (isEnabled) {
      debugText.textContent = '🐛 Debug mode ON';
      debugText.style.color = '#ff6b6b';
    } else {
      debugText.textContent = '🐛 Debug mode OFF';
      debugText.style.color = '#888';
    }
  }

  function updateThemeText(isDark) {
    if (isDark) {
      themeText.textContent = '🌙 Dark mode';
      themeText.style.color = '#19c37d';
    } else {
      themeText.textContent = '☀️ Light mode';
      themeText.style.color = '#10a37f';
    }
  }

  // Theme toggle handler
  themeToggle.onchange = async () => {
    const isDark = themeToggle.checked;
    document.body.classList.toggle('dark-mode', isDark);
    updateThemeText(isDark);
    
    try {
      await chrome.storage.local.set({ theme: isDark ? 'dark' : 'light' });
    } catch (err) {
      debugError('Error saving theme:', err);
    }
  };

  // Tab behavior toggle handler
  tabBehaviorToggle.onchange = async () => {
    const useNewTab = tabBehaviorToggle.checked;
    debugLog('GPT Pinboard: Tab behavior changed to:', useNewTab);
    updateTabBehaviorText(useNewTab);
    
    try {
      await setSetting('alwaysNewTab', useNewTab);
      debugLog('GPT Pinboard: Successfully saved alwaysNewTab setting:', useNewTab);
      
      // Verify it was saved
      const alwaysNewTab = await getSetting('alwaysNewTab');
      debugLog('GPT Pinboard: Verified saved setting:', alwaysNewTab);
    } catch (err) {
      debugError('GPT Pinboard: Error saving tab behavior:', err);
    }
  };

  // Debug mode toggle handler
  debugToggle.onchange = async () => {
    const isDebugEnabled = debugToggle.checked;
    debugLog('GPT Pinboard: Debug mode changed to:', isDebugEnabled);
    updateDebugText(isDebugEnabled);
    
    try {
      await setSetting('debugMode', isDebugEnabled);
      debugLog('GPT Pinboard: Successfully saved debug mode setting:', isDebugEnabled);
      
      // Verify it was saved
      const debugMode = await getSetting('debugMode');
      debugLog('GPT Pinboard: Verified saved debug setting:', debugMode);
    } catch (err) {
      debugError('GPT Pinboard: Error saving debug mode:', err);
    }
  };

  // Load version from manifest
  function loadVersion() {
    const manifest = chrome.runtime.getManifest();
    if (versionNumber && manifest.version) {
      versionNumber.textContent = manifest.version;
    }
  }

  // Initialize theme, tab behavior, and debug mode on load
  await initializePopupDebug(); // Initialize debug first so other logs work
  await initializeTheme();
  await initializeTabBehavior();
  await initializeDebugMode();
  loadVersion();

  // Settings Modal Handlers
  settingsBtn.onclick = () => {
    settingsModal.style.display = 'flex';
    updateSyncStatus(); // Refresh sync status when opening settings
  };

  // Coffee Button Handler
  coffeeBtn.onclick = () => {
    chrome.tabs.create({ url: 'https://www.buymeacoffee.com/0xdps' });
  };

  // Delete All Pins Handler
  deleteAllBtn.onclick = () => {
    deleteAllPins();
  };

  closeSettings.onclick = () => {
    settingsModal.style.display = 'none';
  };

  // Close modal when clicking outside
  settingsModal.onclick = (e) => {
    if (e.target === settingsModal) {
      settingsModal.style.display = 'none';
    }
  };

  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && settingsModal.style.display === 'flex') {
      settingsModal.style.display = 'none';
    }
  });

  async function updateSyncStatus() {
    try {
      const stats = await getStorageStats();
      syncText.textContent = `🔄 Syncing (${stats.pinCount} pins, ${stats.quotaUsed}% quota)`;
      syncText.style.color = stats.quotaUsed < 90 ? 'var(--primary)' : 'var(--warning)';
      
      if (stats.quotaUsed >= 100) {
        syncText.textContent = `⚠️ Storage full (${stats.pinCount} pins)`;
        syncText.style.color = 'var(--danger)';
      }
      
      // Always show as enabled since we only use sync storage
      syncToggle.checked = true;
      syncToggle.disabled = true; // No option to disable sync
    } catch (err) {
      syncText.textContent = '⚠️ Sync unavailable';
      syncText.style.color = 'var(--danger)';
      syncToggle.checked = false;
      syncToggle.disabled = true;
    }
  }

  // Remove sync toggle functionality since we always use sync
  syncToggle.style.opacity = '0.5';
  syncToggle.title = 'Sync is always enabled in this version';

  async function getPins() { 
    try {
      const pins = await idbGetAll();
      return pins;
    } catch (err) {
      return [];
    }
  }

  // Helper function for relative time display
  function getRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return days === 1 ? '1 day ago' : `${days} days ago`;
    } else if (hours > 0) {
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    } else if (minutes > 0) {
      return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
    } else {
      return 'Just now';
    }
  }

  // Centralized pin opening function
  async function openPin(pinId) {
    const stored = (await getPins()).find(x => x.id === pinId);
    if (stored?.pageUrl) {
      debugLog('GPT Pinboard: Opening pin:', stored.id, stored.pageUrl);
      chrome.runtime.sendMessage({ action: 'open-and-highlight', pin: stored }, (resp) => {
        debugLog('GPT Pinboard: Response from background script:', resp, 'Error:', chrome.runtime.lastError);
        if (chrome.runtime.lastError) {
          debugLog('GPT Pinboard: Background script error:', chrome.runtime.lastError.message);
          showNotification('Error communicating with background script', 'error');
          return;
        } else if (resp?.success) {
          if (resp.highlighted) {
            // Success - pin was highlighted
            window.close();
          } else {
            // Pin was opened but not highlighted
            showNotification('Pin opened but message not found on page', 'warning');
            setTimeout(() => window.close(), 1500);
          }
        } else {
          // Error response from background script
          debugLog('GPT Pinboard: Highlighting failed:', resp?.error);
          showNotification('Pin opened but highlighting failed', 'warning');
          setTimeout(() => window.close(), 1500);
        }
      });
    } else {
      showNotification('No original page URL saved for this pin.', 'error');
    }
  }

  // Custom confirmation modal
  function showConfirmation(title, message) {
    return new Promise((resolve) => {
      const modal = document.getElementById('confirmModal');
      const titleEl = document.getElementById('confirmTitle');
      const messageEl = document.getElementById('confirmMessage');
      const cancelBtn = document.getElementById('confirmCancel');
      const exportBtn = document.getElementById('confirmExport');
      const okBtn = document.getElementById('confirmOK');
      
      titleEl.textContent = title;
      messageEl.textContent = message;
      
      // Hide export button by default
      exportBtn.style.display = 'none';
      
      modal.style.display = 'flex';
      
      function cleanup() {
        modal.style.display = 'none';
        cancelBtn.removeEventListener('click', handleCancel);
        exportBtn.removeEventListener('click', handleExport);
        okBtn.removeEventListener('click', handleOK);
      }
      
      function handleCancel() {
        cleanup();
        resolve('cancel');
      }
      
      function handleExport() {
        cleanup();
        resolve('export');
      }
      
      function handleOK() {
        cleanup();
        resolve('delete');
      }
      
      cancelBtn.addEventListener('click', handleCancel);
      exportBtn.addEventListener('click', handleExport);
      okBtn.addEventListener('click', handleOK);
    });
  }

  // Enhanced confirmation modal with export option for delete all
  function showDeleteAllConfirmation(title, message) {
    return new Promise((resolve) => {
      const modal = document.getElementById('confirmModal');
      const titleEl = document.getElementById('confirmTitle');
      const messageEl = document.getElementById('confirmMessage');
      const cancelBtn = document.getElementById('confirmCancel');
      const exportBtn = document.getElementById('confirmExport');
      const okBtn = document.getElementById('confirmOK');
      
      titleEl.textContent = title;
      messageEl.textContent = message;
      
      // Show export button for delete all
      exportBtn.style.display = 'inline-block';
      
      modal.style.display = 'flex';
      
      function cleanup() {
        modal.style.display = 'none';
        cancelBtn.removeEventListener('click', handleCancel);
        exportBtn.removeEventListener('click', handleExport);
        okBtn.removeEventListener('click', handleOK);
      }
      
      function handleCancel() {
        cleanup();
        resolve('cancel');
      }
      
      function handleExport() {
        cleanup();
        resolve('export');
      }
      
      function handleOK() {
        cleanup();
        resolve('delete');
      }
      
      cancelBtn.addEventListener('click', handleCancel);
      exportBtn.addEventListener('click', handleExport);
      okBtn.addEventListener('click', handleOK);
    });
  }

  // Centralized pin deletion function with confirmation
  async function deletePin(pinId) {
    const pin = (await getPins()).find(x => x.id === pinId);
    if (!pin) return;
    
    const title = pin.name || pin.messageText.slice(0, 50) + (pin.messageText.length > 50 ? '...' : '');
    
    const confirmed = await showConfirmation('Delete Pin', `Delete "${title}"?`);
    if (confirmed) {
      try {
        await idbDelete(pinId);
        await render();
      } catch (err) {
        debugError('Failed to delete pin:', err);
      }
    }
  }

  // Delete all pins function with confirmation
  async function deleteAllPins() {
    try {
      const pins = await getPins();
      if (pins.length === 0) {
        showNotification('No pins to delete.', 'info');
        return;
      }

      const result = await showDeleteAllConfirmation(
        'Delete All Pins', 
        `Are you sure you want to delete all ${pins.length} pins? This action cannot be undone. Consider exporting first to create a backup.`
      );
      
      if (result === 'export') {
        // Export pins first, then ask again
        try {
          const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            pinCount: pins.length,
            pins: pins
          };
          
          const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const dateStr = new Date().toISOString().split('T')[0];
          a.download = `gpt-pinboard-backup-${dateStr}.json`;
          a.click();
          URL.revokeObjectURL(url);
          
          showNotification(`Exported ${pins.length} pins successfully. You can now safely delete all pins.`, 'success');
          
          // Ask again after export
          setTimeout(() => deleteAllPins(), 1000);
        } catch (err) {
          debugError('Export failed:', err);
          showNotification('Export failed. Please try again.', 'error');
        }
      } else if (result === 'delete') {
        // Delete all pins using the proper IndexedDB clear function
        await idbClear();
        
        // Close settings modal
        settingsModal.style.display = 'none';
        
        // Re-render the UI
        await render();
        
        showNotification(`Successfully deleted all ${pins.length} pins.`, 'success');
      }
      // If result === 'cancel', do nothing
    } catch (err) {
      debugError('Failed to delete all pins:', err);
      showNotification('Failed to delete all pins.', 'error');
    }
  }

  // Simple notification system
  function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification status-indicator ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: var(--space-4);
      right: var(--space-4);
      z-index: 1001;
      box-shadow: var(--shadow-lg);
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  function escapeHtml(s){ return (s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

  // Calculate search relevance for better sorting
  function getSearchRelevance(pin, query) {
    if (!query) return 0;
    
    let score = 0;
    const q = query.toLowerCase();
    
    // Title matches get highest score
    if (pin.name && pin.name.toLowerCase().includes(q)) {
      score += pin.name.toLowerCase() === q ? 100 : 50;
    }
    
    // Tag matches get high score
    if (pin.tags) {
      const exactTagMatch = pin.tags.some(tag => tag.toLowerCase() === q);
      const partialTagMatch = pin.tags.some(tag => tag.toLowerCase().includes(q));
      if (exactTagMatch) score += 80;
      else if (partialTagMatch) score += 40;
    }
    
    // Message content matches get moderate score
    if (pin.messageText && pin.messageText.toLowerCase().includes(q)) {
      // Boost if query appears near the beginning
      const index = pin.messageText.toLowerCase().indexOf(q);
      score += index < 100 ? 30 : 20;
    }
    
    return score;
  }

  function renderPin(pin) {
    // Clone the template
    const template = document.getElementById('pinTemplate');
    const pinElement = template.cloneNode(true);
    
    // Remove the template ID and make it visible
    pinElement.removeAttribute('id');
    pinElement.style.display = 'flex';
    pinElement.setAttribute('data-pin-id', pin.id);
    pinElement.setAttribute('data-pin-type', pin.type || 'message');
    
    // Add visual indicator for chat pins
    if (pin.type === 'chat') {
      pinElement.classList.add('chat-pin');
    }
    
    // Add click handler to the entire card (for opening)
    pinElement.style.cursor = 'pointer';
    pinElement.addEventListener('click', (e) => {
      // Don't trigger if clicking on action buttons
      if (e.target.closest('.pin-actions')) {
        return;
      }
      // Open the pin
      openPin(pin.id);
    });
    
    // Get elements to populate
    const titleEl = pinElement.querySelector('.pin-title');
    const messageEl = pinElement.querySelector('.pin-message');
    const tagsEl = pinElement.querySelector('.pin-tags');
    const openBtn = pinElement.querySelector('.openBtn');
    const deleteBtn = pinElement.querySelector('.deleteBtn');
    const infoBtn = pinElement.querySelector('.infoBtn');
    
    // Handle different pin types
    let title, messagePreview;
    
    if (pin.type === 'chat') {
      // Chat pin
      title = '💬 ' + (pin.chatTitle || 'Untitled Chat');
      // Show description if available, otherwise show default text
      messagePreview = pin.description || pin.messageText || 'Entire conversation pinned';
    } else {
      // Message pin
      title = pin.name ? escapeHtml(pin.name.trim()) : '';
      const messageLength = 200;
      messagePreview = pin.messageText && pin.messageText.length > messageLength 
        ? pin.messageText.slice(0, messageLength).trim() + '…' 
        : (pin.messageText || '');
    }
    
    // Set title (hide if empty)
    if (title) {
      titleEl.textContent = title;
      titleEl.style.display = 'block';
    } else {
      titleEl.style.display = 'none';
    }
    
    // Set message with better formatting
    messageEl.textContent = messagePreview;
    
    // Set tags with improved design
    if (pin.tags?.length) {
      // Clear existing tags safely
      while (tagsEl.firstChild) {
        tagsEl.removeChild(tagsEl.firstChild);
      }
      
      // Create tag elements safely
      pin.tags.slice(0, 5).forEach(tag => { // Limit to 5 tags for UI
        const tagSpan = document.createElement('span');
        tagSpan.className = 'tag-link';
        tagSpan.setAttribute('data-tag', tag);
        tagSpan.textContent = tag;
        tagSpan.title = `Search for "${tag}"`;
        tagsEl.appendChild(tagSpan);
      });
      
      // Add "more tags" indicator if there are more than 5
      if (pin.tags.length > 5) {
        const moreSpan = document.createElement('span');
        moreSpan.className = 'tag-link';
        moreSpan.textContent = `+${pin.tags.length - 5} more`;
        moreSpan.style.opacity = '0.7';
        moreSpan.style.cursor = 'default';
        moreSpan.title = pin.tags.slice(5).join(', ');
        tagsEl.appendChild(moreSpan);
      }
      
      tagsEl.style.display = 'flex';
    } else {
      tagsEl.style.display = 'none';
    }
    
    // Set button data and enhanced tooltips
    openBtn.setAttribute('data-id', pin.id);
    openBtn.setAttribute('data-tooltip', 'Open pin (Enter)');
    openBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openPin(pin.id);
    });
    
    deleteBtn.setAttribute('data-id', pin.id);
    deleteBtn.setAttribute('data-tooltip', 'Delete pin (Del)');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deletePin(pin.id);
    });
    
    // Enhanced info tooltip with relative time
    const dateTime = new Date(pin.pinnedAt);
    const relativeTime = getRelativeTime(dateTime);
    const fullDateTime = dateTime.toLocaleString();
    infoBtn.setAttribute('data-tooltip', `Pinned ${relativeTime}\n${fullDateTime}`);
    
    // Add keyboard navigation
    pinElement.setAttribute('tabindex', '0');
    pinElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openPin(pin.id);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deletePin(pin.id);
      }
    });
    
    return pinElement;
  }

  async function render() {
    // Show loading state for long operations
    const isLoading = listEl.children.length === 0;
    if (isLoading) {
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'loading-state';
      loadingDiv.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--space-8);
        gap: var(--space-3);
        color: var(--text-tertiary);
      `;
      const loadingSpinner = document.createElement('div');
      loadingSpinner.className = 'loading';
      const loadingText = document.createElement('span');
      loadingText.textContent = 'Loading pins...';
      loadingDiv.appendChild(loadingSpinner);
      loadingDiv.appendChild(loadingText);
      listEl.appendChild(loadingDiv);
    }
    
    const pins = await getPins();
    const q = search.value.trim().toLowerCase();
    
    // Clear list safely
    while (listEl.firstChild) {
      listEl.removeChild(listEl.firstChild);
    }
    
    const filtered = pins.filter(p => {
      // Apply filter type
      if (currentFilter === 'chats' && p.type !== 'chat') return false;
      if (currentFilter === 'messages' && p.type === 'chat') return false;
      
      if (!q) return true;
      
      // Handle tag-specific search
      if (q.startsWith('tag:')) {
        const tagQuery = q.substring(4).trim();
        return p.tags && p.tags.some(tag => tag.toLowerCase().includes(tagQuery));
      }
      
      // Enhanced search - include partial matches and better relevance
      const searchTerms = q.split(' ').filter(term => term.length > 0);
      return searchTerms.every(term => 
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.chatTitle && p.chatTitle.toLowerCase().includes(term)) ||
        (p.messageText && p.messageText.toLowerCase().includes(term)) ||
        (p.tags && p.tags.join(' ').toLowerCase().includes(term)) ||
        (p.site && p.site.toLowerCase().includes(term))
      );
    }).sort((a,b) => {
      // Better sorting: prioritize recent pins, but boost exact matches
      const aRelevance = getSearchRelevance(a, q);
      const bRelevance = getSearchRelevance(b, q);
      
      if (aRelevance !== bRelevance) {
        return bRelevance - aRelevance;
      }
      
      // Sort by pinnedAt (most recent first), fallback to timestamp
      const aTime = a.pinnedAt || a.timestamp || 0;
      const bTime = b.pinnedAt || b.timestamp || 0;
      return bTime - aTime;
    });
    
    // Only show counter when actively searching, not when using filter tabs
    if (q) {
      updateSearchResults(filtered.length, pins.length, q);
    } else {
      // Remove counter when not searching (including filter tabs)
      const existingCounter = document.querySelector('.search-results-counter');
      if (existingCounter) {
        existingCounter.remove();
      }
    }
    
    
    if (!filtered.length) {
      // Create modern empty state
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'empty-state';
      
      const iconDiv = document.createElement('div');
      
      const img = document.createElement('img');
      img.src = 'icons/icon-32.png';
      img.width = 32;
      img.height = 32;
      img.alt = 'GPT Pinboard';
      
      iconDiv.appendChild(img);
      
      const messageP = document.createElement('p');
      
      if (q) {
        // Search found no results
        messageP.textContent = 'No pins found for "';
        const strongEl = document.createElement('strong');
        strongEl.textContent = q;
        messageP.appendChild(strongEl);
        messageP.appendChild(document.createTextNode('"'));
      } else if (currentFilter === 'chats') {
        // No chat pins
        messageP.textContent = 'No chat pins yet!\n\nVisit ChatGPT and click the "Pin Chat" button to save entire conversations here.';
        messageP.style.whiteSpace = 'pre-line';
      } else if (currentFilter === 'messages') {
        // No message pins
        messageP.textContent = 'No message pins yet!\n\nVisit ChatGPT and click the pin button next to any message to save it here.';
        messageP.style.whiteSpace = 'pre-line';
      } else {
        // No pins at all
        messageP.textContent = 'No pins yet!\n\nVisit ChatGPT and click the pin button next to any message to save it here.';
        messageP.style.whiteSpace = 'pre-line';
      }
      
      emptyDiv.appendChild(iconDiv);
      emptyDiv.appendChild(messageP);
      
      listEl.appendChild(emptyDiv);
      return;
    }
    
    filtered.forEach(p => {
      const el = renderPin(p);
      listEl.appendChild(el);
    });

    // Add event listeners for tag links
    document.querySelectorAll('.tag-link').forEach(tagEl => {
      tagEl.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const tag = e.target.dataset.tag;
        search.value = `tag:${tag}`;
        updateClearButton();
        render(); // Re-render with new search
      };
    });

    // Event listeners are now attached in renderPin function for better performance
    // and to avoid memory leaks from repeated event listener attachments
  }

  // Function to update clear button visibility
  function updateClearButton() {
    if (search.value.trim()) {
      searchContainer.classList.add('has-content');
    } else {
      searchContainer.classList.remove('has-content');
    }
  }

  // Add search result counter
  function updateSearchResults(filteredCount, totalCount, query) {
    // Remove existing counter
    const existingCounter = document.querySelector('.search-results-counter');
    if (existingCounter) {
      existingCounter.remove();
    }
    
    if (query || filteredCount !== totalCount) {
      const counter = document.createElement('div');
      counter.className = 'search-results-counter';
      counter.style.cssText = `
        margin-top: var(-1 * --space-2);
        padding: var(--space-2) var(--space-5);
        font-size: var(--font-size-xs);
        color: var(--text-tertiary);
        border-bottom: 1px solid var(--border-color);
        background: var(--bg-secondary);
      `;
      
      if (query) {
        if (filteredCount === 0) {
          counter.textContent = `No results for "${query}"`;
        } else {
          counter.textContent = `${filteredCount} result${filteredCount !== 1 ? 's' : ''} for "${query}"`;
        }
      } else {
        counter.textContent = `Showing ${filteredCount} of ${totalCount} pins`;
      }
      
      // Insert after search container
      searchContainer.insertAdjacentElement('afterend', counter);
    }
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Escape key clears search or closes modal
    if (e.key === 'Escape') {
      if (search.value) {
        search.value = '';
        updateClearButton();
        render();
        e.preventDefault();
      } else if (settingsModal.style.display === 'flex') {
        settingsModal.style.display = 'none';
        e.preventDefault();
      }
    }
    
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      search.focus();
      search.select();
      e.preventDefault();
    }
    
    // Ctrl/Cmd + , to open settings
    if ((e.ctrlKey || e.metaKey) && e.key === ',') {
      settingsModal.style.display = 'flex';
      updateSyncStatus();
      e.preventDefault();
    }
  });

  // Debounce search for better performance
  let searchTimeout;
  search.addEventListener('input', () => {
    updateClearButton();
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Show instant feedback for clearing search
    if (!search.value.trim()) {
      render();
      return;
    }
    
    // Debounce other searches
    searchTimeout = setTimeout(() => {
      render();
    }, 300);
  });

  exportBtn.onclick = async () => {
    try {
      const pins = await getPins();
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        pinCount: pins.length,
        pins: pins
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `gpt-pinboard-backup-${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      showNotification(`Exported ${pins.length} pins successfully`, 'success');
    } catch (err) {
      showNotification('Export failed: ' + err.message, 'error');
    }
  };

  importBtn.onclick = () => importFile.click();
  importFile.onchange = async (ev) => {
    const f = ev.target.files[0];
    if (!f) return;
    
    try {
      const text = await f.text();
      const data = JSON.parse(text);
      
      // Only support structured export format (v1.0+)
      if (!data.pins || !Array.isArray(data.pins)) {
        throw new Error('Invalid file format. Please use a file exported from GPT Pinboard v1.0 or later.');
      }
      
      const pins = data.pins;
      
      if (pins.length === 0) {
        showNotification('No pins found in file', 'warning');
        return;
      }
      
      // Validate and import pins
      let imported = 0;
      let skipped = 0;
      
      for (const p of pins) {
        try {
          // Validate required fields
          if (!p.messageText) {
            skipped++;
            continue;
          }
          
          // Generate ID if missing
          p.id = p.id || crypto.randomUUID();
          
          // Set default values for missing fields
          p.pinnedAt = p.pinnedAt || Date.now();
          p.site = p.site || 'ChatGPT';
          p.tags = p.tags || [];
          
          await idbAdd(p);
          imported++;
        } catch (err) {
          console.warn('Failed to import pin:', err);
          skipped++;
        }
      }
      
      await render();
      
      if (imported > 0) {
        let message = `Imported ${imported} pin${imported !== 1 ? 's' : ''} successfully`;
        if (skipped > 0) {
          message += ` (${skipped} skipped)`;
        }
        showNotification(message, 'success');
      } else {
        showNotification('No valid pins could be imported', 'error');
      }
      
    } catch (err) {
      showNotification('Import failed: ' + err.message, 'error');
    }
    
    // Reset file input
    ev.target.value = '';
  };

  // Help link handler
  document.addEventListener('click', (e) => {
    if (e.target.id === 'helpLink') {
      e.preventDefault();
      chrome.tabs.create({ url: 'https://github.com/0xdps/gpt-pinboard-extension' });
    }
  });

  // Filter tab handlers
  function setActiveFilter(filter) {
    currentFilter = filter;
    filterAll.classList.toggle('active', filter === 'all');
    filterChats.classList.toggle('active', filter === 'chats');
    filterMessages.classList.toggle('active', filter === 'messages');
    render();
  }
  
  filterAll.addEventListener('click', () => setActiveFilter('all'));
  filterChats.addEventListener('click', () => setActiveFilter('chats'));
  filterMessages.addEventListener('click', () => setActiveFilter('messages'));

  await updateSyncStatus();
  updateClearButton();
  await render();
});
