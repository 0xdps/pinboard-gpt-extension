# GPT Pinboard — Pin the Messages That Matter

> Ever had a perfect ChatGPT answer, buried deep in a long chat? You remember what it said, maybe even which chat it was in — but scrolling through hundreds of messages to find it again is a nightmare. GPT Pinboard fixes that.

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-blue)](https://chromewebstore.google.com/detail/pingpt-%E2%80%94-chatgpt-message/hdhoaialemjelcfjjmjkkhkffiggbnap)
[![Firefox Add-ons](https://img.shields.io/badge/Firefox-Add--ons-orange)](https://addons.mozilla.org/en-US/firefox/addon/gpt-pinboard/)
[![Version](https://img.shields.io/badge/version-2.0.1-green)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Website](https://img.shields.io/badge/Website-Live-green)](https://gptpins.dps.codes)
[![Supports](https://img.shields.io/badge/Supports-ChatGPT-10a37f)](https://chatgpt.com)
[![Coming Soon](https://img.shields.io/badge/Coming%20Soon-Claude%20%7C%20Gemini%20%7C%20Grok-purple)](https://github.com/0xdps/gpt-pinboard-extension/discussions)

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

### Current (ChatGPT Support)

- **Pin individual messages** - Save specific ChatGPT responses that matter
- **Pin entire chats** - Bookmark complete conversations for later reference
- **📋 Chat Outline navigation** - See your entire conversation structure and jump to any message instantly
- **🏷️ Custom names and tags** - Add up to 3 tags for easy organization
- **🔍 Instant search** - Filter by text, name, or tags across all pins
- **📦 Filter tabs** - Switch between all pins, chat pins, or message pins
- **⚡ Jump back** - Instantly return to the original conversation
- **💾 Local-first** - Your data stays on your device. No accounts. No sync drama.
- **🌙 Dark mode support** - Automatic theme detection with seamless integration

### 🚀 Coming Soon - Multi-Platform Support

We're expanding beyond ChatGPT to support all major AI assistants:

- **🤖 Claude** (Anthropic) - Pin conversations from Claude.ai
- **💎 Gemini** (Google) - Organize your Gemini chats
- **⚡ Grok** (xAI) - Save important Grok discussions
- **🔍 DeepSeek** - Manage DeepSeek AI conversations
- **And more!** - Let us know which AI platforms you'd like to see supported

> 📢 **Vote for your favorite AI platform** in our [GitHub Discussions](https://github.com/0xdps/gpt-pinboard-extension/discussions)!

No accounts. No sync drama. Just fast access to what you actually need.

## 🚀 Quick Start

### Install from Browser Stores

**Chrome:** [🚀 Install from Chrome Web Store](https://chromewebstore.google.com/detail/pingpt-%E2%80%94-chatgpt-message/hdhoaialemjelcfjjmjkkhkffiggbnap)

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

### Pin an Entire Chat

1. Click the **"Pin Chat"** button (bottom-right, below Chat Outline)
2. Name is auto-filled from sidebar
3. Description is pre-filled with your first prompt (editable)
4. Add up to 3 tags
5. Click "Pin Chat"

### Navigate Long Conversations

1. Click the **"Chat Outline"** button (bottom-right of ChatGPT)
2. See all messages in a scrollable list
3. Click any message to jump directly to it
4. Perfect for lengthy debugging sessions or tutorials

### Manage Pins

- **View all pins** - Click extension icon in toolbar
- **Filter pins** - Use tabs to view All / Chats / Messages
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
| **Developers** | Pin code snippets or entire debugging sessions; use Chat Outline to navigate complex technical discussions |
| **Researchers** | Pin specific insights or complete research conversations; organize with filter tabs |
| **Students** | Pin study notes or full tutorial conversations; use Chat Outline for lengthy learning sessions |
| **Writers** | Pin templates or entire brainstorming sessions; navigate long creative discussions easily |

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

