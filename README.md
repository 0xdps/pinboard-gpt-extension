# GPT Pinboard — Pin the Messages That Matter

> Ever had a perfect ChatGPT answer, buried deep in a long chat? You remember what it said, maybe even which chat it was in — but scrolling through hundreds of messages to find it again is a nightmare. GPT Pinboard fixes that.

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-blue)](https://chromewebstore.google.com/detail/pingpt-%E2%80%94-chatgpt-message/hdhoaialemjelcfjjmjkkhkffiggbnap)
[![Firefox Add-ons](https://img.shields.io/badge/Firefox-Add--ons-orange)](https://addons.mozilla.org/en-US/firefox/addon/gpt-pinboard/)
[![Version](https://img.shields.io/badge/version-1.1.1-green)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Website](https://img.shields.io/badge/Website-Live-green)](https://gptpins.dps.codes)

## 📖 Table of Contents
- [✨ Features](#-features)
- [🚀 Quick Start](#-quick-start)
- [📖 Usage](#-usage)
- [🌐 Website & Deployment](#-website--deployment)
- [📈 Feedback System Setup](#-feedback-system-setup)
- [🛠️ Development](#️-development)
- [🔧 Technical Stack](#-technical-stack)
- [🆘 Support & Troubleshooting](#-support--troubleshooting)
- [📄 License](#-license)

## ✨ Features

- **Pin individual ChatGPT messages** - Not the entire chat, just the messages that matter
- **🏷️ Add custom names and tags** - Easy organization and categorization
- **🔍 Search instantly** - Filter by text, name, or tags
- **⚡ Jump back** - Instantly return to the original conversation
- **💾 Local-first** - Your data stays on your device. No accounts. No sync drama.
- **🌙 Dark mode support** - Automatic theme detection with seamless light/dark mode integration

No accounts. No sync drama. Just fast access to what you actually need.

## 🚀 Quick Start

### Install from Browser Stores

**Chrome:** [🚀 Install from Chrome Web Store](https://chromewebstore.google.com/detail/pingpt-%E2%80%94-chatgpt-message/hdhoaialemjelcfjjmjkkhkffiggbnap)

**Chrome:** [🔗 Install from Chrome Web Store](https://chromewebstore.google.com/detail/pingpt-%E2%80%94-chatgpt-message/hdhoaialemjelcfjjmjkkhkffiggbnap)

**Firefox:** [🦊 Install from Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/gpt-pinboard/)

One-click install with automatic updates for both browsers.

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

1. **Hover Method** - Move mouse over any message → Click "Pin" button
2. **Right-Click** - Select text → Right-click → "Pin selection to GPT Pinboard"
3. **Quick Pin** - Click the "Pin Message" button (bottom-right of ChatGPT)

### Manage Pins

- **View all pins** - Click extension icon in toolbar
- **Search** - Type in search box to filter by name, content, or tags
- **Jump to message** - Click "Open" to navigate and highlight
- **Export/Import** - Backup pins or sync across devices
- **Delete** - Click "Delete" to remove unwanted pins

## 🌐 Website & Deployment

Visit our official website: **[gptpins.dps.codes](https://gptpins.dps.codes)**

The website includes:
- Interactive feature showcase with browser detection
- Installation guides for Chrome and Firefox
- Usage tutorials and developer documentation
- User feedback collection system

### Deploy to Vercel

```bash
# Deploy to production
npm run deploy

# Preview deployment  
npm run deploy:preview

# Build website locally
npm run build:website

# Run website locally
npm run dev:website
# Visit: http://localhost:8080
```

### Website Features
- **Browser Detection**: Shows appropriate install button for user's browser
- **Responsive Design**: Works on desktop and mobile
- **Feedback System**: Collects user feedback via GitHub Issues
- **Progressive Enhancement**: Works with JavaScript disabled

## � Feedback System Setup

The website includes a comprehensive feedback system that collects user feedback via GitHub Issues.

### ⚡ Quick Setup (5 minutes)

#### 1. Create GitHub Token
```bash
# Open GitHub settings
open https://github.com/settings/personal-access-tokens/new

# Configure fine-grained token:
# - Name: GPT Pinboard Feedback
# - Repository: gpt-pinboard-extension (selected repositories only)
# - Permissions: Issues (Read and write), Metadata (Read)
```

#### 2. Add to Vercel
```bash
vercel env add GITHUB_TOKEN
# Paste your token when prompted
```

#### 3. Deploy & Test
```bash
npm run deploy
npm run feedback:test  # Test the setup
```

### Security Features
- **Rate Limiting**: 1 submission per 5 minutes per IP
- **Spam Protection**: Extension verification (form only shown to verified users), math CAPTCHA, honeypot fields, content validation
- **Origin Validation**: Only accepts requests from approved domains
- **Content Filtering**: Blocks common spam patterns and malicious content

### Feedback Management
```bash
npm run feedback:issues  # View all feedback issues
npm run feedback:logs    # Monitor submissions
npm run feedback:env     # Check environment setup
```

## 🛠️ Development

For detailed development instructions, see **[DEVELOPMENT.md](DEVELOPMENT.md)**.

### Quick Commands

```bash
npm install          # Install dependencies
npm run build        # Generate icons and assets
npm run dev:chrome   # Development build for Chrome
npm run dev:chrome   # Development build for Chrome
npm run dev:firefox  # Development build for Firefox
npm run dev:website  # Run website locally
npm run pack         # Package extension for stores
npm run release      # Build and package in one step

# Feedback system commands
npm run feedback:setup  # Setup feedback system
npm run feedback:test   # Test feedback system
npm run feedback:logs   # View feedback logs
```

### Quick Setup for Contributors

```bash
# 1. Clone repository
git clone https://github.com/0xdps/gpt-pinboard-extension.git
cd gpt-pinboard-extension

# 2. Install dependencies
npm install

# 3. Build extension
npm run build

# 4. Load in browser
# Chrome: Load build/chrome/ folder in chrome://extensions/
# Chrome: Load build/chrome/ folder in chrome://extensions/
# Firefox: Load build/firefox/ folder in about:debugging
```

See [DEVELOPMENT.md](DEVELOPMENT.md) for complete setup, testing, and contribution guidelines.

## 📚 Documentation

### Quick Navigation

| Task | Section | Purpose |
|------|---------|---------|
| **Install extension** | [Quick Start](#-quick-start) | Get started in 2 minutes |
| **Setup feedback system** | [Feedback System](#-feedback-system-setup) | Configure GitHub Issues integration |
| **Deploy website** | [Website & Deployment](#-website--deployment) | Deploy to Vercel |
| **Development** | [Development](#️-development) | Build, test, contribute |
| **Get help** | [Support](#-support--troubleshooting) | Troubleshooting guide |
| **Legal** | [PRIVACY.md](PRIVACY.md) | Privacy policy |
| **Changes** | [CHANGELOG.md](CHANGELOG.md) | Version history |

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

**Made with ❤️ by [Devendra Pratap Singh](https://github.com/0xdps)**

