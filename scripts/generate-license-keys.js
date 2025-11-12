#!/usr/bin/env node

/**
 * License Key Generator for Pinboard GPT
 * 
 * Usage:
 *   node scripts/generate-license-keys.js pro 5        # Generate 5 Pro keys
 *   node scripts/generate-license-keys.js premium 3    # Generate 3 Premium keys
 * 
 * Format: PINGPT-{TYPE}-{RANDOM}-{CHECKSUM}
 * Example: PINGPT-PRO-A1B2C3-XYZ456
 */

// Same hash function as in license.js
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// Generate random alphanumeric string
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate a valid license key
function generateLicenseKey(licenseType) {
  const type = licenseType.toUpperCase();
  const random = generateRandomString(6);
  const payload = `PINGPT-${type}-${random}`;
  
  // Same secret as in license.js - KEEP THIS SECRET!
  const secret = 'pingpt_secret_2025';
  const checksum = simpleHash(payload + secret).substring(0, 6).toUpperCase();
  
  return `${payload}-${checksum}`;
}

// Main function
function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node generate-license-keys.js <pro|premium> <count>');
    console.log('Example: node generate-license-keys.js pro 5');
    process.exit(1);
  }
  
  const licenseType = args[0].toLowerCase();
  const count = parseInt(args[1], 10);
  
  if (!['pro', 'premium'].includes(licenseType)) {
    console.error('Error: License type must be "pro" or "premium"');
    process.exit(1);
  }
  
  if (isNaN(count) || count < 1 || count > 100) {
    console.error('Error: Count must be between 1 and 100');
    process.exit(1);
  }
  
  console.log(`\n🔑 Generating ${count} ${licenseType.toUpperCase()} license keys...\n`);
  console.log('─'.repeat(60));
  
  const keys = [];
  for (let i = 0; i < count; i++) {
    const key = generateLicenseKey(licenseType);
    keys.push(key);
    console.log(`${i + 1}. ${key}`);
  }
  
  console.log('─'.repeat(60));
  console.log(`\n✅ Generated ${count} keys successfully!`);
  console.log('\n📋 CSV Format (for spreadsheet):');
  console.log('Key,Type,Status');
  keys.forEach(key => {
    console.log(`${key},${licenseType.toUpperCase()},unused`);
  });
  
  console.log('\n⚠️  IMPORTANT:');
  console.log('• Keep these keys secure - each can only be used once');
  console.log('• Track which keys you distribute');
  console.log('• Keys are validated against a checksum to prevent tampering');
  console.log('• Once activated, keys cannot be reused on other devices\n');
}

main();
