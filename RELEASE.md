# Release Guide

> **Purpose**: Complete guide for releasing PinGPT to the Chrome Web Store, including store listing copy and publishing steps.

## 📋 Store Listing Copy

Use these pre-written texts when filling out the Chrome Web Store listing form.

### Short Description (Single-Purpose)
```
Pin important ChatGPT messages, add notes, and jump back to them instantly.
```

### Detailed Description
```
📌 Never lose important ChatGPT conversations again!

PinGPT lets you pin, organize, and quickly access important messages from your ChatGPT conversations.

✨ KEY FEATURES:
• Pin any ChatGPT message with one click
• Add custom names and tags for easy organization
• Search pins by content, name, or tags
• Jump back to the original conversation instantly
• Export/Import your pins for backup
• 100% private - all data stored locally on your device

🎯 HOW IT WORKS:
1. While chatting with ChatGPT, click the "📌 Pin Message" button
2. Add a custom name and tags (optional)
3. Access your pins anytime from the extension popup
4. Click any pin to jump back to that conversation

🔒 PRIVACY FIRST:
• All pins stored locally using IndexedDB
• No data sent to external servers
• No tracking or analytics
• Your conversations stay private

Perfect for:
• Developers saving code snippets and solutions
• Researchers organizing information
• Writers collecting ideas and references
• Students keeping track of study materials
• Anyone who wants to remember important ChatGPT responses

Works with both chatgpt.com and chat.openai.com
```

### Category
- **Primary**: Productivity
- **Secondary**: Developer Tools

### Contact & Support
- **Email**: dps.manit@gmail.com
- **Website**: https://0xdps.xyz/pingpt
- **Privacy Policy**: https://0xdps.xyz/pingpt?model=privacy
- **Support**: https://0xdps.xyz/pingpt?model=support

---

## 🚀 Publishing Steps

### Prerequisites

- [ ] Chrome Web Store developer account ($5 one-time fee)
- [ ] Extension package built (`npm run pack`)
- [ ] All assets generated (icons, screenshots, promo images)
- [ ] Privacy justifications prepared (see PRIVACY.md)

### 1. Create Developer Account

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Sign in with your Google account
3. Pay the **one-time $5 developer registration fee**
4. Verify your email address
5. Complete account setup

### 2. Prepare Release Package

```bash
# Update version in manifest.json
# Current version: 1.0.1

# Build fresh icons and assets
npm run build

# Create release package
npm run pack
# Creates: pingpt-v1.0.1.zip

# Verify package contents
unzip -l pingpt-v1.0.1.zip
```

**Package should include**:
- `manifest.json`
- `background.js`
- `content_script_chatgpt.js`
- `idb.js`
- `popup.html`, `popup.js`, `styles.css`
- `icons/*.png` (16, 48, 128, 256, 512)

### 3. Upload Extension

1. Click **"New Item"** button in dashboard
2. Upload **pingpt-v1.0.1.zip**
3. Click **"Upload"**
4. Wait for upload to complete

### 4. Complete Store Listing

#### Product Details Tab

| Field | Value |
|-------|-------|
| **Name** | PinGPT — ChatGPT Message Pinner |
| **Short description** | See "Short Description" above |
| **Detailed description** | See "Detailed Description" above |
| **Category** | Productivity |
| **Language** | English (United States) |

#### Graphics Tab

**Required Graphics** (✅ = Already generated in `assets/`):

| Asset | Size | Status | Location |
|-------|------|--------|----------|
| Icon | 128x128 | ✅ | `icons/icon128.png` |
| Small tile | 440x280 | ✅ | `assets/promo-440x280.png` |
| Screenshot 1 | 1280x800 | ✅ | `assets/screenshot-pins-1280x800.png` |
| Screenshot 2 | 1280x800 | ✅ | `assets/screenshot-dialog-1280x800.png` |
| Screenshot 3 | 1280x800 | ✅ | `assets/screenshot-highlight-1280x800.png` |
| Screenshot 4 | 1280x800 | ✅ | `assets/screenshot-search-1280x800.png` |

**Optional** (recommended):
- **Marquee** (1400x560): ✅ `assets/marquee-1400x560.png`

#### Privacy Practices Tab

**Single Purpose Description**:
```
Pin important ChatGPT messages, add notes, and jump back to them instantly.
```

**Permission Justifications**:

Copy from [PRIVACY.md](PRIVACY.md):

- **activeTab**: Allows PinGPT to access the currently active ChatGPT tab to navigate and highlight messages when users click a pin.

- **contextMenus**: Enables right-click context menu to quickly pin selected text from ChatGPT conversations.

- **host permissions**: Required to interact with ChatGPT pages for pinning and highlighting functionality. Only works on chatgpt.com and chat.openai.com domains.

- **remote code**: PinGPT does not load or execute any remote code. All scripts are bundled with the extension.

- **storage**: Used to save user pins locally in IndexedDB. No data is transmitted off-device.

- **tabs**: Helps locate or open ChatGPT tabs when users navigate to pins.

**Data Use Certification**:
```
All pin data is stored locally in the browser and is not sent to any external servers. No analytics or remote tracking is used.
```

**Privacy Policy**: 
```
https://0xdps.xyz/pingpt/privacy
```

#### Distribution Tab

| Setting | Value |
|---------|-------|
| **Visibility** | Public |
| **Pricing** | Free |
| **Regions** | All regions |

