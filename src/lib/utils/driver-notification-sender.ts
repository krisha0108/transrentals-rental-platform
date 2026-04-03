// @ts-nocheck
/**
 * Saves a notification for a driver and sends FCM push to ALL their registered devices.
 * Supports multiple devices: mobile app (multiple phones) + web browser.
 * Tokens stored as JSON arrays so every logged-in device receives the push.
 */

import { prisma } from '@/lib/db/prisma';
import { sendPushNotification } from '@/lib/services/push-notification-service';

interface DriverNotificationParams {
  staffId: string;           // vendor_staff.id
  title: string;
  body: string;
  type: string;              // 'booking_assigned' | 'trip_update' etc.
  serviceType: string;
  bookingId?: string;
  bookingNumber?: string;
}

const NOTIF_KEY        = (id: string) => `driver_notifications_${id}`;
const WEB_FCM_KEY      = (id: string) => `driver_web_fcm_${id}`;
const MOBILE_FCM_KEY   = (id: string) => `driver_mobile_fcm_${id}`;

// ── Helper: read token array from settings ─────────────────────────────────
async function getTokens(key: string): Promise<string[]> {
  const row = await prisma.settings.findUnique({ where: { key } });
  if (!row?.value) return [];
  try {
    const parsed = JSON.parse(row.value as string);
    // Support both old single-string format and new array format
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
    if (typeof parsed === 'string') return [parsed];
    return [];
  } catch {
    // Raw string (old format)
    return [row.value as string];
  }
}

// ── Helper: add token to array (dedup), save back ─────────────────────────
export async function addFcmToken(key: string, newToken: string): Promise<void> {
  if (!newToken) return;
  const existing = await getTokens(key);
  // Dedup: remove if already present then prepend (moves to front = most recent)
  const updated = [newToken, ...existing.filter(t => t !== newToken)].slice(0, 10);
  await prisma.settings.upsert({
    where: { key },
    create: { key, value: JSON.stringify(updated) },
    update: { value: JSON.stringify(updated) },
  });
}

// ── Helper: remove a stale/invalid token from array ───────────────────────
async function removeToken(key: string, badToken: string): Promise<void> {
  const existing = await getTokens(key);
  const updated = existing.filter(t => t !== badToken);
  await prisma.settings.upsert({
    where: { key },
    create: { key, value: JSON.stringify(updated) },
    update: { value: JSON.stringify(updated) },
  }).catch(() => {});
}

// ── Helper: send to all tokens in a list, prune invalid ones ──────────────
async function sendToAll(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, string>,
  channelId: string,
  storageKey: string,
): Promise<void> {
  for (const token of tokens) {
    try {
      const result = await sendPushNotification(
        token,
        { title, body },
        data,
        { channelId, sound: 'notification_sound' },
      );
      // Remove token if FCM says it's no longer valid
      if (!result?.success && result?.error?.includes?.('registration-token-not-registered')) {
        await removeToken(storageKey, token);
      }
    } catch {}
  }
}

// ── Main export ────────────────────────────────────────────────────────────
export async function saveDriverNotification(params: DriverNotificationParams): Promise<void> {
  const { staffId, title, body, type, serviceType, bookingId, bookingNumber } = params;

  // ── 1. Save in-app notification (DB) ──────────────────────────────────────
  const key = NOTIF_KEY(staffId);
  const existing = await prisma.settings.findUnique({ where: { key } });
  const notifData: any = existing?.value
    ? JSON.parse(existing.value as string)
    : { notifications: [] };

  if (!Array.isArray(notifData.notifications)) notifData.notifications = [];

  notifData.notifications = [
    {
      id: `${type}_${bookingId || Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type,
      title,
      body,
      serviceType,
      bookingId:     bookingId     || null,
      bookingNumber: bookingNumber || null,
      read:          false,
      createdAt:     new Date().toISOString(),
    },
    ...notifData.notifications,
  ].slice(0, 50);

  await prisma.settings.upsert({
    where:  { key },
    create: { key, value: JSON.stringify(notifData) },
    update: { value: JSON.stringify(notifData) },
  });

  const pushData = {
    bookingId:     bookingId     || '',
    bookingNumber: bookingNumber || '',
    serviceType,
    type,
  };

  // ── 2. Send to ALL web browser tokens ────────────────────────────────────
  try {
    const webTokens = await getTokens(WEB_FCM_KEY(staffId));
    if (webTokens.length) {
      await sendToAll(webTokens, title, body, pushData, 'default_v3', WEB_FCM_KEY(staffId));
    }
  } catch {}

  // ── 3. Send to ALL mobile app tokens (tr-driver-app) ─────────────────────
  try {
    const mobileTokens = await getTokens(MOBILE_FCM_KEY(staffId));
    if (mobileTokens.length) {
      await sendToAll(mobileTokens, title, body, pushData, 'driver_default', MOBILE_FCM_KEY(staffId));
    }
  } catch {}
}
