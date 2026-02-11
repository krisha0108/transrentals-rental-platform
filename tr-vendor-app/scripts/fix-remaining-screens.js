const fs = require('fs');
const path = require('path');

const files = [
  'screens/vendor/services/truck/TruckQuoteRequestsScreen.js',
  'screens/vendor/services/truck/TruckMyQuotesScreen.js',
  'screens/vendor/services/truck/TruckBookingsScreen.js',
  'screens/vendor/services/packers/PackersQuoteRequestsScreen.js',
  'screens/vendor/services/packers/PackersMyQuotesScreen.js',
  'screens/vendor/services/packers/PackersBookingsScreen.js',
];

const OLD_PATTERN = /onApply=\{(\([^)]*\))\s*=>\s*applyDateFilter\(([^)]*)\)\}/g;
const NEW_PATTERN = 'onApply={(start, end, filterType) => applyDateFilter(start, end, filterType)}';

const OLD_CURRENT_DATES = /(currentStartDate=\{dateFilter\.start\}\s*currentEndDate=\{dateFilter\.end\})/;
const NEW_CURRENT_DATES = 'currentStartDate={dateFilter.start}\n        currentEndDate={dateFilter.end}\n        currentFilterType={dateFilter.type}';

files.forEach((file) => {
  const filePath = path.join(__dirname, '..', file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix onApply pattern
  if (content.match(OLD_PATTERN)) {
    content = content.replace(OLD_PATTERN, NEW_PATTERN);
    modified = true;
    console.log(`✅ Fixed onApply in: ${file}`);
  }

  // Fix currentStartDate/currentEndDate pattern to add currentFilterType
  if (content.match(OLD_CURRENT_DATES) && !content.includes('currentFilterType')) {
    content = content.replace(OLD_CURRENT_DATES, NEW_CURRENT_DATES);
    modified = true;
    console.log(`✅ Added currentFilterType to: ${file}`);
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`💾 Saved: ${file}\n`);
  } else {
    console.log(`⏭️  No changes needed: ${file}\n`);
  }
});

console.log('✨ Done!');
