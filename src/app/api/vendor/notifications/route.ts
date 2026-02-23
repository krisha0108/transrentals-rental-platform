// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - Fetch all notifications for the logged-in vendor
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    const settingKey = `vendor_notifications_${vendorId}`;
    const setting = await prisma.settings.findUnique({
      where: { key: settingKey },
    });

    const parsed = setting?.value ? JSON.parse(setting.value as string) : {};
    const notifications = parsed?.notifications || [];

    return NextResponse.json({ notifications });
  } catch (error) {
    logger.error('Failed to fetch notifications', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST - Mark notifications as read / delete
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    const body = await request.json();
    const settingKey = `vendor_notifications_${vendorId}`;
    const existing = await prisma.settings.findUnique({
      where: { key: settingKey },
    });

    // Always start from real DB data — never fall back to dummy
    const data: any = existing?.value
      ? JSON.parse(existing.value as string)
      : { notifications: [] };

    if (!Array.isArray(data.notifications)) {
      data.notifications = [];
    }

    if (body.action === 'markAllRead') {
      data.notifications = data.notifications.map((n: any) => ({ ...n, read: true }));
    } else if (body.action === 'markRead' && body.notificationIds) {
      data.notifications = data.notifications.map((n: any) =>
        body.notificationIds.includes(n.id) ? { ...n, read: true } : n
      );
    } else if (body.action === 'delete' && body.notificationIds) {
      data.notifications = data.notifications.filter(
        (n: any) => !body.notificationIds.includes(n.id)
      );
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const serialized = JSON.stringify(data);
    await prisma.settings.upsert({
      where: { key: settingKey },
      create: { key: settingKey, value: serialized },
      update: { value: serialized },
    });

    return NextResponse.json({ success: true, notifications: data.notifications });
  } catch (error) {
    logger.error('Failed to update notifications', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
