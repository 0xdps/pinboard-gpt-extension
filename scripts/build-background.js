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
  const uiConfigPath = path.join(buildDir, 'ui-config.js');
  const licensePath = path.join(buildDir, 'license.js');
  const authPath = path.join(buildDir, 'auth.js');
  const backgroundPath = path.join(buildDir, 'background.js');
  
  const uiConfigContent = fs.readFileSync(uiConfigPath, 'utf8');
  const licenseContent = fs.readFileSync(licensePath, 'utf8');
  const authContent = fs.readFileSync(authPath, 'utf8');
  const backgroundContent = fs.readFileSync(backgroundPath, 'utf8');
  
  console.log(`✅ Read ui-config.js (${Math.round(uiConfigContent.length / 1024)}KB)`);
  console.log(`✅ Read license.js (${Math.round(licenseContent.length / 1024)}KB)`);
  console.log(`✅ Read auth.js (${Math.round(authContent.length / 1024)}KB)`);
  console.log(`✅ Read background.js (${Math.round(backgroundContent.length / 1024)}KB)`);
  
  // Bundle them together in the correct order:
  // 1. browser code (already in background.js from prepend-browser.js)
  // 2. ui-config.js (defines UI_CONFIG and helper functions)
  // 3. license.js (needs UI_CONFIG)
  // 4. auth.js (needs UI_CONFIG helper functions like retryWithBackoff)
  // 5. background logic (the rest of background.js)
  // Note: background.js already has browser.js prepended to it from the prepend-browser.js script
  const bundledBackground = backgroundContent + '\n\n' + uiConfigContent + '\n\n' + licenseContent + '\n\n' + authContent;
  
  // Write the bundled background script
  fs.writeFileSync(backgroundPath, bundledBackground, 'utf8');
  
  console.log(`✅ Successfully bundled ui-config.js, license.js and auth.js into background.js`);
  console.log(`📄 Final background.js size: ${Math.round(bundledBackground.length / 1024)}KB`);
  
} catch (error) {
  console.error('❌ Error building background bundle:', error.message);
  process.exit(1);
}
