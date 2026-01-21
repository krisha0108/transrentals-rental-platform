/**
 * Extract Seed Data from tr-new Database
 *
 * This script connects to tr-new database and extracts locations and services data
 * to generate seed files for the current database.
 *
 * Usage:
 * 1. Set TR_NEW_DATABASE_URL environment variable to tr-new database connection string
 * 2. Run: TR_NEW_DATABASE_URL="mysql://..." node scripts/extract-seed-from-trnew.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

// Connect to tr-new database
const prismaOld = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TR_NEW_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

async function extractData() {
  console.log('\n📦 Extracting data from tr-new database...\n');
  console.log('=' .repeat(60));

  try {
    // Extract locations
    console.log('\n📍 Fetching locations...');
    const locations = await prismaOld.locations.findMany({
      orderBy: { displayOrder: 'asc' }
    });
    console.log(`   Found ${locations.length} locations`);

    // Extract services
    console.log('\n🔧 Fetching services...');
    const services = await prismaOld.services.findMany({
      orderBy: { displayOrder: 'asc' }
    });
    console.log(`   Found ${services.length} services`);

    // Generate seed file
    await generateSeedFile(locations, services);

    console.log('\n' + '=' .repeat(60));
    console.log('✅ Data extraction completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Error extracting data:', error);
    throw error;
  }
}

function generateSeedFile(locations, services) {
  console.log('\n📝 Generating seed file...');

  // Separate locations by type
  const countries = locations.filter(l => l.type === 'COUNTRY');
  const states = locations.filter(l => l.type === 'STATE');
  const cities = locations.filter(l => l.type === 'CITY');
  const areas = locations.filter(l => l.type === 'AREA');
  const airports = locations.filter(l => l.type === 'AIRPORT');

  console.log(`   - Countries: ${countries.length}`);
  console.log(`   - States: ${states.length}`);
  console.log(`   - Cities: ${cities.length}`);
  console.log(`   - Areas: ${areas.length}`);
  console.log(`   - Airports: ${airports.length}`);

  // Separate services by parent
  const parentServices = services.filter(s => !s.parentId);
  const childServices = services.filter(s => s.parentId);

  console.log(`   - Parent Services: ${parentServices.length}`);
  console.log(`   - Child Services: ${childServices.length}`);

  let output = `const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Locations and Services Seed File
 *
 * Extracted from tr-new database on ${new Date().toISOString()}
 *
 * Usage: node scripts/seed-locations-services.js
 */

// ============================================
// SERVICES DATA (${services.length} total)
// ============================================

`;

  // Add parent services
  output += `// Parent Services (${parentServices.length})\n`;
  output += `const PARENT_SERVICES = [\n`;
  for (const s of parentServices) {
    output += formatService(s);
  }
  output += `];\n\n`;

  // Add child services
  output += `// Child/Sub Services (${childServices.length})\n`;
  output += `const CHILD_SERVICES = [\n`;
  for (const s of childServices) {
    output += formatService(s);
  }
  output += `];\n\n`;

  output += `// ============================================
// LOCATIONS DATA (${locations.length} total)
// ============================================

`;

  // Add countries
  output += `// Countries (${countries.length})\n`;
  output += `const COUNTRIES = [\n`;
  for (const loc of countries) {
    output += formatLocation(loc);
  }
  output += `];\n\n`;

  // Add states
  output += `// States (${states.length})\n`;
  output += `const STATES = [\n`;
  for (const loc of states) {
    output += formatLocation(loc);
  }
  output += `];\n\n`;

  // Add cities
  output += `// Cities (${cities.length})\n`;
  output += `const CITIES = [\n`;
  for (const loc of cities) {
    output += formatLocation(loc);
  }
  output += `];\n\n`;

  // Add areas
  output += `// Areas (${areas.length})\n`;
  output += `const AREAS = [\n`;
  for (const loc of areas) {
    output += formatLocation(loc);
  }
  output += `];\n\n`;

  // Add airports
  output += `// Airports (${airports.length})\n`;
  output += `const AIRPORTS = [\n`;
  for (const loc of airports) {
    output += formatLocation(loc);
  }
  output += `];\n\n`;

  // Add seed functions
  output += getSeedFunctions();

  // Write to file
  fs.writeFileSync('scripts/seed-locations-services.js', output);
  console.log('   ✅ Generated: scripts/seed-locations-services.js');
}

