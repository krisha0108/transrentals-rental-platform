// Test notification with a specific FCM token
import { sendPushNotification } from '../src/lib/services/push-notification-service';

async function testWithToken() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔔 TESTING PUSH NOTIFICATION WITH TOKEN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Get FCM token from command line argument
  const fcmToken = process.argv[2];

  if (!fcmToken) {
    console.log('❌ Please provide FCM token as argument:');
    console.log('   npx tsx scripts/test-with-token.ts "YOUR_FCM_TOKEN_HERE"\n');
    return;
  }

  console.log(`📱 Testing with FCM token: ${fcmToken.substring(0, 40)}...\n`);

  // Send push notification
  console.log('📤 Sending push notification via LOCAL Firebase SDK...');
  const result = await sendPushNotification(
    fcmToken,
    {
      title: '🎉 Test from Local Backend',
      body: 'This notification is sent from LOCAL backend with LIVE token! Testing... 🚀',
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
    console.log('   1. FCM token is valid');
    console.log('   2. LOCAL Firebase SDK is working');
    console.log('   3. Push notifications work!\n');
    console.log('📱 Check your device for the notification!');
  } else {
    console.log('❌ Failed to send push notification');
    console.log(`   Error: ${result.error}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ FAILED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n❌ Possible reasons:');
    console.log('   1. FCM token is expired (user needs fresh login)');
    console.log('   2. Firebase project mismatch');
    console.log('   3. Firebase credentials incorrect\n');
  }
}

testWithToken();
