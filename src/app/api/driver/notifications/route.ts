// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyDriverToken } from '@/lib/auth/driver-auth';
import { addFcmToken } from '@/lib/utils/driver-notification-sender';

export const dynamic = 'force-dynamic';

const SETTINGS_KEY = (driverId: string) => `driver_notifications_${driverId}`;

// GET - Fetch all notifications for the logged-in driver
export async function GET(request: NextRequest) {
  const payload = await verifyDriverToken(request);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const driverId = payload.driverId;

  const setting = await prisma.settings.findUnique({
    where: { key: SETTINGS_KEY(driverId) },
  });

  const parsed = setting?.value ? JSON.parse(setting.value as string) : {};
  const notifications = parsed?.notifications || [];

  return NextResponse.json({ notifications });
}

// POST - Mark notifications as read
export async function POST(request: NextRequest) {
  const payload = await verifyDriverToken(request);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const driverId = payload.driverId;

  const body = await request.json();

  // Handle FCM token update from mobile app (append to array — multi-device support)
  if (body.fcmToken) {
    const updatePromises: Promise<any>[] = [
      addFcmToken(`driver_mobile_fcm_${driverId}`, body.fcmToken),
    ];
    // Also keep vendor_staff.fcmToken updated (used by some direct-send routes)
    if (payload.userType === 'vendor_staff') {
      updatePromises.push(
        prisma.vendor_staff.update({
          where: { id: driverId },
          data: { fcmToken: body.fcmToken },
        })
      );
    }
    await Promise.all(updatePromises).catch(() => {});
    return NextResponse.json({ success: true });
  }

  const key = SETTINGS_KEY(driverId);

  const existing = await prisma.settings.findUnique({ where: { key } });
  const data: any = existing?.value
    ? JSON.parse(existing.value as string)
    : { notifications: [] };

  if (!Array.isArray(data.notifications)) data.notifications = [];

  if (body.action === 'markAllRead') {
    data.notifications = data.notifications.map((n: any) => ({ ...n, read: true }));
  } else if (body.action === 'markRead' && body.notificationIds) {
    data.notifications = data.notifications.map((n: any) =>
      body.notificationIds.includes(n.id) ? { ...n, read: true } : n
    );
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  await prisma.settings.upsert({
    where: { key },
    create: { key, value: JSON.stringify(data) },
    update: { value: JSON.stringify(data) },
  });

  return NextResponse.json({ success: true });
}
