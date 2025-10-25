const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

const sizes = [16, 48, 128, 256, 512];

async function generatePNGs() {
  // Use the icon SVG from assets folder
  const iconSvgPath = '../../../assets/PinGPT-Icon.svg';
  
  if (!fs.existsSync(iconSvgPath)) {
    console.error('❌ PinGPT-Icon.svg not found in assets folder!');
    return;
  }

  // Read the SVG content
  const svgContent = fs.readFileSync(iconSvgPath, 'utf8');

  for (const size of sizes) {
    try {
      // Create a data URL from the SVG
      const svgDataUrl = 'data:image/svg+xml;base64,' + Buffer.from(svgContent).toString('base64');
      
      // Load the SVG as an image
      const img = await loadImage(svgDataUrl);
      
      // Create canvas with high quality settings
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      // Enable high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Clear canvas with transparent background
      ctx.clearRect(0, 0, size, size);
      
      // Draw the SVG scaled to fit the canvas
      ctx.drawImage(img, 0, 0, size, size);
      
      // Save to PNG
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(`icon${size}.png`, buffer);
      console.log(`✓ Generated icon${size}.png (${size}x${size})`);
    } catch (err) {
      console.error(`❌ Error generating icon${size}.png:`, err.message);
    }
  }
  
  console.log('\n🎉 All icons generated successfully!');
  console.log('📁 Generated files:');
  sizes.forEach(size => console.log(`   - icon${size}.png`));
}

generatePNGs().catch(console.error);
