// @ts-nocheck
/**
 * Saves a notification for a driver (via vendor_staff record).
 * Used by assignment routes so the driver sees it when polling on web/PWA.
 */

import { prisma } from '@/lib/db/prisma';

interface DriverNotificationParams {
  staffId: string;           // vendor_staff.id
  title: string;
  body: string;
  type: string;              // 'booking_assigned' | 'trip_update' etc.
  serviceType: string;
  bookingId?: string;
  bookingNumber?: string;
}

const SETTINGS_KEY = (staffId: string) => `driver_notifications_${staffId}`;

export async function saveDriverNotification(params: DriverNotificationParams): Promise<void> {
  const { staffId, title, body, type, serviceType, bookingId, bookingNumber } = params;

  const key = SETTINGS_KEY(staffId);
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

  // Prepend, keep last 50
  data.notifications = [newNotification, ...data.notifications].slice(0, 50);

  await prisma.settings.upsert({
    where: { key },
    create: { key, value: JSON.stringify(data) },
    update: { value: JSON.stringify(data) },
  });
}
