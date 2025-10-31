# Asset Generation

This directory contains the source PNG files for generating the extension's icons and logos.

## Files

- `gpt-dashboard-icon-backgroud.png` - Source icon image (388x388)
- `gpt-dashboard-logo-background.png` - Source logo image (1536x1024)

## Generated Files

When you run `node generate-assets.js`, it creates:

### SVG Files
- `../src/common/icons/PinGPT-Icon.svg` - Icon in SVG format
- `../src/common/PinGPT-Logo.svg` - Logo in SVG format

### PNG Icons
- `../src/common/icons/icon16.png` - 16x16 pixels
- `../src/common/icons/icon48.png` - 48x48 pixels
- `../src/common/icons/icon128.png` - 128x128 pixels
- `../src/common/icons/icon256.png` - 256x256 pixels
- `../src/common/icons/icon512.png` - 512x512 pixels

## Usage

Run the following command to generate all assets:

```bash
cd assets
node generate-assets.js
```

Or use the npm script:

```bash
npm run build:assets
```

## Requirements

The script requires the following npm packages:
- `canvas` - For SVG generation
- `sharp` - For PNG icon resizing

These are already included in the project dependencies.
