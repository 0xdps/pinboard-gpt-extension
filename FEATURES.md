# PinGPT Features & Usage Guide

## 🎯 Core Features

### 1. Pin Messages
**Three ways to pin:**
- **Hover Method**: Hover over any ChatGPT message → Click the "📌 Pin" button that appears
- **Right-Click Method**: Select text → Right-click → Choose "Pin selection to PinGPT"
- **Context Menu**: Available on any selected text in ChatGPT

### 2. Organize Your Pins
When pinning a message, you can:
- **Add a custom name** to easily identify the pin later
- **Add tags** (comma-separated) for categorization
- Example: `python, web-scraping, tutorial`

### 3. Search & Filter
- Open the extension popup (click the extension icon)
- Use the search box to filter by:
  - Pin names
  - Message content
  - Tags
  - Site name

### 4. Jump to Original Message
- Click the **"Open"** button on any pin
- Extension will:
  - Open the original ChatGPT conversation (or switch to existing tab)
  - Scroll to the pinned message
  - Highlight it with a yellow background and green outline

### 5. Import/Export
- **Export**: Backup all your pins to a JSON file
- **Import**: Restore pins from a backup file
- Useful for:
  - Syncing across devices
  - Creating backups
  - Sharing pin collections

## 💡 Use Cases

### For Developers
- Pin code snippets and explanations
- Save debugging solutions
- Bookmark API usage examples
- Keep track of architecture decisions

### For Researchers
- Save key insights and summaries
- Organize research by topic using tags
- Build a knowledge base from conversations
- Track important references

### For Writers
- Save creative ideas and outlines
- Pin style guidelines and examples
- Organize research by project
- Keep track of fact-checks

### For Students
- Save study notes and explanations
- Pin homework help and solutions
- Organize by subject using tags
- Build exam preparation materials

## 🔧 Technical Details

### Storage
- Uses **IndexedDB** for local storage
- No data sent to external servers
- All pins stored locally in your browser

### Message Matching
The extension uses two methods to relocate pinned messages:
1. **XPath**: Precise DOM path to the element
2. **Text Anchors**: Fuzzy matching using text snippets (fallback)

This dual approach ensures pins can be found even if ChatGPT's interface changes.

### Compatibility
- Works with ChatGPT (https://chat.openai.com/*)
- Chrome/Edge/Brave (Manifest V3)
- May need updates if ChatGPT significantly changes their UI

## 🎨 Keyboard Shortcuts (Future Enhancement)
Currently not implemented, but could add:
- `Ctrl+Shift+P` - Pin current message
- `Ctrl+Shift+O` - Open pins popup

## 🚀 Tips & Tricks

1. **Use descriptive names**: Makes searching much easier later
2. **Consistent tagging**: Develop a tagging system (e.g., `lang-python`, `topic-ml`)
3. **Regular exports**: Backup your pins weekly if you use them heavily
4. **Tag by project**: Use project names as tags to organize work-related pins
5. **Date tagging**: Add year/month tags for temporal organization (e.g., `2025-q4`)

## 🐛 Troubleshooting

### Pin button doesn't appear
- Refresh the ChatGPT page
- Check that the extension is enabled
- Make sure you're on chat.openai.com

### Can't find pinned message
- ChatGPT may have changed the conversation URL
- The message might be in a different conversation
- Try searching for the content in your ChatGPT history

### Pins disappeared
- Check if you're in the same browser profile
- Try importing from a backup if available
- IndexedDB data is tied to the browser profile

## 📝 Future Enhancements (Ideas)

- [ ] Keyboard shortcuts
- [ ] Pin folders/categories
- [ ] Color-coded tags
- [ ] Pin sharing via URL
- [ ] Cloud sync option
- [ ] Browser extension for other AI chat platforms
- [ ] Rich text notes on pins
- [ ] Pin versioning (track edits to conversations)
