const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateServiceTypes() {
  try {
    console.log('🔧 Updating notification service types...\n');

    // Update based on title patterns
    const updates = [
      { pattern: 'Bike', serviceType: 'bike' },
      { pattern: 'Bus', serviceType: 'bus' },
      { pattern: 'Truck', serviceType: 'truck' },
      { pattern: 'Equipment', serviceType: 'equipment' },
      { pattern: 'Packers', serviceType: 'packers' },
      { pattern: 'Movers', serviceType: 'packers' },
      { pattern: 'Self-Drive', serviceType: 'self-drive' },
      { pattern: 'Luxury', serviceType: 'luxury' },
    ];

    for (const { pattern, serviceType } of updates) {
      const result = await prisma.notifications.updateMany({
        where: {
          title: { contains: pattern },
          serviceType: null,
        },
        data: { serviceType },
      });
      console.log(`✅ Updated ${result.count} notifications with "${pattern}" -> serviceType: "${serviceType}"`);
    }

    // Also clean bad IDs while we're at it
    console.log('\n🔧 Cleaning bad IDs...\n');

    const badNotifs = await prisma.notifications.findMany({
      where: {
        OR: [
          { quoteId: { endsWith: '-' } },
          { quoteId: { equals: 'null' } },
          { bookingId: { equals: 'null' } },
        ],
      },
    });

    console.log(`Found ${badNotifs.length} notifications with bad IDs\n`);

    for (const notif of badNotifs) {
      const updates = {};

      if (notif.quoteId && notif.quoteId.endsWith('-')) {
        updates.quoteId = notif.quoteId.replace(/-+$/, '');
        console.log(`  Cleaning quote ID: "${notif.quoteId}" -> "${updates.quoteId}"`);
      } else if (notif.quoteId === 'null') {
        updates.quoteId = null;
        console.log(`  Fixing null string: "${notif.quoteId}" -> null`);
      }

      if (notif.bookingId === 'null') {
        updates.bookingId = null;
        console.log(`  Fixing null string: "${notif.bookingId}" -> null`);
      }

      if (Object.keys(updates).length > 0) {
        await prisma.notifications.update({
          where: { id: notif.id },
          data: updates,
        });
        console.log(`  ✅ Fixed notification: ${notif.id}\n`);
      }
    }

    console.log('\n✅ All notifications updated!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

updateServiceTypes();
