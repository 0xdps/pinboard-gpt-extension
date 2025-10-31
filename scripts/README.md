# Scripts

This directory contains build and asset generation scripts for the GPT Pinboard extension.

## generate-assets.js

Generates all icons and assets from source PNG files in the `assets/` directory.

### What it does:
- Converts `gpt-icon-pinboard-background.png` → `icon.svg` (675x675)
- Converts `gpt-logo-pinboard-background.png` → `logo.svg` (150x75)  
- Generates PNG icons in sizes: 16, 32, 48, 128px
- Generates favicon variants for website
- Copies demo screenshot to assets/icons/

### Usage:
```bash
# Generate all assets
npm run build:assets

# Or run directly
node scripts/generate-assets.js
```

### Generated Files:
All files are created in `assets/icons/` with generic names:
- `icon.svg` - Main extension icon
- `logo.svg` - Brand logo
- `icon-{size}.png` - Extension manifest icons
- `favicon-{size}x{size}.png` - Website favicons
- `favicon.ico` - Website favicon
- `demo-screenshot.svg` - Website demo image

### Requirements:
- Node.js
- sharp package (`npm install`)