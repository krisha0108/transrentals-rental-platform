const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get service by slug
  const service = await prisma.services.findUnique({
    where: { slug: 'transporter' },
    select: { id: true, name: true },
  });

  if (!service) {
    console.log('Service "transporter" not found');
    return;
  }

  console.log(`Service: ${service.name} (${service.id})`);

  // Count active service locations for this service
  const activeCount = await prisma.service_locations.count({
    where: {
      serviceId: service.id,
      isActive: true,
    },
  });

  console.log(`\nActive service_locations: ${activeCount}`);

  // Get last few IDs (ordered alphabetically - the bug!)
  const lastAlphabetical = await prisma.service_locations.findMany({
    orderBy: { id: 'desc' },
    take: 5,
    select: { id: true },
  });

  console.log('\nLast 5 IDs (alphabetical order - BUGGY):');
  lastAlphabetical.forEach(sl => console.log(`  ${sl.id}`));

  // Get all IDs and sort them numerically
  const allIds = await prisma.service_locations.findMany({
    select: { id: true },
    where: { id: { startsWith: 'SL_' } },
  });

  const sortedIds = allIds
    .map(sl => ({
      id: sl.id,
      num: parseInt(sl.id.replace('SL_', '')),
    }))
    .sort((a, b) => b.num - a.num)
    .slice(0, 5);

  console.log('\nLast 5 IDs (numeric order - CORRECT):');
  sortedIds.forEach(sl => console.log(`  ${sl.id} (${sl.num})`));

  console.log(`\nHighest ID number: ${sortedIds[0]?.num || 0}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
