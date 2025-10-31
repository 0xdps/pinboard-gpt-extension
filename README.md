# GPT Pinboard — Pin the Messages That Matter 📌

> Ever had a perfect ChatGPT answer, buried deep in a long chat? You remember what it said, maybe even which chat it was in — but scrolling through hundreds of messages to find it again is a nightmare. GPT Pinboard fixes that.

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-blue)](https://chrome.google.com/webstore)
[![Version](https://img.shields.io/badge/version-1.0.1-green)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## ✨ Features

- **📌 Pin individual ChatGPT messages** - Not the entire chat, just the messages that matter
- **🏷️ Add custom names and tags** - Easy organization and categorization
- **🔍 Search instantly** - Filter by text, name, or tags
- **⚡ Jump back** - Instantly return to the original conversation
- **💾 Local-first** - Your data stays on your device. No accounts. No sync drama.

No accounts. No sync drama. Just fast access to what you actually need.

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
2. **Right-Click** - Select text → Right-click → "Pin selection to GPT Pinboard"
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

### Quick Navigation

| For... | Document | Purpose |
|--------|----------|---------|
| **Users** | [README.md](#) | Features, installation, usage guide |
| **Users** | [CHANGELOG.md](CHANGELOG.md) | Version history, what's new |
| **Developers** | [DEVELOPMENT.md](DEVELOPMENT.md) | Setup, debugging, architecture, contributing |
| **Publishers** | [RELEASE.md](RELEASE.md) | Chrome Web Store publishing guide |
| **Legal** | [PRIVACY.md](PRIVACY.md) | Privacy policy and permission justifications |

### I want to...
- **Install the extension** → [Quick Start](#-quick-start)
- **Fix a problem** → [Support & Troubleshooting](#-support--troubleshooting)
- **Learn features** → [Usage Guide](#-usage)
- **Contribute code** → [DEVELOPMENT.md](DEVELOPMENT.md#contributing)
- **Report a bug** → [GitHub Issues](https://github.com/devendrapratap02/pingpt-chrome-extension/issues)
- **Publish to store** → [RELEASE.md](RELEASE.md)

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

## 🆘 Support & Troubleshooting

### 📧 Contact & Support

- **Email**: dps.manit@gmail.com
- **GitHub Issues**: [Report a Bug](https://github.com/devendrapratap02/pingpt-chrome-extension/issues)
- **GitHub Discussions**: [Ask Questions](https://github.com/devendrapratap02/pingpt-chrome-extension/discussions)

### � Common Issues & Quick Fixes

**Pins not showing in popup?**
1. Go to `chrome://extensions/` → Find GPT Pinboard → Click refresh 🔄
2. Reload ChatGPT page (F5)
3. Try creating a new pin

**Pin button not appearing?**
1. Refresh ChatGPT page
2. Check extension is enabled at `chrome://extensions/`
3. Try right-click method: Select text → Right-click → "Pin selection to GPT Pinboard"

**Can't click "Open" button?**
1. Check popup blocker settings
2. Grant extension tab permissions
3. Verify conversation still exists

**Highlight not showing?**
- Wait a few seconds for page to load
- Scroll manually to find message
- Try with a newly created pin

### 💡 Pro Tips

- **Name your pins**: "Python async explanation" beats "response 1"
- **Use tags**: Organize with `python`, `important`, `todo`
- **Export regularly**: Backup your pins weekly
- **Date tags**: Add `2025-10` for time organization

For more help, check out our [GitHub Issues](https://github.com/devendrapratap02/pingpt-chrome-extension/issues) or email us directly.

## 🙏 Acknowledgments

Built for the ChatGPT community. Special thanks to all contributors and users providing feedback!

---

**Made with ❤️ by [Devendra Pratap Singh](https://github.com/devendrapratap02)**

