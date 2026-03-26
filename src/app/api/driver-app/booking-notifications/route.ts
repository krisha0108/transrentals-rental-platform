// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getDriverAppUser } from '@/lib/auth/driver-app-auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

const KEY = (id: string) => `driver_notifications_${id}`;

export async function GET(request: NextRequest) {
  const driver = await getDriverAppUser(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const setting = await prisma.settings.findUnique({ where: { key: KEY(driver.id) } });
  const data = setting?.value ? JSON.parse(setting.value as string) : {};
  const notifications = Array.isArray(data.notifications) ? data.notifications : [];

  return NextResponse.json({ success: true, notifications });
}

export async function POST(request: NextRequest) {
  const driver = await getDriverAppUser(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const key = KEY(driver.id);

  const existing = await prisma.settings.findUnique({ where: { key } });
  const data: any = existing?.value ? JSON.parse(existing.value as string) : { notifications: [] };
  if (!Array.isArray(data.notifications)) data.notifications = [];

  if (body.action === 'markAllRead') {
    data.notifications = data.notifications.map((n: any) => ({ ...n, read: true }));
  } else if (body.action === 'markRead' && Array.isArray(body.ids)) {
    data.notifications = data.notifications.map((n: any) =>
      body.ids.includes(n.id) ? { ...n, read: true } : n
    );
  }

  await prisma.settings.upsert({
    where: { key },
    create: { key, value: JSON.stringify(data) },
    update: { value: JSON.stringify(data) },
  });

  return NextResponse.json({ success: true });
}
