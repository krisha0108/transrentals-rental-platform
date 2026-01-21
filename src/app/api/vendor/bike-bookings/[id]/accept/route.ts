// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { emitBookingAccepted, BookingAcceptedData } from '@/lib/socket';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// POST - Vendor accepts a bike booking
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    // Get vendor with approved locations
    const vendor = await prisma.vendors.findFirst({
      where: { id: vendorId },
      select: {
        id: true,
        businessName: true,
        phone: true,
        vendor_approved_locations: { select: { locationId: true } },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const approvedLocationIds = vendor.vendor_approved_locations.map((l) => l.locationId);

    // Get booking with current version
    const booking = await prisma.bike_bookings.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if booking can be accepted
    const acceptableStatuses = ['PENDING_VENDOR', 'BROADCASTED', 'PAYMENT_VERIFIED'];
    if (!acceptableStatuses.includes(booking.status)) {
      return NextResponse.json(
        { error: 'This booking cannot be accepted. It may have already been accepted by another vendor or payment is pending.' },
        { status: 400 }
      );
    }

    // For direct requests, only the assigned vendor can accept
    if (booking.status === 'PENDING_VENDOR' && booking.assignedVendorId !== vendor.id) {
      return NextResponse.json(
        { error: 'You are not authorized to accept this booking' },
        { status: 403 }
      );
    }

    // For broadcasted/verified requests, check if vendor was notified or has approved location
    const notifiedVendors = (booking.notifiedVendorIds as string[]) || [];
    if (booking.status === 'BROADCASTED' || booking.status === 'PAYMENT_VERIFIED') {
      // Check if vendor has approved location or was in notified list
      const isNotified = notifiedVendors.includes(vendor.id);
      const hasApprovedLocation = approvedLocationIds.includes(booking.locationId);

      if (!isNotified && !hasApprovedLocation) {
        return NextResponse.json(
          { error: 'You are not authorized to accept this booking' },
          { status: 403 }
        );
      }
    }

    // Parse request body for additional info (vehicle assignment, custom rate)
    const body = await request.json().catch(() => ({}));
    const { vehicleId, vehicleName, customRate } = body;

    // Calculate new amounts if custom rate provided
    let dailyRate = booking.dailyRate;
    let totalAmount = booking.totalAmount;
    let gstAmount = booking.gstAmount;
    let grandTotal = booking.grandTotal;

    if (customRate && customRate !== booking.dailyRate) {
      dailyRate = customRate;
      totalAmount = customRate * booking.totalDays;
      gstAmount = Math.round(totalAmount * 0.18);
      grandTotal = totalAmount + gstAmount;
    }

    const acceptedAt = new Date();

    // OPTIMISTIC LOCKING: Atomic update with version check
    // Only one vendor can win this race
    const result = await prisma.bike_bookings.updateMany({
      where: {
        id,
        status: { in: ['PENDING_VENDOR', 'BROADCASTED', 'PAYMENT_VERIFIED'] }, // Must still be available
        version: booking.version, // Version must match what we read
      },
      data: {
        status: 'ACCEPTED',
        acceptedVendorId: vendor.id,
        acceptedVehicleId: vehicleId || null,
        acceptedVehicleName: vehicleName || booking.requestedVehicleName,
        acceptedAt,
        responseDeadline: null,
        dailyRate,
        totalAmount,
        gstAmount,
        grandTotal,
        version: { increment: 1 }, // Increment version
      },
    });

    // If count is 0, another vendor already accepted
    if (result.count === 0) {
      return NextResponse.json(
        {
          error: 'Booking already taken',
          message: 'Another vendor has already accepted this booking. Better luck next time!'
        },
        { status: 409 } // Conflict
      );
    }

    // Fetch the updated booking for response
    const updatedBooking = await prisma.bike_bookings.findUnique({
      where: { id },
      include: {
        locations: { select: { name: true, slug: true } },
      },
    });

    // Emit Socket.io notifications
    // 1. Notify customer that booking was accepted
    // 2. Notify other vendors that booking is no longer available
    const acceptedData: BookingAcceptedData = {
      bookingId: id,
      bookingNumber: booking.bookingNumber,
      vendorId: vendor.id,
      vendorName: vendor.businessName || 'Vendor',
      vendorPhone: vendor.phone || undefined,
      acceptedVehicleId: vehicleId || '',
      acceptedVehicleName: vehicleName || booking.requestedVehicleName,
      dailyRate,
      totalAmount: grandTotal,
      acceptedAt: acceptedAt.toISOString(),
    };

    emitBookingAccepted(id, vendor.id, notifiedVendors, acceptedData);

    return NextResponse.json({
      success: true,
      message: 'Booking accepted successfully! Customer has been notified. Prepare for pickup.',
      booking: {
        id: updatedBooking?.id,
        bookingNumber: updatedBooking?.bookingNumber,
        status: updatedBooking?.status,
        vehicleName: updatedBooking?.acceptedVehicleName,
        dailyRate: updatedBooking?.dailyRate,
        totalAmount: updatedBooking?.totalAmount,
        grandTotal: updatedBooking?.grandTotal,
        acceptedAt: updatedBooking?.acceptedAt,
        location: updatedBooking?.locations,
        pickupDate: updatedBooking?.pickupDate,
        pickupTime: updatedBooking?.pickupTime,
      },
    });
  } catch (error: any) {
    logger.error('Failed to accept bike booking', error);
    return NextResponse.json(
      { error: 'Failed to accept booking', details: error?.message },
      { status: 500 }
    );
  }
}
