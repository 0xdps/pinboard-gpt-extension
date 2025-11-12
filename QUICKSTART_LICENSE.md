# Quick Start Guide - License System

## Test the License System

### 1. Generate Test Keys

```bash
# Generate 2 Pro keys for testing
node scripts/generate-license-keys.js pro 2
```

You'll get output like:
```
PINGPT-PRO-ABC123-XYZ789
PINGPT-PRO-DEF456-UVW012
```

### 2. Test Key Activation

1. **Load extension** in Chrome (`build/chrome`)
2. **Open extension popup**
3. **Click Settings ⚙️**
4. **Find "License" section**
5. **Enter a key**: `PINGPT-PRO-ABC123-XYZ789`
6. **Click "Activate License"**
7. **See success message** ✅
8. **Try the same key again** → Should fail (already used)

### 3. Test Complementary Access (Beta Testers)

```bash
# Run the complementary access tool
node scripts/grant-complementary.js
```

Follow prompts:
- Type: `1` (Pro)
- Duration: `1` (30 days)
- Reason: `Testing`

Copy the generated code, then:

1. **Open extension popup**
2. **Press F12** (Developer Console)
3. **Paste the code** and press Enter
4. **See confirmation** ✅
5. **Check Settings** → Shows "Complementary access"

### 4. Test Expiry (Fast Forward)

To test expiry quickly, modify the code to use 1 minute:

```javascript
// In grant-complementary.js output, change:
const expiryDate = Date.now() + (60 * 1000); // 1 minute instead of 30 days
```

Wait 1 minute, reload popup, and it should revert to Free.

---

## Real Usage Examples

### For Paying Customers

After payment via Gumroad/Stripe:

1. **Generate key**: `node scripts/generate-license-keys.js pro 1`
2. **Email to customer**:
   ```
   Thank you for purchasing Pinboard GPT Pro!
   
   Your license key: PINGPT-PRO-ABC123-XYZ789
   
   To activate:
   1. Open the extension
   2. Click Settings ⚙️
   3. Enter your key in the License section
   4. Click Activate
   
   Enjoy unlimited pins!
   ```

### For Beta Testers

1. **Run**: `node scripts/grant-complementary.js`
2. **Select**: Pro, 30 days, "Beta tester - John"
3. **Send them**:
   ```
   Hi John,
   
   Thanks for beta testing! Here's how to get Pro access:
   
   1. Install extension from [link]
   2. Open the popup
   3. Press F12 to open console
   4. Paste this code:
   
   [generated code]
   
   5. Press Enter
   
   You'll have Pro access for 30 days!
   ```

### For Friends & Family

Same as beta testers, but use 3650 days (10 years):

```bash
node scripts/grant-complementary.js
# Type: 1 (Pro)
# Duration: 4 (10 years)
# Reason: Friend - Jane
```

---

## Security Notes

✅ **What's Protected:**
- Keys have checksums (can't be faked)
- Keys are one-time use (can't be shared)
- Complementary access expires (can't be permanent without permission)
- All validation is local (no API to exploit)

❌ **What's NOT Protected:**
- Someone with your secret key can generate keys (keep it secret!)
- Browser sync could theoretically share license (Pro includes sync by design)
- User could extract complementary code (but it's tied to their browser)

🔒 **For Production:**
- Change `pingpt_secret_2025` to something unique
- Track all generated keys in a spreadsheet
- Monitor for suspicious patterns
- Consider server-side validation for high volumes

---

## Troubleshooting

**"Invalid license key format"**
- Check format: `PINGPT-PRO-XXXXXX-XXXXXX`
- All caps required
- Make sure you copied the full key

**"License key already activated"**
- Key can only be used once
- Generate a new key if needed

**Complementary access not working**
- Make sure you pasted in the extension popup console (not webpage)
- Check for JavaScript errors in console
- Verify code is complete

**License disappeared after reinstall**
- License keys: Re-enter your key
- Complementary: Need to re-grant access (not stored in sync)

---

## Quick Reference

```bash
# Generate keys
node scripts/generate-license-keys.js pro 5
node scripts/generate-license-keys.js premium 3

# Grant complementary access
node scripts/grant-complementary.js

# Build extension
npm run build

# Test in browser
# Load unpacked from build/chrome or build/firefox
```
