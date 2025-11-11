# Changelog

All notable changes to GPT Pinboard will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Under Review]

## [2.1.1] - 2025-11-11

### Changed
- **🎨 Floating Button UI**: Redesigned Pin Chat and Chat Outline buttons
  - Circular design (48x48px) for cleaner, more modern appearance
  - Icon-only buttons with custom tooltips on hover
  - Tooltips feature pointer arrows and perfect vertical alignment
  - Improved visual consistency with ChatGPT interface

### Removed
- **🔒 Unused Permission**: Removed `activeTab` permission from Chrome and Firefox manifests
  - Chrome Web Store compliance fix (Violation ID: Purple Potassium)
  - Extension only uses `storage`, `tabs`, and host permissions
  - Reduced permission footprint improves user trust and store compliance

### Fixed
- **📄 Privacy Documentation**: Updated PRIVACY.md to reflect current permissions

## [2.1.0] - 2025-11-09

### Added
- **🐛 Debug Logging System**: Comprehensive debug logging with persistent on/off toggle
  - 189+ console statements replaced with smart debug functions
  - Settings toggle in Advanced section (off by default)
  - Persistent across browser sessions and page reloads
  - Available in all extension components (popup, background, content script)
- **💾 Enhanced Delete All Confirmation**: Smart 3-button confirmation dialog
  - "Cancel" to abort deletion
  - "Export First" to backup pins before deleting
  - "Delete" to proceed with deletion
  - Automatic re-prompt after successful export
  - Prevents accidental data loss with backup suggestions
- **🎨 Consolidated Settings UI**: All toggles now grouped in single "General Settings" section
  - Streamlined interface with connected visual design
  - Rounded container with thin separator lines between options
  - Ultra-thin 3px scrollbar for better visual integration
  - Hidden tab behavior setting (not working yet)

### Improved
- **🏗️ Build Architecture**: Enhanced prepend-browser.js system
  - Browser-specific code injected at top of files for immediate availability
  - Eliminated dynamic import compatibility issues with service workers
  - Cleaner code organization with browser APIs available from start
- **🎛️ Settings Interface**: Better visual hierarchy and user experience
  - Settings grouped logically under single section header
  - Improved spacing and visual connections between related options
  - More compact and mobile-app-like appearance
- **⚙️ Cross-browser Compatibility**: Enhanced Firefox and Chrome support
  - Service worker compatibility through build-time code injection
  - Proper API availability without initialization race conditions

### Fixed
- **🔧 Service Worker Issues**: Resolved "import() is disallowed on ServiceWorkerGlobalScope" errors
- **🎯 Settings Persistence**: All settings now persist properly across browser sessions
- **🖼️ Icon Loading**: Fixed missing 16px icon references in manifests
- **📜 Scrollbar Positioning**: Thin scrollbar now properly contained within modal bounds

### Technical
- **📦 Build System**: New prepend-browser.js replaces append-browser.js for better code organization
- **🧹 Code Quality**: Replaced 189 console.log/error statements with debugLog/debugError system
- **🔒 Architecture**: Clean separation of browser-specific and common code
- **🎨 CSS Improvements**: Enhanced settings UI with proper container styling and custom scrollbars

## [2.0.1] - 2025-11-08

### Fixed
- **Dark Mode Default**: Extension now defaults to dark mode on first install for both Chrome and Firefox
- **Firefox Theme Persistence**: Fixed theme preference not persisting across browser restarts in Firefox
- **Browser API Compatibility**: Added compatibility shim for Firefox browser API in popup.js
- **Removed Development Permissions**: Cleaned up localhost permissions from production manifests
- **Security Improvements**: All innerHTML replaced with safe DOM manipulation methods for Firefox add-on compliance

### Changed
- Simplified manifest permissions by removing localhost development URLs
- Improved theme initialization logic to default to dark mode when no preference is set

## [2.0.0] - 2025-11-08

### Added
- **Pin Entire Chats**: Save complete ChatGPT conversations with context
  - Floating "Pin Chat" button in bottom-right of chat interface
  - Smart auto-fill: Chat name from sidebar title
  - Description pre-populated with first user prompt
  - Dedicated chat pin indicator in popup list
  - Full metadata support: name, tags (up to 3), and description

- **Chat Outline Navigation**: Navigate long conversations efficiently
  - Floating "Chat Outline" button in bottom-left of chat interface
  - Interactive outline panel showing all messages in conversation
  - Click any message to jump directly to it in the chat
  - Visual scroll indicator for current position
  - Smooth scrolling with message highlighting

- **Filter Tabs**: Organize pins by type
  - Three-tab system: All / Chats / Messages
  - Dynamic counters showing pin counts for each category
  - Instant filtering without page reload
  - Persistent filter state during session
  - Visual distinction between chat and message pins

### Changed
- **Enhanced Storage Schema**: Unified system for both pin types
  - New `type` field differentiating "chat" from "message" pins
  - Chat pins store: `chatId`, `chatTitle`, `firstUserMessage`
  - Message pins retain: `messageId`, `messageText`, `anchors`
  - Backward compatible with existing message pins

- **Improved UI/UX**: Better visual hierarchy and interactions
  - Floating buttons positioned for easy access without obstruction
  - Chat pins show conversation icon (💬) vs message pins (📌)
  - Filter tabs with clean, modern design
  - Enhanced pin cards with type-specific information display
  - Better responsive layout for different screen sizes

### Technical
- **New Content Script Functions**:
  - `getChatId()`: Extract unique chat identifier from URL
  - `getChatTitle()`: Get conversation name from sidebar
  - `getFirstUserMessage()`: Extract initial prompt for context
  - `createChatOutline()`: Generate interactive message navigation
  - Enhanced floating button system with improved positioning

- **Architecture Improvements**:
  - Separated browser-specific code for better performance
  - Chrome Build: Native `chrome.*` APIs (Manifest V3)
  - Firefox Build: Native `browser.*` APIs (Manifest V2)
  - Eliminated runtime detection overhead
  - Browser-specific files: `extension/chrome/*.js` and `extension/firefox/*.js`
  - Common resources: Shared HTML/CSS in `extension/common/`

### Fixed
- Button positioning with dynamic chat interface changes
- Filter state persistence across popup reopens
- Chat title extraction from various ChatGPT UI states
- Export/import compatibility with both pin types

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
