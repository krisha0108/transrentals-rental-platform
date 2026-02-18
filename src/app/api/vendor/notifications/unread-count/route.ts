// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - Return count of unread notifications for the logged-in vendor
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
    const unreadCount = notifications.filter((n: any) => !n.read).length;

    return NextResponse.json({ unreadCount });
  } catch (error) {
    logger.error('Failed to fetch unread notification count', error);
    return NextResponse.json({ error: 'Failed to fetch unread count' }, { status: 500 });
  }
}
