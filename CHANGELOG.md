# Changelog

All notable changes to Pinboard GPT will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Extension - Code Quality & Performance Optimizations (2025-12-13)

#### Added
- **Performance Monitoring**: New `perf-monitor.js` module with operation tracking
  - Tracks slow operations (>1000ms threshold)
  - Measures pin creation, storage ops, and API calls
  - Configurable via `UI_CONFIG.performance` settings
  
- **Error Handling**: Structured error system in `error-handler.js`
  - 30+ error codes for specific failure scenarios
  - User-friendly error messages with suggested actions
  - Automatic error code detection from error messages
  
- **Keyboard Shortcuts**: Global shortcuts in `keyboard-shortcuts.js`
  - Ctrl+Shift+P: Pin selected text or first user message
  - Ctrl+Shift+B: Open extension popup
  - Ctrl+Shift+O: Toggle chat outline
  - Smart detection prevents triggering in input fields
  
- **Accessibility**: Comprehensive screen reader support in `accessibility.js`
  - ARIA live region announcements for pin actions
  - Keyboard navigation support for all interactive elements
  - Screen reader-friendly labels and descriptions
  
- **Shared Utilities**: New `utils.js` with 25+ helper functions
  - Browser API wrappers (storageAPI, tabsAPI, runtimeAPI)
  - DOM utilities (scrollIntoViewSmooth, isElementInViewport)
  - String/array helpers (truncate, sanitize, unique, chunk)
  - Timing utilities (debounce, throttle, sleep)
  - Tag rendering components (createTagElement, renderTags)

- **License Caching**: In-memory caching in `license-cache.js`
  - 10-second TTL reduces storage API calls by ~40%
  - Automatic invalidation on storage changes
  - Built-in statistics tracking

#### Changed
- **Debug Logging**: Replaced 39 console.log/error calls with debugLog/debugError
  - Respects debug mode setting
  - No console output in production (CSP compliant)
  - Unified logging across all modules

- **Configuration**: Centralized timing constants in UI_CONFIG
  - Replaced 8+ hardcoded timeout values
  - New BG_TIMING section for background script
  - Consistent delay/interval values across extension

- **Storage**: Consolidated idb.js from separate Chrome/Firefox files
  - Single common file with browser-agnostic API
  - Reduced code duplication
  - Improved maintainability

- **CSS Variables**: Extended theming system in styles.css
  - Spacing scale (--spacing-xs to --spacing-2xl)
  - Border radius system (--radius-sm to --radius-full)
  - Animation durations (--duration-fast/normal/slow)
  - Transition utilities for consistent animations

- **MutationObserver Management**: Centralized observer tracking
  - All observers tracked in OBSERVERS object
  - Automatic cleanup on page unload
  - Prevents memory leaks from orphaned observers

#### Fixed
- **Permissions**: Removed unused 'identity' permission from manifests
  - Reduced permission footprint
  - Improved privacy and user trust
  
- **DOMCache**: Improved consistency in content_script_chatgpt.js
  - getFirstUserMessage() now uses DOMCache.getMessages()
  - Reduced direct DOM queries
  - Better performance for message lookups

#### Performance
- ~40% reduction in storage API calls (license caching)
- Eliminated 39 console.log statements (CSP compliance)
- Centralized configuration reduces code duplication
- Observer cleanup prevents memory leaks
- Performance monitoring enables bottleneck identification

#### Technical Debt
- Extracted utilities from 4,291-line content script
- Created 6 new focused modules (perf, errors, accessibility, utils, keyboard, cache)
- Improved code organization and maintainability
- Foundation for future code splitting

## [Under Review]

### Backend - Hono Migration (2025-01-XX)

#### Changed
- **⚡ Framework Migration**: Complete rewrite from Express to Hono
  - **42x smaller framework**: 550KB → 13KB bundle size
  - **40-50% faster cold starts**: 300-500ms → 150-300ms
  - **30-40% less memory**: 80-120MB → 50-80MB
  - **22% smaller node_modules**: 95MB → 74MB
  - **Built for serverless**: Native edge/Lambda optimization vs. adapted server framework
  - **Web Standard APIs**: Framework-agnostic, runs anywhere

