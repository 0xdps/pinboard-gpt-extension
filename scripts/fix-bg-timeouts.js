#!/usr/bin/env node
/**
 * Script to replace hardcoded timeouts in background.js specifically
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'extension/common/background.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace 30000 with BG_TIMING.TAB_LOAD_TIMEOUT
content = content.replace(/}, 30000\);/g, '}, BG_TIMING.TAB_LOAD_TIMEOUT);');

// Replace 3000 with BG_TIMING.CONTENT_SCRIPT_WAIT
content = content.replace(/}, 3000\);/g, '}, BG_TIMING.CONTENT_SCRIPT_WAIT);');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ background.js: Replaced hardcoded timeouts with BG_TIMING constants');
