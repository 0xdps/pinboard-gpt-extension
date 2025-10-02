# PinGPT — ChatGPT Message Pinner 📌

A Chrome extension to pin, organize, and quickly access important messages from your ChatGPT conversations.

## ✨ Features

- **📌 Pin Messages**: Hover over any ChatGPT message and click the pin button
- **🏷️ Organize**: Add custom names and tags to your pins
- **🔍 Search**: Quickly find pins by content, name, or tags
- **🎯 Jump Back**: Click to open and highlight the original pinned message
- **💾 Export/Import**: Backup and restore your pins
- **🔒 Privacy**: All data stored locally (IndexedDB)

## 🚀 Installation

### Developer Mode (Chrome/Edge/Brave)

1. **Clone or download** this repository
   ```bash
   git clone <repository-url>
   cd chat-pinner-extension
   ```

2. **Generate icons** (if not already present)
   ```bash
   cd icons
   python3 create_icons.py
   cd ..
   ```

3. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer Mode** (toggle in top-right corner)
   - Click **Load unpacked**
   - Select the `chat-pinner-extension` folder

4. **Start using!**
   - Visit [ChatGPT](https://chat.openai.com/)
   - You'll see a **"📌 Pin Message"** button in the bottom-right corner
   - Click it to pin any message, or hover over messages for more options

## 📖 How to Use

### Pin a Message (3 Easy Ways!)

**Method 1: Fixed Pin Button (Easiest!)**
- Look for the **"📌 Pin Message"** button in the bottom-right corner of ChatGPT
- Click it to pin the last assistant response
- Perfect for quick pinning!

**Method 2: Hover Method**
- Move your mouse over any ChatGPT message
- A floating **"📌 Pin"** button should appear in the top-right of the message
- Click it to pin that specific message

**Method 3: Right-Click Method**
- Select any text in a ChatGPT message
- Right-click → Choose **"Pin selection to PinGPT"**

After clicking any pin button:
1. Enter an optional name for the pin (or press Enter to skip)
2. Add optional tags, separated by commas (or press Enter to skip)
3. Done! Your message is pinned ✅

### View Your Pins
1. Click the PinGPT extension icon in your browser toolbar
2. See all your pinned messages
3. Use the search box to filter by content, names, or tags

### Return to Original Message
1. Open the PinGPT popup
2. Click the **"Open"** button on any pin
3. The extension will navigate to the conversation and highlight the message

### Export/Import Pins
- **Export**: Click "Export" button → Save JSON file
- **Import**: Click "Import" button → Select previously exported JSON file

## 🗂️ Project Structure

```
chat-pinner-extension/
├── manifest.json              # Extension configuration
├── background.js              # Background service worker
├── content_script_chatgpt.js  # Main content script (runs on ChatGPT)
├── idb.js                     # IndexedDB wrapper
├── popup.html                 # Extension popup UI
├── popup.js                   # Popup logic
├── styles.css                 # Popup styles
├── icons/                     # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   ├── icon.svg
│   └── create_icons.py        # Icon generator script
├── README.md                  # This file
├── FEATURES.md               # Detailed features & usage guide
└── .gitignore

```

## 🔧 Technical Details

- **Storage**: IndexedDB for local storage
- **Message Location**: XPath + fuzzy text matching
- **Permissions**: 
  - `storage` - Save pins locally
  - `contextMenus` - Right-click menu
  - `activeTab` - Access current tab
  - `scripting` - Inject content script
  - `tabs` - Open/switch tabs
- **Host Permissions**: `https://chat.openai.com/*`

## 🎯 Use Cases

- **Developers**: Save code snippets, debugging solutions, API examples
- **Researchers**: Build knowledge bases, organize insights by topic
- **Students**: Save study notes, organize by subject
- **Writers**: Keep creative ideas, style guidelines, research notes

See [FEATURES.md](FEATURES.md) for detailed usage guide and tips.

## 🛠️ Development

### Modify the Extension

1. Edit the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the PinGPT extension
4. Test your changes

### File Descriptions

- **`manifest.json`**: Extension metadata and permissions
- **`background.js`**: Handles context menus and tab management
- **`content_script_chatgpt.js`**: Runs on ChatGPT pages, handles pinning and highlighting
- **`idb.js`**: IndexedDB wrapper for storage operations
- **`popup.html/js`**: Extension popup interface
- **`styles.css`**: Popup styling

## 🐛 Known Issues

- If ChatGPT significantly changes their UI, the pin button might not appear correctly
- Very old conversations might have changed URLs, making pins harder to locate
- The extension only works on `chat.openai.com`

## 🚀 Future Enhancements

- [ ] Keyboard shortcuts
- [ ] Pin folders/categories  
- [ ] Color-coded tags
- [ ] Rich text notes
- [ ] Cloud sync option
- [ ] Support for other AI chat platforms

## 📄 License

MIT License - Feel free to use and modify!

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

---

**Enjoy pinning! 📌** If you find this useful, consider starring the repository!

