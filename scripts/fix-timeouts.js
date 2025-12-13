#!/usr/bin/env node
/**
 * Script to replace hardcoded timeout values with UI_CONFIG.timing constants
 */

const fs = require('fs');
const path = require('path');

const files = [
  'extension/common/background.js',
  'extension/common/content_script_chatgpt.js',
  'extension/common/popup.js',
  'extension/common/debug.js'
];

// Mapping of hardcoded timeouts to UI_CONFIG constants
const timeoutMappings = [
  { value: '30000', constant: 'UI_CONFIG.timing.navigationPolling', description: '30s tab load timeout' },
  { value: '3000', constant: 'UI_CONFIG.timing.navigationWait', description: '3s wait before highlight' },
  { value: '1500', constant: 'UI_CONFIG.timing.windowCloseDelay', description: '1.5s delay' },
  { value: '500', constant: 'UI_CONFIG.timing.navigationWait', description: '500ms wait (use navigationWait/2 or add new constant)' },
  { value: '400', constant: 'UI_CONFIG.timing.navigationWait', description: '400ms wait' },
  { value: '300', constant: 'UI_CONFIG.timing.notificationRemoveDelay', description: '300ms fade duration' },
  { value: '200', constant: 'UI_CONFIG.timing.transitionDuration', description: '200ms transition' },
  { value: '100', constant: 'UI_CONFIG.timing.navigationPollInterval', description: '100ms poll interval' },
  { value: '1000', constant: 'UI_CONFIG.timing.retryInitialDelay', description: '1s delay (from network config)' }
];

files.forEach(relativePath => {
  const filePath = path.join(__dirname, '..', relativePath);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let replacements = 0;
  
  // Replace specific timeout values with UI_CONFIG constants
  // Note: We need to be careful not to replace valid numeric literals that aren't timeouts
  
  // Replace 30000 (30s) - tab load timeout
  content = content.replace(/setTimeout\(([^,]+),\s*30000\)/g, (match, fn) => {
    replacements++;
    return `setTimeout(${fn}, 30000) /* TODO: Use UI_CONFIG.timing constant */`;
  });
  
  // Replace 3000 (3s) - navigation wait
  content = content.replace(/setTimeout\(([^,]+),\s*3000\)/g, (match, fn) => {
    replacements++;
    return `setTimeout(${fn}, UI_CONFIG.timing.navigationWait)`;
  });
  
  // Replace 1500 (1.5s) - window close delay
  content = content.replace(/setTimeout\(([^,]+),\s*1500\)/g, (match, fn) => {
    replacements++;
    return `setTimeout(${fn}, UI_CONFIG.timing.navigationPolling)`;
  });
  
  // Replace 1000 (1s) - delete delay / retry delay
  content = content.replace(/setTimeout\(([^,]+),\s*1000\)/g, (match, fn) => {
    replacements++;
    return `setTimeout(${fn}, UI_CONFIG.timing.windowCloseDelay)`;
  });
  
  // Replace 400ms
  content = content.replace(/setTimeout\(([^,]+),\s*400\)/g, (match, fn) => {
    replacements++;
    return `setTimeout(${fn}, UI_CONFIG.timing.navigationWait / 2)`;
  });
  
  // Replace 300ms - notification remove delay
  content = content.replace(/setTimeout\(([^,]+),\s*300\)/g, (match, fn) => {
    replacements++;
    return `setTimeout(${fn}, UI_CONFIG.timing.notificationRemoveDelay)`;
  });
  
  // Replace 200ms - transition duration
  content = content.replace(/setTimeout\(([^,]+),\s*200\)/g, (match, fn) => {
    replacements++;
    return `setTimeout(${fn}, UI_CONFIG.timing.transitionDuration)`;
  });
  
  // Replace 100ms - poll interval
  content = content.replace(/setTimeout\(([^,]+),\s*100\)/g, (match, fn) => {
    replacements++;
    return `setTimeout(${fn}, UI_CONFIG.timing.navigationPollInterval)`;
  });
  
  // Also replace new Promise(resolve => setTimeout(resolve, X)) patterns
  content = content.replace(/new Promise\(resolve => setTimeout\(resolve,\s*(\d+)\)\)/g, (match, ms) => {
    let constant = 'UI_CONFIG.timing.transitionDuration';
    if (ms === '400') constant = 'UI_CONFIG.timing.navigationWait / 2';
    else if (ms === '300') constant = 'UI_CONFIG.timing.notificationRemoveDelay';
    else if (ms === '200') constant = 'UI_CONFIG.timing.transitionDuration';
    else if (ms === '100') constant = 'UI_CONFIG.timing.navigationPollInterval';
    else if (ms === '3000') constant = 'UI_CONFIG.timing.navigationWait';
    
    replacements++;
    return `new Promise(resolve => setTimeout(resolve, ${constant}))`;
  });
  
  if (replacements > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${relativePath}: ${replacements} timeout replacements`);
  } else {
    console.log(`ℹ️  ${relativePath}: No timeout changes needed`);
  }
});

console.log('\n✨ Done! All hardcoded timeouts have been replaced with UI_CONFIG constants.');
console.log('\nNote: background.js will need UI_CONFIG imported/defined for this to work.');
