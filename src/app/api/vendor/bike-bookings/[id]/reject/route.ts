// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';
export const dynamic = 'force-dynamic';

// POST - Vendor rejects a bike booking (broadcasts to other vendors)
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

    // Block rejected/suspended/blocked vendors from write operations
    const guard = await vendorStatusGuard(vendorId);
    if (guard.blocked) return guard.response;

    // Get vendor
    const vendor = await prisma.vendors.findFirst({
      where: { id: vendorId },
      select: { id: true, businessName: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Get booking
    const booking = await prisma.bike_bookings.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if booking can be rejected
    if (!['PENDING_VENDOR', 'BROADCASTED', 'PAYMENT_VERIFIED'].includes(booking.status)) {
      return NextResponse.json(
        { error: 'This booking cannot be rejected' },
        { status: 400 }
      );
    }

    // For direct/payment-verified requests, only the assigned vendor can reject
    if (['PENDING_VENDOR', 'PAYMENT_VERIFIED'].includes(booking.status) && booking.assignedVendorId !== vendorId) {
      return NextResponse.json(
        { error: 'You are not authorized to reject this booking' },
        { status: 403 }
      );
    }

    // Parse request body for rejection reason
    const body = await request.json().catch(() => ({}));
    const { reason = 'Vehicle not available' } = body;

    // PAYMENT_VERIFIED = quote-based booking where customer already paid.
    // Do NOT broadcast to other vendors — cancel the booking instead.
    if (booking.status === 'PAYMENT_VERIFIED') {
      const updatedBooking = await prisma.bike_bookings.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancellationReason: `Vendor cancelled: ${reason}`,
          responseDeadline: null,
        },
        include: {
          locations: { select: { name: true, slug: true } },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Booking cancelled. Customer will be notified and refund will be processed.',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
          location: updatedBooking.locations?.name,
        },
      });
    }

    // Get current rejected vendors list
    const currentRejections = (booking.rejectedByVendors as any[]) || [];

    // Add this vendor to the rejected list with reason and timestamp
    const rejectionEntry = {
      vendorId: vendorId,
      vendorName: vendor.businessName,
      reason,
      rejectedAt: new Date().toISOString(),
    };

    const updatedRejections = [...currentRejections, rejectionEntry];

    // Check if this was a direct request (assigned to specific vendor)
    const wasDirectRequest = booking.status === 'PENDING_VENDOR';

    // Update booking - broadcast to other vendors if it was a direct request
    const updatedBooking = await prisma.bike_bookings.update({
      where: { id },
      data: {
        status: 'BROADCASTED', // Broadcast after rejection for non-payment bookings
        assignedVendorId: null, // Clear assigned vendor
        rejectedByVendors: updatedRejections,
        broadcastedAt: wasDirectRequest ? new Date() : booking.broadcastedAt,
        responseDeadline: null, // Clear deadline
      },
      include: {
        locations: { select: { name: true, slug: true } },
      },
    });

    // Get vendor IDs that have rejected
    const rejectedVendorIds = updatedRejections.map((r: any) => r.vendorId);

    // Count available vendors in the location (excluding rejected ones)
    const availableVendorsCount = await prisma.vendors.count({
      where: {
        isActive: true,
        status: 'APPROVED',
        id: { notIn: rejectedVendorIds },
        // Vendor must have this location approved
        vendor_approved_locations: {
          some: {
            locationId: booking.locationId,
            status: 'ACTIVE',
          },
        },
        // Check if vendor provides bike rental service
        vendor_approved_services: {
          some: {
            services: {
              slug: { in: ['bike-on-rent', 'bike-rental', 'scooty-on-rent'] },
            },
            isActive: true,
          },
        },
      },
    });

    // If no more vendors available, mark booking as EXPIRED
    if (availableVendorsCount === 0) {
      await prisma.bike_bookings.update({
        where: { id },
        data: {
          status: 'EXPIRED',
          cancellationReason: 'No vendors available in this location',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Booking rejected. No other vendors available in this location.',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: 'EXPIRED',
        },
        availableVendors: 0,
      });
    }

    return NextResponse.json({
      success: true,
      message: wasDirectRequest
        ? 'Booking rejected and broadcasted to other vendors'
        : 'Booking removed from your list',
      booking: {
        id: updatedBooking.id,
        bookingNumber: updatedBooking.bookingNumber,
        status: updatedBooking.status,
        location: updatedBooking.locations?.name,
      },
      availableVendors: availableVendorsCount,
    });
  } catch (error: any) {
    logger.error('Failed to reject bike booking', error);
    return NextResponse.json(
      { error: 'Failed to reject booking', details: error?.message },
      { status: 500 }
    );
  }
}
