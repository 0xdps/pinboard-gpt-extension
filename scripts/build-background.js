#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get command line arguments
const buildDir = process.argv[2]; // e.g., 'build/chrome'

if (!buildDir) {
  console.error('Usage: node build-background.js <buildDir>');
  process.exit(1);
}

console.log(`🔨 Building background.js bundle...`);

try {
  // Read the individual files that need to be bundled
  const licensePath = path.join(buildDir, 'license.js');
  const authPath = path.join(buildDir, 'auth.js');
  const backgroundPath = path.join(buildDir, 'background.js');
  
  const licenseContent = fs.readFileSync(licensePath, 'utf8');
  const authContent = fs.readFileSync(authPath, 'utf8');
  const backgroundContent = fs.readFileSync(backgroundPath, 'utf8');
  
  console.log(`✅ Read license.js (${Math.round(licenseContent.length / 1024)}KB)`);
  console.log(`✅ Read auth.js (${Math.round(authContent.length / 1024)}KB)`);
  console.log(`✅ Read background.js (${Math.round(backgroundContent.length / 1024)}KB)`);
  
  // Bundle them together: browser code (already in background.js) + license.js + auth.js + background logic
  // Note: background.js already has browser.js prepended to it from the prepend-browser.js script
  const bundledBackground = backgroundContent + '\n\n' + licenseContent + '\n\n' + authContent;
  
  // Write the bundled background script
  fs.writeFileSync(backgroundPath, bundledBackground, 'utf8');
  
  console.log(`✅ Successfully bundled license.js and auth.js into background.js`);
  console.log(`📄 Final background.js size: ${Math.round(bundledBackground.length / 1024)}KB`);
  
} catch (error) {
  console.error('❌ Error building background bundle:', error.message);
  process.exit(1);
}
