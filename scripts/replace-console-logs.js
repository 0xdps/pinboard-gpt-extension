#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get the file path from command line arguments
const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: node replace-console-logs.js <filePath>');
  process.exit(1);
}

try {
  console.log(`🔧 Replacing console statements in ${filePath}...`);
  
  // Read the file
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Count replacements
  const logMatches = content.match(/console\.log/g) || [];
  const errorMatches = content.match(/console\.error/g) || [];
  
  // Replace console.log with debugLog
  content = content.replace(/console\.log/g, 'debugLog');
  
  // Replace console.error with debugError  
  content = content.replace(/console\.error/g, 'debugError');
  
  // Write the file back
  fs.writeFileSync(filePath, content, 'utf8');
  
  console.log(`✅ Replaced ${logMatches.length} console.log calls with debugLog`);
  console.log(`✅ Replaced ${errorMatches.length} console.error calls with debugError`);
  console.log(`📄 Updated ${filePath}`);
  
} catch (error) {
  console.error('❌ Error processing file:', error.message);
  process.exit(1);
}