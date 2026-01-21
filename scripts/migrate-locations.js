const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');

// Generate simple loc_N ID format
function generateLocId(num) {
  return `loc_${num}`;
}

// Generate clean slug from name
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function migrateLocations() {
  const prisma = new PrismaClient();

  // Connect to source database (trbugs)
  const sourceDb = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'trbugs'
  });

  try {
    console.log('Fetching locations from trbugs...');

    // Get all locations from source ordered by parent dependency
    const [rows] = await sourceDb.execute(`
      SELECT id, name, slug, type, parent_id, state_code, image, latitude, longitude,
             status, display_order, created_at, updated_at
      FROM locations
      ORDER BY
        CASE type
          WHEN 'country' THEN 1
          WHEN 'state' THEN 2
          WHEN 'city' THEN 3
          WHEN 'street' THEN 4
        END,
        id
    `);

    console.log(`Found ${rows.length} locations to migrate`);

    // Map old IDs to new loc_N IDs
    const idMap = new Map();
    const slugCount = new Map();

    // First pass: generate new IDs using original ID numbers
    for (const row of rows) {
      const newId = generateLocId(row.id);
      idMap.set(row.id, newId);
    }

    // Second pass: insert locations
    let inserted = 0;
    let errors = 0;

    for (const row of rows) {
      try {
        const newId = idMap.get(row.id);
        const newParentId = row.parent_id ? idMap.get(row.parent_id) : null;

        // Generate clean slug
        let baseSlug = row.slug || generateSlug(row.name);
        let finalSlug = baseSlug;

        // Handle duplicate slugs by appending a counter
        if (slugCount.has(baseSlug)) {
          const count = slugCount.get(baseSlug) + 1;
          slugCount.set(baseSlug, count);
          // For duplicates, append parent info or type
          const typePrefix = row.type === 'street' ? 'area' : row.type;
          finalSlug = `${baseSlug}-${typePrefix}`;

          // If still duplicate, add a number
          if (slugCount.has(finalSlug)) {
            finalSlug = `${baseSlug}-${count}`;
          }
        } else {
          slugCount.set(baseSlug, 1);
        }

        // Mark this slug as used
        slugCount.set(finalSlug, 1);

        // Map type
        const typeMap = {
          'country': 'COUNTRY',
          'state': 'STATE',
          'city': 'CITY',
          'street': 'AREA'
        };

        await prisma.location.create({
          data: {
            id: newId,
            name: row.name,
            slug: finalSlug,
            type: typeMap[row.type] || 'CITY',
            parentId: newParentId,
            code: row.state_code || null,
            image: row.image || null,
            latitude: row.latitude ? parseFloat(row.latitude) : null,
            longitude: row.longitude ? parseFloat(row.longitude) : null,
            isActive: row.status === 1,
            displayOrder: row.display_order || 0,
            createdAt: row.created_at || new Date(),
            updatedAt: row.updated_at || new Date(),
          }
        });

        inserted++;
        if (inserted % 50 === 0) {
          console.log(`Inserted ${inserted}/${rows.length} locations...`);
        }
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

migrateLocations();
