const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');

// Generate simple svc_N ID format
function generateSvcId(num) {
  return `svc_${num}`;
}

// Generate slug from name
function generateSlug(name) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  // Add common suffixes for clarity
  const slugMap = {
    'bike': 'bike-rental',
    'car-rental': 'car-rental',
    'luxury-car': 'luxury-car-rental',
    'selfdrive-car': 'self-drive-car-rentals',
    'bus-rental': 'bus-rental',
    'truck-rental': 'truck-rental',
    'packers-and-movers': 'packers-and-movers',
    'equipment': 'equipment-rental',
  };

  return slugMap[slug] || slug;
}

// Determine flow type based on service
function getFlowType(name) {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('selfdrive') || nameLower.includes('self-drive') || nameLower.includes('bike')) {
    return 'BROWSE_FIRST';
  }
  if (nameLower.includes('luxury')) {
    return 'TRIP_FIRST';
  }
  return 'QUOTE_BASED';
}

async function migrateServices() {
  const prisma = new PrismaClient();

  // Connect to source database (trbugs)
  const sourceDb = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'trbugs'
  });

  try {
    console.log('Fetching services from trbugs...');

    // Get all services from source ordered by parent dependency
    const [rows] = await sourceDb.execute(`
      SELECT id, name, parent_id, status, image, created_at, updated_at
      FROM services
      ORDER BY
        CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END,
        id
    `);

    console.log(`Found ${rows.length} services to migrate`);

    // Map old IDs to new svc_N IDs
    const idMap = new Map();

    // First pass: generate new IDs
    for (const row of rows) {
      const newId = generateSvcId(row.id);
      idMap.set(row.id, newId);
    }

    // Second pass: insert services
    let inserted = 0;
    let errors = 0;

    for (const row of rows) {
      try {
        const newId = idMap.get(row.id);
        const newParentId = row.parent_id ? idMap.get(row.parent_id) : null;
        const slug = generateSlug(row.name);
        const flowType = getFlowType(row.name);

        await prisma.service.create({
          data: {
            id: newId,
            name: row.name,
            slug: slug,
            parentId: newParentId,
            description: `${row.name} services across India`,
            shortDesc: row.name,
            image: row.image || null,
            flowType: flowType,
            isActive: row.status === 1,
            displayOrder: row.id,
            createdAt: row.created_at || new Date(),
            updatedAt: row.updated_at || new Date(),
          }
        });

        console.log(`Inserted: ${row.name} (${newId}) -> slug: ${slug}, flowType: ${flowType}`);
        inserted++;
      } catch (err) {
        console.error(`Error inserting ${row.name}:`, err.message);
        errors++;
      }
    }

    console.log(`\nMigration complete!`);
    console.log(`Inserted: ${inserted}`);
    console.log(`Errors: ${errors}`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
    await sourceDb.end();
  }
}

migrateServices();
