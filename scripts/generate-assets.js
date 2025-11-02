const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

const sizes = [16, 32, 48, 128];

async function copySVG(sourceSvgPath, outputSvgPath) {
  try {
    fs.mkdirSync(path.dirname(outputSvgPath), { recursive: true });
    fs.copyFileSync(sourceSvgPath, outputSvgPath);
    console.log(`✓ Copied ${outputSvgPath}`);
  } catch (err) {
    console.error(`❌ Error copying ${outputSvgPath}:`, err.message);
  }
}

async function generatePNGIcons(svgPath, outputDir, baseName) {
  try {
    fs.mkdirSync(outputDir, { recursive: true });
    const svgBuffer = fs.readFileSync(svgPath);

    for (const size of sizes) {
      const outputPath = `${outputDir}/icon-${size}.png`;
      await sharp(svgBuffer)
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

async function generateFavicons(svgPath, outputDir) {
  try {
    fs.mkdirSync(outputDir, { recursive: true });
    const svgBuffer = fs.readFileSync(svgPath);
    
    const faviconSizes = [16, 32, 48];
    for (const size of faviconSizes) {
      const outputPath = `${outputDir}/favicon-${size}x${size}.png`;
      await sharp(svgBuffer)
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
    await sharp(svgBuffer)
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
  console.log('🎨 Generating assets from icon-transparent.svg...\n');

  const assetsDir = path.join(__dirname, '..', 'assets');
  const iconsDir = path.join(assetsDir, 'icons');
  const sourceSvg = path.join(assetsDir, 'icon-transaparent.svg'); // Note: actual filename has typo
  
  // Copy the transparent SVG as the main icon
  await copySVG(sourceSvg, path.join(iconsDir, 'icon.svg'));

  console.log('\n🎨 Generating PNG icons in different sizes...\n');

  // Generate PNG icons from SVG
  await generatePNGIcons(sourceSvg, iconsDir);

  console.log('\n🎨 Generating favicon variants...\n');

  // Generate favicon variants from SVG
  await generateFavicons(sourceSvg, iconsDir);

  console.log('\n🎉 All assets generated successfully!');
}

if (require.main === module) {
  generateAssets().catch(console.error);
}

module.exports = { generateAssets };