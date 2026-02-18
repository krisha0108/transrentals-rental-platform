// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

const SETTINGS_KEY = (vendorId: string) => `vendor_fcm_tokens_${vendorId}`;
const MAX_TOKENS = 10; // max devices per vendor

// POST - Save/update vendor FCM token (supports multiple devices)
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fcmToken, deviceId } = body;

    if (!fcmToken || typeof fcmToken !== 'string') {
      return NextResponse.json({ error: 'fcmToken is required' }, { status: 400 });
    }

    const vendorId = auth.vendorId;
    const key = SETTINGS_KEY(vendorId);

    // Load existing tokens
    const existing = await prisma.settings.findUnique({ where: { key } });
    const data = existing?.value ? JSON.parse(existing.value as string) : { tokens: [] };

    // Remove any existing entry for this token or deviceId (avoid duplicates)
    data.tokens = (data.tokens || []).filter(
      (t: any) => t.token !== fcmToken && (!deviceId || t.deviceId !== deviceId)
    );

    // Add new token entry at the front
    data.tokens.unshift({
      token: fcmToken,
      deviceId: deviceId || null,
      updatedAt: new Date().toISOString(),
    });

    // Keep max N tokens (oldest removed first)
    data.tokens = data.tokens.slice(0, MAX_TOKENS);

    await prisma.settings.upsert({
      where: { key },
      create: { key, value: JSON.stringify(data) },
      update: { value: JSON.stringify(data) },
    });

    // Also keep vendors.fcmToken updated (latest token — backward compat)
    await prisma.vendors.update({
      where: { id: vendorId },
      data: { fcmToken },
    });

    logger.info(`FCM token saved for vendor ${vendorId} (${data.tokens.length} devices)`);
    return NextResponse.json({ success: true, deviceCount: data.tokens.length });
  } catch (error: any) {
    logger.error('Failed to update vendor FCM token', error);
    return NextResponse.json({ error: 'Failed to update FCM token' }, { status: 500 });
  }
}

// DELETE - Remove this device's FCM token on logout
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { fcmToken, deviceId } = body;

    const vendorId = auth.vendorId;
    const key = SETTINGS_KEY(vendorId);

    // Remove the specific token from the array
    const existing = await prisma.settings.findUnique({ where: { key } });
    if (existing?.value) {
      const data = JSON.parse(existing.value as string);
      data.tokens = (data.tokens || []).filter(
        (t: any) => t.token !== fcmToken && (!deviceId || t.deviceId !== deviceId)
      );
      await prisma.settings.update({
        where: { key },
        data: { value: JSON.stringify(data) },
      });
    }

    // If this was the main fcmToken, clear it too
    const vendor = await prisma.vendors.findUnique({
      where: { id: vendorId },
      select: { fcmToken: true },
    });
    if (vendor?.fcmToken === fcmToken) {
      await prisma.vendors.update({
        where: { id: vendorId },
        data: { fcmToken: null },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Failed to clear vendor FCM token', error);
    return NextResponse.json({ error: 'Failed to clear FCM token' }, { status: 500 });
  }
}
