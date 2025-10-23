# PinGPT — ChatGPT Message Pinner 📌

> Pin, organize, and instantly jump back to important ChatGPT messages. All data stored locally for complete privacy.

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-blue)](https://chrome.google.com/webstore)
[![Version](https://img.shields.io/badge/version-1.0.1-green)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## ✨ Features

- **📌 Pin Messages** - Hover, click, or right-click to pin any ChatGPT response
- **🏷️ Organize** - Add custom names and tags for easy categorization
- **🔍 Search** - Instantly filter pins by content, name, or tags
- **🎯 Jump Back** - Click to navigate and highlight the original message
- **💾 Export/Import** - Backup and restore your pins as JSON
- **🔒 Privacy First** - All data stored locally in IndexedDB, never sent anywhere

## 🚀 Quick Start

### Install from Chrome Web Store
Coming soon!

### Install from Source

```bash
# Clone repository
git clone https://github.com/devendrapratap02/pingpt-chrome-extension.git
cd pingpt-chrome-extension

# Install dependencies (for building icons/assets)
npm install

# Load in Chrome
# 1. Go to chrome://extensions/
# 2. Enable "Developer Mode"
# 3. Click "Load unpacked"
# 4. Select this folder
```

## 📖 Usage

### Pin a Message (3 Ways)

1. **Hover Method** - Move mouse over any message → Click "📌 Pin" button
2. **Right-Click** - Select text → Right-click → "Pin selection to PinGPT"
3. **Quick Pin** - Click the "📌 Pin Message" button (bottom-right of ChatGPT)

### Manage Pins

- **View all pins** - Click extension icon in toolbar
- **Search** - Type in search box to filter by name, content, or tags
- **Jump to message** - Click "Open" to navigate and highlight
- **Export/Import** - Backup pins or sync across devices
- **Delete** - Click "Delete" to remove unwanted pins

## 🛠️ Development

See [DEVELOPMENT.md](DEVELOPMENT.md) for:
- Setting up development environment
- Build commands and workflow
- Debugging tools and techniques
- Architecture overview
- Contributing guidelines

### Quick Commands

```bash
npm run build        # Generate icons and assets
npm run pack         # Package extension for Chrome Web Store
npm run release      # Build and package in one step
```

## 📚 Documentation

- **[SUPPORT.md](SUPPORT.md)** - Troubleshooting, FAQ, getting help
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Developer setup, debugging, contributing
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and updates
- **[RELEASE.md](RELEASE.md)** - Publishing guide and store listing copy
- **[PRIVACY.md](PRIVACY.md)** - Privacy policy and permissions

## 🎯 Use Cases

| User Type | Use Cases |
|-----------|-----------|
| **Developers** | Code snippets, debugging solutions, API examples |
| **Researchers** | Knowledge organization, insight tracking, topic categorization |
| **Students** | Study notes, homework help, exam preparation |
| **Writers** | Creative ideas, style guides, research references |

## 🔧 Technical Stack

- **Manifest V3** - Latest Chrome extension format
- **IndexedDB** - Local storage via custom wrapper
- **XPath + Text Anchors** - Dual message location system
- **CSP Compliant** - No eval(), no remote scripts

## 🤝 Contributing

Contributions welcome! See [DEVELOPMENT.md](DEVELOPMENT.md) for guidelines.

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🆘 Support

- 📧 **Email**: dps.manit@gmail.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/devendrapratap02/pingpt-chrome-extension/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/devendrapratap02/pingpt-chrome-extension/discussions)
- 📖 **Troubleshooting**: See [SUPPORT.md](SUPPORT.md)

## 🙏 Acknowledgments

Built for the ChatGPT community. Special thanks to all contributors and users providing feedback!

---

**Made with ❤️ by [Devendra Pratap Singh](https://github.com/devendrapratap02)**

## ✨ Features

- **📌 Pin Messages**: Hover over any ChatGPT message and click the pin button
- **🏷️ Organize**: Add custom names and tags to your pins
- **🔍 Search**: Quickly find pins by content, name, or tags
- **🎯 Jump Back**: Click to open and highlight the original pinned message
- **💾 Export/Import**: Backup and restore your pins
- **🔒 Privacy**: All data stored locally (IndexedDB)

## 🚀 Installation

### From Source (Developer Mode)

1. **Clone or download** this repository
   ```bash
   git clone https://github.com/devendrapratap02/pingpt-chrome-extension.git
   cd pingpt-chrome-extension
   ```

2. **Install dependencies** (for building icons/assets)
   ```bash
   npm install
   ```

3. **Build icons and assets** (optional, already included)
   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer Mode** (toggle in top-right corner)
   - Click **Load unpacked**
   - Select the `pingpt-chrome-extension` folder

5. **Start using!**
   - Visit [ChatGPT](https://chatgpt.com/)
   - You'll see a **"📌 Pin Message"** button in the bottom-right corner
   - Click it to pin any message, or hover over messages for more options

## 🛠️ Development

### Build Commands

```bash
# Generate icon files from SVG
npm run build:icons

# Generate promotional assets and screenshots
npm run build:assets

# Build everything (icons + assets)
npm run build

# Package extension for Chrome Web Store
npm run pack

# Build and package in one step
npm run release
```

### Package Structure

The `npm run pack` command creates a zip file named `pingpt-v{version}.zip` containing:
- Extension files (manifest, scripts, popup, styles)
- Icon images (16px, 48px, 128px, 256px, 512px)
- Ready for Chrome Web Store upload

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

