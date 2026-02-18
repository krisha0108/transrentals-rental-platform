// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyDriverToken } from '@/lib/auth/driver-auth';

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
