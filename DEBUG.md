# PinGPT Debugging Guide

## 🔍 How to Check if Pins are Being Stored

### Method 1: Browser Console (Easiest!)

1. **Open ChatGPT** (https://chatgpt.com)
2. **Open Browser Console**: Press `F12` or `Ctrl+Shift+J` (Mac: `Cmd+Option+J`)
3. **Run these commands**:

```javascript
// Check all pins in database
await PinGPT_Debug.getAllPins()

// Add a test pin
await PinGPT_Debug.addTestPin()

// Check if DB functions are loaded
PinGPT_Debug.checkDB()

// Clear all pins (use with caution!)
await PinGPT_Debug.clearAllPins()
```

### Method 2: Chrome DevTools Application Tab

1. **Open DevTools**: Press `F12`
2. **Go to "Application" tab**
3. **Navigate**: Storage → IndexedDB → chat_pinner_db → pins
4. **View all pins**: You should see your pinned messages here
5. **Refresh**: Click the refresh icon to see latest data

### Method 3: Popup Console

1. **Right-click the PinGPT extension icon**
2. **Select "Inspect popup"**
3. **Check the Console tab**
4. Look for messages like:
   - `"PinGPT popup loaded"`
   - `"Fetched pins from DB: [...]"`
   - `"Total pins to render: X"`

## 🐛 Common Issues & Solutions

### Issue 1: Pins not showing in popup

**Symptoms**: You pin messages but popup shows "No pins yet"

**Debug steps**:
1. Open ChatGPT and press F12
2. Run: `await PinGPT_Debug.getAllPins()`
3. Check the output:
   - **If you see pins**: The issue is with the popup rendering
   - **If empty array `[]`**: Pins are not being saved

**Solutions**:
- If pins exist but don't show: Reload the extension
- If pins don't exist: Check console for errors when pinning
- Try using `PinGPT_Debug.addTestPin()` to add a test pin

### Issue 2: idbAdd is not defined

**Symptoms**: Console error: "idbAdd is not a function"

**Debug steps**:
1. Run: `PinGPT_Debug.checkDB()`
2. Check if all functions show as "function"

**Solutions**:
- Reload the extension at `chrome://extensions/`
- Make sure `idb.js` is in the extension folder
- Check manifest.json loads scripts in correct order

### Issue 3: Pin button not working

**Symptoms**: Clicking pin button does nothing

**Debug steps**:
1. Check console for errors when clicking
2. Look for: "Pin saved successfully:" message
3. Run: `await PinGPT_Debug.getAllPins()` to verify

**Solutions**:
- Check if prompt dialogs appeared (might be behind window)
- Make sure you didn't cancel the prompt
- Try adding a test pin via console

### Issue 4: Database permission errors

**Symptoms**: Errors about IndexedDB being blocked

**Solutions**:
1. Check browser settings allow IndexedDB
2. Not in Incognito mode (or enable extension in Incognito)
3. Clear browser cache and reload extension

## 📊 Manual Database Inspection

### Quick Test Commands

```javascript
// On ChatGPT page, in console:

// 1. Check if extension loaded
console.log('Extension loaded:', typeof PinGPT_Debug !== 'undefined');

// 2. Add a manual pin
const testPin = {
  id: crypto.randomUUID(),
  messageText: 'Manual test pin',
  name: 'Test',
  tags: ['test'],
  pageUrl: window.location.href,
  site: 'ChatGPT',
  pinnedAt: Date.now()
};
await idbAdd(testPin);
console.log('Added:', testPin);

// 3. Verify it was saved
const allPins = await idbGetAll();
console.log('Total pins:', allPins.length);
console.log('Last pin:', allPins[allPins.length - 1]);

// 4. Open popup and check if it appears
// Click extension icon to open popup
```

## 🔧 Reset Everything

If things are completely broken:

```javascript
// In ChatGPT console:
await PinGPT_Debug.clearAllPins()
```

Or manually:
1. F12 → Application → IndexedDB
2. Right-click "chat_pinner_db"
3. Delete database
4. Reload extension
5. Refresh ChatGPT page

## 📝 Expected Console Output

When everything works correctly, you should see:

**On ChatGPT page load:**
```
PinGPT content script loaded on: https://chatgpt.com/...
PinGPT: idbAdd function available: true
PinGPT: idbGetAll function available: true
PinGPT Debug tools available! Use these commands in console:
  PinGPT_Debug.getAllPins() - View all pins
  ...
PinGPT: Manual pin button added
```

**When clicking Pin button:**
```
Pin saved successfully: {id: "...", messageText: "...", ...}
```

**When opening popup:**
```
PinGPT popup loaded
Fetched pins from DB: [{...}, {...}]
Total pins to render: 2
Filtered pins: 2
```

## 🆘 Still Not Working?

1. Check extension is enabled at `chrome://extensions/`
2. Verify extension has permissions for chatgpt.com
3. Try in a regular (non-incognito) window first
4. Check for browser console errors (red text)
5. Reload extension and hard refresh ChatGPT (Ctrl+Shift+R)
