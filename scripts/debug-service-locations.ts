// Debug what's in service_locations for bike-on-rent
import { prisma } from '../src/lib/db/prisma';

async function debugServiceLocations() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 DEBUGGING SERVICE LOCATIONS FOR BIKE-ON-RENT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Get bike service
  const service = await prisma.services.findUnique({
    where: { slug: 'bike-on-rent' },
  });

  if (!service) {
    console.log('❌ Service not found!');
    return;
  }

  console.log(`✅ Service: ${service.name} (${service.id})\n`);

  // Get all enabled locations for this service
  const serviceLocations = await prisma.service_locations.findMany({
    where: {
      serviceId: service.id,
      isActive: true,
    },
    include: {
      locations: {
        select: {
          id: true,
          name: true,
          type: true,
          slug: true,
          parentId: true,
        },
      },
    },
  });

  console.log(`Total enabled locations: ${serviceLocations.length}\n`);

  // Group by type
  const byType: Record<string, any[]> = {};
  serviceLocations.forEach((sl) => {
    const type = sl.locations.type;
    if (!byType[type]) byType[type] = [];
    byType[type].push(sl.locations);
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 BREAKDOWN BY TYPE:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  Object.keys(byType).forEach((type) => {
    console.log(`${type}: ${byType[type].length}`);
  });

  // Check Union Territories specifically
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏛️  UNION TERRITORIES IN service_locations:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (byType['UNION_TERRITORY']) {
    console.log(`Found ${byType['UNION_TERRITORY'].length} Union Territories:\n`);
    byType['UNION_TERRITORY'].forEach((loc, i) => {
      console.log(`${i + 1}. ${loc.name} (${loc.id})`);
      console.log(`   Slug: ${loc.slug}`);
      console.log(`   ParentId: ${loc.parentId || 'NULL'}\n`);
    });
  } else {
    console.log('❌ NO Union Territories found in service_locations!\n');
    console.log('This is the problem - Union Territories themselves are not in service_locations.\n');
  }

  // Check cities that belong to UTs
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏙️  CITIES THAT BELONG TO UNION TERRITORIES:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Get all union territories
  const uts = await prisma.locations.findMany({
    where: { type: 'UNION_TERRITORY', isActive: true },
    select: { id: true, name: true },
  });

  const utIds = new Set(uts.map((ut) => ut.id));

  // Cities in service_locations that have UT as parent
  const citiesInUTs = serviceLocations.filter(
    (sl) =>
      sl.locations.type === 'CITY' &&
      sl.locations.parentId &&
      utIds.has(sl.locations.parentId)
  );

  if (citiesInUTs.length > 0) {
    console.log(`✅ Found ${citiesInUTs.length} cities in Union Territories:\n`);

    // Group by parent UT
    const byUT: Record<string, any[]> = {};
    citiesInUTs.forEach((sl) => {
      const parentId = sl.locations.parentId!;
      const ut = uts.find((u) => u.id === parentId);
      const utName = ut ? ut.name : parentId;

      if (!byUT[utName]) byUT[utName] = [];
      byUT[utName].push(sl.locations);
    });

    Object.keys(byUT).forEach((utName) => {
      console.log(`📍 ${utName}: ${byUT[utName].length} cities`);
      byUT[utName].forEach((city) => {
        console.log(`   - ${city.name} (${city.id})`);
      });
      console.log();
    });
  } else {
    console.log('❌ NO cities found that belong to Union Territories!\n');
    console.log('This means cities are not properly linked to UTs via parentId.\n');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 DIAGNOSIS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('For Union Territories to appear in fleet assignment:');
  console.log('1. Union Territory must exist in locations table (type=UNION_TERRITORY) ✅');
  console.log('2. Cities must be linked to UT via parentId');
  console.log('3. Those cities must be in service_locations with isActive=true\n');

  if (citiesInUTs.length === 0) {
    console.log('❌ PROBLEM: No cities are linked to Union Territories AND enabled for bike service.\n');
    console.log('SOLUTION: Either:');
    console.log('  A. Link existing cities to union territories (set their parentId)');
    console.log('  B. Add union territory cities to service_locations\n');
  } else {
    console.log(`✅ ${citiesInUTs.length} cities are properly linked to UTs and enabled.\n`);
    console.log('The API should be returning these UTs. Check if there\'s a caching issue.\n');
  }

  await prisma.$disconnect();
}

debugServiceLocations().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
