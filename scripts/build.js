#!/usr/bin/env node

/**
 * Unified Build Script
 * Replaces multiple individual build scripts with a single configurable builder
 * Uses npm-run-all for parallel execution where possible
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const config = require('../build.config');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(emoji, message, color = colors.reset) {
  console.log(`${color}${emoji} ${message}${colors.reset}`);
}

function error(message) {
  log('❌', message, colors.red);
}

function success(message) {
  log('✅', message, colors.green);
}

function info(message) {
  log('ℹ️', message, colors.blue);
}

/**
 * Copy files from source to destination
 */
function copyFiles(source, dest, pattern = '**') {
  try {
    const cmd = `cpx "${path.join(source, pattern)}" "${dest}"`;
    execSync(cmd, { stdio: 'inherit' });
    return true;
  } catch (err) {
    error(`Failed to copy from ${source} to ${dest}`);
    return false;
  }
}

/**
 * Prepend browser-specific code to a file
 */
function prependBrowserCode(browser, buildDir) {
  const backgroundPath = path.join(buildDir, 'background.js');
  const browserPath = path.join(buildDir, 'browser.js');

  if (!fs.existsSync(backgroundPath) || !fs.existsSync(browserPath)) {
    return false;
  }

  const backgroundContent = fs.readFileSync(backgroundPath, 'utf8');
  const browserContent = fs.readFileSync(browserPath, 'utf8');

  const enhanced = browserContent + '\n\n' + backgroundContent;
  fs.writeFileSync(backgroundPath, enhanced, 'utf8');
  fs.unlinkSync(browserPath);

  return true;
}

/**
 * Bundle multiple files into one
 */
function bundleFiles(buildDir, targetFile, sourceFiles) {
  const targetPath = path.join(buildDir, targetFile);
  let bundled = fs.readFileSync(targetPath, 'utf8');

  sourceFiles.forEach(file => {
    const filePath = path.join(buildDir, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      bundled += '\n\n' + content;
    }
  });

  fs.writeFileSync(targetPath, bundled, 'utf8');
  return bundled.length;
}

/**
 * Replace browser-specific text in files
 */
function replaceBrowserText(browser, filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const replacements = config.replacements[browser];

  // Replace sync description
  const chromeText = config.replacements.chrome.syncDesc;
  if (content.includes(chromeText) && browser !== 'chrome') {
    content = content.replace(chromeText, replacements.syncDesc);
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }

  return false;
}

/**
 * Build for a specific browser
 */
function buildBrowser(browser) {
  log('🔨', `Building ${browser} extension...`, colors.bright);

  const buildDir = config.output[browser];

  // Clean build directory
  if (fs.existsSync(buildDir)) {
    fs.rmSync(buildDir, { recursive: true, force: true });
  }
  fs.mkdirSync(buildDir, { recursive: true });

  // Copy common files
  info(`Copying common files to ${buildDir}`);
  if (!copyFiles(config.source.common, buildDir)) {
    return false;
  }

  // Copy browser-specific files
  info(`Copying ${browser}-specific files`);
  if (!copyFiles(config.source[browser], buildDir)) {
    return false;
  }

  // Prepend browser code
  info('Prepending browser-specific code');
  if (prependBrowserCode(browser, buildDir)) {
    success('Browser code prepended to background.js');
  }

  // Bundle files
  info('Bundling files');
  for (const [target, sources] of Object.entries(config.process.bundle)) {
    const size = bundleFiles(buildDir, target, sources);
    success(`Bundled ${target} (${Math.round(size / 1024)}KB)`);
  }

  // Replace text
  config.process.replace.forEach(file => {
    const filePath = path.join(buildDir, file);
    if (replaceBrowserText(browser, filePath)) {
      success(`Updated ${file} for ${browser}`);
    }
  });

  success(`${browser} build complete!`);
  return true;
}

/**
 * Main build function
 */
function main() {
  const args = process.argv.slice(2);
  const target = args[0] || 'all';

  console.log('\n' + colors.bright + '🚀 Extension Build System' + colors.reset + '\n');

  try {
    if (target === 'chrome' || target === 'all') {
      if (!buildBrowser('chrome')) {
        process.exit(1);
      }
    }

    if (target === 'firefox' || target === 'all') {
      if (!buildBrowser('firefox')) {
        process.exit(1);
      }
    }

    if (target !== 'chrome' && target !== 'firefox' && target !== 'all') {
      error(`Unknown target: ${target}`);
      info('Usage: node build.js [chrome|firefox|all]');
      process.exit(1);
    }

    console.log('\n' + colors.green + '✨ Build complete!' + colors.reset + '\n');
  } catch (err) {
    error(`Build failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { buildBrowser, bundleFiles, prependBrowserCode };
