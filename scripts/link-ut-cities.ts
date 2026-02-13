// Link cities to their Union Territories
import { prisma } from '../src/lib/db/prisma';

async function linkUTCities() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔗 LINKING CITIES TO UNION TERRITORIES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Get enabled UTs
  const service = await prisma.services.findUnique({
    where: { slug: 'bike-on-rent' },
  });

  if (!service) {
    console.log('❌ Service not found!');
    return;
  }

  const enabledUTs = await prisma.service_locations.findMany({
    where: {
      serviceId: service.id,
      isActive: true,
    },
    include: {
      locations: true,
    },
  });

  const uts = enabledUTs
    .filter((sl) => sl.locations && sl.locations.type === 'UNION_TERRITORY')
    .map((sl) => sl.locations);

  console.log(`Found ${uts.length} enabled Union Territories:\n`);

  for (const ut of uts) {
    console.log(`\n📍 ${ut.name} (${ut.id}):`);

    // Search for cities that might belong to this UT
    const searchTerms = [
      ut.name,
      ut.name.split(' ')[0],
      ut.slug,
    ];

    console.log(`   Searching for cities with terms: ${searchTerms.join(', ')}\n`);

    for (const term of searchTerms) {
      const cities = await prisma.locations.findMany({
        where: {
          type: 'CITY',
          isActive: true,
          name: {
            contains: term,
          },
        },
        select: {
          id: true,
          name: true,
          parentId: true,
        },
        take: 10,
      });

      if (cities.length > 0) {
        console.log(`   Found ${cities.length} potential cities for "${term}":`);
        for (const city of cities) {
          console.log(`      - ${city.name} (${city.id})`);
          console.log(`        Current parentId: ${city.parentId || 'NULL'}`);

          // If parentId is NULL or different, we can link it
          if (!city.parentId || city.parentId !== ut.id) {
            console.log(`        ⚠️  Not linked to ${ut.name}`);
          } else {
            console.log(`        ✅ Already linked to ${ut.name}`);
          }
        }
        console.log();
        break; // Found cities, no need to search more terms
      }
    }

    // Check if any cities are already linked
    const linkedCities = await prisma.locations.findMany({
      where: {
        type: 'CITY',
        parentId: ut.id,
        isActive: true,
      },
    });

    console.log(`   Currently linked cities: ${linkedCities.length}`);
    if (linkedCities.length > 0) {
      linkedCities.forEach((city) => {
        console.log(`      ✅ ${city.name}`);
      });
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 NEXT STEPS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('1. Check if the cities above should belong to the UTs');
  console.log('2. If yes, we need to:');
  console.log('   a. Update city parentId to point to UT');
  console.log('   b. Enable those cities in service_locations for bike service');
  console.log('3. Then Union Territories will appear in fleet assignment\n');

  await prisma.$disconnect();
}

linkUTCities().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
