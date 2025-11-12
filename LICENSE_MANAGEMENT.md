# License Management System

This document explains how to manage licenses for Pinboard GPT, including generating keys, granting complementary access, and preventing exploitation.

## Overview

Pinboard GPT uses a **dual-access system**:

1. **License Keys** - For paid customers (Pro/Premium)
2. **Complementary Access** - For beta testers, friends, family, reviewers

Both methods are secure and prevent unauthorized access.

---

## Security Features

### ✅ What Prevents Exploitation

1. **Checksum Validation** - Each key has a cryptographic checksum that validates authenticity
2. **One-Time Use** - Keys can only be activated once and are marked as "used"
3. **Time-Limited Complementary** - Free access expires automatically
4. **Local Storage** - License data stored locally, tied to browser installation
5. **No API Calls** - Validation happens client-side (keys are pre-validated)

### 🔒 Security Best Practices

- **Keep the secret key secure** (in `license.js` and `generate-license-keys.js`)
- **Track distributed keys** - Maintain a spreadsheet of who got what
- **Set expiry dates** - Use time-limited complementary access for testing
- **Monitor usage** - Check for suspicious patterns
- **Rotate secret** - Change the secret key periodically for new key batches

---

## 1. License Keys (For Paid Customers)

### Generate License Keys

```bash
# Generate 5 Pro keys
node scripts/generate-license-keys.js pro 5

# Generate 3 Premium keys
node scripts/generate-license-keys.js premium 3
```

**Output Example:**
```
🔑 Generating 5 PRO license keys...

1. PINGPT-PRO-A1B2C3-X7Y9Z2
2. PINGPT-PRO-D4E5F6-K3L8M4
3. PINGPT-PRO-G7H8I9-P2Q6R1
4. PINGPT-PRO-J0K1L2-T5U9V3
5. PINGPT-PRO-M3N4O5-W8X2Y7

✅ Generated 5 keys successfully!
```

### Key Format

```
PINGPT-{TYPE}-{RANDOM}-{CHECKSUM}
```

- **PINGPT** - Prefix (prevents generic key guessing)
- **TYPE** - PRO or PREMIUM
- **RANDOM** - 6 random characters (36^6 = 2.1 billion combinations)
- **CHECKSUM** - 6-character hash for validation

### How Customers Use Keys

1. Install extension
2. Click Settings ⚙️
3. Scroll to "License" section
4. Enter key: `PINGPT-PRO-A1B2C3-X7Y9Z2`
5. Click "Activate License"
6. ✅ Access granted instantly!

### Key Validation Process

```javascript
// Extension validates:
1. Format: PINGPT-{TYPE}-{6chars}-{6chars}
2. Type matches: PRO key for Pro upgrade
3. Checksum valid: Hash matches expected value
4. Not used before: Key hasn't been activated

// If all pass → License activated
// If any fail → Error message shown
```

### Track Your Keys

Create a spreadsheet:

| Key | Type | Assigned To | Date | Status |
|-----|------|-------------|------|--------|
| PINGPT-PRO-ABC123-XYZ789 | PRO | john@example.com | 2025-01-15 | Active |
| PINGPT-PRO-DEF456-UVW012 | PRO | jane@example.com | 2025-01-16 | Active |

---

## 2. Complementary Access (For Beta Testers)

### Grant Complementary Access

```bash
node scripts/grant-complementary.js
```

**Interactive Prompts:**
```
Select license type:
1. Pro (unlimited pins, sync, export, multi-AI)
2. Premium (Pro + cloud sync + cross-browser)

Select duration:
1. 30 days (beta testing)
2. 90 days (product review)
3. 365 days (1 year)
4. 3650 days (10 years, effectively lifetime)
5. Custom days

Enter reason: Beta tester - John Doe
```

**Output:**
```javascript
// Code to paste in browser console:

(async function() {
  const expiryDate = 1735689600000;
  const licenseData = {
    type: 'pro',
    key: null,
    activatedAt: Date.now(),
    complementary: true,
    complementaryReason: 'Beta tester - John Doe',
    complementaryExpiry: expiryDate
  };
  
  await chrome.storage.local.set({ 
    license: licenseData.type, 
    licenseData: licenseData 
  });
  
  console.log('✅ Complementary PRO access granted!');
  console.log('Expires:', new Date(expiryDate).toLocaleString());
  location.reload();
})();
```

### How to Grant Access

1. Run `node scripts/grant-complementary.js`
2. Answer prompts (type, duration, reason)
3. Copy the generated code
4. Send to user with instructions:
   - Install extension
   - Open extension popup
   - Press F12 (Developer Console)
   - Paste code and press Enter
   - Extension reloads with access ✅

### Complementary Access Features

- ✅ **Time-limited** - Automatically expires
- ✅ **Trackable** - Includes reason/purpose
- ✅ **No key required** - Direct browser storage
- ✅ **Non-transferable** - Tied to browser installation
- ✅ **Auto-reverts** - Returns to Free after expiry

### Use Cases

