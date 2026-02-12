import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import * as fs from 'fs';
import * as path from 'path';

// Lazy import firebase-admin to avoid build errors if not installed
let admin: any = null;
let firebaseInitialized = false;

function initFirebase() {
  if (firebaseInitialized) return;

  try {
    // Dynamic import for firebase-admin
    admin = require('firebase-admin');

    if (!admin.apps.length) {
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

      if (serviceAccountPath) {
        // Resolve path from project root
        const fullPath = path.resolve(process.cwd(), serviceAccountPath);

        // Read and parse the service account JSON file
        const serviceAccountJson = fs.readFileSync(fullPath, 'utf8');
        const serviceAccount = JSON.parse(serviceAccountJson);

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('✅ Firebase Admin initialized successfully');
      } else {
        console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_PATH not found in .env');
      }
    }
    firebaseInitialized = true;
  } catch (error: any) {
    console.warn('⚠️ Firebase Admin not available:', error.message);
    admin = null;
  }
}

interface SendNotificationParams {
  customerId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  image?: string | null;
}

/**
 * Send FCM push notification to customer
 * @param params - Notification parameters
 * @returns Success status
 */
export async function sendFCMNotification(params: SendNotificationParams): Promise<boolean> {
  const { customerId, title, body, data = {}, image } = params;

  // Initialize Firebase if not already done
  initFirebase();

  // If Firebase is not available, skip notification
  if (!admin) {
    logger.warn('FCM notification skipped - Firebase Admin not available');
    return false;
  }

  try {
    // Get customer's FCM token
    const customer = await prisma.customers.findUnique({
      where: { id: customerId },
      select: { fcmToken: true, name: true },
    });

    if (!customer?.fcmToken) {
      logger.warn(`No FCM token found for customer: ${customerId}`);
      return false;
    }

    // Check if Firebase Admin is initialized
    if (!admin.apps.length) {
      logger.error('Firebase Admin not initialized');
      return false;
    }

    // Prepare notification payload
    const message: admin.messaging.Message = {
      token: customer.fcmToken,
      notification: {
        title,
        body,
        ...(image && image !== 'null' ? { imageUrl: image } : {}),
      },
      data: {
        ...data,
        // Ensure all values are strings
        timestamp: Date.now().toString(),
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'default',
          sound: 'default',
          priority: 'high' as const,
          defaultSound: true,
          defaultVibrateTimings: true,
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

    // Send the notification
    const response = await admin.messaging().send(message);
    logger.info(`FCM notification sent successfully: ${response}`);
    return true;
  } catch (error: any) {
    // Handle specific FCM errors
    if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
      logger.warn(`Invalid FCM token for customer ${customerId}, clearing token`);
      // Clear invalid token
      await prisma.customers.update({
        where: { id: customerId },
        data: { fcmToken: null },
      });
    } else {
      logger.error('Failed to send FCM notification', error);
    }
    return false;
  }
}

/**
 * Send FCM notifications to multiple customers
 * @param notifications - Array of notification params
 */
export async function sendBatchFCMNotifications(
  notifications: SendNotificationParams[]
): Promise<void> {
  const promises = notifications.map(notification => sendFCMNotification(notification));
  await Promise.allSettled(promises);
}
