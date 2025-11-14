#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const manifestPath = path.join(__dirname, '../build/firefox/manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const version = manifest.version;

const zipName = `pingpt-firefox-v${version}.zip`;
const zipPath = path.join(__dirname, '../pack', zipName);

console.log(`📦 Packing Firefox extension v${version}...`);

// Create pack directory if it doesn't exist
const packDir = path.join(__dirname, '../pack');
if (!fs.existsSync(packDir)) {
  fs.mkdirSync(packDir, { recursive: true });
}

// Change to build/firefox directory and create zip
process.chdir(path.join(__dirname, '../build/firefox'));

try {
  // Use different zip commands based on platform
  if (process.platform === 'win32') {
    // Windows: try using PowerShell Compress-Archive
    const psCommand = `powershell -Command "Compress-Archive -Path * -DestinationPath '${zipPath}' -Force"`;
    execSync(psCommand, { stdio: 'inherit' });
  } else {
    // Unix-like systems: use zip
    execSync(`zip -r "${zipPath}" . -x '*.DS_Store' '*node_modules*'`, { stdio: 'inherit' });
  }
  console.log(`✅ Created ${zipName}`);
} catch (error) {
  console.error('❌ Error creating zip file:', error.message);
  console.log('\n💡 TIP: If zip failed, you can manually zip the build/firefox folder');
  process.exit(1);
}
