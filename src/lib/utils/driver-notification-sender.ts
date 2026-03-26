// @ts-nocheck
/**
 * Saves a notification for a driver and sends FCM push to their web browser token.
 * Used by assignment routes so the driver sees it in both the app and the web portal.
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

const NOTIF_KEY = (staffId: string) => `driver_notifications_${staffId}`;
const WEB_FCM_KEY = (staffId: string) => `driver_web_fcm_${staffId}`;

export async function saveDriverNotification(params: DriverNotificationParams): Promise<void> {
  const { staffId, title, body, type, serviceType, bookingId, bookingNumber } = params;

  // ── 1. Save in-app notification ────────────────────────────────────────────
  const key = NOTIF_KEY(staffId);
  const existing = await prisma.settings.findUnique({ where: { key } });
  const data: any = existing?.value
    ? JSON.parse(existing.value as string)
    : { notifications: [] };

  if (!Array.isArray(data.notifications)) data.notifications = [];

  const newNotification = {
    id: `${type}_${bookingId || Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    title,
    body,
    serviceType,
    bookingId: bookingId || null,
    bookingNumber: bookingNumber || null,
    read: false,
    createdAt: new Date().toISOString(),
  };

  data.notifications = [newNotification, ...data.notifications].slice(0, 50);

  await prisma.settings.upsert({
    where: { key },
    create: { key, value: JSON.stringify(data) },
    update: { value: JSON.stringify(data) },
  });

  // ── 2. Send FCM push to web browser token (if saved) ──────────────────────
  try {
    const webFcmSetting = await prisma.settings.findUnique({
      where: { key: WEB_FCM_KEY(staffId) },
    });
    const webToken = webFcmSetting?.value;

    if (webToken) {
      sendPushNotification(
        webToken,
        { title, body },
        {
          bookingId: bookingId || '',
          bookingNumber: bookingNumber || '',
          serviceType,
          type,
        },
        { channelId: 'default_v3', sound: 'notification_sound' }
      ).catch(() => {});
    }
  } catch {}
}
