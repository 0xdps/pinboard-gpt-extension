document.addEventListener('DOMContentLoaded', async () => {
  const listEl = document.getElementById('list');
  const search = document.getElementById('search');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');
  const syncText = document.getElementById('syncText');
  const syncToggle = document.getElementById('syncToggle');
  
  // Settings Modal Elements
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettings = document.getElementById('closeSettings');

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
    const div = document.createElement('div');
    div.className = 'pin';
    const messagePreview = pin.messageText.length > 100 
      ? escapeHtml(pin.messageText.slice(0, 100)) + '…' 
      : escapeHtml(pin.messageText);
    const title = pin.name ? escapeHtml(pin.name) : (escapeHtml(pin.messageText.slice(0, 60)) + (pin.messageText.length > 60 ? '…' : ''));
    
    div.innerHTML = `
      <div style="font-weight:600">${title}</div>
      <div style="color:#555; margin-top:6px; font-size:13px;">${messagePreview}</div>
      <div class="meta">${new Date(pin.pinnedAt).toLocaleString()} • ${pin.site} ${pin.tags?.length ? ' • ' + pin.tags.join(', '):''}</div>
      <div class="actions">
        <button data-id="${pin.id}" class="openBtn">Open</button>
        <button data-id="${pin.id}" class="deleteBtn">Delete</button>
      </div>
    `;
    return div;
  }

  async function render() {
    const pins = await getPins();
    const q = search.value.trim().toLowerCase();
    listEl.innerHTML = '';
    const filtered = pins.filter(p => {
      if (!q) return true;
      return (p.name && p.name.toLowerCase().includes(q))
          || (p.messageText && p.messageText.toLowerCase().includes(q))
          || (p.tags && p.tags.join(' ').toLowerCase().includes(q))
          || (p.site && p.site.toLowerCase().includes(q));
    }).sort((a,b)=>b.pinnedAt - a.pinnedAt);
    
    
    if (!filtered.length) {
      listEl.innerHTML = `
        <div style="color:#666;padding:20px;text-align:center;">
          <div style="margin-bottom:12px;">
            <img src="PinGPT-Icon.svg" width="32" height="32" style="opacity:0.7;" alt="PinGPT"/>
          </div>
          No pins yet. Visit ChatGPT and click the "Pin Last Message" button!
        </div>
      `;
      return; // Add return here to prevent further execution
    }
    
    filtered.forEach(p => {
      const el = renderPin(p);
      listEl.appendChild(el);
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

  search.addEventListener('input', render);

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
  await render();
});
