// Send a test push notification
import { prisma } from '../src/lib/db/prisma';
import { sendNotificationToCustomer } from '../src/lib/services/push-notification-service';
import crypto from 'crypto';

async function sendTestNotification() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔔 SENDING TEST NOTIFICATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Get a customer with FCM token
    const customer = await prisma.customers.findFirst({
      where: {
        fcmToken: { not: null },
      },
      select: {
        id: true,
        name: true,
        email: true,
        fcmToken: true,
      },
    });

    if (!customer) {
      console.log('❌ No customers with FCM tokens found!');
      console.log('   Make sure a customer has logged in via mobile app.\n');
      return;
    }

    console.log(`📱 Sending notification to: ${customer.name} (${customer.email})`);
    console.log(`   Customer ID: ${customer.id}`);
    console.log(`   FCM Token: ${customer.fcmToken?.substring(0, 30)}...\n`);

    // Create notification in database
    const notificationData = {
      id: 'NOTIF_' + crypto.randomBytes(8).toString('hex'),
      customerId: customer.id,
      title: '🎉 Test Notification',
      body: 'This is a test push notification from TransRentals! If you see this, notifications are working! 🚀',
      type: 'general',
      serviceType: null,
      quoteId: null,
      bookingId: null,
      image: null,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('💾 Creating notification in database...');
    const dbNotification = await prisma.notifications.create({
      data: notificationData,
    });
    console.log(`✅ Notification created: ${dbNotification.id}\n`);

    // Send push notification
    console.log('📤 Sending push notification via Firebase...');
    const result = await sendNotificationToCustomer(
      customer.id,
      {
        title: '🎉 Test Notification',
        body: 'This is a test push notification from TransRentals! If you see this, notifications are working! 🚀',
      },
      {
        type: 'test',
        notification_id: dbNotification.id,
      }
    );

    if (result.success) {
      console.log('✅ Push notification sent successfully!');
      console.log(`   Message ID: ${result.messageId}\n`);
    } else {
      console.log('❌ Failed to send push notification');
      console.log(`   Error: ${result.error}\n`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ TEST COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nCheck your mobile app:');
    console.log('1. You should see a push notification');
    console.log('2. Open the app to see the in-app notification\n');
  } catch (error: any) {
    console.error('❌ Error sending test notification:', error);
    console.error('   Details:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

sendTestNotification();
