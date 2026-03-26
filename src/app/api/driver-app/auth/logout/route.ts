import { NextRequest, NextResponse } from 'next/server';
import { getDriverAppUser } from '@/lib/auth/driver-app-auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const driver = await getDriverAppUser(request);
  if (driver) {
    await prisma.drivers.update({
      where: { id: driver.id },
      data: { fcmToken: null },
    });
  }
  return NextResponse.json({ success: true });
}
