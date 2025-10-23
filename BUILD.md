# Multi-Browser Build Structure

This project now supports both **Chrome** and **Firefox** from a single codebase.

## 📁 Directory Structure

```
pingpt-extension/
├── src/
│   ├── common/          # Shared code (JS, HTML, CSS, icons)
│   ├── chrome/          # Chrome-specific manifest.json
│   └── firefox/         # Firefox-specific manifest.json
├── dist/                # Build output (gitignored)
│   ├── chrome/          # Chrome extension build
│   └── firefox/         # Firefox extension build
├── assets/              # Store promotional materials
└── docs/                # Documentation files
```

## 🛠️ Build Commands

### Development
```bash
# Build for Chrome
npm run build:chrome

# Build for Firefox
npm run build:firefox

# Build both
npm run build
```

### Testing Locally
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

### Packaging for Stores
```bash
# Package both browsers
npm run pack

# Package Chrome only
npm run pack:chrome

# Package Firefox only
npm run pack:firefox

# Build + Package
npm run release
```

## 🔄 Key Differences

### Chrome (Manifest V3)
- Uses `service_worker` for background
- Standard Chrome extension structure

### Firefox (Manifest V3)
- Uses `scripts` array for background
- Requires `browser_specific_settings.gecko.id`
- Minimum Firefox version: 109.0

## 📝 Making Changes

1. **Common code**: Edit files in `src/common/`
2. **Browser-specific**: Edit manifests in `src/chrome/` or `src/firefox/`
3. **Rebuild**: Run `npm run build`
4. **Test**: Load from `dist/chrome/` or `dist/firefox/`

All changes to shared code automatically apply to both browsers!
