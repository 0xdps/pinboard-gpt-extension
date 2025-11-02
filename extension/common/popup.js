document.addEventListener('DOMContentLoaded', async () => {
  const listEl = document.getElementById('list');
  const search = document.getElementById('search');
  const clearSearchBtn = document.getElementById('clearSearch');
  const searchContainer = document.querySelector('.search-container');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');
  const syncText = document.getElementById('syncText');
  const syncToggle = document.getElementById('syncToggle');
  const themeText = document.getElementById('themeText');
  const themeToggle = document.getElementById('themeToggle');
  
  // Settings Modal Elements
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettings = document.getElementById('closeSettings');

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

  // Initialize theme on load
  await initializeTheme();

  // Settings Modal Handlers
  settingsBtn.onclick = () => {
    settingsModal.style.display = 'flex';
    updateSyncStatus(); // Refresh sync status when opening settings
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
      const status = await getSyncStatus();
      if (status) {
        // Update checkbox state
        syncToggle.checked = status.enabled;
        
        if (status.enabled) {
          syncText.textContent = `🔄 Syncing (${status.pinCount} pins, ${status.quotaUsed}% quota)`;
          syncText.style.color = status.canSync ? '#10a37f' : '#ff6b6b';
          if (!status.canSync) {
            syncText.textContent = `⚠️ Sync disabled (quota exceeded)`;
          }
        } else {
          syncText.textContent = '💾 Local storage only';
          syncText.style.color = '#666';
        }
      }
    } catch (err) {
      syncText.textContent = '💾 Local storage';
      syncToggle.checked = false;
    }
  }

  syncToggle.onchange = async () => {
    const shouldEnable = syncToggle.checked;
    
    try {
      await toggleSync(shouldEnable);
      await updateSyncStatus();
      await render();
    } catch (err) {
      // Revert toggle state on error
      syncToggle.checked = !shouldEnable;
      alert('Error toggling sync: ' + err.message);
    }
  };

  async function getPins() { 
    try {
      const pins = await idbGetAll();
      return pins;
    } catch (err) {
      return [];
    }
  }

  function escapeHtml(s){ return (s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

  function renderPin(pin) {
    // Clone the template
    const template = document.getElementById('pinTemplate');
    const pinElement = template.cloneNode(true);
    
    // Remove the template ID and make it visible
    pinElement.removeAttribute('id');
    pinElement.style.display = 'flex';
    
    // Get elements to populate
    const titleEl = pinElement.querySelector('.pin-title');
    const messageEl = pinElement.querySelector('.pin-message');
    const tagsEl = pinElement.querySelector('.pin-tags');
    const openBtn = pinElement.querySelector('.openBtn');
    const deleteBtn = pinElement.querySelector('.deleteBtn');
    const infoBtn = pinElement.querySelector('.infoBtn');
    
    // Populate content
    const messagePreview = pin.messageText.length > 150 
      ? escapeHtml(pin.messageText.slice(0, 150)) + '…' 
      : escapeHtml(pin.messageText);
    const title = pin.name ? escapeHtml(pin.name) : '';
    
    // Set title (hide if empty)
    if (title) {
      titleEl.textContent = title;
      titleEl.style.display = 'block';
    } else {
      titleEl.style.display = 'none';
    }
    
    // Set message
    messageEl.textContent = pin.messageText.length > 150 
      ? pin.messageText.slice(0, 150) + '…' 
      : pin.messageText;
    
    // Set tags using safe DOM manipulation
    if (pin.tags?.length) {
      // Clear existing tags safely
      while (tagsEl.firstChild) {
        tagsEl.removeChild(tagsEl.firstChild);
      }
      
      // Create tag elements safely
      pin.tags.forEach(tag => {
        const tagSpan = document.createElement('span');
        tagSpan.className = 'tag-link';
        tagSpan.setAttribute('data-tag', tag);
        tagSpan.textContent = tag;
        tagsEl.appendChild(tagSpan);
        
        // Add space between tags
        if (tag !== pin.tags[pin.tags.length - 1]) {
          tagsEl.appendChild(document.createTextNode(' '));
        }
      });
      
      tagsEl.style.display = 'flex';
    } else {
      tagsEl.style.display = 'none';
    }
    
    // Set button data and tooltip
    openBtn.setAttribute('data-id', pin.id);
    deleteBtn.setAttribute('data-id', pin.id);
    
    // Create custom tooltip for info button
    const dateTime = new Date(pin.pinnedAt).toLocaleString();
    infoBtn.setAttribute('data-tooltip', dateTime);
    
    return pinElement;
  }

  async function render() {
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
      
      // Regular search
      return (p.name && p.name.toLowerCase().includes(q))
          || (p.messageText && p.messageText.toLowerCase().includes(q))
          || (p.tags && p.tags.join(' ').toLowerCase().includes(q))
          || (p.site && p.site.toLowerCase().includes(q));
    }).sort((a,b)=>b.pinnedAt - a.pinnedAt);
    
    
    if (!filtered.length) {
      // Create empty state safely
      const emptyDiv = document.createElement('div');
      emptyDiv.style.cssText = 'color:#666;padding:20px;text-align:center;';
      
      const iconDiv = document.createElement('div');
      iconDiv.style.cssText = 'margin-bottom:12px;';
      
      const img = document.createElement('img');
      img.src = 'icons/icon-32.png';
      img.width = 32;
      img.height = 32;  
      img.style.opacity = '0.7';
      img.alt = 'GPT Pinboard';
      
      iconDiv.appendChild(img);
      emptyDiv.appendChild(iconDiv);
      emptyDiv.appendChild(document.createTextNode('No pins yet. Visit ChatGPT and click the "Pin Last Message" button!'));
      
      listEl.appendChild(emptyDiv);
      return; // Add return here to prevent further execution
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

    document.querySelectorAll('.deleteBtn').forEach(btn=>{
      btn.onclick = async (e)=> {
        const id = e.target.dataset.id;
        await idbDelete(id);
        await render();
      }
    });
    document.querySelectorAll('.openBtn').forEach(btn=>{
      btn.onclick = async (e)=> {
        const id = e.target.dataset.id;
        const stored = (await getPins()).find(x=>x.id===id);
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
          alert('No original page URL saved for this pin.');
        }
      }
    });
  }

  // Function to update clear button visibility
  function updateClearButton() {
    if (search.value.trim()) {
      searchContainer.classList.add('has-content');
    } else {
      searchContainer.classList.remove('has-content');
    }
  }

  // Clear search functionality
  clearSearchBtn.onclick = () => {
    search.value = '';
    updateClearButton();
    render();
  };

  search.addEventListener('input', () => {
    updateClearButton();
    render();
  });

  exportBtn.onclick = async () => {
    const pins = await getPins();
    const blob = new Blob([JSON.stringify(pins, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chat-pins.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  importBtn.onclick = () => importFile.click();
  importFile.onchange = async (ev) => {
    const f = ev.target.files[0];
    if (!f) return;
    const text = await f.text();
    try {
      const arr = JSON.parse(text);
      if (!Array.isArray(arr)) throw new Error('expected array');
      for (const p of arr) {
        p.id = p.id || crypto.randomUUID();
        await idbAdd(p);
      }
      await render();
      alert('Imported ' + arr.length + ' pins.');
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
  };

  await updateSyncStatus();
  updateClearButton();
  await render();
});
