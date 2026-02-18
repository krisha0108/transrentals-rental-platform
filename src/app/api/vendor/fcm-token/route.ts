// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// POST - Save/update vendor FCM token
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fcmToken } = body;

    if (!fcmToken || typeof fcmToken !== 'string') {
      return NextResponse.json({ error: 'fcmToken is required' }, { status: 400 });
    }

    await prisma.vendors.update({
      where: { id: auth.vendorId },
      data: { fcmToken },
    });

    logger.info(`FCM token updated for vendor ${auth.vendorId}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Failed to update vendor FCM token', error);
    return NextResponse.json({ error: 'Failed to update FCM token' }, { status: 500 });
  }
}

// DELETE - Clear FCM token on logout
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    await prisma.vendors.update({
      where: { id: auth.vendorId },
      data: { fcmToken: null },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Failed to clear vendor FCM token', error);
    return NextResponse.json({ error: 'Failed to clear FCM token' }, { status: 500 });
  }
}
