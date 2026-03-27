// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { verifyDriverToken } from '@/lib/auth/driver-auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

const KEY = (id: string) => `driver_web_fcm_${id}`;

export async function POST(request: NextRequest) {
  const payload = await verifyDriverToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { token } = await request.json();
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });

  await prisma.settings.upsert({
    where: { key: KEY(payload.driverId) },
    create: { key: KEY(payload.driverId), value: token },
    update: { value: token },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const payload = await verifyDriverToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.settings.deleteMany({ where: { key: KEY(payload.driverId) } });
  return NextResponse.json({ success: true });
}
