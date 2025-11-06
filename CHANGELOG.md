# Changelog

All notable changes to GPT Pinboard will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **Architecture Overhaul**: Separated browser-specific code for better performance
  - **Chrome Build**: Uses native `chrome.*` APIs directly (Manifest V3)
  - **Firefox Build**: Uses native `browser.*` APIs directly (Manifest V2)
  - **Eliminated Runtime Detection**: No more `typeof chrome !== 'undefined'` checks
  - **Browser-Specific Files**: `extension/chrome/*.js` and `extension/firefox/*.js`
  - **Common Resources**: Shared HTML/CSS in `extension/common/`

### Improved  
- **Code Cleanliness**: Removed all backward compatibility layers
  - Direct API usage in each browser build (no runtime detection overhead)
  - Cleaner error handling without cross-browser edge cases  
  - Better performance from eliminating compatibility checks
  - Easier maintenance with clear separation of concerns

### Technical
- **Build System**: Updated to copy browser-specific JS files correctly
  - `npm run build:chrome` - Chrome-optimized build
  - `npm run build:firefox` - Firefox-optimized build  
  - `npm run build` - Both browsers
  - Proper manifest versions (V3 for Chrome, V2 for Firefox)

## [1.1.0] - 2025-10-23

### Added
- **Chrome Sync Support**: Pins now sync across Chrome devices on the same account
  - Automatic fallback to local storage when sync quota exceeded
  - Smart quota management (102,400 bytes total, 8,192 bytes per item)
  - Sync status indicator in popup showing quota usage
  - Toggle button to enable/disable sync with data migration
  - Visual indicators: 🔄 Syncing, 💾 Local storage, ⚠️ Quota exceeded

### Changed
- **Storage Optimization**: Reduced stored text from full paragraph to 120 characters maximum
  - `messageText` field truncated to 120 characters
  - `anchors.full` field reduced from 500 to 120 characters
  - Significantly improved storage efficiency for sync compatibility

### Documentation
- Merged CHROME_WEB_STORE_GUIDE.md and STORE_COPY.md into RELEASE.md
- Created DEVELOPMENT.md - comprehensive developer guide
- Created SUPPORT.md - user troubleshooting and FAQ
- Created DOCS.md - documentation navigation guide
- Removed FEATURES.md and DEBUG.md (content merged into other docs)
- Streamlined README.md with badges and cleaner structure

## [1.0.1] - 2025-10-23

### Fixed
- **Chrome Web Store Rejection**: Removed unused `scripting` permission (violation: Purple Potassium)
- Updated permission justifications in PRIVACY.md

### Changed
- Version bump from 1.0.0 to 1.0.1 for resubmission
- Updated developer email to dps.manit@gmail.com in manifest and documentation

### Documentation
- Reorganized documentation structure
- Added package.json scripts for building and packaging
- Updated README with development workflow

## [1.0.0] - 2025-10-21 - Initial Public Release

### Added
- **Donation Link**: Added "Buy me a coffee" support link to popup
- **Chrome Web Store Assets**: Generated promotional images and screenshots
  - Small promotional tile (440x280)
  - Marquee banner (1400x560)
  - 4 screenshots at 1280x800 and 640x400 resolutions
- **Publishing Documentation**:
  - CHROME_WEB_STORE_GUIDE.md - Complete publishing guide
  - STORE_COPY.md - Marketing copy for store listing
  - PRIVACY_JUSTIFICATIONS.md - Permission explanations
- **High-Quality Icons**: Generated HD PNG icons (16px to 512px)
  - Installed canvas and sharp npm packages for better rendering
  - Updated SVG with width/height attributes
  - 10x better quality than original icons

### Changed
- **CSS Refactoring**: Improved popup styles readability and organization
- **Icon Generation**: Upgraded from Python script to Node.js with canvas library
  - icon16.png: 139 bytes → 474 bytes (better quality)
  - icon48.png: 267 bytes → 1.8 KB (better quality)
  - icon128.png: 596 bytes → 5.3 KB (better quality)
  - icon256.png: 1.3 KB (new)
  - icon512.png: 3.4 KB → 29 KB (better quality)

### Removed
- Developer information from manifest.json for privacy compliance

## [0.5.0] - 2025-10-21

### Fixed
- **Message Selection Accuracy**: Improved element selection to only target `[data-message-author-role]` containers
- **Highlighting Issues**: Fixed whole-screen yellow highlighting
  - Changed from bright yellow to subtle green tint
  - Better targeting of specific messages instead of entire page
- **Scroll Positioning**: Changed scroll behavior from `block: 'center'` to `block: 'start'`
  - Message beginning now visible after navigation
  - More consistent scroll positioning

