const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const CSV_DIR = '/Users/thecre8r/Documents';
const OUTPUT_FILE = path.join(__dirname, '../prisma/redirects-seed.json');

// URL mapping rules
const urlMappings = {
  // Transporter: Remove "transporter-in-" prefix
  '/transporter/transporter-in-': '/transporter/',

  // Airport: Rename service
  '/airport-taxi/': '/airport-transfer/',

  // One Way: Rename service
  '/one-way-taxi-cab/': '/one-way-car-rental/',

  // Note: Trailer is now a separate service, no redirect needed
};

const redirects = [];
const processedUrls = new Set();

function normalizeUrl(url) {
  // Extract path from full URL
  if (url.startsWith('http')) {
    const urlObj = new URL(url);
    return urlObj.pathname;
  }
  return url;
}

function generateNewUrl(oldPath) {
  // Apply mapping rules
  let newPath = oldPath;

  // Transporter: transporter-in-{city} → {city}
  if (oldPath.includes('/transporter/transporter-in-')) {
    newPath = oldPath.replace('/transporter/transporter-in-', '/transporter/');
  }

  // Airport taxi → airport transfer
  else if (oldPath.includes('/airport-taxi/')) {
    newPath = oldPath.replace('/airport-taxi/', '/airport-transfer/');
  }

  // One way taxi/cab → one way car rental
  else if (oldPath.includes('/one-way-taxi-cab/')) {
    newPath = oldPath.replace('/one-way-taxi-cab/', '/one-way-car-rental/');
  }

  // Trailer stays as-is (separate service)
  // No redirect needed for trailer-on-rent

  return newPath;
}

function shouldCreateRedirect(oldPath, newPath) {
  // Don't create redirect if URLs are the same
  if (oldPath === newPath) return false;

  // Don't create redirect if already processed
  if (processedUrls.has(oldPath)) return false;

  // Don't redirect main service pages (they exist)
  const mainPages = [
    '/bike-on-rent/',
    '/bus-rental/',
    '/packers-and-movers/',
    '/equipment-rental/',
    '/transporter/',
    '/car-rental/',
    '/luxury-car-rental/',
  ];

  if (mainPages.includes(oldPath)) return false;

  return true;
}

function categorizeUrl(path) {
  if (path.includes('/transporter/')) return 'Transporter';
  if (path.includes('/bike-on-rent/')) return 'Bike Rental';
  if (path.includes('/bus-rental/')) return 'Bus Rental';
  if (path.includes('/packers-and-movers/')) return 'Packers & Movers';
  if (path.includes('/equipment-rental/')) return 'Equipment';
  if (path.includes('/trailer-on-rent/')) return 'Trailer';
  if (path.includes('/airport')) return 'Airport Transfer';
  if (path.includes('/one-way')) return 'One Way';
  return 'Other';
}

async function processCsvFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        if (row.URL) {
          results.push(row);
        }
      })
      .on('end', () => {
        console.log(`✅ Processed ${path.basename(filePath)}: ${results.length} URLs`);
        resolve(results);
      })
      .on('error', reject);
  });
}

async function main() {
  console.log('🚀 Starting redirect generation...\n');

  // Find all CSV files
  const csvFiles = fs.readdirSync(CSV_DIR)
    .filter(f => f.startsWith('export-all-urls-') && f.endsWith('.csv'))
    .filter(f => !f.includes('(1)')) // Skip duplicates
    .map(f => path.join(CSV_DIR, f));

  console.log(`📁 Found ${csvFiles.length} CSV files\n`);

  // Process each CSV
  for (const csvFile of csvFiles) {
    const rows = await processCsvFile(csvFile);

    for (const row of rows) {
      const oldPath = normalizeUrl(row.URL);
      const newPath = generateNewUrl(oldPath);

      if (shouldCreateRedirect(oldPath, newPath)) {
        redirects.push({
          fromPath: oldPath,
          toPath: newPath,
          type: 'PERMANENT',
          description: `${categorizeUrl(oldPath)}: ${row.Title || 'Auto-generated'}`,
          isActive: true,
        });

        processedUrls.add(oldPath);
      }
    }
  }

  // Stats
  const stats = {
    total: redirects.length,
    byCategory: {},
  };

  redirects.forEach(r => {
    const category = categorizeUrl(r.fromPath);
    stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
  });

  // Save to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(redirects, null, 2));

  console.log('\n✅ Redirect generation complete!\n');
  console.log('📊 Statistics:');
  console.log(`   Total redirects: ${stats.total}`);
  console.log('\n   By category:');
  Object.entries(stats.byCategory).forEach(([cat, count]) => {
    console.log(`   - ${cat}: ${count}`);
  });
  console.log(`\n💾 Saved to: ${OUTPUT_FILE}`);
  console.log('\n🎯 Next step: Run "npm run seed:redirects" to import to database');
}

main().catch(console.error);
