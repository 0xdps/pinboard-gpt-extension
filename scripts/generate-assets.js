const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

const sizes = [16, 24, 32, 48, 128];

async function generatePNGIcons(sourcePath, outputDir, baseName) {
  try {
    fs.mkdirSync(outputDir, { recursive: true });
    const sourceBuffer = fs.readFileSync(sourcePath);

    for (const size of sizes) {
      const outputPath = `${outputDir}/icon-${size}.png`;
      await sharp(sourceBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toFile(outputPath);
      console.log(`✓ Generated ${outputPath} (${size}x${size})`);
    }
  } catch (err) {
    console.error(`❌ Error generating PNG icons:`, err.message);
  }
}

async function generateFavicons(sourcePath, outputDir) {
  try {
    fs.mkdirSync(outputDir, { recursive: true });
    const sourceBuffer = fs.readFileSync(sourcePath);
    
    const faviconSizes = [16, 32, 48];
    for (const size of faviconSizes) {
      const outputPath = `${outputDir}/favicon-${size}x${size}.png`;
      await sharp(sourceBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toFile(outputPath);
      console.log(`✓ Generated ${outputPath} (${size}x${size})`);
    }

    // Generate favicon.ico (32x32)
    const icoPath = `${outputDir}/favicon.ico`;
    await sharp(sourceBuffer)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(icoPath);
    console.log(`✓ Generated ${icoPath} (32x32)`);
  } catch (err) {
    console.error(`❌ Error generating favicons:`, err.message);
  }
}

async function generateAssets() {
  console.log('🎨 Generating assets from icon-transparent.png...\n');

  const assetsDir = path.join(__dirname, '..', 'assets');
  const iconsDir = path.join(assetsDir, 'icons');
  const sourcePng = path.join(assetsDir, 'icon-transparent.png');

  console.log('🎨 Generating PNG icons in different sizes...\n');

  // Generate PNG icons from PNG
  await generatePNGIcons(sourcePng, iconsDir);

  console.log('\n🎨 Generating favicon variants...\n');

  // Generate favicon variants from PNG
  await generateFavicons(sourcePng, iconsDir);

  console.log('\n🎉 All assets generated successfully!');
}

if (require.main === module) {
  generateAssets().catch(console.error);
}

module.exports = { generateAssets };