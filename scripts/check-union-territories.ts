// Check Union Territories data and their cities
import { prisma } from '../src/lib/db/prisma';

async function checkUnionTerritories() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 CHECKING UNION TERRITORIES DATA');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. Get all union territories
  const unionTerritories = await prisma.locations.findMany({
    where: {
      type: 'UNION_TERRITORY',
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
    },
  });

  console.log(`✅ Found ${unionTerritories.length} Union Territories:\n`);
  unionTerritories.forEach((ut, index) => {
    console.log(`${index + 1}. ${ut.name} (${ut.id})`);
    console.log(`   Slug: ${ut.slug}`);
    console.log(`   ParentId: ${ut.parentId || 'NULL (correct for UT)'}\n`);
  });

  if (unionTerritories.length === 0) {
    console.log('❌ NO UNION TERRITORIES FOUND IN DATABASE!\n');
    console.log('You need to add union territories to the locations table.\n');
    return;
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏙️  CHECKING CITIES FOR EACH UNION TERRITORY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 2. For each UT, check cities
  for (const ut of unionTerritories) {
    const cities = await prisma.locations.findMany({
      where: {
        type: 'CITY',
        parentId: ut.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    console.log(`\n📍 ${ut.name}:`);
    if (cities.length === 0) {
      console.log(`   ❌ NO CITIES LINKED (parentId not set)`);
    } else {
      console.log(`   ✅ ${cities.length} cities found:`);
      cities.forEach((city) => {
        console.log(`      - ${city.name} (${city.id})`);
      });
    }
  }

  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚴 CHECKING BIKE-ON-RENT SERVICE CONFIGURATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 3. Get bike-on-rent service
  const bikeService = await prisma.services.findUnique({
    where: { slug: 'bike-on-rent' },
    select: { id: true, name: true },
  });

  if (!bikeService) {
    console.log('❌ Bike-on-rent service not found!\n');
    return;
  }

  console.log(`✅ Service: ${bikeService.name} (${bikeService.id})\n`);

  // 4. For each UT, check which cities are enabled for bike service
  for (const ut of unionTerritories) {
    const cities = await prisma.locations.findMany({
      where: {
        type: 'CITY',
        parentId: ut.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (cities.length === 0) {
      console.log(`\n📍 ${ut.name}: NO CITIES LINKED\n`);
      continue;
    }

    const cityIds = cities.map((c) => c.id);
    const enabledCities = await prisma.service_locations.findMany({
      where: {
        serviceId: bikeService.id,
        locationId: { in: cityIds },
        isActive: true,
      },
      select: {
        locationId: true,
        locations: {
          select: { name: true },
        },
      },
    });

    console.log(`\n📍 ${ut.name}:`);
    console.log(`   Total cities: ${cities.length}`);
    console.log(`   Enabled for bike-on-rent: ${enabledCities.length}`);

    if (enabledCities.length === 0) {
      console.log(`   ❌ NO CITIES ENABLED FOR BIKE SERVICE`);
      console.log(`   Cities that need to be enabled:`);
      cities.forEach((city) => {
        console.log(`      - ${city.name} (${city.id})`);
      });
    } else {
      console.log(`   ✅ Enabled cities:`);
      enabledCities.forEach((ec) => {
        console.log(`      - ${ec.locations.name}`);
      });
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let totalCitiesInUTs = 0;
  let totalEnabledCities = 0;

  for (const ut of unionTerritories) {
    const cities = await prisma.locations.findMany({
      where: { type: 'CITY', parentId: ut.id, isActive: true },
    });

    const cityIds = cities.map((c) => c.id);
    const enabledCities = await prisma.service_locations.findMany({
      where: {
        serviceId: bikeService.id,
        locationId: { in: cityIds },
        isActive: true,
      },
    });

    totalCitiesInUTs += cities.length;
    totalEnabledCities += enabledCities.length;
  }

  console.log(`Union Territories: ${unionTerritories.length}`);
  console.log(`Total cities in UTs: ${totalCitiesInUTs}`);
  console.log(`Cities enabled for bike service: ${totalEnabledCities}`);
  console.log(`\n${totalEnabledCities > 0 ? '✅' : '❌'} Union territories ${totalEnabledCities > 0 ? 'SHOULD' : 'WILL NOT'} appear in fleet location assignment\n`);

  await prisma.$disconnect();
}

checkUnionTerritories()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
