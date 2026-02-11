const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBadNotifications() {
  try {
    // Find notifications with bad quote IDs
    const allNotifications = await prisma.notifications.findMany({
      where: {
        quoteId: {
          not: null
        }
      },
      select: {
        id: true,
        title: true,
        quoteId: true,
        bookingId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    console.log('\n📋 Last 10 Notifications with Quote IDs:\n');
    allNotifications.forEach(notif => {
      const quoteIdValid = notif.quoteId && notif.quoteId.length >= 10 && !notif.quoteId.endsWith('-');
      const bookingIdValid = !notif.bookingId || (notif.bookingId !== 'null' && notif.bookingId.length >= 10);
      
      console.log(`ID: ${notif.id}`);
      console.log(`Title: ${notif.title}`);
      console.log(`Quote ID: "${notif.quoteId}" ${quoteIdValid ? '✅' : '❌ INVALID'}`);
      console.log(`Booking ID: "${notif.bookingId}" ${bookingIdValid ? '✅' : '❌ INVALID'}`);
      console.log(`Created: ${notif.createdAt}`);
      console.log('---\n');
    });

    // Check if the quote actually exists
    const badNotifs = allNotifications.filter(n => !n.quoteId || n.quoteId.endsWith('-'));
    if (badNotifs.length > 0) {
      console.log(`\n⚠️  Found ${badNotifs.length} notifications with bad quote IDs!\n`);
      
      for (const notif of badNotifs) {
        // Try to find the quote
        const cleanQuoteId = notif.quoteId?.replace(/-+$/, ''); // Remove trailing dashes
        console.log(`\n🔍 Checking quote: "${notif.quoteId}" -> cleaned: "${cleanQuoteId}"`);
        
        // Check all quote tables
        const bikeQuote = await prisma.bike_quote_requests.findUnique({ where: { id: cleanQuoteId } });
        const busQuote = await prisma.bus_quote_requests.findUnique({ where: { id: cleanQuoteId } });
        const truckQuote = await prisma.truck_quote_requests.findUnique({ where: { id: cleanQuoteId } });
        
        if (bikeQuote) console.log(`   ✅ Found in bike_quote_requests`);
        if (busQuote) console.log(`   ✅ Found in bus_quote_requests`);
        if (truckQuote) console.log(`   ✅ Found in truck_quote_requests`);
        
        if (!bikeQuote && !busQuote && !truckQuote) {
          console.log(`   ❌ Quote not found in any table!`);
        }
        
        // Fix the notification
        console.log(`\n🔧 Fixing notification ${notif.id}...`);
        await prisma.notifications.update({
          where: { id: notif.id },
          data: {
            quoteId: cleanQuoteId || null,
            bookingId: notif.bookingId === 'null' ? null : notif.bookingId
          }
        });
        console.log(`   ✅ Fixed!`);
      }
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkBadNotifications();
