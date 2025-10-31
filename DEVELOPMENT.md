# Development Guide

## 🛠️ Setting Up Development Environment

### Prerequisites
- Node.js 16+ and npm
- Git
- Chrome/Chromium browser

### Installation

```bash
# Clone repository
git clone https://github.com/devendrapratap02/pingpt-chrome-extension.git
cd pingpt-chrome-extension

# Install dependencies
npm install

# Build icons and assets
npm run build
```

### Loading Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer Mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the project folder
5. Extension should now be loaded

### Multi-Browser Development

This project supports both **Chrome** and **Firefox** from a single codebase.

#### Directory Structure

```
gpt-pinboard-extension/
├── assets/                # Source images for icon generation
├── scripts/               # Build scripts and tools
│   └── generate-assets.js # Icon generation from PNG sources
├── extension/             # Extension source code
│   ├── common/          # Shared extension code (JS, HTML, CSS, icons)
│   ├── chrome/          # Chrome-specific manifest.json
│   └── firefox/         # Firefox-specific manifest.json
├── website/             # Static website for the extension
│   ├── index.html       # Main website page
│   ├── sitemap.xml      # XML sitemap for SEO
│   ├── sitemap.xsl      # XSL stylesheet for visual sitemap
│   ├── robots.txt       # Web crawler directives
│   ├── css/             # Website styles
│   ├── js/              # Website JavaScript
│   └── images/          # Website assets
├── dist/                # Build output (gitignored)
│   ├── chrome/          # Chrome extension build
│   └── firefox/         # Firefox extension build
├── assets/              # Store promotional materials
└── docs/                # Documentation files
```

#### Build Process

The build system automatically:
- Creates separate builds for Chrome and Firefox
- Copies all necessary files to `build/chrome/` and `build/firefox/`
- Handles manifest differences between browsers
- Packages extensions for distribution
- **Copies icons from `assets/icons/` to appropriate locations during build**

### Commands

```bash
npm run build        # Build both Chrome and Firefox versions
npm run dev:chrome   # Development build for Chrome  
npm run dev:firefox  # Development build for Firefox
npm run pack         # Create distribution ZIP files
npm run copy:icons   # Copy icons from assets/ to extension/ and website/
npm run clean        # Remove all generated files (keeps source assets)
```

### Asset Management

Icons and images are generated from source PNG files and automatically copied during builds:
- **Sources**: `assets/*.png` (version controlled - source images)
- **Generated**: `assets/icons/` (generated from sources, gitignored)
- **Extension**: `extension/common/icons/` (copied from generated, gitignored)
- **Website**: `website/images/` (copied from generated, gitignored)
- **Distribution**: `build/chrome/` and `build/firefox/` (build outputs, gitignored)

#### Icon Names (Generic)
- `icon.svg` - Main extension icon (675x675)
- `logo.svg` - Brand logo (150x75) 
- `icon-16.png`, `icon-32.png`, `icon-48.png`, `icon-128.png` - Extension manifest icons
- `favicon-16x16.png`, `favicon-32x32.png`, `favicon-48x48.png` - Website favicon variants
- `favicon.ico` - Website favicon (32x32)
- `demo-screenshot.svg` - Website demo image

#### Asset Generation
Assets are generated from source PNG files using:
```bash
npm run build:assets  # Generate all icons from source PNG files
```

#### Testing Locally

**Chrome:**
1. Run `npm run build:chrome`
2. Open `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist/chrome/` folder

**Firefox:**
1. Run `npm run build:firefox`
2. Open `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select any file in `dist/firefox/` folder

#### Browser Differences

**Chrome (Manifest V3)**
- Uses `service_worker` for background
- Standard Chrome extension structure

**Firefox (Manifest V3)**
- Uses `scripts` array for background
- Requires `browser_specific_settings.gecko.id`
- Minimum Firefox version: 109.0

#### Making Changes

1. **Extension code**: Edit files in `extension/common/`
2. **Browser-specific**: Edit manifests in `extension/chrome/` or `extension/firefox/`
3. **Website**: Edit files in `website/` directory
4. **Rebuild**: Run `npm run build` (for extension) or `npm run dev:website` (for website)
5. **Test**: Load from `dist/chrome/` or `dist/firefox/` for extension, visit localhost:8080 for website

All changes to shared extension code automatically apply to both browsers!

#### Website Development

The project now includes a static website in the `website/` directory.

**Running the website locally:**
```bash
# From project root
npm run dev:website

# Or manually
cd website
python3 -m http.server 8080
```

**Website structure:**
- `index.html` - Main single-page website
- `sitemap.xml` - XML sitemap for search engines
- `sitemap.xsl` - Visual stylesheet for sitemap
- `robots.txt` - Web crawler directives
- `css/styles.css` - Modern, responsive styles
- `js/main.js` - Interactive functionality
- `images/` - Website assets and icons

The website showcases the extension features, installation instructions, and usage guides in a professional, modern design with comprehensive SEO optimization.

## 🔍 Debugging

### Browser Console Debugging

The extension provides debug helpers accessible from ChatGPT pages:

```javascript
// Open ChatGPT and press F12, then run:

// Check all pins in database
await GPT_Pinboard_Debug.getAllPins()

// Add a test pin
await GPT_Pinboard_Debug.addTestPin()

// Check if DB functions are loaded
GPT_Pinboard_Debug.checkDB()

