# Asset Generation

This directory contains the source SVG file for generating the extension's icons and website assets.

## Source Files

- `icon-transparent.svg` - Source transparent icon in SVG format

## Generated Files

When you run `npm run build:assets`, it creates icons in the `assets/icons/` directory:

### SVG Files
- `icons/icon.svg` - Main icon (copied from source)

### PNG Icons (Multiple Sizes)
- `icons/icon-16.png` - 16x16 pixels
- `icons/icon-32.png` - 32x32 pixels
- `icons/icon-48.png` - 48x48 pixels
- `icons/icon-128.png` - 128x128 pixels

### Favicon Variants (for website)
- `icons/favicon-16x16.png` - 16x16 pixels
- `icons/favicon-32x32.png` - 32x32 pixels
- `icons/favicon-48x48.png` - 48x48 pixels
- `icons/favicon.ico` - 32x32 pixels ICO format

## Usage

Run the following command to generate all assets:

```bash
npm run build:assets
```

This will:
1. Copy `icon-transparent.svg` to `icons/icon.svg`
2. Generate PNG icons in multiple sizes from the SVG
3. Generate favicon variants for the website

## Requirements

The script requires the following npm packages:
- `sharp` - For SVG to PNG conversion and resizing

These are already included in the project dependencies.

## Note

All generated files in `assets/icons/` are gitignored and should not be committed to the repository. They are generated during the build process.
