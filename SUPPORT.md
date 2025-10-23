# Support & Troubleshooting

## 📧 Contact & Support

- **Email**: dps.manit@gmail.com
- **GitHub Issues**: [Report a Bug](https://github.com/devendrapratap02/pingpt-chrome-extension/issues)
- **GitHub Discussions**: [Ask Questions](https://github.com/devendrapratap02/pingpt-chrome-extension/discussions)

## 🆘 Common Issues

### Issue: Pins Not Showing in Popup

**Symptoms**: You pin messages but popup shows "No pins yet"

**Solutions**:
1. Refresh the extension:
   - Go to `chrome://extensions/`
   - Find PinGPT
   - Click the refresh icon 🔄
2. Reload ChatGPT page
3. Try creating a new pin
4. Check if pins are saved:
   - Open ChatGPT page
   - Press `F12` to open console
   - Type: `await PinGPT_Debug.getAllPins()`
   - If you see pins but popup is empty, it's a display issue

### Issue: Pin Button Not Appearing

**Symptoms**: No pin button shows when hovering over messages

**Solutions**:
1. Refresh the ChatGPT page (F5)
2. Check if extension is enabled:
   - Go to `chrome://extensions/`
   - Make sure PinGPT is toggled ON
3. Verify ChatGPT URL matches:
   - Must be `chatgpt.com/*` or `chat.openai.com/*`
4. Try the right-click method instead:
   - Select text → Right-click → "Pin selection to PinGPT"

### Issue: Can't Click Pin Button

**Symptoms**: Pin button appears but doesn't respond to clicks

**Solutions**:
1. Check if prompt dialogs are blocked:
   - Look for blocked popup notification in address bar
   - Allow popups for chatgpt.com
2. Try right-click method as alternative
3. Reload extension and ChatGPT page

### Issue: "Open" Button Doesn't Navigate

**Symptoms**: Clicking "Open" on a pin does nothing

**Solutions**:
1. Check popup blocker settings
2. Grant extension permission to open tabs
3. Manually copy the conversation URL and paste in browser
4. Check if conversation still exists (might be deleted)

### Issue: Highlight Not Showing

**Symptoms**: Extension opens conversation but doesn't highlight the message

**Possible Causes**:
- Message was edited/deleted
- ChatGPT UI structure changed
- Conversation is very long (still loading)

**Solutions**:
1. Wait a few seconds for page to fully load
2. Scroll manually to find the message
3. Try pinning a new message to test
4. Update to latest extension version

### Issue: Tags Not Saving

**Symptoms**: Tags entered but don't appear on pins

**Solutions**:
1. Use comma-separated format: `tag1, tag2, tag3`
2. Don't use special characters in tags
3. Check if tags show in export file
4. Re-save pin with tags

### Issue: Search Not Working

**Symptoms**: Search box doesn't filter pins

**Solutions**:
1. Reload popup (close and reopen)
2. Try exact text from pin
3. Search is case-insensitive, check spelling
4. Clear search box and try again

### Issue: Export File Empty

**Symptoms**: Exported JSON file has no pins

**Solutions**:
1. Check if pins exist in popup
2. Try exporting again
3. Open JSON file to verify format
4. Manually check IndexedDB (see Developer Tools below)

### Issue: Import Doesn't Work

**Symptoms**: Importing JSON file shows error or no pins appear

**Solutions**:
1. Verify JSON file format is correct
2. Check file was exported from PinGPT
3. Don't edit JSON manually (can corrupt data)
4. Try importing to fresh extension install

## 🔧 Advanced Troubleshooting

### Check IndexedDB Directly

1. Open ChatGPT page
2. Press `F12` (open DevTools)
3. Go to **Application** tab
4. Navigate: Storage → IndexedDB → `chat_pinner_db` → `pins`
5. View all stored pins
6. Click refresh icon to see latest data

### Clear All Data (Reset Extension)

⚠️ **Warning**: This deletes all pins permanently!

1. Open DevTools on ChatGPT page (F12)
2. Go to Application tab
3. Right-click `chat_pinner_db` → Delete database
4. Reload extension at `chrome://extensions/`
5. Reload ChatGPT page

### Check Console Errors

1. Open ChatGPT page
2. Press `F12`
3. Go to **Console** tab
4. Look for red error messages
5. Take screenshot and report to support

### Inspect Popup Console

1. Right-click PinGPT extension icon
2. Select **Inspect popup**
3. Check Console tab for errors
4. Look for messages about pin loading

## ❓ Frequently Asked Questions

### Can I sync pins across devices?
Not automatically. But you can:
1. Export pins from one device
2. Import on another device
3. Use cloud storage (Google Drive, Dropbox) to share the JSON file

### Are my pins stored in the cloud?
No. All pins are stored locally in your browser's IndexedDB. Nothing is sent to external servers.

### Can I use this with other AI chatbots?
Currently only ChatGPT is supported. We may add support for Claude, Gemini, etc. in future versions.

### How many pins can I save?
No hard limit, but browser storage quota applies (typically 10-50MB). Most users can save thousands of pins.

### Can I edit a pin after creating it?
Not currently. You'll need to:
1. Delete the old pin
2. Create a new pin with updated info
(Edit feature planned for future release)

### Does this work in Incognito mode?
Yes, but you need to:
1. Go to `chrome://extensions/`
2. Find PinGPT
3. Click "Details"
4. Enable "Allow in Incognito"

Note: Pins created in Incognito won't persist after closing.

### Can I share pins with others?
Yes:
1. Export your pins to JSON
2. Share the file
3. Recipient imports it into their PinGPT

### What happens if ChatGPT changes their UI?
The extension may stop working. We monitor ChatGPT changes and update the extension accordingly. Update to latest version if issues occur.

### Can I customize the highlight color?
Not currently through UI. Advanced users can modify `content_script_chatgpt.js` and change the highlight styling.

### Does this slow down ChatGPT?
No. The extension is lightweight and only activates when you interact with it.

## 🐛 Reporting Bugs

When reporting issues, please include:

1. **Extension version**: Check `chrome://extensions/`
2. **Browser version**: Chrome/Edge/Brave version number
3. **Steps to reproduce**: Exact steps that cause the issue
4. **Expected vs actual**: What should happen vs what happens
5. **Screenshots**: If applicable
6. **Console errors**: Press F12, copy any red errors

**Submit via**:
- GitHub Issues: [Create new issue](https://github.com/devendrapratap02/pingpt-chrome-extension/issues/new)
- Email: dps.manit@gmail.com

## 💡 Feature Requests

Have an idea? We'd love to hear it!

1. Check [existing feature requests](https://github.com/devendrapratap02/pingpt-chrome-extension/issues?q=label%3Aenhancement)
2. If new, [create a feature request](https://github.com/devendrapratap02/pingpt-chrome-extension/issues/new)
3. Describe the feature and use case
4. Explain why it would be valuable

## 🎓 Tutorials & Guides

### Getting Started (Video Tutorial)
Coming soon!

### Best Practices
1. **Name your pins descriptively**: "Python async/await explanation" beats "response 1"
2. **Use consistent tags**: Develop a tagging system early
3. **Export regularly**: Backup weekly if you pin often
4. **Organize by project**: Tag pins by project name
5. **Clean up old pins**: Delete pins you no longer need

### Power User Tips
- **Date tagging**: Add `2025-10` to organize by time
- **Priority tags**: Use `important`, `todo`, `reference`
- **Language tags**: `python`, `javascript`, `rust`
- **Topic tags**: `algorithms`, `databases`, `design-patterns`

## 📚 Additional Resources

- [Chrome Extension Guide](CHROME_WEB_STORE_GUIDE.md)
- [Development Guide](DEVELOPMENT.md)
- [Privacy Policy](PRIVACY.md)
- [Changelog](CHANGELOG.md)

## 🔄 Keeping Up to Date

### Check for Updates
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Update" button
4. Or install from Chrome Web Store (auto-updates)

### What's New
Check [CHANGELOG.md](CHANGELOG.md) for version history and new features.

---

**Still having issues?** 📧 Contact us at dps.manit@gmail.com
