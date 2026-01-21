// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
// POST - Send a quote for a booking
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
    const { id } = await params;
    const body = await request.json();

    const settingKey = `vendor_bookings_${vendorId}`;
    const existing = await prisma.settings.findUnique({
      where: { key: settingKey },
    });

    const data = existing?.value ? JSON.parse(existing.value as string) : { bookings: [] };
    const bookingIndex = data.bookings.findIndex((b: any) => b.id === id);

    if (bookingIndex !== -1) {
      data.bookings[bookingIndex] = {
        ...data.bookings[bookingIndex],
        status: 'quoted',
        quotedAmount: body.amount,
        quoteNotes: body.notes,
        quotedAt: new Date().toISOString(),
      };

      await prisma.settings.upsert({
        where: { key: settingKey },
        create: { key: settingKey, value: JSON.stringify(data) },
        update: { value: JSON.stringify(data) },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Quote sent successfully',
    });
  } catch (error) {
    logger.error('Failed to send quote', error);
    return NextResponse.json(
      { error: 'Failed to send quote' },
      { status: 500 }
    );
  }
}
