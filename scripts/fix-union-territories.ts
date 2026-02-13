// Fix Union Territories data
import { prisma } from '../src/lib/db/prisma';

const ACTUAL_UNION_TERRITORIES = [
  'Delhi',
  'Chandigarh',
  'Puducherry',
  'Jammu and Kashmir',
  'Ladakh',
  'Andaman and Nicobar Islands',
  'Lakshadweep',
  'Dadra and Nagar Haveli and Daman and Diu',
];

async function fixUnionTerritories() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔧 FIXING UNION TERRITORIES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Step 1: Check which actual UTs exist in database
  console.log('Step 1: Checking which actual UTs exist in database...\n');

  for (const utName of ACTUAL_UNION_TERRITORIES) {
    const location = await prisma.locations.findFirst({
      where: {
        name: {
          contains: utName.split(' ')[0], // Search by first word
        },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        type: true,
        parentId: true,
      },
    });

    if (location) {
      console.log(`✅ Found: ${location.name} (${location.id})`);
      console.log(`   Current type: ${location.type}`);
      console.log(`   ParentId: ${location.parentId || 'NULL'}`);

      if (location.type !== 'UNION_TERRITORY') {
        console.log(`   ⚠️  Should be UNION_TERRITORY!\n`);
      } else {
        console.log(`   ✅ Already marked as UNION_TERRITORY\n`);
      }
    } else {
      console.log(`❌ NOT FOUND: ${utName}\n`);
    }
  }

  // Step 2: Fix Goa (change back to STATE)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Step 2: Fixing Goa (should be STATE, not UT)...\n');

  const goa = await prisma.locations.findFirst({
    where: { name: 'Goa' },
  });

  if (goa && goa.type === 'UNION_TERRITORY') {
    await prisma.locations.update({
      where: { id: goa.id },
      data: { type: 'STATE' },
    });
    console.log('✅ Goa changed from UNION_TERRITORY → STATE\n');
  } else {
    console.log('ℹ️  Goa is already a STATE or not found\n');
  }

  // Step 3: Update actual UTs to UNION_TERRITORY type
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Step 3: Updating actual UTs to UNION_TERRITORY type...\n');

  let updatedCount = 0;

  for (const utName of ACTUAL_UNION_TERRITORIES) {
    const location = await prisma.locations.findFirst({
      where: {
        name: {
          contains: utName.split(' ')[0],
        },
        isActive: true,
      },
    });

    if (location && location.type !== 'UNION_TERRITORY') {
      await prisma.locations.update({
        where: { id: location.id },
        data: {
          type: 'UNION_TERRITORY',
          parentId: null, // UTs should have no parent
        },
      });
      console.log(`✅ Updated: ${location.name} → UNION_TERRITORY`);
      updatedCount++;
    }
  }

  console.log(`\n✅ Updated ${updatedCount} locations to UNION_TERRITORY\n`);

  // Step 4: Check cities and link them
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Step 4: Checking cities for each UT...\n');

  const uts = await prisma.locations.findMany({
    where: { type: 'UNION_TERRITORY', isActive: true },
    select: { id: true, name: true, slug: true },
  });

  console.log(`Found ${uts.length} Union Territories:\n`);

  for (const ut of uts) {
    console.log(`\n📍 ${ut.name}:`);

    // Find cities that should belong to this UT
    const cities = await prisma.locations.findMany({
      where: {
        type: 'CITY',
        isActive: true,
        OR: [
          { parentId: ut.id }, // Already linked
          {
            name: {
              contains: ut.name.split(' ')[0]
            }
          }, // Name matches UT name
        ],
      },
      select: {
        id: true,
        name: true,
        parentId: true,
      },
    });

    if (cities.length === 0) {
      console.log(`   ⚠️  No cities found for ${ut.name}`);
      console.log(`   You may need to manually add cities for this UT`);
    } else {
      console.log(`   Found ${cities.length} potential cities:`);

      for (const city of cities) {
        if (city.parentId === ut.id) {
          console.log(`      ✅ ${city.name} (already linked)`);
        } else if (city.parentId) {
          console.log(`      ⚠️  ${city.name} (linked to different parent: ${city.parentId})`);
        } else {
          // Update city to link to this UT
          await prisma.locations.update({
            where: { id: city.id },
            data: { parentId: ut.id },
          });
          console.log(`      ✅ ${city.name} (NOW LINKED)`);
        }
      }
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ DONE! Now check the fleet page again.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await prisma.$disconnect();
}

fixUnionTerritories()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