// Clear all pins (use with caution!)
await GPT_Pinboard_Debug.clearAllPins()
```

### Chrome DevTools Inspection

#### Application Tab (IndexedDB)
1. Open DevTools (`F12`)
2. Go to **Application** tab
3. Navigate: Storage → IndexedDB → `chat_pinner_db` → `pins`
4. View all stored pins
5. Refresh to see latest data

#### Popup Debugging
1. Right-click extension icon
2. Select **Inspect popup**
3. Check Console for errors
4. Look for initialization messages

### Common Issues

#### Pins Not Saving
**Check**: 
- Console errors when clicking pin button
- Run `GPT_Pinboard_Debug.checkDB()` to verify DB functions
- Ensure `idb.js` loads before content script

**Fix**:
- Reload extension at `chrome://extensions/`
- Refresh ChatGPT page
- Check manifest.json script order

#### Pin Button Not Appearing
**Check**:
- Content script loaded (check console)
- ChatGPT DOM structure hasn't changed
- No CSP violations in console

**Fix**:
- Inspect ChatGPT page source
- Update selectors if needed
- Check host_permissions in manifest

#### Highlight Not Working
**Check**:
- XPath and text anchor data stored in pin
- Message still exists in conversation
- No navigation errors in background script

**Fix**:
- Open pin object and verify `xpath` field
- Test with newly created pin
- Check background.js logs

## 📁 Project Structure

```
pingpt-chrome-extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (tab management)
├── content_script_chatgpt.js  # Main content script
├── idb.js                 # IndexedDB wrapper
├── popup.html/js/css      # Extension popup UI
├── icons/                 # Extension icons
│   ├── icon.svg          # Source SVG
│   ├── generate-icons.js # Icon builder
│   └── *.png             # Generated icons
├── assets/                # Store promotional images
│   ├── generate-assets.js
│   └── *.png
└── docs/
    ├── README.md
    ├── DEVELOPMENT.md
    ├── SUPPORT.md
    └── ...
```

## 🧪 Testing

### Manual Testing Checklist

#### Pin Creation
- [ ] Hover pin button appears
- [ ] Right-click context menu works
- [ ] Pin dialog accepts input
- [ ] Tags saved correctly
- [ ] Pin appears in popup

#### Pin Navigation
- [ ] Clicking "Open" navigates to conversation
- [ ] Message is highlighted correctly
- [ ] Scroll position is correct
- [ ] Works with existing open tab
- [ ] Works when creating new tab

#### Search & Filter
- [ ] Search by pin name
- [ ] Search by message text
- [ ] Search by tags
- [ ] Empty state shows correctly

#### Export/Import
- [ ] Export creates valid JSON
- [ ] Import loads all pins
- [ ] No duplicate pins created

### Browser Compatibility
Test on:
- Chrome (stable)
- Chrome (beta/dev)
- Edge
- Brave

## 🏗️ Architecture

### Components

#### Background Service Worker (`background.js`)
- Manages context menus
- Handles tab navigation for "Open" functionality
- Routes messages between popup and content scripts

#### Content Script (`content_script_chatgpt.js`)
- Injects pin buttons into ChatGPT UI
- Handles pin creation dialog
- Manages message highlighting
- Stores/retrieves pins via IndexedDB

#### Popup (`popup.html/js`)
- Lists all saved pins
- Provides search/filter functionality
- Export/import interface
- Sends navigation requests to background

#### Storage (`idb.js`)
- Wrapper around IndexedDB
- Promise-based API
- Handles pin CRUD operations

### Data Flow

```
User Action (Pin Button Click)
  ↓
Content Script (Create Pin Dialog)
  ↓
IndexedDB (Store Pin)
  ↓
Popup (Refresh Pin List)

User Action (Open Pin)
  ↓
Popup (Send Message to Background)
  ↓
Background (Navigate to URL)
  ↓
Content Script (Highlight Message)
```

## 🤝 Contributing

### Code Style
- Use consistent indentation (2 spaces)
- Add comments for complex logic
- Follow existing naming conventions
- No console.log in production code (CSP violation)

### Commit Messages
- Use conventional commits format
- Examples:
  - `feat: add tag autocomplete`
  - `fix: resolve highlight positioning issue`
  - `docs: update installation guide`
  - `chore: update dependencies`

### Pull Request Process
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Feature Development
1. Check existing issues/discussions
2. Propose feature in issue first
3. Wait for approval before major work
4. Include tests if applicable
5. Update documentation

## 📦 Building for Production

### Pre-release Checklist
- [ ] Update version in `manifest.json`
- [ ] Update `CHANGELOG.md`
- [ ] Test all core features
- [ ] Check CSP compliance (no console logs)
- [ ] Build fresh icons/assets
- [ ] Test on multiple browsers
- [ ] Create release notes

### Build Commands

```bash
# Clean build
npm run build

# Create package
npm run pack

# Full release build
npm run release
```

### Version Numbering
Follow semantic versioning:
- `MAJOR.MINOR.PATCH`
- Example: `1.2.3`
  - Major: Breaking changes
  - Minor: New features (backward compatible)
  - Patch: Bug fixes

## 🔐 Security

### Best Practices
- Never log sensitive data
- Validate all user inputs
- Use CSP-compliant code only
- No external script loading
- No eval() or Function()
- Sanitize HTML before insertion

### Permission Justification
Every permission must be:
1. Actively used in code
2. Necessary for core functionality
3. Documented in PRIVACY.md

## 📚 Resources

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration](https://developer.chrome.com/docs/extensions/migrating/)
- [CSP for Extensions](https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/#content-security-policy)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

## 🆘 Getting Help

- 📧 Email: dps.manit@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/devendrapratap02/pingpt-chrome-extension/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/devendrapratap02/pingpt-chrome-extension/discussions)