function formatService(service) {
  const id = `'${service.id}'`;
  const name = escapeString(service.name);
  const slug = `'${service.slug}'`;
  const parentId = service.parentId ? `'${service.parentId}'` : 'null';
  const description = service.description ? escapeString(service.description) : 'null';
  const shortDesc = service.shortDesc ? escapeString(service.shortDesc) : 'null';
  const icon = service.icon ? `'${service.icon}'` : 'null';
  const image = service.image ? `'${service.image}'` : 'null';
  const flowType = `'${service.flowType}'`;
  const config = service.config ? escapeString(service.config) : 'null';
  const formFields = service.formFields ? escapeString(service.formFields) : 'null';
  const isActive = service.isActive;
  const displayOrder = service.displayOrder;
  const metaTitle = service.metaTitle ? escapeString(service.metaTitle) : 'null';
  const metaDescription = service.metaDescription ? escapeString(service.metaDescription) : 'null';

  return `  { id: ${id}, name: ${name}, slug: ${slug}, parentId: ${parentId}, description: ${description}, shortDesc: ${shortDesc}, icon: ${icon}, image: ${image}, flowType: ${flowType}, config: ${config}, formFields: ${formFields}, isActive: ${isActive}, displayOrder: ${displayOrder}, metaTitle: ${metaTitle}, metaDescription: ${metaDescription} },\n`;
}

function formatLocation(location) {
  const id = `'${location.id}'`;
  const name = escapeString(location.name);
  const slug = `'${location.slug}'`;
  const type = `'${location.type}'`;
  const parentId = location.parentId ? `'${location.parentId}'` : 'null';
  const code = location.code ? `'${location.code}'` : 'null';
  const image = location.image ? `'${location.image}'` : 'null';
  const description = location.description ? escapeString(location.description) : 'null';
  const latitude = location.latitude !== null ? location.latitude : 'null';
  const longitude = location.longitude !== null ? location.longitude : 'null';
  const timezone = location.timezone ? `'${location.timezone}'` : "'Asia/Kolkata'";
  const isActive = location.isActive;
  const displayOrder = location.displayOrder;
  const metaTitle = location.metaTitle ? escapeString(location.metaTitle) : 'null';
  const metaDescription = location.metaDescription ? escapeString(location.metaDescription) : 'null';

  return `  { id: ${id}, name: ${name}, slug: ${slug}, type: ${type}, parentId: ${parentId}, code: ${code}, image: ${image}, description: ${description}, latitude: ${latitude}, longitude: ${longitude}, timezone: ${timezone}, isActive: ${isActive}, displayOrder: ${displayOrder}, metaTitle: ${metaTitle}, metaDescription: ${metaDescription} },\n`;
}

function escapeString(str) {
  if (!str) return 'null';
  // Escape backslashes first, then quotes, newlines, and other special chars
  const escaped = str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
  return `'${escaped}'`;
}

