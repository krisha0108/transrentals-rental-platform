// Test notification using FCM token from LIVE database
import { PrismaClient } from '@prisma/client';
import { sendPushNotification } from '../src/lib/services/push-notification-service';
import crypto from 'crypto';

async function testLiveToken() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔔 TESTING WITH LIVE DATABASE TOKEN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Connect to LIVE database
  const liveDatabaseUrl = process.env.LIVE_DATABASE_URL || process.env.DATABASE_URL;

  if (!liveDatabaseUrl) {
    console.log('❌ LIVE_DATABASE_URL not found in .env');
    console.log('   Please add: LIVE_DATABASE_URL="your-live-database-connection-string"\n');
    return;
  }

  console.log('📡 Connecting to LIVE database...');
  const livePrisma = new PrismaClient({
    datasources: {
      db: {
        url: liveDatabaseUrl,
      },
    },
  });

  try {
    // Get customers with FCM token from LIVE database
    const customers = await livePrisma.customers.findMany({
      where: {
        fcmToken: { not: null },
      },
      select: {
        id: true,
        name: true,
        email: true,
        fcmToken: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 5,
    });

    if (customers.length === 0) {
      console.log('❌ No customers with FCM tokens found in LIVE database!');
      console.log('   Make sure a customer has logged in via mobile app.\n');
      return;
    }

    console.log(`✅ Found ${customers.length} customers with FCM tokens in LIVE database:\n`);

    customers.forEach((customer, index) => {
      console.log(`${index + 1}. ${customer.name} (${customer.email})`);
      console.log(`   Customer ID: ${customer.id}`);
      console.log(`   FCM Token: ${customer.fcmToken?.substring(0, 40)}...`);
      console.log('');
    });

    // Select the first customer for testing
    const testCustomer = customers[0];
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📱 Testing with: ${testCustomer.name} (${testCustomer.email})`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Send push notification using LOCAL Firebase Admin SDK
    console.log('📤 Sending push notification via LOCAL Firebase SDK...');
    const result = await sendPushNotification(
      testCustomer.fcmToken!,
      {
        title: '🎉 Test from Local Backend',
        body: 'This notification is sent from LOCAL backend using LIVE database token! Testing... 🚀',
      },
      {
        type: 'test',
        source: 'local-backend',
        timestamp: new Date().toISOString(),
      }
    );

    if (result.success) {
      console.log('✅ Push notification sent successfully!');
      console.log(`   Message ID: ${result.messageId}\n`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ SUCCESS!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n✅ This proves:');
      console.log('   1. LIVE database has valid FCM token');
      console.log('   2. LOCAL Firebase SDK is configured correctly');
      console.log('   3. Push notifications are working!\n');
      console.log('📱 Check your device for the notification!');
    } else {
      console.log('❌ Failed to send push notification');
      console.log(`   Error: ${result.error}\n`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('❌ FAILED');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n❌ Possible reasons:');
      console.log('   1. FCM token is expired (user needs to fresh login)');
      console.log('   2. Firebase project mismatch (mobile app vs backend)');
      console.log('   3. Firebase credentials incorrect\n');
    }
  } catch (error: any) {
    console.error('❌ Error:', error);
    console.error('   Details:', error.message);
  } finally {
    await livePrisma.$disconnect();
  }
}

testLiveToken();
