// Check notifications in database
import { prisma } from '../src/lib/db/prisma';

async function checkNotifications() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔔 CHECKING NOTIFICATIONS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Get recent notifications
  const recentNotifications = await prisma.notifications.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      customers: {
        select: { name: true, email: true },
      },
    },
  });

  console.log(`Found ${recentNotifications.length} recent notifications:\n`);

  if (recentNotifications.length === 0) {
    console.log('❌ NO NOTIFICATIONS FOUND IN DATABASE!');
    console.log('   Notifications are not being created.\n');
  } else {
    recentNotifications.forEach((notif, i) => {
      console.log(`${i + 1}. ${notif.title}`);
      console.log(`   Type: ${notif.type}`);
      console.log(`   Customer: ${notif.customers?.name || 'N/A'} (${notif.customers?.email || 'N/A'})`);
      console.log(`   Read: ${notif.isRead ? '✅' : '❌'}`);
      console.log(`   Created: ${notif.createdAt.toLocaleString()}`);
      console.log(`   Message: ${notif.message ? notif.message.substring(0, 50) + '...' : 'N/A'}`);
      console.log();
    });
  }

  // Check FCM tokens
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📱 CHECKING FCM TOKENS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const customers = await prisma.customers.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      fcmToken: true,
    },
    take: 10,
  });

  console.log(`Checking ${customers.length} customers:\n`);

  let customersWithTokens = 0;
  customers.forEach((customer) => {
    if (customer.fcmToken) {
      customersWithTokens++;
      console.log(`✅ ${customer.name} (${customer.email})`);
      console.log(`   FCM Token: ${customer.fcmToken.substring(0, 30)}...`);
    } else {
      console.log(`❌ ${customer.name} (${customer.email}) - NO FCM TOKEN`);
    }
    console.log();
  });

  console.log(`\nCustomers with FCM tokens: ${customersWithTokens}/${customers.length}`);

  if (customersWithTokens === 0) {
    console.log('\n❌ NO CUSTOMERS HAVE FCM TOKENS!');
    console.log('   Mobile app is not saving FCM tokens to backend.\n');
  }

  // Check notification settings
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚙️  NOTIFICATION SETTINGS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const settings = await prisma.site_settings.findFirst({
    where: {
      key: { startsWith: 'notification_' },
    },
  });

  if (settings) {
    console.log('✅ Notification settings found');
  } else {
    console.log('⚠️  No notification settings found');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 DIAGNOSIS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (recentNotifications.length === 0) {
    console.log('❌ PROBLEM: Notifications are NOT being created in database');
    console.log('   Check if notification service is working:');
    console.log('   - src/lib/services/notification-service.ts');
    console.log('   - Are notifications being created when actions happen?\n');
  } else if (customersWithTokens === 0) {
    console.log('❌ PROBLEM: No FCM tokens saved');
    console.log('   Mobile app is not saving FCM tokens');
    console.log('   Check: tr-app/screens/services/authService.js saveFcmToken()\n');
  } else {
    console.log('✅ Notifications are being created');
    console.log('✅ FCM tokens exist');
    console.log('   Check Firebase Cloud Messaging configuration\n');
  }

  await prisma.$disconnect();
}

checkNotifications().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
