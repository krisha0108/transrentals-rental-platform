import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get specific bus booking details for vendor
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    // Get vendor
    const vendor = await prisma.vendors.findFirst({
      where: { id: auth.vendorId },
            select: { id: true },
        });

        if (!vendor) {
            return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
        }

        // Get booking with related quote request
        const booking = await prisma.bus_bookings.findUnique({
            where: { id },
            include: {
                bus_quote_requests: {
                    include: {
                        locations: {
                            select: { name: true, slug: true }
                        }
                    }
                },
                bus_quotes: true,
            },
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Verify vendor owns this booking
        if (booking.vendorId !== vendor.id) {
            return NextResponse.json(
                { error: 'You are not authorized to view this booking' },
                { status: 403 }
            );
        }

        // Use location from quoteRequest if available, fallback to existing fields
        const pickupCity = booking.bus_quote_requests?.locations?.name || booking.pickupCity || 'N/A';
        const dropCity = booking.dropCity || 'N/A';

        const transformedBooking = {
            ...booking,
            pickupCity,
            dropCity,
        };

        return NextResponse.json({
            success: true,
            booking: transformedBooking,
        });
    } catch (error: any) {
        logger.error('Failed to fetch bus booking details', error);
        return NextResponse.json(
            { error: 'Failed to fetch booking', details: error?.message },
            { status: 500 }
        );
    }
}

// PATCH - Update bus booking (assign driver, accept, reject, etc.)
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
        const booking = await prisma.bus_bookings.findUnique({
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
                // Check if booking can have driver assigned
                const assignableStatuses = ['ADVANCE_PAID', 'ACCEPTED', 'PAYMENT_VERIFIED'];
                if (!assignableStatuses.includes(booking.status)) {
                    return NextResponse.json(
                        { error: 'Driver can only be assigned to paid or accepted bookings' },
                        { status: 400 }
                    );
                }

                if (!data.driverName || !data.driverPhone) {
                    return NextResponse.json(
                        { error: 'Driver name and phone are required' },
                        { status: 400 }
                    );
                }

                updateData = {
                    status: 'VEHICLE_ASSIGNED',
                    driverName: data.driverName,
                    driverPhone: data.driverPhone,
                    driverPhoto: data.driverPhoto || null,
                };
                message = 'Driver assigned successfully';
                break;

            case 'accept':
                if (booking.status !== 'PENDING_PAYMENT' && booking.status !== 'PAYMENT_SUBMITTED' && booking.status !== 'ADVANCE_PAID') {
                    return NextResponse.json(
                        { error: 'Booking cannot be accepted in current status' },
                        { status: 400 }
                    );
                }

                updateData = {
                    status: 'CONFIRMED',
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
        const updatedBooking = await prisma.bus_bookings.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            message,
            booking: updatedBooking,
        });

    } catch (error: any) {
        logger.error('Failed to update bus booking', error);
        return NextResponse.json(
            { error: 'Failed to update booking', details: error?.message },
            { status: 500 }
        );
    }
}
