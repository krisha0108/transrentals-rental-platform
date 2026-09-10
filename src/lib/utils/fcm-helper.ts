import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { logSystemEvent } from '@/lib/system-health/log-event';
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
    await logSystemEvent({ category: 'NOTIFICATION', sourceName: 'fcm-customer-push', status: 'SUCCESS' });
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
      await logSystemEvent({ category: 'NOTIFICATION', sourceName: 'fcm-customer-push', status: 'FAILURE', message: error?.message || error?.code || 'Unknown error' });
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

// ==================== Travel Agent push ====================
// TA devices register their FCM tokens via /api/travel-agent/fcm-token, which
// stores up to 10 tokens in the `settings` table under this key, plus keeps
// the latest in `travel_agents.fcmToken` for backward compatibility.
const TA_FCM_SETTINGS_KEY = (agentId: string) => `travel_agent_fcm_tokens_${agentId}`;

// TA notification type → Android channel + sound. Channel ids must match those
// registered by createNotificationChannels() in the vendor app. Types not
// listed here (LEAD, SYSTEM) fall back to the default channel.
const TA_CHANNEL_BY_TYPE: Record<string, { channelId: string; sound: string }> = {
  PAYMENT: { channelId: 'payment_channel', sound: 'payment' },
  CHAT: { channelId: 'chat_channel', sound: 'chat' },
  BOOKING: { channelId: 'booking_confirmed_channel', sound: 'booking_confirmed' },
};

interface SendTravelAgentPushParams {
  travelAgentId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  image?: string | null;
}

/** Collect every FCM token registered for a travel agent (de-duplicated). */
async function getTravelAgentTokens(travelAgentId: string): Promise<string[]> {
  const tokens = new Set<string>();

  const settingsRow = await prisma.settings.findUnique({
    where: { key: TA_FCM_SETTINGS_KEY(travelAgentId) },
  });
  if (settingsRow?.value) {
    try {
      const parsed = JSON.parse(settingsRow.value as string);
      for (const t of parsed?.tokens || []) {
        if (t?.token) tokens.add(t.token);
      }
    } catch {
      // malformed settings blob — ignore, fall back to the column token
    }
  }

  const agent = await (prisma as any).travel_agents.findUnique({
    where: { id: travelAgentId },
    select: { fcmToken: true },
  });
  if (agent?.fcmToken) tokens.add(agent.fcmToken);

  return Array.from(tokens);
}

/** Remove tokens Firebase reports as permanently invalid from both stores. */
async function pruneTravelAgentTokens(
  travelAgentId: string,
  invalidTokens: string[]
): Promise<void> {
  if (invalidTokens.length === 0) return;
  const invalid = new Set(invalidTokens);
  try {
    const key = TA_FCM_SETTINGS_KEY(travelAgentId);
    const row = await prisma.settings.findUnique({ where: { key } });
    if (row?.value) {
      const parsed = JSON.parse(row.value as string);
      parsed.tokens = (parsed.tokens || []).filter((t: any) => !invalid.has(t?.token));
      await prisma.settings.update({ where: { key }, data: { value: JSON.stringify(parsed) } });
    }

    const agent = await (prisma as any).travel_agents.findUnique({
      where: { id: travelAgentId },
      select: { fcmToken: true },
    });
    if (agent?.fcmToken && invalid.has(agent.fcmToken)) {
      await (prisma as any).travel_agents.update({
        where: { id: travelAgentId },
        data: { fcmToken: null },
      });
    }
  } catch (error) {
    logger.error('Failed to prune travel agent FCM tokens', error);
  }
}

/**
 * Send an FCM push to all of a travel agent's registered devices.
 * Mirrors sendFCMNotification but is multi-device aware (multicast) and
 * sources tokens from the TA token stores.
 * @returns true if at least one device was delivered to.
 */
export async function sendTravelAgentPush(
  params: SendTravelAgentPushParams
): Promise<boolean> {
  const { travelAgentId, title, body, data = {}, image } = params;

  initFirebase();
  if (!admin) {
    logger.warn('TA FCM push skipped - Firebase Admin not available');
    return false;
  }

  try {
    const tokens = await getTravelAgentTokens(travelAgentId);
    if (tokens.length === 0) {
      logger.warn(`No FCM token found for travel_agent: ${travelAgentId}`);
      return false;
    }

    if (!admin.apps.length) {
      logger.error('Firebase Admin not initialized');
      return false;
    }

    // Pick the Android channel (and its sound) from the notification type so
    // BACKGROUND/quit notifications — shown by the OS straight from this
    // payload — match the per-type channels the app registers. These ids must
    // stay in sync with createNotificationChannels() in the vendor app.
    const channel = TA_CHANNEL_BY_TYPE[data.type] || {
      channelId: 'default_v3',
      sound: 'notification_sound',
    };

    const message = {
      tokens,
      notification: {
        title,
        body,
        ...(image && image !== 'null' ? { imageUrl: image } : {}),
      },
      data: {
        ...data,
        timestamp: Date.now().toString(),
      },
      android: {
        priority: 'high' as const,
        notification: {
          channelId: channel.channelId,
          sound: channel.sound,
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

    const response = await admin.messaging().sendEachForMulticast(message);
    logger.info(
      `TA FCM push: ${response.successCount}/${tokens.length} delivered for ${travelAgentId}`
    );

    // Clear out tokens that are permanently dead so they don't pile up.
    if (response.failureCount > 0) {
      const invalid: string[] = [];
      response.responses.forEach((r: any, i: number) => {
        const code = r?.error?.code;
        if (
          !r.success &&
          (code === 'messaging/invalid-registration-token' ||
            code === 'messaging/registration-token-not-registered')
        ) {
          invalid.push(tokens[i]);
        }
      });
      await pruneTravelAgentTokens(travelAgentId, invalid);
    }

    const delivered = response.successCount > 0;
    await logSystemEvent({
      category: 'NOTIFICATION',
      sourceName: 'fcm-travel-agent-push',
      status: delivered ? 'SUCCESS' : 'FAILURE',
      message: delivered ? undefined : `0/${tokens.length} devices delivered`,
    });
    return delivered;
  } catch (error: any) {
    logger.error('Failed to send travel agent FCM push', error);
    await logSystemEvent({ category: 'NOTIFICATION', sourceName: 'fcm-travel-agent-push', status: 'FAILURE', message: error?.message || 'Unknown error' });
    return false;
  }
}
