#!/usr/bin/env node

/**
 * Replace browser-specific text in HTML files during build
 * Usage: node scripts/replace-browser-text.js <browser> <file>
 */

const fs = require('fs');
const path = require('path');

const browser = process.argv[2]; // 'chrome' or 'firefox'
const filePath = process.argv[3];

if (!browser || !filePath) {
  console.error('Usage: node scripts/replace-browser-text.js <browser> <file>');
  process.exit(1);
}

if (!['chrome', 'firefox'].includes(browser)) {
  console.error('Browser must be either "chrome" or "firefox"');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Define replacements based on browser
const replacements = {
  chrome: {
    syncDesc: 'Automatically sync pins across your Chrome devices using Chrome sync storage'
  },
  firefox: {
    syncDesc: 'Automatically sync pins across your Firefox devices using Firefox Sync (requires Firefox account & Sync enabled)'
  }
};

// Replace the sync description text
const oldText = 'Automatically sync pins across your Chrome devices using Chrome sync storage';
const newText = replacements[browser].syncDesc;

if (content.includes(oldText)) {
  content = content.replace(oldText, newText);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✓ Updated ${path.basename(filePath)} for ${browser}`);
} else {
  console.log(`⚠ No replacement needed in ${path.basename(filePath)}`);
}
