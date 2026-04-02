// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { verifyDriverToken } from '@/lib/auth/driver-auth';
import { addFcmToken } from '@/lib/utils/driver-notification-sender';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

const KEY = (id: string) => `driver_web_fcm_${id}`;

export async function POST(request: NextRequest) {
  const payload = await verifyDriverToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { token } = await request.json();
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });

  // Append to array — supports multiple browser tabs / devices
  await addFcmToken(KEY(payload.driverId), token);

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const payload = await verifyDriverToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Remove specific token if provided, else clear all web tokens for this device
  const body = await request.json().catch(() => ({}));
  const tokenToRemove = body?.token;

  if (tokenToRemove) {
    const key = KEY(payload.driverId);
    const row = await prisma.settings.findUnique({ where: { key } });
    if (row?.value) {
      try {
        const tokens = JSON.parse(row.value as string);
        const updated = Array.isArray(tokens)
          ? tokens.filter((t: string) => t !== tokenToRemove)
          : [];
        await prisma.settings.update({ where: { key }, data: { value: JSON.stringify(updated) } });
      } catch {}
    }
  } else {
    await prisma.settings.deleteMany({ where: { key: KEY(payload.driverId) } });
  }

  return NextResponse.json({ success: true });
}
