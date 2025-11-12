#!/usr/bin/env node

/**
 * Complementary Access Manager for Pinboard GPT
 * 
 * This script helps you grant free access to beta testers, friends, family, etc.
 * Complementary access expires after a specified duration.
 * 
 * Usage:
 *   node scripts/grant-complementary.js
 * 
 * Then follow the interactive prompts or use programmatically:
 *   - Open extension popup
 *   - Open browser console (F12)
 *   - Paste the generated code
 */

console.log(`
╔════════════════════════════════════════════════════════════════╗
║          Pinboard GPT - Complementary Access Manager          ║
╚════════════════════════════════════════════════════════════════╝

This tool generates code to grant complementary Pro/Premium access
to beta testers, reviewers, friends, family, or team members.

Complementary access:
• ✅ No license key required
• ✅ Time-limited (configurable expiry)
• ✅ Cannot be transferred or shared
• ✅ Tracked with reason/purpose
• ✅ Automatically expires and reverts to Free

Use cases:
• Beta testing (short-term access)
• Product reviews (30-90 days)
• Friends & family (lifetime)
• Team members (ongoing)
• Educational/nonprofit (1 year)

`);

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  try {
    // Select license type
    console.log('Select license type:');
    console.log('1. Pro (unlimited pins, sync, export, multi-AI)');
    console.log('2. Premium (Pro + cloud sync + cross-browser)');
    const typeChoice = await question('\nEnter choice (1 or 2): ');
    
    const licenseType = typeChoice === '2' ? 'premium' : 'pro';
    
    // Select duration
    console.log('\nSelect duration:');
    console.log('1. 30 days (beta testing)');
    console.log('2. 90 days (product review)');
    console.log('3. 365 days (1 year)');
    console.log('4. 3650 days (10 years, effectively lifetime)');
    console.log('5. Custom days');
    const durationChoice = await question('\nEnter choice (1-5): ');
    
    let durationDays;
    switch(durationChoice) {
      case '1': durationDays = 30; break;
      case '2': durationDays = 90; break;
      case '3': durationDays = 365; break;
      case '4': durationDays = 3650; break;
      case '5':
        durationDays = parseInt(await question('Enter custom days: '), 10);
        if (isNaN(durationDays) || durationDays < 1) {
          console.error('Invalid number of days');
          process.exit(1);
        }
        break;
      default:
        durationDays = 30;
    }
    
    // Enter reason
    const reason = await question('\nEnter reason (e.g., "Beta tester", "Friend", "Review"): ');
    
    // Calculate expiry
    const expiryDate = new Date(Date.now() + (durationDays * 24 * 60 * 60 * 1000));
    
    console.log(`\n${'═'.repeat(60)}`);
    console.log('✅ Complementary Access Configuration:');
    console.log(`${'═'.repeat(60)}`);
    console.log(`License Type: ${licenseType.toUpperCase()}`);
    console.log(`Duration: ${durationDays} days`);
    console.log(`Expires: ${expiryDate.toLocaleDateString()} ${expiryDate.toLocaleTimeString()}`);
    console.log(`Reason: ${reason}`);
    console.log(`${'═'.repeat(60)}\n`);
    
    // Generate the code
    const code = `
// Grant ${licenseType.toUpperCase()} complementary access
(async function() {
  const expiryDate = ${Date.now() + (durationDays * 24 * 60 * 60 * 1000)};
  const licenseData = {
    type: '${licenseType}',
    key: null,
    activatedAt: Date.now(),
    complementary: true,
    complementaryReason: '${reason.replace(/'/g, "\\'")}',
    complementaryExpiry: expiryDate
  };
  
  await chrome.storage.local.set({ 
    license: licenseData.type, 
    licenseData: licenseData 
  });
  
  console.log('✅ Complementary ${licenseType.toUpperCase()} access granted!');
  console.log('Expires:', new Date(expiryDate).toLocaleString());
  
  // Reload popup to show changes
  location.reload();
})();
`.trim();
    
    console.log('📋 INSTRUCTIONS:');
    console.log('─'.repeat(60));
    console.log('1. Install the extension in the user\'s browser');
    console.log('2. Open the extension popup');
    console.log('3. Press F12 to open Developer Console');
    console.log('4. Paste the code below and press Enter');
    console.log('5. The extension will reload with complementary access\n');
    
    console.log('📝 CODE TO PASTE:');
    console.log('─'.repeat(60));
    console.log(code);
    console.log('─'.repeat(60));
    
    console.log('\n💡 TIP: You can also add this to your payment confirmation page');
    console.log('to automatically activate licenses after purchase.\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    rl.close();
  }
}

main();
