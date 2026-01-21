// @ts-nocheck
/**
 * Migration script to transfer locations and services from HOC CRM database to transrentals CMS
 *
 * HOC Database: bugsolving (MySQL)
 * CMS Database: transrentals_cms (MySQL)
 *
 * Run with: npx tsx prisma/migrate-hoc-data.ts
 */

import { PrismaClient } from '@prisma/client';
import mysql from 'mysql2/promise';

// CMS Prisma client
const prisma = new PrismaClient();

// HOC Database connection config
const hocDbConfig = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '',
  database: 'bugsolving',
};

// Map HOC location type to CMS LocationType enum
function mapLocationType(hocType: string): 'COUNTRY' | 'STATE' | 'CITY' | 'AREA' {
  const typeMap: Record<string, 'COUNTRY' | 'STATE' | 'CITY' | 'AREA'> = {
    'country': 'COUNTRY',
    'state': 'STATE',
    'city': 'CITY',
    'street': 'AREA', // HOC uses 'street', CMS uses 'AREA'
  };
  return typeMap[hocType.toLowerCase()] || 'CITY';
}

// Generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Map to track HOC ID -> CMS ID for locations
const locationIdMap = new Map<number, string>();
// Map to track HOC ID -> CMS ID for services
const serviceIdMap = new Map<number, string>();

async function migrateLocations(hocConnection: mysql.Connection) {
  console.log('\n📍 Starting Location Migration...\n');

  // Fetch all locations from HOC database
  const [rows] = await hocConnection.execute(
    'SELECT id, name, type, parent_id, status, image, latitude, longitude, created_at, updated_at FROM locations ORDER BY parent_id ASC NULLS FIRST, id ASC'
  );

  const locations = rows as any[];
  console.log(`Found ${locations.length} locations in HOC database`);

  // First pass: Create all locations without parent relationships
  // Second pass: Update parent relationships

  // Track existing slugs to avoid duplicates
  const usedSlugs = new Set<string>();

  // Get existing slugs from CMS database
  const existingLocations = await prisma.location.findMany({
    select: { slug: true }
  });
  existingLocations.forEach(l => usedSlugs.add(l.slug));

  // First pass: Create locations (parent first, then children)
  // Sort by parent_id to ensure parents are created first
  const sortedLocations = [...locations].sort((a, b) => {
    if (a.parent_id === null && b.parent_id !== null) return -1;
    if (a.parent_id !== null && b.parent_id === null) return 1;
    return (a.parent_id || 0) - (b.parent_id || 0);
  });

  let created = 0;
  let skipped = 0;

  for (const loc of sortedLocations) {
    try {
      // Generate unique slug
      let slug = generateSlug(loc.name);
      let slugCounter = 1;
      const originalSlug = slug;

      while (usedSlugs.has(slug)) {
        slug = `${originalSlug}-${slugCounter}`;
        slugCounter++;
      }
      usedSlugs.add(slug);

      // Get CMS parent ID if parent exists
      let cmsParentId: string | null = null;
      if (loc.parent_id && locationIdMap.has(loc.parent_id)) {
        cmsParentId = locationIdMap.get(loc.parent_id) || null;
      }

      // Create location in CMS
      const newLocation = await prisma.location.create({
        data: {
          name: loc.name,
          slug: slug,
          type: mapLocationType(loc.type),
          parentId: cmsParentId,
          isActive: loc.status === 1 || loc.status === true,
          image: loc.image || null,
          latitude: loc.latitude ? parseFloat(loc.latitude) : null,
          longitude: loc.longitude ? parseFloat(loc.longitude) : null,
          displayOrder: 0,
          timezone: 'Asia/Kolkata',
        },
      });

      // Store mapping
      locationIdMap.set(loc.id, newLocation.id);
      created++;

      console.log(`✅ Created: ${loc.name} (${loc.type}) -> ${newLocation.id}`);
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`⏭️  Skipped (duplicate): ${loc.name}`);
        skipped++;
      } else {
        console.error(`❌ Error creating ${loc.name}:`, error.message);
      }
    }
  }

  console.log(`\n📍 Location Migration Complete!`);
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);

  return locationIdMap;
}