### 5. Submit for Review

1. Review all information thoroughly
2. Check preview of store listing
3. Click **"Submit for Review"**
4. Wait for email confirmation

**Review Timeline**:
- Initial review: 1-3 business days
- Resubmissions: 1-2 business days
- Sometimes longer during peak periods

---

## 📊 After Publishing

### Monitor Extension

**Daily (First Week)**:
- [ ] Check reviews and respond promptly
- [ ] Monitor error reports in dashboard
- [ ] Track installation metrics

**Weekly**:
- [ ] Review user feedback
- [ ] Check for bug reports on GitHub
- [ ] Plan updates based on feedback

### Marketing Checklist

- [ ] Share on Twitter with #ChatGPT hashtag
- [ ] Post on Reddit (r/ChatGPT, r/chrome_extensions)
- [ ] Submit to Product Hunt
- [ ] Post on LinkedIn
- [ ] Write announcement blog post
- [ ] Share in ChatGPT Discord communities
- [ ] Create YouTube demo video

### Support Setup

- [ ] Set up GitHub Issues for bug reports
- [ ] Enable GitHub Discussions for questions
- [ ] Create FAQ based on common questions
- [ ] Set up email notifications for reviews

---

## 🔄 Publishing Updates

### Pre-Release Checklist

- [ ] Update version in `manifest.json` (follow semantic versioning)
- [ ] Update `CHANGELOG.md` with changes
- [ ] Test all features thoroughly
- [ ] Check CSP compliance (no console logs)
- [ ] Build fresh package (`npm run release`)
- [ ] Test package on clean Chrome install

### Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (x.0.0): Breaking changes, major UI overhaul
- **MINOR** (1.x.0): New features, backward compatible
- **PATCH** (1.0.x): Bug fixes, small improvements

Examples:
- Fix bug: `1.0.1` → `1.0.2`
- Add feature: `1.0.2` → `1.1.0`
- Breaking change: `1.1.0` → `2.0.0`

### Update Process

```bash
# 1. Update version in manifest.json
# Example: "version": "1.1.0"

# 2. Update CHANGELOG.md
# Add new section with changes

# 3. Build and package
npm run release

# 4. Upload to Chrome Web Store
# Go to dashboard → Select item → Upload new version

# 5. Submit for review
# Updates typically approved faster than initial submission

# 6. Tag release in Git
git tag -a v1.1.0 -m "Release version 1.1.0"
git push origin v1.1.0
```

---

## ⚠️ Important Guidelines

### Chrome Web Store Policies

- **No misleading functionality**: Extension must do what it says
- **No spam**: Don't ask for reviews or ratings in-app
- **No external code**: All code must be bundled (no remote scripts)
- **User data privacy**: Clearly explain all permissions
- **No keyword stuffing**: Use natural language in descriptions
- **Quality screenshots**: Show real functionality, no mockups

### Common Rejection Reasons

1. **Unused permissions** (e.g., requesting `scripting` but not using it)
2. **Misleading description** (claiming features not present)
3. **Poor quality screenshots** (blurry, fake UI, watermarks)
4. **Missing privacy policy** (required if collecting any data)
5. **CSP violations** (eval(), inline scripts, remote code)

### Appeal Process

If rejected:
1. Read rejection email carefully
2. Fix all listed violations
3. Update version number
4. Resubmit with changes explained
5. Usually faster review on resubmission

---

## 📝 Pre-Submission Checklist

Use this before every submission:

### Code Quality
- [ ] All features working correctly
- [ ] No console.log statements (CSP violation)
- [ ] No errors in browser console
- [ ] Tested on multiple Chrome versions
- [ ] Tested on Edge/Brave if claiming compatibility

### Permissions
- [ ] All permissions actively used in code
- [ ] Justification written for each permission
- [ ] No unused permissions requested
- [ ] Host permissions minimal and necessary

### Package
- [ ] Correct version number in manifest
- [ ] Package size reasonable (<10MB ideal)
- [ ] All required files included
- [ ] No development files (node_modules, .git, etc.)

### Listing
- [ ] Compelling store description
- [ ] High-quality screenshots (5 recommended)
- [ ] Professional promotional images
- [ ] Privacy policy URL provided
- [ ] Support email verified

### Testing
- [ ] Fresh install test on clean profile
- [ ] All three pinning methods work
- [ ] Search and filter functional
- [ ] Export/import working
- [ ] Navigation to pins working
- [ ] No errors in background console

---

## 🎯 Success Metrics

### Track These KPIs

- **Installations**: Target 1,000 in first month
- **Active users**: % of installs that remain active
- **Rating**: Maintain 4.5+ stars
- **Reviews**: Respond to all within 24 hours
- **Uninstall rate**: Keep below 10%

### Analytics (Privacy-Safe)

Consider adding opt-in analytics:
- Feature usage (which pin methods most used)
- Average pins per user
- Export/import usage
- No tracking of pin content (privacy)

---

## 🆘 Support

**Need help with publishing?**
- 📧 Email: dps.manit@gmail.com
- 📚 [Chrome Web Store Developer Support](https://support.google.com/chrome_webstore/)
- 📖 [Developer Program Policies](https://developer.chrome.com/docs/webstore/program-policies/)

---

**Ready to publish? Good luck with your launch! 🚀**