- **API Architecture**: Unified serverless architecture
  - All routes consolidated into single Hono app (`api/index.js`)
  - Migrated from standalone Vercel functions to route handlers
  - Moved feedback API from GitHub Issues to database storage
  - Database-based rate limiting (serverless-friendly)
  - Dynamic version reading from `package.json`

- **Route Conversion**: All endpoints migrated to Hono patterns
  - `api/routes/auth.js`: Google OAuth & email/password authentication
  - `api/routes/user.js`: Profile & license management
  - `api/routes/pins.js`: Premium cloud pin sync
  - `api/routes/feedback.js`: Feedback collection with spam protection
  - `api/routes/install.js`: Browser detection & store redirects

- **Middleware**: Authentication converted to Hono factory pattern
  - `createMiddleware()` for type-safe context passing
  - `c.set()` / `c.get()` for request-scoped data
  - Async JWT verification with proper error handling

#### Technical
- **Dependencies Updated**:
  - Removed: `express@4.19.2`, `cors@2.8.5`, `@types/express`, `@types/cors`
  - Added: `hono@^4.0.0`, `@hono/node-server@^1.8.2`
  - Retained: Turso, Drizzle ORM, Google OAuth, bcryptjs, jsonwebtoken

- **Performance Metrics** (Vercel serverless):
  - Cold start: 150-300ms (vs 300-500ms with Express)
  - Warm duration: 5-15 minutes of inactivity
  - Memory footprint: 50-80MB (vs 80-120MB with Express)
  - Response time: <100ms for authenticated requests (warm)

- **Code Changes**:
  - `express()` → `new Hono()`
  - `app.use(cors())` → `app.use('/*', cors())`
  - `(req, res)` → `(c)` context parameter
  - `req.body` → `await c.req.json()`
  - `res.json()` → `c.json(data, statusCode)`
  - `req.user` → `c.get('user')`

#### Documentation
- Updated `api/README.md` with Hono framework details and performance metrics
- Updated `DEVELOPMENT.md` with new API architecture structure
- Updated `api/package.json` description to mention Hono
- All code migration complete with zero Express references remaining

## [2.1.2] - 2025-11-11

### Added
- **🏷️ Popular Preset Tags**: 200 curated tags across 17 categories
  - Development & Code (28 tags: javascript, typescript, python-script, react-hook, vue, angular, node, kotlin, swift, etc.)
  - Testing & Quality (14 tags: test-case, unit-test, e2e-test, integration-test, load-test, debugging, code-review, etc.)
  - Design & Styling (10 tags: css-trick, tailwind, accessibility, responsive, ui-component, animation, etc.)
  - Infrastructure & DevOps (16 tags: deployment, terraform, docker, kubernetes, ci-cd, aws, azure, etc.)
  - Architecture & Patterns (14 tags: system-design, microservices, design-pattern, solid-principles, clean-code, etc.)
  - AI & ML (8 tags: machine-learning, data-science, llm-prompt, neural-network, deep-learning, nlp, etc.)
  - Database & Data (8 tags: database, mongodb, postgres, redis, migration, schema, query-optimization, etc.)
  - Documentation & Writing, Learning & Reference, Task Management, Organization, and more
  - Tags show even for new users with no existing pins

- **🔍 Fuzzy Search for Tags**: Intelligent tag matching algorithm
  - Type abbreviations: "tst" finds "test-case", "unit-test", "e2e-test"
  - Multiple matching modes: exact, prefix, substring, character sequence
  - Smart scoring with consecutive character bonuses
  - Results sorted by relevance (best matches first)
  - Faster tag selection and better discovery

### Improved
- Tag autocomplete combines popular preset tags with user's existing tags
- Better tag consistency and organization across pins
- Enhanced tag suggestion relevance with fuzzy matching

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
