#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get command line arguments
const browser = process.argv[2]; // 'chrome' or 'firefox'
const buildDir = process.argv[3]; // e.g., 'build/chrome'

if (!browser || !buildDir) {
  console.error('Usage: node append-browser.js <browser> <buildDir>');
  process.exit(1);
}

console.log(`📦 Appending ${browser} browser code to background.js...`);

try {
  // Read the common background.js file
  const backgroundPath = path.join(buildDir, 'background.js');
  const backgroundContent = fs.readFileSync(backgroundPath, 'utf8');
  
  // Read the browser code file
  const browserPath = path.join(buildDir, 'browser.js');
  const browserContent = fs.readFileSync(browserPath, 'utf8');
  
  console.log(`✅ Read browser code (${Math.round(browserContent.length / 1024)}KB)`);
  
  // Append the browser code to the background script
  const enhancedBackground = backgroundContent + '\n\n' + browserContent;
  
  // Write the enhanced background script
  fs.writeFileSync(backgroundPath, enhancedBackground, 'utf8');
  
  // Clean up - remove the separate browser.js file since it's now included
  fs.unlinkSync(browserPath);
  
  console.log(`✅ Successfully appended ${browser} browser code to background.js`);
  console.log(`📄 Final background.js size: ${Math.round(enhancedBackground.length / 1024)}KB`);
  
} catch (error) {
  console.error('❌ Error appending browser code:', error.message);
  process.exit(1);
}