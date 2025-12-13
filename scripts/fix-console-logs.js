#!/usr/bin/env node
/**
 * Script to replace console.log/error/warn with debugLog/debugError
 * Maintains the message format by removing '[Pinboard GPT]' prefix
 */

const fs = require('fs');
const path = require('path');

const files = [
  'extension/common/content_script_chatgpt.js',
  'extension/common/web_verification.js',
  'extension/chrome/idb.js',
  'extension/firefox/idb.js'
];

files.forEach(relativePath => {
  const filePath = path.join(__dirname, '..', relativePath);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let replacements = 0;
  
  // Replace console.log with debugLog (remove [Pinboard GPT] prefix)
  content = content.replace(/console\.log\('\[Pinboard GPT\] ([^']+)'/g, (match, message) => {
    replacements++;
    return `debugLog('${message}'`;
  });
  
  // Replace console.log with debugLog (keep other prefixes)
  content = content.replace(/console\.log\('([^']+)'/g, (match, message) => {
    replacements++;
    return `debugLog('${message}'`;
  });
  
  // Replace console.log with debugLog (template literals)
  content = content.replace(/console\.log\(`\[Pinboard\] ([^`]+)`/g, (match, message) => {
    replacements++;
    return `debugLog(\`${message}\``;
  });
  
  // Replace console.error with debugError (remove [Pinboard GPT] prefix)
  content = content.replace(/console\.error\('\[Pinboard GPT\] ([^']+)'/g, (match, message) => {
    replacements++;
    return `debugError('${message}'`;
  });
  
  // Replace console.error with debugError (keep other formats)
  content = content.replace(/console\.error\('([^']+)'/g, (match, message) => {
    replacements++;
    return `debugError('${message}'`;
  });
  
  // Replace console.warn with debugLog (remove [Pinboard GPT] prefix)
  content = content.replace(/console\.warn\('\[Pinboard GPT\] ([^']+)'/g, (match, message) => {
    replacements++;
    return `debugLog('${message}'`;
  });
  
  // Replace console.warn with debugLog (keep other formats)
  content = content.replace(/console\.warn\('([^']+)'/g, (match, message) => {
    replacements++;
    return `debugLog('${message}'`;
  });
  
  if (replacements > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${relativePath}: ${replacements} replacements`);
  } else {
    console.log(`ℹ️  ${relativePath}: No changes needed`);
  }
});

console.log('\n✨ Done! All console.log/error/warn statements have been replaced.');
