#!/usr/bin/env node

/**
 * Unified Pack Script
 * Creates distribution ZIP files using archiver for cross-platform compatibility
 * Replaces separate pack-chrome.js and pack-firefox.js scripts
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// ANSI colors
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(emoji, message, color = colors.reset) {
  console.log(`${color}${emoji} ${message}${colors.reset}`);
}

/**
 * Create ZIP archive using archiver
 */
async function createZip(sourceDir, outputPath, browser) {
  return new Promise((resolve, reject) => {
    // Read manifest to get version
    const manifestPath = path.join(sourceDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      reject(new Error(`Manifest not found: ${manifestPath}`));
      return;
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const version = manifest.version;

    log('📦', `Packing ${browser} extension v${version}...`, colors.blue);

    // Create output directory if needed
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Create write stream
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Event handlers
    output.on('close', () => {
      const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
      log('✅', `Created ${path.basename(outputPath)} (${sizeMB}MB)`, colors.green);
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    // Pipe archive to output
    archive.pipe(output);

    // Add all files from source directory
    archive.glob('**/*', {
      cwd: sourceDir,
      ignore: ['*.DS_Store', 'node_modules/**', '**/.git/**']
    });

    // Finalize archive
    archive.finalize();
  });
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const target = args[0] || 'all';

  console.log('\n📦 Extension Packaging\n');

  const packDir = path.join(__dirname, '../pack');

  try {
    if (target === 'chrome' || target === 'all') {
      const chromeSource = path.join(__dirname, '../build/chrome');
      const chromeOutput = path.join(packDir, 'pingpt-chrome.zip');
      
      if (fs.existsSync(chromeSource)) {
        await createZip(chromeSource, chromeOutput, 'chrome');
      } else {
        log('⚠️', 'Chrome build not found. Run npm run build:chrome first', colors.red);
      }
    }

    if (target === 'firefox' || target === 'all') {
      const firefoxSource = path.join(__dirname, '../build/firefox');
      const firefoxOutput = path.join(packDir, 'pingpt-firefox.zip');
      
      if (fs.existsSync(firefoxSource)) {
        await createZip(firefoxSource, firefoxOutput, 'firefox');
      } else {
        log('⚠️', 'Firefox build not found. Run npm run build:firefox first', colors.red);
      }
    }

    console.log('\n✨ Packaging complete!\n');
  } catch (err) {
    log('❌', `Packaging failed: ${err.message}`, colors.red);
    console.error(err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createZip };
