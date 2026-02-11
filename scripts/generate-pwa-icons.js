const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Icon sizes required by PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Source logo
const sourceImage = path.join(__dirname, '../public/assets/Logo-favicon.png');
const outputDir = path.join(__dirname, '../public/icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  console.log('🎨 Generating PWA icons...\n');

  for (const size of sizes) {
    const outputFile = path.join(outputDir, `icon-${size}x${size}.png`);

    try {
      await sharp(sourceImage)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(outputFile);

      console.log(`✅ Generated: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`❌ Error generating ${size}x${size}:`, error.message);
    }
  }

  console.log('\n🎉 All PWA icons generated successfully!');
}

generateIcons().catch(console.error);
