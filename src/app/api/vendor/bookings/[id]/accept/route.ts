// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';
// POST - Accept a booking
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    // Block rejected/suspended/blocked vendors from write operations
    const guard = await vendorStatusGuard(vendorId);
    if (guard.blocked) return guard.response;
    const { id } = await params;

    const settingKey = `vendor_bookings_${vendorId}`;
    const existing = await prisma.settings.findUnique({
      where: { key: settingKey },
    });

    const data = existing?.value ? JSON.parse(existing.value as string) : { bookings: [] };
    const bookingIndex = data.bookings.findIndex((b: any) => b.id === id);

    if (bookingIndex !== -1) {
      data.bookings[bookingIndex] = {
        ...data.bookings[bookingIndex],
        status: 'confirmed',
        acceptedAt: new Date().toISOString(),
      };

      await prisma.settings.upsert({
        where: { key: settingKey },
        create: { key: settingKey, value: JSON.stringify(data) },
        update: { value: JSON.stringify(data) },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Accept booking error', error);
    return NextResponse.json(
      { error: 'Failed to accept booking', details: error?.message },
      { status: 500 }
    );
  }
}
