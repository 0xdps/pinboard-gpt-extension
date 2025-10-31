const fs = require('fs');
const sharp = require('sharp');

const sizes = [16, 32, 48, 128, 256, 512];

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

    fs.mkdirSync(require('path').dirname(outputSvgPath), { recursive: true });
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
      const outputPath = `${outputDir}/${baseName}-${size}.png`;
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

async function generateAssets() {
  console.log('🎨 Generating SVG files from PNG assets...\n');

  await generateSVGWithEmbeddedImage(
    'gpt-icon-pinboard-background.png',
    '../src/common/icons/GPT-Pinboard-Icon.svg',
    675,
    675
  );

  await generateSVGWithEmbeddedImage(
    'gpt-logo-pinboard-background.png',
    '../src/common/GPT-Pinboard-Logo.svg',
    150,
    75
  );

  console.log('\n🎨 Generating PNG icons in different sizes...\n');

  await generatePNGIcons(
    'gpt-icon-pinboard-background.png',
    '../src/common/icons',
    'icon'
  );

  console.log('\n🎉 All assets generated successfully!');
}

generateAssets().catch(console.error);
