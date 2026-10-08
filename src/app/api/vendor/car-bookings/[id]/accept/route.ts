// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';
export const dynamic = 'force-dynamic';

// POST - Vendor accepts a Car Booking (with driver)
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
      select: {
        id: true,
        businessName: true,
        phone: true,
        vendor_approved_locations: { where: { isActive: true }, select: { locationId: true } },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const approvedLocationIds = vendor.vendor_approved_locations.map((l) => l.locationId);

    // Get booking
    const booking = await prisma.chauffeur_bookings.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if booking has already been accepted by another vendor
    if (booking.acceptedVendorId && booking.acceptedVendorId !== vendorId) {
      return NextResponse.json(
        { error: 'This booking has already been accepted by another vendor' },
        { status: 400 }
      );
    }

    // Check if booking can be accepted
    if (!['PENDING_VENDOR', 'BROADCASTED'].includes(booking.status)) {
      return NextResponse.json(
        { error: 'This booking cannot be accepted' },
        { status: 400 }
      );
    }

    // For direct requests, only the assigned vendor can accept
    if (booking.status === 'PENDING_VENDOR' && booking.assignedVendorId !== vendorId) {
      return NextResponse.json(
        { error: 'You are not authorized to accept this booking' },
        { status: 403 }
      );
    }

    // For broadcasted requests, check if vendor has approved location
    if (booking.status === 'BROADCASTED' && !approvedLocationIds.includes(booking.locationId)) {
      return NextResponse.json(
        { error: 'This booking is not available in your approved locations' },
        { status: 403 }
      );
    }

    // Parse request body for driver/vehicle info
    const body = await request.json().catch(() => ({}));
    const { driverName, driverPhone, driverPhoto, vehicleNumber, vehicle_model } = body;

    // Check if another vendor has already accepted
    const currentBooking = await prisma.chauffeur_bookings.findUnique({
      where: { id },
      select: { status: true, acceptedVendorId: true }
    });

    if (currentBooking && currentBooking.acceptedVendorId && currentBooking.acceptedVendorId !== vendorId) {
      return NextResponse.json(
        {
          error: 'Booking already taken',
          message: 'This booking has already been accepted by another vendor.'
        },
        { status: 409 }
      );
    }

    // Update booking using relation connect to avoid field sync issues
    const updatedBooking = await prisma.chauffeur_bookings.update({
      where: { id },
      data: {
        status: driverName ? 'DRIVER_ASSIGNED' : 'ACCEPTED',
        vendors_chauffeur_bookings_acceptedVendorIdTovendors: {
          connect: { id: vendorId }
        },
        driverName: driverName || null,
        driverPhone: driverPhone || null,
        driverPhoto: driverPhoto || null,
        vehicleNumber: vehicleNumber || null,
        vehicleModel: vehicle_model || null,
        driverAssignedAt: driverName ? new Date() : null,
        acceptedAt: new Date(),
        responseDeadline: null,
      },
      include: {
        locations: { select: { name: true, slug: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: driverName
        ? 'Car Booking accepted and driver assigned'
        : 'Car Booking accepted. Please assign a driver.',
      booking: {
        id: updatedBooking?.id,
        bookingNumber: updatedBooking?.bookingNumber,
        status: updatedBooking?.status,
        tripType: updatedBooking?.tripType,
        carCategory: updatedBooking?.carCategoryName,
        grandTotal: updatedBooking?.grandTotal,
        acceptedAt: updatedBooking?.acceptedAt,
        driverName: updatedBooking?.driverName,
        vehicleNumber: updatedBooking?.vehicleNumber,
        tripStartOtp: updatedBooking?.tripStartOtp,
        location: updatedBooking?.locations,
      },
    });
  } catch (error: any) {
    logger.error('Failed to accept car booking', error);
    return NextResponse.json(
      { error: 'Failed to accept booking', details: error?.message },
      { status: 500 }
    );
  }
}
