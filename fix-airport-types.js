/**
 * Migration script to fix airport types
 * Updates all locations with airport codes (IATA codes) from type='CITY' to type='AIRPORT'
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAirportTypes() {
  try {
    console.log('🔍 Finding airports with incorrect type...');

    // Find all locations with airport codes (3-letter IATA codes) but type != 'AIRPORT'
    const incorrectAirports = await prisma.locations.findMany({
      where: {
        code: { not: null },
        type: { not: 'AIRPORT' },
      },
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
      },
    });

    console.log(`Found ${incorrectAirports.length} airports with incorrect type`);

    if (incorrectAirports.length === 0) {
      console.log('✅ All airports already have correct type!');
      return;
    }

    console.log('\nAirports to be updated:');
    incorrectAirports.forEach(airport => {
      console.log(`  - ${airport.name} (${airport.code}) - Type: ${airport.type} → AIRPORT`);
    });

    console.log('\n🔄 Updating airport types...');

    // Update all airports to type='AIRPORT'
    const result = await prisma.locations.updateMany({
      where: {
        code: { not: null },
        type: { not: 'AIRPORT' },
      },
      data: {
        type: 'AIRPORT',
      },
    });

    console.log(`✅ Successfully updated ${result.count} airports to type='AIRPORT'`);

  } catch (error) {
    console.error('❌ Error fixing airport types:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
fixAirportTypes()
  .then(() => {
    console.log('\n✨ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
