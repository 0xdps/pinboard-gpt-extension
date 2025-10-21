const fs = require('fs');
const sharp = require('sharp');

const ICON_PATH = 'icons/icon512.png';
const OUT_DIR = 'assets';

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function createPromoTile() {
  const width = 440;
  const height = 280;
  const bgColor = '#10a37f';

  const icon = await sharp(ICON_PATH).resize(128, 128).toBuffer();

  const svgOverlay = `
  <svg width="${width}" height="${height}">
    <rect width="100%" height="100%" rx="12" fill="${bgColor}" />
    <image href="data:image/png;base64,${icon.toString('base64')}" x="28" y="76" width="128" height="128" />
    <text x="170" y="120" font-size="28" font-family="Arial, Helvetica, sans-serif" fill="#ffffff" font-weight="700">PinGPT</text>
    <text x="170" y="155" font-size="16" font-family="Arial, Helvetica, sans-serif" fill="#f4fff8">Pin ChatGPT messages and jump back instantly</text>
  </svg>`;

  await sharp(Buffer.from(svgOverlay)).png().toFile(`${OUT_DIR}/promo-440x280.png`);
  console.log('✓ Created promo-440x280.png');
}

async function createMarquee() {
  const width = 1400;
  const height = 560;
  const bgColor = '#0d8a6a';

  const icon = await sharp(ICON_PATH).resize(220, 220).toBuffer();

  const svgOverlay = `
  <svg width="${width}" height="${height}">
    <rect width="100%" height="100%" rx="0" fill="${bgColor}" />
    <image href="data:image/png;base64,${icon.toString('base64')}" x="80" y="170" width="220" height="220" />
    <text x="340" y="260" font-size="64" font-family="Arial, Helvetica, sans-serif" fill="#ffffff" font-weight="700">PinGPT</text>
    <text x="340" y="320" font-size="28" font-family="Arial, Helvetica, sans-serif" fill="#e7fff3">Save and organize important ChatGPT messages</text>
  </svg>`;

  await sharp(Buffer.from(svgOverlay)).png().toFile(`${OUT_DIR}/marquee-1400x560.png`);
  console.log('✓ Created marquee-1400x560.png');
}

async function createScreenshots() {
  const w = 1280;
  const h = 800;

  // Placeholder: Create a popup-like mockup
  const popupSVG = `
  <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="100%" height="100%" fill="#f4f6f7" />
    <rect x="60" y="60" width="1160" height="680" rx="12" fill="#ffffff" stroke="#e6e6e6" />
    <text x="90" y="120" font-size="36" font-family="Arial, Helvetica, sans-serif" fill="#222222">PinGPT — Saved Pins</text>

    <!-- Sample pins list -->
    <g transform="translate(90,160)">
      <rect x="0" y="0" width="1100" height="120" rx="8" fill="#fafafa" stroke="#eee" />
      <text x="20" y="40" font-size="20" fill="#111">ChatGPT response about JavaScript closures</text>
      <text x="20" y="74" font-size="14" fill="#666">Pinned • Oct 21, 2025 • chat.openai.com</text>

      <rect x="0" y="140" width="1100" height="120" rx="8" fill="#fafafa" stroke="#eee" />
      <text x="20" y="180" font-size="20" fill="#111">How to center a div with CSS</text>
      <text x="20" y="214" font-size="14" fill="#666">Pinned • Oct 21, 2025 • chat.openai.com</text>
    </g>

    <!-- Right panel mockup -->
    <rect x="960" y="60" width="200" height="200" rx="8" fill="#f9fafb" stroke="#eee" />
    <text x="980" y="100" font-size="14" fill="#111">Search</text>

  </svg>`;
  await sharp(Buffer.from(popupSVG)).png().toFile(`${OUT_DIR}/screenshot-pins-1280x800.png`);
  console.log('✓ Created screenshot-pins-1280x800.png');

  // Highlighted message mockup
  const highlightSVG = `
  <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="100%" height="100%" fill="#ffffff" />
    <rect x="60" y="220" width="1160" height="140" rx="8" fill="#10a37f" fill-opacity="0.08" />
    <text x="80" y="270" font-size="20" fill="#111">This is the highlighted message when jumping back to a pin</text>
  </svg>`;
  await sharp(Buffer.from(highlightSVG)).png().toFile(`${OUT_DIR}/screenshot-highlight-1280x800.png`);
  console.log('✓ Created screenshot-highlight-1280x800.png');

  // Pin dialog mockup
  const dialogSVG = `
  <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="100%" height="100%" fill="#ffffff" />
    <rect x="340" y="220" width="600" height="360" rx="12" fill="#ffffff" stroke="#e6e6e6" />
    <text x="380" y="280" font-size="28" fill="#111">Pin Message</text>
    <rect x="380" y="320" width="520" height="120" rx="8" fill="#f7f7f7" />
    <text x="380" y="360" font-size="16" fill="#333">Add a name and tags for this pin</text>
  </svg>`;
  await sharp(Buffer.from(dialogSVG)).png().toFile(`${OUT_DIR}/screenshot-dialog-1280x800.png`);
  console.log('✓ Created screenshot-dialog-1280x800.png');

  // Search/tags mockup
  const searchSVG = `
  <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="100%" height="100%" fill="#ffffff" />
    <text x="90" y="120" font-size="36" font-family="Arial, Helvetica, sans-serif" fill="#222222">Search Pins</text>

    <rect x="90" y="160" width="1100" height="80" rx="8" fill="#fafafa" stroke="#eee" />
    <text x="110" y="210" font-size="20" fill="#111">Query: css center</text>

    <g transform="translate(90,290)">
      <rect x="0" y="0" width="1100" height="120" rx="8" fill="#fafafa" stroke="#eee" />
      <text x="20" y="40" font-size="20" fill="#111">Centered div solution</text>
      <text x="20" y="74" font-size="14" fill="#666">tag: css • Oct 21, 2025</text>
    </g>
  </svg>`;
  await sharp(Buffer.from(searchSVG)).png().toFile(`${OUT_DIR}/screenshot-search-1280x800.png`);
  console.log('✓ Created screenshot-search-1280x800.png');
}

async function createScaled() {
  const sizes = [640, 400];
  const files = [
    'screenshot-pins-1280x800.png',
    'screenshot-highlight-1280x800.png',
    'screenshot-dialog-1280x800.png',
    'screenshot-search-1280x800.png',
  ];

  for (const file of files) {
    await sharp(`assets/${file}`).resize(640, 400).toFile(`assets/${file.replace('1280x800', '640x400')}`);
    console.log(`✓ Created ${file.replace('1280x800', '640x400')}`);
  }
}

(async () => {
  try {
    await createPromoTile();
    await createMarquee();
    await createScreenshots();
    await createScaled();
    console.log('\nAll assets generated in assets/');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
