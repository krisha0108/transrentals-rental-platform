/**
 * Push Notification Service using Firebase Cloud Messaging (FCM)
 */

import * as admin from 'firebase-admin';
import path from 'path';

// Initialize Firebase Admin SDK
let firebaseApp: admin.app.App | null = null;

function initializeFirebase() {
  // Check if already initialized (for Next.js HMR)
  if (admin.apps.length > 0) {
    console.log('♻️  Reusing existing Firebase app instance');
    firebaseApp = admin.app();
    return firebaseApp;
  }

  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    let serviceAccount;

    // Try to get from environment variable first (for production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
      // For local development, use direct import
      // This works better with Next.js webpack bundling
      const fs = require('fs');
      const serviceAccountPath = path.resolve(process.cwd(), 'firebase-service-account.json');

      if (!fs.existsSync(serviceAccountPath)) {
        throw new Error(`Firebase service account file not found at: ${serviceAccountPath}`);
      }

      const fileContent = fs.readFileSync(serviceAccountPath, 'utf8');
      serviceAccount = JSON.parse(fileContent);
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
}

/**
 * Send push notification to a single device
 */
export async function sendPushNotification(
  fcmToken: string,
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
  },
  data?: Record<string, string>,
  options?: { channelId?: string; sound?: string }
) {
  try {
    // Initialize Firebase if not already initialized
    initializeFirebase();

    const channelId = options?.channelId || 'default_v3';
    const sound = options?.sound || 'notification_sound';

    const message: admin.messaging.Message = {
      token: fcmToken,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl,
      },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          channelId,
          sound,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Push notification sent successfully:', response);
    return { success: true, messageId: response };
  } catch (error: any) {
    // Detect stale / unregistered token
    const isStaleToken =
      error.code === 'messaging/registration-token-not-registered' ||
      error.code === 'messaging/invalid-registration-token' ||
      (error.message && error.message.includes('Requested entity was not found'));

    if (isStaleToken) {
      console.warn('⚠️  Stale FCM token detected — should be cleaned up:', fcmToken.substring(0, 20) + '...');
      return { success: false, error: error.message, tokenInvalid: true };
    }

    console.error('❌ Failed to send push notification:', error);
    return { success: false, error: error.message, tokenInvalid: false };
  }
}

/**
 * Send push notification to multiple devices
 */
export async function sendMulticastNotification(
  fcmTokens: string[],
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
  },
  data?: Record<string, string>
) {
  try {
    initializeFirebase();

    const message: admin.messaging.MulticastMessage = {
      tokens: fcmTokens,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl,
      },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          channelId: 'default_v3',
          sound: 'notification_sound',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`✅ Multicast notification sent: ${response.successCount}/${fcmTokens.length} successful`);

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses,
    };
  } catch (error: any) {
    console.error('❌ Failed to send multicast notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send notification to a customer by their ID
 */
export async function sendNotificationToCustomer(
  customerId: string,
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
  },
  data?: Record<string, string>
) {
  try {
    // Import prisma dynamically to avoid circular dependencies
    const { prisma } = await import('@/lib/db/prisma');

    // Get customer's FCM token
    const customer = await prisma.customers.findUnique({
      where: { id: customerId },
      select: { fcmToken: true, name: true },
    });

    if (!customer || !customer.fcmToken) {
      console.log(`⚠️  Customer ${customerId} has no FCM token`);
      return { success: false, error: 'No FCM token found' };
    }

    // Send push notification
    const result = await sendPushNotification(customer.fcmToken, notification, data);

    // Auto-clean stale customer token
    if ((result as any)?.tokenInvalid) {
      await prisma.customers.update({
        where: { id: customerId },
        data: { fcmToken: null },
      }).catch(() => {});
      console.warn(`⚠️  Cleared stale FCM token for customer ${customerId}`);
    }

    return result;
  } catch (error: any) {
    console.error('❌ Failed to send notification to customer:', error);
    return { success: false, error: error.message };
  }
}
