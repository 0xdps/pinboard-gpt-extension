const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

const sizes = [16, 48, 128];
const svgContent = fs.readFileSync('icon.svg', 'utf8');

async function generatePNGs() {
  for (const size of sizes) {
    // Create a data URL from the SVG
    const svgDataUrl = 'data:image/svg+xml;base64,' + Buffer.from(svgContent).toString('base64');
    
    // Create canvas and load the SVG
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    try {
      const img = await loadImage(svgDataUrl);
      ctx.drawImage(img, 0, 0, size, size);
      
      // Save to PNG
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(`icon${size}.png`, buffer);
      console.log(`✓ Generated icon${size}.png`);
    } catch (err) {
      console.error(`Error generating icon${size}.png:`, err.message);
    }
  }
}

generatePNGs().catch(console.error);