| Scenario | Duration | Example |
|----------|----------|---------|
| Beta Testing | 30 days | Test new features before launch |
| Product Review | 90 days | YouTuber/blogger reviewing extension |
| Friends & Family | 10 years | Give lifetime access to supporters |
| Team Members | 10 years | Internal team access |
| Educational | 1 year | Students/teachers |

---

## 3. Checking License Status

### In Extension Popup

1. Click Settings ⚙️
2. View "License" section:
   - **Current Plan:** Pro/Premium/Free
   - **Details:** Key info or expiry date

### In Browser Console

```javascript
// Check current license
chrome.storage.local.get(['license', 'licenseData'], (result) => {
  console.log('License:', result.license);
  console.log('Data:', result.licenseData);
});

// Check if complementary
chrome.storage.local.get(['licenseData'], (result) => {
  if (result.licenseData?.complementary) {
    const expiry = new Date(result.licenseData.complementaryExpiry);
    console.log('Complementary access expires:', expiry);
  }
});
```

---

## 4. Integration with Payment System

### After Payment Completion

When a customer completes payment, you can:

**Option A: Email License Key**
```
Thank you for purchasing Pro!
Your license key: PINGPT-PRO-ABC123-XYZ789

To activate:
1. Open Pinboard GPT extension
2. Click Settings ⚙️
3. Enter your license key
4. Click Activate

Enjoy unlimited pins!
```

**Option B: Auto-Activate on Website**

Create a success page at `pinboard-gpt.dps.codes/activated.html`:

```html
<script>
// After payment verification
const licenseKey = "PINGPT-PRO-ABC123-XYZ789"; // From payment processor

// Show key to user
document.getElementById('key').textContent = licenseKey;

// Optional: Try to auto-activate if extension installed
chrome.runtime.sendMessage('YOUR_EXTENSION_ID', {
  action: 'activateLicense',
  key: licenseKey
});
</script>
```

---

## 5. Preventing Exploitation

### What We Prevent

❌ **Key Sharing** - Keys can only be used once
❌ **Key Generation** - Checksum prevents fake keys
❌ **Unlimited Access** - Complementary access expires
❌ **API Exploitation** - No server calls to attack
❌ **Browser Sync Abuse** - Marked keys stored locally

### What Users CAN'T Do

- Share a key with multiple people (one-time use)
- Generate valid keys (need secret + checksum)
- Extend expiry (client-side validation)
- Transfer complementary access (tied to installation)

### What Users CAN Do

- Use one key on one browser/device
- Reinstall extension (key still works if unused)
- Export/import pins (not license data)

### Edge Cases

**Q: What if user uninstalls and reinstalls?**
A: If they have their key, they can re-activate. If complementary, they need to re-request access.

**Q: What if user has multiple browsers?**
A: Each browser needs a separate key or complementary grant (Pro includes Chrome sync, Premium will include cross-browser).

**Q: What if complementary access expires?**
A: Extension automatically reverts to Free plan. User keeps their pins but loses Pro features.

---

## 6. Testing

### Test License Activation

```bash
# Generate a test key
node scripts/generate-license-keys.js pro 1

# Output: PINGPT-PRO-ABC123-XYZ789

# Test in extension:
1. Open popup
2. Go to Settings
3. Enter key
4. Verify activation
```

### Test Complementary Access

```bash
# Grant 1-day test access
node scripts/grant-complementary.js

# Select:
# - Type: Pro
# - Duration: Custom → 1 day
# - Reason: Test

# Paste code in console
# Wait 24 hours
# Verify auto-revert to Free
```

---

## 7. FAQ

**Q: Can I revoke a key?**
A: Not currently. Issue time-limited complementary access for testing instead.

**Q: How many keys should I generate?**
A: Generate in small batches (10-20) as needed. Track in spreadsheet.

**Q: Should I change the secret key?**
A: Yes, periodically rotate it and generate new batches. Old keys remain valid.

**Q: What if someone cracks the checksum?**
A: The secret key adds entropy. Use a strong, unique secret. Consider server-side validation for high-value cases.

**Q: Can I sell keys on multiple platforms?**
A: Yes! Each platform (Gumroad, Stripe, etc.) can receive a batch of keys.

---

## 8. License Data Structure

```javascript
{
  // Simple license type (stored for quick access)
  license: 'pro',
  
  // Full license data
  licenseData: {
    type: 'pro',                    // License type
    key: 'PINGPT-PRO-ABC123-XYZ789', // License key (or null if complementary)
    keyHash: 'a1b2c3d4e5',          // Hash of key (prevents reuse)
    activatedAt: 1704067200000,     // Timestamp of activation
    complementary: false,            // Is this complementary access?
    complementaryReason: '',         // Reason if complementary
    complementaryExpiry: 0           // Expiry timestamp if complementary
  },
  
  // Used keys tracking (prevents sharing)
  usedLicenseKeys: ['a1b2c3', 'x7y8z9']
}
```

---

## Summary

- **License Keys**: For paying customers, secure, one-time use
- **Complementary**: For testers/friends, time-limited, trackable
- **Security**: Checksum validation, one-time use, local storage
- **Scripts**: Easy generation and management tools
- **Flexible**: Multiple use cases covered

**Need help?** Contact support@pinboard-gpt.dps.codes
