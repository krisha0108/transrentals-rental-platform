// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vendor = await prisma.vendors.findFirst({
      where: { id: auth.vendorId },
      select: { id: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const booking = await prisma.packers_bookings.findFirst({
      where: { id, vendorId: vendor.id },
      include: {
        packers_quote_requests: {
          select: {
            id: true,
            requestNumber: true,
            pickupCity: true,
            dropCity: true,
          }
        },
        packers_quotes: {
          select: {
            id: true,
            packingCharges: true,
            unpackingCharges: true,
            loadingCharges: true,
            unloadingCharges: true,
            transportCharges: true,
            storageCharges: true,
            insuranceCharges: true,
            materialCharges: true,
            gstAmount: true,
            totalAmount: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.vendorId !== auth.vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Use location from quoteRequest if available, fallback to existing fields
    const pickupCity = booking.packers_quote_requests?.pickupCity || booking.pickupCity || 'N/A';
    const dropCity = booking.packers_quote_requests?.dropCity || booking.dropCity || 'N/A';

    const transformedBooking = {
      ...booking,
      pickupCity,
      dropCity,
      quoteRequest: booking.packers_quote_requests,
      acceptedQuote: booking.packers_quotes,
    };

    return NextResponse.json({ success: true, booking: transformedBooking });
  } catch (error: any) {
    logger.error('Failed to fetch packers booking', error);
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
  }
}

// PATCH - Update packers booking (assign operator, accept, reject, etc.)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const auth = await getVendorAuth(request);

        if (!auth.authenticated || !auth.vendorId) {
            return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
        }

        const vendor = await prisma.vendors.findFirst({
            where: { id: auth.vendorId },
            select: { id: true },
        });

        if (!vendor) {
            return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
        }

        const body = await request.json();
        const { action, ...data } = body;

        // Find the booking
        const booking = await prisma.packers_bookings.findUnique({
            where: { id },
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Verify vendor owns this booking
        if (booking.vendorId !== vendor.id) {
            return NextResponse.json(
                { error: 'You can only modify your own bookings' },
                { status: 403 }
            );
        }

        let updateData: any = {};
        let message = '';

        switch (action) {
            case 'assign_driver':
                // Check if booking can have operator assigned
                const assignableStatuses = ['ADVANCE_PAID', 'ACCEPTED', 'PAYMENT_VERIFIED'];
                if (!assignableStatuses.includes(booking.status)) {
                    return NextResponse.json(
                        { error: 'Operator can only be assigned to paid or accepted bookings' },
                        { status: 400 }
                    );
                }

                if (!data.operatorName || !data.operatorPhone) {
                    return NextResponse.json(
                        { error: 'Operator name and phone are required' },
                        { status: 400 }
                    );
                }

                updateData = {
                    status: 'TEAM_ASSIGNED',
                    teamLeaderName: data.operatorName,
                    teamLeaderPhone: data.operatorPhone,
                };
                message = 'Team leader assigned successfully';
                break;

            case 'accept':
                if (booking.status !== 'PENDING_VENDOR' && booking.status !== 'BROADCASTED' && booking.status !== 'PAYMENT_VERIFIED') {
                    return NextResponse.json(
                        { error: 'Booking cannot be accepted in current status' },
                        { status: 400 }
                    );
                }

                updateData = {
                    status: 'ACCEPTED',
                    acceptedAt: new Date(),
                };
                message = 'Booking accepted successfully';
                break;

            case 'reject':
                if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
                    return NextResponse.json(
                        { error: 'Cannot reject completed or cancelled booking' },
                        { status: 400 }
                    );
                }

                updateData = {
                    status: 'CANCELLED',
                    cancellationReason: data.reason || 'Vendor rejected',
                    cancelledAt: new Date(),
                };
                message = 'Booking rejected';
                break;

            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 }
                );
        }

        // Update the booking
        const updatedBooking = await prisma.packers_bookings.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            message,
            booking: updatedBooking,
        });

    } catch (error: any) {
        logger.error('Failed to update packers booking', error);
        return NextResponse.json(
            { error: 'Failed to update booking', details: error?.message },
            { status: 500 }
        );
    }
}
