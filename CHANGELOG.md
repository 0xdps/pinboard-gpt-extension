# Changelog

## 2025-10-20 - Debug Code Removal & CSP Fixes

### Fixed
- **CSP Violations**: Removed all debug code that was causing Content Security Policy violations
- **Input Visibility**: Fixed pin dialog form inputs not showing typed text by adding explicit color styling
- **Highlighting**: Changed from blinding yellow highlight to subtle green tint for better UX

### Removed
- All `console.log`, `console.error`, `console.warn`, and `console.debug` statements
- Debug script injection code that violated CSP
- `window.PinGPT_ContentDebug` and `window.PinGPT_CheckDB` debug objects
- Empty if/else blocks left after console removal

### Changed
- **Highlight Effect**: 
  - Old: Bright yellow (`#fffacd`) with harsh outline
  - New: Subtle green tint (`rgba(16, 163, 127, 0.08)`) with soft glow
  - Added smooth fade-in/fade-out animations
  - Better border radius for modern look

- **Pin Dialog Inputs**:
  - Added explicit `color: #202124` for text visibility
  - Added `background: white` to ensure contrast
  - Added `font-family` for consistent styling

### Technical Details
- Extension now fully CSP-compliant for Manifest V3
- Removed all dynamic script injection
- Cleaned up content script initialization
- No more inline script execution

### Files Modified
- `content_script_chatgpt.js` - Removed 24 console statements, fixed CSP violations, improved highlighting
- `popup.js` - Removed 9 console statements
- `background.js` - Removed 11 console statements  
- `idb.js` - Removed 4 console statements
- `manifest.json` - Added proper CSP configuration

### Migration Notes
- Extension should be reloaded from `chrome://extensions/`
- All ChatGPT pages should be refreshed after update
- No data migration needed - uses same Chrome Storage API
