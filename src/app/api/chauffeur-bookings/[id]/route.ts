// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { updateVendorRating } from '@/lib/utils/update-vendor-rating';

export const dynamic = 'force-dynamic';

// PATCH - Rate or cancel a chauffeur booking
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, rating, review, driverRating } = body;

    const booking = await prisma.chauffeur_bookings.findFirst({
      where: { OR: [{ id }, { bookingNumber: id }] },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    if (action === 'rate' || action === 'review') {
      if (booking.status !== 'COMPLETED') {
        return NextResponse.json({ success: false, error: 'Only completed bookings can be rated' }, { status: 400 });
      }
      if (booking.rating) {
        return NextResponse.json({ success: false, error: 'Already rated' }, { status: 400 });
      }
      if (!rating || rating < 1 || rating > 5) {
        return NextResponse.json({ success: false, error: 'Rating must be between 1 and 5' }, { status: 400 });
      }

      const updated = await prisma.chauffeur_bookings.update({
        where: { id: booking.id },
        data: {
          rating: parseInt(rating),
          review: review || null,
          driverRating: driverRating || parseInt(rating),
        },
      });

      updateVendorRating(booking.acceptedVendorId, rating).catch(() => {});

      return NextResponse.json({
        success: true,
        message: 'Thank you for your feedback!',
        booking: { id: updated.id, rating: updated.rating },
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    logger.error('Failed to update chauffeur booking', error);
    return NextResponse.json({ success: false, error: 'Failed to update booking', details: error?.message }, { status: 500 });
  }
}
