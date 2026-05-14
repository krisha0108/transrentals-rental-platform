// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';
import { onSuperQuoteAccepted } from '@/lib/utils/b2b-notification-helper';

export const dynamic = 'force-dynamic';

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

function generateTripCode(): string {
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `T-${random}`;
}

// POST - HR accepts the super quote -> booking confirmed -> trips auto-created
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const superQuoteId = params.id;

    const superQuote = await prisma.b2b_super_quotes.findUnique({
      where: { id: superQuoteId },
      include: {
        items: {
          include: {
            vendorQuote: {
              include: {
                quoteVehicles: true,
              }
            }
          }
        },
        booking: true,
      },
    });

    if (!superQuote) {
      return NextResponse.json({ error: 'Super Quote not found' }, { status: 404 });
    }
    if (superQuote.status !== 'SENT') {
      return NextResponse.json({ error: `Super Quote is ${superQuote.status}, cannot accept` }, { status: 400 });
    }

    const booking = superQuote.booking;

    // Generate trips from all vendor quote vehicles. For self-drive vehicles
    // the vendor declared a per-vehicle pickup point — pull it from the quote
    // notes JSON (vehiclePickupPoints, ordered same as quoteVehicles).
    const tripsData: any[] = [];

    for (const item of superQuote.items) {
      const vendorQuote = item.vendorQuote;
      let vehiclePickupPoints: (string | null)[] = [];
      if (vendorQuote.notes) {
        try {
          const parsed = JSON.parse(vendorQuote.notes);
          if (Array.isArray(parsed?.vehiclePickupPoints)) {
            vehiclePickupPoints = parsed.vehiclePickupPoints;
          }
        } catch { /* legacy plain-text notes — fall back to booking pickup */ }
      }
      vendorQuote.quoteVehicles.forEach((qv: any, qvIdx: number) => {
        const perVehiclePickup = vehiclePickupPoints[qvIdx]?.trim?.() || '';
        tripsData.push({
          id: generateId(),
          tripCode: generateTripCode(),
          bookingId: booking.id,
          vendorId: vendorQuote.vendorId,
          vendorFleetId: qv.vendorFleetId,
          driverStaffId: qv.driverStaffId,
          vehicleName: qv.vehicleName,
          vehicleNumber: qv.vehicleNumber,
          driverName: qv.driverName,
          driverPhone: qv.driverPhone,
          pickupLocation: perVehiclePickup || booking.pickupLocation,
          dropLocation: booking.dropLocation,
          scheduledDate: booking.scheduledDate,
          scheduledTime: booking.scheduledTime,
          status: 'PENDING',
        });
      });
    }

    await prisma.$transaction(async (tx) => {
      // Accept super quote
      await tx.b2b_super_quotes.update({
        where: { id: superQuoteId },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
      });

      // Confirm all selected vendor quotes
      const vendorQuoteIds = superQuote.items.map(i => i.vendorQuoteId);
      await tx.b2b_vendor_quotes.updateMany({
        where: { id: { in: vendorQuoteIds } },
        data: { status: 'CONFIRMED' },
      });

      // Reject all non-selected vendor quotes for this booking
      await tx.b2b_vendor_quotes.updateMany({
        where: {
          bookingId: booking.id,
          id: { notIn: vendorQuoteIds },
          status: { in: ['SUBMITTED', 'REVISED'] },
        },
        data: { status: 'REJECTED' },
      });

      // Create all trips
      if (tripsData.length > 0) {
        await tx.b2b_trips.createMany({ data: tripsData });
      }

      // Update booking status
      await tx.b2b_bookings.update({
        where: { id: booking.id },
        data: {
          status: 'TRIPS_CREATED',
          acceptedSuperQuoteId: superQuoteId,
        },
      });
    });

    // Notify confirmed vendors
    const vendorIds = [...new Set(superQuote.items.map(i => i.vendorQuote.vendorId))];
    onSuperQuoteAccepted({
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      companyName: booking.companyName,
      serviceType: booking.serviceType,
      vendorIds,
    }).catch(e => console.error('Super quote accepted notification error:', e));

    return NextResponse.json({
      status: 'success',
      message: `Booking confirmed! ${tripsData.length} trips created.`,
      tripsCreated: tripsData.length,
      trips: tripsData.map(t => ({
        tripCode: t.tripCode,
        vehicleName: t.vehicleName,
        vehicleNumber: t.vehicleNumber,
        driverName: t.driverName,
      })),
    });
  } catch (error: any) {
    console.error('Super Quote Accept error:', error);
    return NextResponse.json({ error: 'Failed to accept super quote' }, { status: 500 });
  }
}