async function migrateServices(hocConnection: mysql.Connection) {
  console.log('\n🛠️  Starting Service Migration...\n');

  // Fetch all services from HOC database
  const [rows] = await hocConnection.execute(
    'SELECT id, name, parent_id, status, image, created_at, updated_at FROM services ORDER BY parent_id ASC NULLS FIRST, id ASC'
  );

  const services = rows as any[];
  console.log(`Found ${services.length} services in HOC database`);

  // Track existing slugs to avoid duplicates
  const usedSlugs = new Set<string>();

  // Get existing slugs from CMS database
  const existingServices = await prisma.service.findMany({
    select: { slug: true }
  });
  existingServices.forEach(s => usedSlugs.add(s.slug));

  // Sort by parent_id to ensure parents are created first
  const sortedServices = [...services].sort((a, b) => {
    if (a.parent_id === null && b.parent_id !== null) return -1;
    if (a.parent_id !== null && b.parent_id === null) return 1;
    return (a.parent_id || 0) - (b.parent_id || 0);
  });

  // Define which services are fleet-based vs quote-based
  const fleetBasedKeywords = ['bike', 'self-drive', 'self drive', 'car rental', 'scooter', 'scooty'];
  const quotBasedKeywords = ['bus', 'truck', 'equipment', 'tempo', 'mini truck'];

  function determineFlowType(name: string): 'FLEET_BASED' | 'QUOTE_BASED' {
    const lowerName = name.toLowerCase();
    if (fleetBasedKeywords.some(kw => lowerName.includes(kw))) {
      return 'FLEET_BASED';
    }
    if (quotBasedKeywords.some(kw => lowerName.includes(kw))) {
      return 'QUOTE_BASED';
    }
    // Default to quote-based for unknown services
    return 'QUOTE_BASED';
  }

  let created = 0;
  let skipped = 0;

  for (const svc of sortedServices) {
    try {
      // Generate unique slug
      let slug = generateSlug(svc.name);
      let slugCounter = 1;
      const originalSlug = slug;

      while (usedSlugs.has(slug)) {
        slug = `${originalSlug}-${slugCounter}`;
        slugCounter++;
      }
      usedSlugs.add(slug);

      // Get CMS parent ID if parent exists
      let cmsParentId: string | null = null;
      if (svc.parent_id && serviceIdMap.has(svc.parent_id)) {
        cmsParentId = serviceIdMap.get(svc.parent_id) || null;
      }

      // Determine flow type based on service name
      const flowType = determineFlowType(svc.name);

      // Create service in CMS
      const newService = await prisma.service.create({
        data: {
          name: svc.name,
          slug: slug,
          parentId: cmsParentId,
          isActive: svc.status === 1 || svc.status === true,
          image: svc.image || null,
          flowType: flowType,
          displayOrder: 0,
        },
      });

      // Store mapping
      serviceIdMap.set(svc.id, newService.id);
      created++;

      console.log(`✅ Created: ${svc.name} (${flowType}) -> ${newService.id}`);
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`⏭️  Skipped (duplicate): ${svc.name}`);
        skipped++;
      } else {
        console.error(`❌ Error creating ${svc.name}:`, error.message);
      }
    }
  }

  console.log(`\n🛠️  Service Migration Complete!`);
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);

  return serviceIdMap;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  HOC CRM to TransRentals CMS Data Migration');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\nSource DB: ${hocDbConfig.database}`);
  console.log(`Target DB: transrentals_cms (via Prisma)\n`);

  let hocConnection: mysql.Connection | null = null;

  try {
    // Connect to HOC database
    console.log('🔌 Connecting to HOC database...');
    hocConnection = await mysql.createConnection(hocDbConfig);
    console.log('✅ Connected to HOC database\n');

    // Migrate locations first
    await migrateLocations(hocConnection);

    // Then migrate services
    await migrateServices(hocConnection);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  Migration Complete!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\nLocation ID Mappings: ${locationIdMap.size}`);
    console.log(`Service ID Mappings: ${serviceIdMap.size}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    if (hocConnection) {
      await hocConnection.end();
      console.log('\n🔌 HOC database connection closed');
    }
    await prisma.$disconnect();
    console.log('🔌 Prisma disconnected');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
