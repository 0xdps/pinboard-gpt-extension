const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

const sizes = [16, 32, 48, 128];

async function generateSVGWithEmbeddedImage(pngPath, outputSvgPath, width = null, height = null) {
  try {
    const imageBuffer = fs.readFileSync(pngPath);
    const base64Image = imageBuffer.toString('base64');
    const metadata = await sharp(pngPath).metadata();
    const imgWidth = width || metadata.width;
    const imgHeight = height || metadata.height;

    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${imgWidth}" height="${imgHeight}" viewBox="0 0 ${imgWidth} ${imgHeight}">
  <image href="data:image/png;base64,${base64Image}" width="${imgWidth}" height="${imgHeight}"/>
</svg>`;

    fs.mkdirSync(path.dirname(outputSvgPath), { recursive: true });
    fs.writeFileSync(outputSvgPath, svgContent);
    console.log(`✓ Generated ${outputSvgPath}`);
  } catch (err) {
    console.error(`❌ Error generating ${outputSvgPath}:`, err.message);
  }
}

async function generatePNGIcons(pngPath, outputDir, baseName) {
  try {
    fs.mkdirSync(outputDir, { recursive: true });
    const image = await sharp(pngPath);

    for (const size of sizes) {
      const outputPath = `${outputDir}/icon-${size}.png`;
      await image
        .clone()
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .toFile(outputPath);
      console.log(`✓ Generated ${outputPath} (${size}x${size})`);
    }
  } catch (err) {
    console.error(`❌ Error generating PNG icons:`, err.message);
  }
}

async function generateFavicons(pngPath, outputDir) {
  try {
    fs.mkdirSync(outputDir, { recursive: true });
    const image = await sharp(pngPath);
    
    const faviconSizes = [16, 32, 48];
    for (const size of faviconSizes) {
      const outputPath = `${outputDir}/favicon-${size}x${size}.png`;
      await image
        .clone()
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .toFile(outputPath);
      console.log(`✓ Generated ${outputPath} (${size}x${size})`);
    }

    // Generate favicon.ico (32x32)
    const icoPath = `${outputDir}/favicon.ico`;
    await image
      .clone()
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
  console.log('🎨 Generating assets from source PNG files...\n');

  const assetsDir = path.join(__dirname, '..', 'assets');
  const iconsDir = path.join(assetsDir, 'icons');
  
  // Generate main icon SVG
  await generateSVGWithEmbeddedImage(
    path.join(assetsDir, 'gpt-icon-pinboard-background.png'),
    path.join(iconsDir, 'icon.svg'),
    675,
    675
  );

  // Generate logo SVG
  await generateSVGWithEmbeddedImage(
    path.join(assetsDir, 'gpt-logo-pinboard-background.png'),
    path.join(iconsDir, 'logo.svg'),
    150,
    75
  );

  console.log('\n🎨 Generating PNG icons in different sizes...\n');

  // Generate PNG icons for extension
  await generatePNGIcons(
    path.join(assetsDir, 'gpt-icon-pinboard-background.png'),
    iconsDir
  );

  console.log('\n🎨 Generating favicon variants...\n');

  // Generate favicon variants for website
  await generateFavicons(
    path.join(assetsDir, 'gpt-icon-pinboard-background.png'),
    iconsDir
  );

  // Note: demo-screenshot.svg should exist independently in website/images/
  // It's not generated from source PNGs

  console.log('\n🎉 All assets generated successfully!');
}

if (require.main === module) {
  generateAssets().catch(console.error);
}

module.exports = { generateAssets };