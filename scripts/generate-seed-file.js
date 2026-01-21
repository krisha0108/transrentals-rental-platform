/**
 * Generate Seed File from Database
 *
 * This script reads all data from your database and generates
 * the seed-locations-services.js file with current data.
 *
 * Usage: DATABASE_URL="mysql://..." node scripts/generate-seed-file.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
  console.log('📦 Fetching data from database...');

  const locations = await prisma.location.findMany({ orderBy: { id: 'asc' } });
  const services = await prisma.service.findMany({ orderBy: { id: 'asc' } });
  const tripTypes = await prisma.tripType.findMany({ orderBy: { id: 'asc' } });

  // Separate locations by type
  const countries = locations.filter(l => l.type === 'COUNTRY');
  const states = locations.filter(l => l.type === 'STATE');
  const cities = locations.filter(l => l.type === 'CITY');
  const areas = locations.filter(l => l.type === 'AREA');
  const airports = locations.filter(l => l.type === 'AIRPORT');

  console.log(`Found: ${services.length} services, ${tripTypes.length} trip types, ${locations.length} locations`);
  console.log(`  - Countries: ${countries.length}`);
  console.log(`  - States: ${states.length}`);
  console.log(`  - Cities: ${cities.length}`);
  console.log(`  - Areas: ${areas.length}`);
  console.log(`  - Airports: ${airports.length}`);

  // Generate the seed file content
  let output = `const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================
// SERVICES DATA (${services.length} services)
// ============================================
const SERVICES = [
`;

  for (const s of services) {
    const parentId = s.parentId ? `'${s.parentId}'` : 'null';
    const desc = s.description ? `"${s.description.replace(/"/g, '\\"')}"` : 'null';
    const shortDesc = s.shortDesc ? `"${s.shortDesc.replace(/"/g, '\\"')}"` : 'null';
    output += `  { id: '${s.id}', name: '${s.name.replace(/'/g, "\\'")}', slug: '${s.slug}', parentId: ${parentId}, description: ${desc}, shortDesc: ${shortDesc}, flowType: '${s.flowType}', isActive: ${s.isActive}, displayOrder: ${s.displayOrder} },\n`;
  }

  output += `];

// ============================================
// TRIP TYPES DATA (${tripTypes.length} trip types)
// ============================================
const TRIP_TYPES = [
`;

  for (const t of tripTypes) {
    const desc = t.description ? `"${t.description.replace(/"/g, '\\"')}"` : 'null';
    output += `  { id: '${t.id}', name: '${t.name.replace(/'/g, "\\'")}', slug: '${t.slug}', description: ${desc}, requiresFromLocation: ${t.requiresFromLocation}, requiresToLocation: ${t.requiresToLocation}, requiresReturnDate: ${t.requiresReturnDate}, isActive: ${t.isActive}, displayOrder: ${t.displayOrder} },\n`;
  }

  output += `];

// ============================================
// COUNTRIES DATA (${countries.length} countries)
// ============================================
const COUNTRIES = [
`;

  for (const c of countries) {
    const lat = c.latitude !== null ? c.latitude : 'null';
    const lng = c.longitude !== null ? c.longitude : 'null';
    const image = c.image ? `'${c.image}'` : 'null';
    output += `  { id: '${c.id}', name: "${c.name.replace(/"/g, '\\"')}", slug: '${c.slug}', type: 'COUNTRY', image: ${image}, latitude: ${lat}, longitude: ${lng} },\n`;
  }

  output += `];

// ============================================
// STATES DATA (${states.length} states)
// ============================================
const STATES = [
`;

  for (const s of states) {
    const parentId = s.parentId ? `'${s.parentId}'` : 'null';
    output += `  { id: '${s.id}', name: "${s.name.replace(/"/g, '\\"')}", slug: '${s.slug}', type: 'STATE', parentId: ${parentId} },\n`;
  }

  output += `];

// ============================================
// CITIES DATA (${cities.length} cities)
// ============================================
const CITIES = [
`;

  for (const c of cities) {
    const lat = c.latitude !== null ? c.latitude : 'null';
    const lng = c.longitude !== null ? c.longitude : 'null';
    const parentId = c.parentId ? `'${c.parentId}'` : 'null';
    output += `  { id: '${c.id}', name: "${c.name.replace(/"/g, '\\"')}", slug: '${c.slug}', type: 'CITY', parentId: ${parentId}, latitude: ${lat}, longitude: ${lng} },\n`;
  }

  output += `];

// ============================================
// AREAS DATA (${areas.length} areas)
// ============================================
const AREAS = [
`;

  for (const a of areas) {
    const lat = a.latitude !== null ? a.latitude : 'null';
    const lng = a.longitude !== null ? a.longitude : 'null';
    const parentId = a.parentId ? `'${a.parentId}'` : 'null';
    output += `  { id: '${a.id}', name: "${a.name.replace(/"/g, '\\"')}", slug: '${a.slug}', type: 'AREA', parentId: ${parentId}, latitude: ${lat}, longitude: ${lng} },\n`;
  }

  output += `];

// ============================================
// AIRPORTS DATA (${airports.length} airports)
// ============================================
const AIRPORTS = [
`;

  for (const a of airports) {
    const lat = a.latitude !== null ? a.latitude : 'null';
    const lng = a.longitude !== null ? a.longitude : 'null';
    const parentId = a.parentId ? `'${a.parentId}'` : 'null';
    const code = a.code ? `'${a.code}'` : 'null';
    output += `  { id: '${a.id}', name: "${a.name.replace(/"/g, '\\"')}", slug: '${a.slug}', type: 'AIRPORT', parentId: ${parentId}, code: ${code}, latitude: ${lat}, longitude: ${lng} },\n`;
  }

  output += getSeedFunctions();

  fs.writeFileSync('scripts/seed-locations-services.js', output);
  console.log('\n✅ Generated seed-locations-services.js');
  console.log(`   Total: ${locations.length} locations`);
}

function getSeedFunctions() {
  return `];

// ============================================
// SEED FUNCTIONS
// ============================================

async function seedServices() {
  console.log('\\n🔧 Seeding services...');
  const parentServices = SERVICES.filter(svc => !svc.parentId);
  const childServices = SERVICES.filter(svc => svc.parentId);
  console.log(\`   Found \${parentServices.length} parent services, \${childServices.length} child services\`);

  let parentCount = 0;
  for (const svc of parentServices) {
    try {
      await prisma.service.upsert({
        where: { id: svc.id },
        update: { name: svc.name, slug: svc.slug, description: svc.description, shortDesc: svc.shortDesc, parentId: null, flowType: svc.flowType, isActive: svc.isActive, displayOrder: svc.displayOrder },
        create: { id: svc.id, name: svc.name, slug: svc.slug, description: svc.description, shortDesc: svc.shortDesc, parentId: null, flowType: svc.flowType, isActive: svc.isActive, displayOrder: svc.displayOrder },
      });
      parentCount++;
    } catch (error) { console.error(\`   Failed to seed service \${svc.name}:\`, error.message); }
  }
  console.log(\`   ✅ \${parentCount} parent services seeded\`);

  let childCount = 0;
  for (const svc of childServices) {
    try {
      await prisma.service.upsert({
        where: { id: svc.id },
        update: { name: svc.name, slug: svc.slug, description: svc.description, shortDesc: svc.shortDesc, parentId: svc.parentId, flowType: svc.flowType, isActive: svc.isActive, displayOrder: svc.displayOrder },
        create: { id: svc.id, name: svc.name, slug: svc.slug, description: svc.description, shortDesc: svc.shortDesc, parentId: svc.parentId, flowType: svc.flowType, isActive: svc.isActive, displayOrder: svc.displayOrder },
      });
      childCount++;
    } catch (error) { console.error(\`   Failed to seed child service \${svc.name}:\`, error.message); }
  }
  console.log(\`   ✅ \${childCount} child services seeded\`);
  console.log(\`✅ Total services seeded: \${parentCount + childCount}\`);
}

async function seedTripTypes() {
  console.log('\\n🚗 Seeding trip types...');
  let count = 0;
  for (const tt of TRIP_TYPES) {
    try {
      await prisma.tripType.upsert({
        where: { id: tt.id },
        update: { name: tt.name, slug: tt.slug, description: tt.description, requiresFromLocation: tt.requiresFromLocation, requiresToLocation: tt.requiresToLocation, requiresReturnDate: tt.requiresReturnDate, isActive: tt.isActive, displayOrder: tt.displayOrder },
        create: { id: tt.id, name: tt.name, slug: tt.slug, description: tt.description, requiresFromLocation: tt.requiresFromLocation, requiresToLocation: tt.requiresToLocation, requiresReturnDate: tt.requiresReturnDate, isActive: tt.isActive, displayOrder: tt.displayOrder },
      });
      count++;
    } catch (error) { console.error(\`   Failed to seed trip type \${tt.name}:\`, error.message); }
  }
  console.log(\`✅ Trip types seeded: \${count}\`);
}

async function seedLocations() {
  console.log('\\n📍 Seeding locations...');

  let countryCount = 0;
  for (const country of COUNTRIES) {
    try {
      await prisma.location.upsert({
        where: { id: country.id },
        update: { name: country.name, slug: country.slug, type: country.type, parentId: null, image: country.image, latitude: country.latitude, longitude: country.longitude, isActive: true, timezone: 'Asia/Kolkata' },
        create: { id: country.id, name: country.name, slug: country.slug, type: country.type, parentId: null, image: country.image, latitude: country.latitude, longitude: country.longitude, isActive: true, timezone: 'Asia/Kolkata' },
      });
      countryCount++;
    } catch (error) { console.error(\`   Failed to seed country \${country.name}:\`, error.message); }
  }
  console.log(\`   ✅ \${countryCount} countries seeded\`);

  let stateCount = 0;
  for (const state of STATES) {
    try {
      await prisma.location.upsert({
        where: { id: state.id },
        update: { name: state.name, slug: state.slug, type: state.type, parentId: state.parentId, isActive: true, timezone: 'Asia/Kolkata' },
        create: { id: state.id, name: state.name, slug: state.slug, type: state.type, parentId: state.parentId, isActive: true, timezone: 'Asia/Kolkata' },
      });
      stateCount++;
    } catch (error) { console.error(\`   Failed to seed state \${state.name}:\`, error.message); }
  }
  console.log(\`   ✅ \${stateCount} states seeded\`);

  let cityCount = 0;
  for (const city of CITIES) {
    try {
      await prisma.location.upsert({
        where: { id: city.id },
        update: { name: city.name, slug: city.slug, type: city.type, parentId: city.parentId, latitude: city.latitude, longitude: city.longitude, isActive: true, timezone: 'Asia/Kolkata' },
        create: { id: city.id, name: city.name, slug: city.slug, type: city.type, parentId: city.parentId, latitude: city.latitude, longitude: city.longitude, isActive: true, timezone: 'Asia/Kolkata' },
      });
      cityCount++;
    } catch (error) { console.error(\`   Failed to seed city \${city.name}:\`, error.message); }
  }
  console.log(\`   ✅ \${cityCount} cities seeded\`);

  let areaCount = 0;
  for (const area of AREAS) {
    try {
      await prisma.location.upsert({
        where: { id: area.id },
        update: { name: area.name, slug: area.slug, type: area.type, parentId: area.parentId, latitude: area.latitude, longitude: area.longitude, isActive: true, timezone: 'Asia/Kolkata' },
        create: { id: area.id, name: area.name, slug: area.slug, type: area.type, parentId: area.parentId, latitude: area.latitude, longitude: area.longitude, isActive: true, timezone: 'Asia/Kolkata' },
      });
      areaCount++;
    } catch (error) { console.error(\`   Failed to seed area \${area.name}:\`, error.message); }
  }
  console.log(\`   ✅ \${areaCount} areas seeded\`);

  let airportCount = 0;
  for (const airport of AIRPORTS) {
    try {
      await prisma.location.upsert({
        where: { id: airport.id },
        update: { name: airport.name, slug: airport.slug, type: airport.type, parentId: airport.parentId, code: airport.code, latitude: airport.latitude, longitude: airport.longitude, isActive: true, timezone: 'Asia/Kolkata' },
        create: { id: airport.id, name: airport.name, slug: airport.slug, type: airport.type, parentId: airport.parentId, code: airport.code, latitude: airport.latitude, longitude: airport.longitude, isActive: true, timezone: 'Asia/Kolkata' },
      });
      airportCount++;
    } catch (error) { console.error(\`   Failed to seed airport \${airport.name}:\`, error.message); }
  }
  console.log(\`   ✅ \${airportCount} airports seeded\`);

  console.log(\`✅ Total locations seeded: \${countryCount + stateCount + cityCount + areaCount + airportCount}\`);
}

async function main() {
  console.log('🌱 Starting Base Data Seed\\n');
  console.log('=' .repeat(50));
  try {
    await seedLocations();
    await seedServices();
    await seedTripTypes();
    console.log('\\n' + '=' .repeat(50));
    console.log('🎉 Seed completed successfully!');
  } catch (error) {
    console.error('\\n❌ Seed failed:', error);
    throw error;
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
`;
}

main()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1); });
