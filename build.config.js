/**
 * Build Configuration
 * Centralized configuration for the build system
 */

module.exports = {
  // Source directories
  source: {
    common: 'extension/common',
    chrome: 'extension/chrome',
    firefox: 'extension/firefox',
    assets: 'assets/icons'
  },

  // Build output directories
  output: {
    chrome: 'build/chrome',
    firefox: 'build/firefox',
    pack: 'pack'
  },

  // Files to exclude from build
  exclude: [
    '**/*.DS_Store',
    '**/node_modules/**',
    '**/*.map',
    '**/.git/**'
  ],

  // Browser-specific replacements
  replacements: {
    chrome: {
      syncDesc: 'Automatically sync pins across your Chrome devices using Chrome sync storage'
    },
    firefox: {
      syncDesc: 'Automatically sync pins across your Firefox devices using Firefox Sync (requires Firefox account & Sync enabled)'
    }
  },

  // Files to process during build
  process: {
    // Files that need browser code prepended
    prepend: ['background.js'],
    
    // Files that need text replacement
    replace: ['popup.html'],
    
    // Files to bundle together
    bundle: {
      'background.js': [
        'ui-config.js',
        'license.js', 
        'auth.js'
      ]
    }
  },

  // Asset generation
  assets: {
    source: 'assets/icon-transparent.png',
    icons: {
      extension: [16, 24, 32, 48, 128],
      favicon: [16, 32, 48]
    }
  }
};
