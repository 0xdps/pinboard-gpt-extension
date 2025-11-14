#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Cross-platform clean script
 * Removes build artifacts and generated files
 */

function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`✓ Removed: ${dirPath}`);
  }
}

function removeFiles(dirPath, pattern) {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  const files = fs.readdirSync(dirPath);
  const regex = new RegExp(pattern.replace('*', '.*'));
  
  files.forEach(file => {
    if (regex.test(file)) {
      const filePath = path.join(dirPath, file);
      try {
        fs.unlinkSync(filePath);
        console.log(`✓ Removed: ${filePath}`);
      } catch (err) {
        console.error(`✗ Failed to remove: ${filePath}`, err.message);
      }
    }
  });
}

function main() {
  console.log('🧹 Cleaning build artifacts...\n');

  // Remove directories
  removeDir(path.join(__dirname, '../build'));
  removeDir(path.join(__dirname, '../assets/icons'));
  
  // Remove icon files
  removeFiles(path.join(__dirname, '../extension/common/icons'), '*.png');
  
  // Remove website images
  const websiteImagesDir = path.join(__dirname, '../website/images');
  removeFiles(websiteImagesDir, '*.png');
  removeFiles(websiteImagesDir, 'favicon.ico');
  
  console.log('\n✅ Clean complete!');
}

main();
