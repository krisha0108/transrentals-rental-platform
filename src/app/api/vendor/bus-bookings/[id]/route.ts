// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get Bus Booking details for vendor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { id } = await params;

    const booking = await prisma.bus_bookings.findFirst({
      where: {
        id,
        vendorId: vendor.id,
      },
      include: {
        bus_quote_requests: {
          select: {
            id: true,
            requestNumber: true,
            requirements: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const response = {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      tripType: booking.tripType,
      vehicleCategory: booking.vehicleCategory,
      vehicleName: booking.vehicleName,
      vehicleNumber: booking.vehicleNumber,
      vehicleModel: booking.vehicleModel,
      passengers: booking.passengers,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerEmail: booking.customerEmail,
      pickupCity: booking.pickupCity,
      pickupAddress: booking.pickupAddress,
      dropCity: booking.dropCity,
      dropAddress: booking.dropAddress,
      routeDetails: booking.routeDetails,
      pickupDate: booking.pickupDate,
      pickupTime: booking.pickupTime,
      returnDate: booking.returnDate,
      returnTime: booking.returnTime,
      tripDays: booking.tripDays,
      baseAmount: booking.baseAmount,
      totalAmount: booking.totalAmount,
      advanceAmount: booking.advanceAmount,
      advancePaid: booking.advancePaid,
      balanceAmount: booking.balanceAmount,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      driverName: booking.driverName,
      driverPhone: booking.driverPhone,
      tripStartOtp: booking.tripStartOtp,
      tripStartedAt: booking.tripStartedAt,
      tripEndedAt: booking.tripEndedAt,
      rating: booking.rating,
      customerNotes: booking.customerNotes,
      quoteRequest: booking.bus_quote_requests,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      droppedAt: booking.droppedAt,
      dropReason: booking.dropReason,
      cancelledAt: booking.cancelledAt,
      cancelledBy: booking.cancelledBy,
      cancellationReason: booking.cancellationReason,
    };

    return NextResponse.json({ success: true, booking: response });
  } catch (error: any) {
    logger.error('Failed to fetch vendor bus booking', error);
    return NextResponse.json({ error: 'Failed to fetch booking', details: error?.message }, { status: 500 });
  }
}
