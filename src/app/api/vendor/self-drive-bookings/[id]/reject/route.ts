// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';
export const dynamic = 'force-dynamic';

// POST - Vendor rejects a Self-Drive car booking (broadcasts to other vendors)
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
    const booking = await prisma.car_bookings.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if booking can be rejected
    if (!['PENDING_VENDOR', 'BROADCASTED'].includes(booking.status)) {
      return NextResponse.json(
        { error: 'This booking cannot be rejected' },
        { status: 400 }
      );
    }

    // For direct requests, only the assigned vendor can reject
    if (booking.status === 'PENDING_VENDOR' && booking.assignedVendorId !== vendorId) {
      return NextResponse.json(
        { error: 'You are not authorized to reject this booking' },
        { status: 403 }
      );
    }

    // Parse request body for rejection reason
    const body = await request.json().catch(() => ({}));
    const { reason = 'Vehicle not available' } = body;

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
    const updatedBooking = await prisma.car_bookings.update({
      where: { id },
      data: {
        status: 'BROADCASTED', // Always broadcast after rejection
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
        // Check if vendor provides self-drive car service
        vendor_approved_services: {
          some: {
            services: {
              slug: { in: ['self-drive-car-rentals', 'self-drive', 'car-rental', 'car-on-rent'] },
            },
            isActive: true,
          },
        },
      },
    });

    // If no more vendors available, mark booking as EXPIRED
    if (availableVendorsCount === 0) {
      await prisma.car_bookings.update({
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
        ? 'Self-Drive booking rejected and broadcasted to other vendors'
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
    logger.error('Failed to reject car booking', error);
    return NextResponse.json(
      { error: 'Failed to reject booking', details: error?.message },
      { status: 500 }
    );
  }
}