### Changed
- **Highlight Effect Refinement**:
  - Background: `rgba(16, 163, 127, 0.08)` (subtle green tint)
  - Box shadow: `0 2px 12px rgba(16, 163, 127, 0.2)` (soft glow)
  - Removed border that was causing layout shifts
  - Removed margin/padding to prevent content displacement
- **Popup Enhancements**:
  - Added debug button for storage inspection
  - Improved gap spacing in header

### Removed
- All `console.log`, `console.error`, `console.warn` statements (48 total) for CSP compliance
- Debug script injection code
- `window.PinGPT_ContentDebug` and helper objects
- Empty if/else blocks

## [0.5.0] - 2025-10-20 - CSP Compliance Release

### Fixed
- **CSP Violations**: Removed all debug code causing Content Security Policy violations
- **Input Visibility**: Fixed pin dialog form inputs not showing typed text
  - Added explicit `color: #202124`
  - Added `background: white`
  - Added `font-family` for consistent styling
- **Highlighting**: Changed from blinding yellow to subtle green tint

### Changed
- **Highlight Effect**: 
  - Old: Bright yellow (`#fffacd`) with harsh outline
  - New: Subtle green tint (`rgba(16, 163, 127, 0.08)`) with soft shadow
  - Added smooth fade-in/fade-out animations
  - Better border radius for modern look

### Removed
- All console statements from all files:
  - `content_script_chatgpt.js` - 24 statements
  - `popup.js` - 9 statements
  - `background.js` - 11 statements
  - `idb.js` - 4 statements
- Dynamic script injection code
- Debug window objects

### Technical
- Extension now fully CSP-compliant for Manifest V3
- Added proper CSP configuration in manifest.json
- No more inline script execution

## [0.5.0] - 2025-10-03 - Pin Button Refactor

### Changed
- **Pin Button Architecture**: Complete refactoring of pin button creation and initialization
  - Simplified button injection logic
  - Improved event handling
  - Better cleanup on page navigation
- **Message Container Detection**: Enhanced algorithm for finding ChatGPT message containers
- **Pin Dialog**: Improved styling and user experience
  - Better form layout
  - Clearer input prompts
  - Responsive design

### Technical
- Reduced code complexity in `content_script_chatgpt.js`
- Better separation of concerns
- Improved error handling

## [0.4.0] - 2025-10-03 - UI Enhancement Release

### Added
- **Enhanced Pin Dialog**: Redesigned pin creation interface
  - Modern, clean design
  - Better input validation
  - Improved tag input UX
- **Pin Button Design**: Updated visual appearance
  - Better hover states
  - More intuitive icon
  - Improved positioning

### Changed
- **Message Container Detection**: More robust algorithm for identifying ChatGPT messages
  - Works with different ChatGPT UI variations
  - Better handling of nested elements
  - Improved XPath generation

### Technical
- Major refactoring of `content_script_chatgpt.js` (425+ lines added)
- Improved DOM manipulation efficiency
- Better event delegation

## [0.3.0] - 2025-10-02 - Initial Development

### Added
- Core extension functionality
- Pin message feature (hover, right-click, quick pin)
- Local storage using IndexedDB
- Search and filter pins
- Export/Import functionality
- Jump to original message with highlighting
- Context menu integration
- Popup UI for managing pins

### Technical
- Manifest V3 architecture
- Background service worker
- Content script injection
- XPath + text anchor message location
- Chrome Storage API integration

---

## Development Notes

### Browser Compatibility
- Chrome 88+
- Edge 88+
- Brave (Chromium-based)

### Permission History
- **v1.0.1**: Removed `scripting` (unused, caused store rejection)
- **v0.5.0**: Added CSP configuration
- **v0.3.0**: Initial permissions - storage, contextMenus, activeTab, tabs, host_permissions

### Known Issues
- None currently reported

## Future Roadmap

### Planned Features
- [ ] Edit pins after creation
- [ ] Keyboard shortcuts (Ctrl+Shift+P to pin)
- [ ] Custom highlight colors
- [ ] Pin categories/folders
- [ ] Bulk operations (delete multiple pins)
- [ ] Dark mode for popup
- [ ] Pin sharing via QR code or link

### Under Consideration
- [ ] Support for Claude, Gemini, other AI chatbots
- [ ] Cloud sync option (opt-in)
- [ ] Browser sync across devices
- [ ] Collaborative pin collections

---

**Legend**:
- `Added` - New features
- `Changed` - Changes in existing functionality
- `Deprecated` - Soon-to-be removed features
- `Removed` - Removed features
- `Fixed` - Bug fixes
- `Security` - Security improvements
- `Documentation` - Documentation changes
- `Technical` - Technical/internal changes
