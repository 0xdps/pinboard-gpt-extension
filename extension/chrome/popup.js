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
  const contextMenuToggle = document.getElementById('contextMenuToggle');
  
  // Settings Modal Elements
  const settingsBtn = document.getElementById('settingsBtn');
  const coffeeBtn = document.getElementById('coffeeBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettings = document.getElementById('closeSettings');
  const versionNumber = document.getElementById('versionNumber');

  // Initialize theme
  async function initializeTheme() {
    try {
      const { theme } = await chrome.storage.local.get(['theme']);
      const isDark = theme === 'dark';
      themeToggle.checked = isDark;
      document.body.classList.toggle('dark-mode', isDark);
      updateThemeText(isDark);
    } catch (err) {
      console.error('Error loading theme:', err);
    }
  }

  // Initialize context menu setting
  async function initializeContextMenu() {
    try {
      const { enableContextMenu } = await chrome.storage.local.get(['enableContextMenu']);
      // Default to false (disabled)
      contextMenuToggle.checked = enableContextMenu === true;
    } catch (err) {
      console.error('Error loading context menu setting:', err);
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
      console.error('Error saving theme:', err);
    }
  };

  // Context menu toggle handler
  contextMenuToggle.onchange = async () => {
    const enabled = contextMenuToggle.checked;
    
    try {
      await chrome.storage.local.set({ enableContextMenu: enabled });
      // Notify background script to update context menu
      chrome.runtime.sendMessage({ action: 'update-context-menu', enabled });
    } catch (err) {
      console.error('Error saving context menu setting:', err);
    }
  };

  // Load version from manifest
  function loadVersion() {
    const manifest = chrome.runtime.getManifest();
    if (versionNumber && manifest.version) {
      versionNumber.textContent = manifest.version;
    }
  }

  // Initialize theme and context menu on load
  await initializeTheme();
  await initializeContextMenu();
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
      chrome.runtime.sendMessage({ action: 'open-and-highlight', pin: stored }, (resp) => {
        if (chrome.runtime.lastError) {
          // Fallback: just open the URL
          chrome.tabs.create({ url: stored.pageUrl });
        } else {
          // Close popup after opening
          window.close();
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
      const okBtn = document.getElementById('confirmOK');
      
      titleEl.textContent = title;
      messageEl.textContent = message;
      modal.style.display = 'flex';
      
      function cleanup() {
        modal.style.display = 'none';
        cancelBtn.removeEventListener('click', handleCancel);
        okBtn.removeEventListener('click', handleOK);
      }
      
      function handleCancel() {
        cleanup();
        resolve(false);
      }
      
      function handleOK() {
        cleanup();
        resolve(true);
      }
      
      cancelBtn.addEventListener('click', handleCancel);
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
        showNotification('Pin deleted successfully', 'success');
      } catch (err) {
        showNotification('Failed to delete pin', 'error');
      }
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
    
    // Populate content with better text handling
    const title = pin.name ? escapeHtml(pin.name.trim()) : '';
    const messageLength = 200; // Increased length
    const messagePreview = pin.messageText.length > messageLength 
      ? pin.messageText.slice(0, messageLength).trim() + '…' 
      : pin.messageText;
    
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
      loadingDiv.innerHTML = '<div class="loading"></div> <span>Loading pins...</span>';
      listEl.appendChild(loadingDiv);
    }
    
    const pins = await getPins();
    const q = search.value.trim().toLowerCase();
    
    // Clear list safely
    while (listEl.firstChild) {
      listEl.removeChild(listEl.firstChild);
    }
    
    const filtered = pins.filter(p => {
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
      
      return b.pinnedAt - a.pinnedAt;
    });
    
    // Update search results counter
    updateSearchResults(filtered.length, pins.length, q);
    
    
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
        messageP.innerHTML = `No pins found for "<strong>${escapeHtml(q)}</strong>"`;
      } else {
        // No pins at all
        messageP.innerHTML = 'No pins yet!<br><br>Visit ChatGPT and click the pin button next to any message to save it here.';
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

  await updateSyncStatus();
  updateClearButton();
  await render();
});
