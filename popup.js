document.addEventListener('DOMContentLoaded', async () => {
  console.log('PinGPT popup loaded');
  const listEl = document.getElementById('list');
  const search = document.getElementById('search');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');

  async function getPins() { 
    try {
      const pins = await idbGetAll();
      console.log('Fetched pins from DB:', pins);
      return pins;
    } catch (err) {
      console.error('Error fetching pins:', err);
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
    console.log('Rendering pins...');
    const pins = await getPins();
    console.log('Total pins to render:', pins.length);
    console.log('Pin details:', pins);
    const q = search.value.trim().toLowerCase();
    listEl.innerHTML = '';
    const filtered = pins.filter(p => {
      if (!q) return true;
      return (p.name && p.name.toLowerCase().includes(q))
          || (p.messageText && p.messageText.toLowerCase().includes(q))
          || (p.tags && p.tags.join(' ').toLowerCase().includes(q))
          || (p.site && p.site.toLowerCase().includes(q));
    }).sort((a,b)=>b.pinnedAt - a.pinnedAt);
    
    console.log('Filtered pins:', filtered.length);
    
    if (!filtered.length) {
      listEl.innerHTML = '<div style="color:#666;padding:20px;text-align:center;">No pins yet. Visit ChatGPT and click the "📌 Pin Last Message" button!</div>';
      return; // Add return here to prevent further execution
    }
    
    filtered.forEach(p => {
      console.log('Rendering pin:', p.name || p.messageText.slice(0, 30));
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
              console.error('Error sending message:', chrome.runtime.lastError);
              // Fallback: just open the URL
              chrome.tabs.create({ url: stored.pageUrl });
            } else {
              console.log('Message sent successfully:', resp);
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

  await render();
});