function getSeedFunctions() {
  return `// ============================================
// SEED FUNCTIONS
// ============================================

async function seedServices() {
  console.log('\\n🔧 Seeding services...');
  console.log('=' .repeat(60));

  // First seed parent services
  console.log('\\n📁 Seeding parent services...');
  let parentCount = 0;
  for (const service of PARENT_SERVICES) {
    try {
      await prisma.services.upsert({
        where: { id: service.id },
        update: {
          name: service.name,
          slug: service.slug,
          parentId: service.parentId,
          description: service.description,
          shortDesc: service.shortDesc,
          icon: service.icon,
          image: service.image,
          flowType: service.flowType,
          config: service.config,
          formFields: service.formFields,
          isActive: service.isActive,
          displayOrder: service.displayOrder,
          metaTitle: service.metaTitle,
          metaDescription: service.metaDescription,
        },
        create: {
          id: service.id,
          name: service.name,
          slug: service.slug,
          parentId: service.parentId,
          description: service.description,
          shortDesc: service.shortDesc,
          icon: service.icon,
          image: service.image,
          flowType: service.flowType,
          config: service.config,
          formFields: service.formFields,
          isActive: service.isActive,
          displayOrder: service.displayOrder,
          metaTitle: service.metaTitle,
          metaDescription: service.metaDescription,
        },
      });
      parentCount++;
      process.stdout.write(\`\\r   ✅ Progress: \${parentCount}/\${PARENT_SERVICES.length} parent services\`);
    } catch (error) {
      console.error(\`\\n   ❌ Failed to seed service \${service.name}:\`, error.message);
    }
  }
  console.log(\`\\n   ✅ \${parentCount} parent services seeded\\n\`);

  // Then seed child services
  console.log('📂 Seeding child services...');
  let childCount = 0;
  for (const service of CHILD_SERVICES) {
    try {
      await prisma.services.upsert({
        where: { id: service.id },
        update: {
          name: service.name,
          slug: service.slug,
          parentId: service.parentId,
          description: service.description,
          shortDesc: service.shortDesc,
          icon: service.icon,
          image: service.image,
          flowType: service.flowType,
          config: service.config,
          formFields: service.formFields,
          isActive: service.isActive,
          displayOrder: service.displayOrder,
          metaTitle: service.metaTitle,
          metaDescription: service.metaDescription,
        },
        create: {
          id: service.id,
          name: service.name,
          slug: service.slug,
          parentId: service.parentId,
          description: service.description,
          shortDesc: service.shortDesc,
          icon: service.icon,
          image: service.image,
          flowType: service.flowType,
          config: service.config,
          formFields: service.formFields,
          isActive: service.isActive,
          displayOrder: service.displayOrder,
          metaTitle: service.metaTitle,
          metaDescription: service.metaDescription,
        },
      });
      childCount++;
      process.stdout.write(\`\\r   ✅ Progress: \${childCount}/\${CHILD_SERVICES.length} child services\`);
    } catch (error) {
      console.error(\`\\n   ❌ Failed to seed child service \${service.name}:\`, error.message);
    }
  }
  console.log(\`\\n   ✅ \${childCount} child services seeded\`);

  console.log(\`\\n✅ Total services seeded: \${parentCount + childCount}\`);
}

async function seedLocations() {
  console.log('\\n📍 Seeding locations...');
  console.log('=' .repeat(60));

  // Seed in hierarchy order: Countries -> States -> Cities -> Areas -> Airports

  console.log('\\n🌍 Seeding countries...');
  let countryCount = 0;
  for (const loc of COUNTRIES) {
    try {
      await prisma.locations.upsert({
        where: { id: loc.id },
        update: {
          name: loc.name,
          slug: loc.slug,
          type: loc.type,
          parentId: loc.parentId,
          code: loc.code,
          image: loc.image,
          description: loc.description,
          latitude: loc.latitude,
          longitude: loc.longitude,
          timezone: loc.timezone,
          isActive: loc.isActive,
          displayOrder: loc.displayOrder,
          metaTitle: loc.metaTitle,
          metaDescription: loc.metaDescription,
        },
        create: {
          id: loc.id,
          name: loc.name,
          slug: loc.slug,
          type: loc.type,
          parentId: loc.parentId,
          code: loc.code,
          image: loc.image,
          description: loc.description,
          latitude: loc.latitude,
          longitude: loc.longitude,
          timezone: loc.timezone,
          isActive: loc.isActive,
          displayOrder: loc.displayOrder,
          metaTitle: loc.metaTitle,
          metaDescription: loc.metaDescription,
        },
      });
      countryCount++;
      process.stdout.write(\`\\r   ✅ Progress: \${countryCount}/\${COUNTRIES.length} countries\`);
    } catch (error) {
      console.error(\`\\n   ❌ Failed to seed country \${loc.name}:\`, error.message);
    }
  }
  console.log(\`\\n   ✅ \${countryCount} countries seeded\\n\`);

  console.log('🗺️  Seeding states...');
  let stateCount = 0;
  for (const loc of STATES) {
    try {
      await prisma.locations.upsert({
        where: { id: loc.id },
        update: {
          name: loc.name,
          slug: loc.slug,
          type: loc.type,
          parentId: loc.parentId,
          code: loc.code,
          image: loc.image,
          description: loc.description,
          latitude: loc.latitude,
          longitude: loc.longitude,
          timezone: loc.timezone,
          isActive: loc.isActive,
          displayOrder: loc.displayOrder,
          metaTitle: loc.metaTitle,
          metaDescription: loc.metaDescription,
        },
        create: {
          id: loc.id,
          name: loc.name,
          slug: loc.slug,
          type: loc.type,
          parentId: loc.parentId,
          code: loc.code,
          image: loc.image,
          description: loc.description,
          latitude: loc.latitude,
          longitude: loc.longitude,
          timezone: loc.timezone,
          isActive: loc.isActive,
          displayOrder: loc.displayOrder,
          metaTitle: loc.metaTitle,
          metaDescription: loc.metaDescription,
        },
      });
      stateCount++;
      process.stdout.write(\`\\r   ✅ Progress: \${stateCount}/\${STATES.length} states\`);
    } catch (error) {
      console.error(\`\\n   ❌ Failed to seed state \${loc.name}:\`, error.message);
    }
  }
  console.log(\`\\n   ✅ \${stateCount} states seeded\\n\`);

  console.log('🏙️  Seeding cities...');
  let cityCount = 0;
  for (const loc of CITIES) {
    try {
      await prisma.locations.upsert({
        where: { id: loc.id },
        update: {
          name: loc.name,
          slug: loc.slug,
          type: loc.type,
          parentId: loc.parentId,
          code: loc.code,
          image: loc.image,
          description: loc.description,
          latitude: loc.latitude,
          longitude: loc.longitude,
          timezone: loc.timezone,
          isActive: loc.isActive,
          displayOrder: loc.displayOrder,
          metaTitle: loc.metaTitle,
          metaDescription: loc.metaDescription,
        },
        create: {
          id: loc.id,
          name: loc.name,
          slug: loc.slug,
          type: loc.type,
          parentId: loc.parentId,
          code: loc.code,
          image: loc.image,
          description: loc.description,
          latitude: loc.latitude,
          longitude: loc.longitude,
          timezone: loc.timezone,
          isActive: loc.isActive,
          displayOrder: loc.displayOrder,
          metaTitle: loc.metaTitle,
          metaDescription: loc.metaDescription,
        },
      });
      cityCount++;
      process.stdout.write(\`\\r   ✅ Progress: \${cityCount}/\${CITIES.length} cities\`);
    } catch (error) {
      console.error(\`\\n   ❌ Failed to seed city \${loc.name}:\`, error.message);
    }
  }
  console.log(\`\\n   ✅ \${cityCount} cities seeded\\n\`);

  console.log('📍 Seeding areas...');
  let areaCount = 0;
  for (const loc of AREAS) {
    try {
      await prisma.locations.upsert({
        where: { id: loc.id },
        update: {
          name: loc.name,
          slug: loc.slug,
          type: loc.type,
          parentId: loc.parentId,
          code: loc.code,
          image: loc.image,
          description: loc.description,
          latitude: loc.latitude,
          longitude: loc.longitude,
          timezone: loc.timezone,
          isActive: loc.isActive,
          displayOrder: loc.displayOrder,
          metaTitle: loc.metaTitle,
          metaDescription: loc.metaDescription,
        },
        create: {
          id: loc.id,
          name: loc.name,
          slug: loc.slug,
          type: loc.type,
          parentId: loc.parentId,
          code: loc.code,
          image: loc.image,
          description: loc.description,
          latitude: loc.latitude,
          longitude: loc.longitude,
          timezone: loc.timezone,
          isActive: loc.isActive,
          displayOrder: loc.displayOrder,
          metaTitle: loc.metaTitle,
          metaDescription: loc.metaDescription,
        },
      });
      areaCount++;
      process.stdout.write(\`\\r   ✅ Progress: \${areaCount}/\${AREAS.length} areas\`);
    } catch (error) {
      console.error(\`\\n   ❌ Failed to seed area \${loc.name}:\`, error.message);
    }
  }
  console.log(\`\\n   ✅ \${areaCount} areas seeded\\n\`);

  console.log('✈️  Seeding airports...');
  let airportCount = 0;
  for (const loc of AIRPORTS) {
    try {
      await prisma.locations.upsert({
        where: { id: loc.id },
        update: {
          name: loc.name,
          slug: loc.slug,
          type: loc.type,
          parentId: loc.parentId,
          code: loc.code,
          image: loc.image,
          description: loc.description,
          latitude: loc.latitude,
          longitude: loc.longitude,
          timezone: loc.timezone,
          isActive: loc.isActive,
          displayOrder: loc.displayOrder,
          metaTitle: loc.metaTitle,
          metaDescription: loc.metaDescription,
        },
        create: {
          id: loc.id,
          name: loc.name,
          slug: loc.slug,
          type: loc.type,
          parentId: loc.parentId,
          code: loc.code,
          image: loc.image,
          description: loc.description,
          latitude: loc.latitude,
          longitude: loc.longitude,
          timezone: loc.timezone,
          isActive: loc.isActive,
          displayOrder: loc.displayOrder,
          metaTitle: loc.metaTitle,
          metaDescription: loc.metaDescription,
        },
      });
      airportCount++;
      process.stdout.write(\`\\r   ✅ Progress: \${airportCount}/\${AIRPORTS.length} airports\`);
    } catch (error) {
      console.error(\`\\n   ❌ Failed to seed airport \${loc.name}:\`, error.message);
    }
  }
  console.log(\`\\n   ✅ \${airportCount} airports seeded\`);

  const totalLocations = countryCount + stateCount + cityCount + areaCount + airportCount;
  console.log(\`\\n✅ Total locations seeded: \${totalLocations}\`);
}

async function main() {
  console.log('\\n🌱 Starting Locations & Services Seed\\n');
  console.log('=' .repeat(60));

  try {
    await seedLocations();
    await seedServices();

    console.log('\\n' + '=' .repeat(60));
    console.log('🎉 Seed completed successfully!\\n');
  } catch (error) {
    console.error('\\n❌ Seed failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;
}

// Run extraction
extractData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaOld.$disconnect();
  });
