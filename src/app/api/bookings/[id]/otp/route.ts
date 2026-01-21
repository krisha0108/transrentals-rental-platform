import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// GET - Generate and send OTP to customer for trip start
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Support both web session and mobile JWT authentication
    const vendorAuth = await getVendorAuth(request);
    if (!vendorAuth.authenticated || !vendorAuth.vendorId) {
      return NextResponse.json({ error: vendorAuth.error || 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = 'then' in params ? await params : params;
    const { id: bookingId } = resolvedParams;

    // Find the booking
    const booking = await prisma.bike_bookings.findUnique({
      where: { id: bookingId },
      include: {
        customers: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify that this vendor is the accepted vendor for this booking
    if (booking.acceptedVendorId !== vendorAuth.vendorId) {
      return NextResponse.json(
        { error: 'You are not authorized to generate OTP for this booking' },
        { status: 403 }
      );
    }

    // Check if booking is ready for trip start (vendor approved)
    const allowedStatuses = ['ACCEPTED', 'CONFIRMED', 'READY_FOR_PICKUP'];
    if (!allowedStatuses.includes(booking.status)) {
      return NextResponse.json(
        { error: 'Booking is not ready to start trip. Current status: ' + booking.status },
        { status: 400 }
      );
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    // Update booking with OTP
    await prisma.bike_bookings.update({
      where: { id: bookingId },
      data: {
        tripStartOtp: otp,
        tripStartOtpExpiry: otpExpiry,
        tripStartOtpSentAt: new Date(),
        status: 'READY_FOR_PICKUP',
      },
    });

    // TODO: Send OTP to customer via SMS/WhatsApp
    // For now, we'll return the OTP in response (for development)
    // In production, this should send via SMS and only return success

    return NextResponse.json({
      success: true,
      message: 'OTP sent to customer successfully',
      // Remove this in production - only for development
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
      expiresAt: otpExpiry,
      customer: {
        name: booking.customers?.name,
        phone: booking.customers?.phone ? `****${booking.customers.phone.slice(-4)}` : null,
      },
    });
  } catch (error: any) {
    logger.error('OTP generation error', error);
    return NextResponse.json(
      { error: 'Failed to generate OTP', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Verify OTP and start trip
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Support both web session and mobile JWT authentication
    const vendorAuth = await getVendorAuth(request);
    if (!vendorAuth.authenticated || !vendorAuth.vendorId) {
      return NextResponse.json({ error: vendorAuth.error || 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = 'then' in params ? await params : params;
    const { id: bookingId } = resolvedParams;
    const body = await request.json();
    const { otp, action } = body;

    // action can be 'start' or 'end'
    const validActions = ['start', 'end'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "start" or "end"' },
        { status: 400 }
      );
    }

    if (!otp) {
      return NextResponse.json({ error: 'OTP is required' }, { status: 400 });
    }

    // Find the booking
    const booking = await prisma.bike_bookings.findUnique({
      where: { id: bookingId },
      include: {
        customers: {
          select: { id: true, name: true, email: true, phone: true },
        },
        vendors_bike_bookings_acceptedVendorIdTovendors: {
          select: { id: true, businessName: true, phone: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify that this vendor is the accepted vendor for this booking
    if (booking.acceptedVendorId !== vendorAuth.vendorId) {
      return NextResponse.json(
        { error: 'You are not authorized to verify OTP for this booking' },
        { status: 403 }
      );
    }

    if (action === 'start') {
      // Verify trip start OTP
      if (booking.status !== 'READY_FOR_PICKUP') {
        return NextResponse.json(
          { error: 'Booking is not ready for pickup' },
          { status: 400 }
        );
      }

      // Check if OTP matches
      if (booking.tripStartOtp !== otp) {
        return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
      }

      // Check if OTP has expired
      if (booking.tripStartOtpExpiry && new Date() > booking.tripStartOtpExpiry) {
        return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
      }

      // OTP verified - start trip
      const updatedBooking = await prisma.bike_bookings.update({
        where: { id: bookingId },
        data: {
          status: 'IN_PROGRESS',
          tripOtpVerified: true,
          tripOtpVerifiedAt: new Date(),
          pickedUpAt: new Date(), // Use pickedUpAt instead of tripStartedAt
          // Clear OTP after successful verification
          tripStartOtp: null,
          tripStartOtpExpiry: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'OTP verified successfully. Trip started!',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
          tripStartedAt: updatedBooking.pickedUpAt,
        },
      });
    } else if (action === 'end') {
      // Verify trip end OTP (if implemented)
      if (booking.status !== 'IN_PROGRESS') {
        return NextResponse.json(
          { error: 'Trip is not in progress' },
          { status: 400 }
        );
      }

      // Check if OTP matches
      if (booking.tripEndOtp !== otp) {
        return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
      }

      // OTP verified - end trip
      const updatedBooking = await prisma.bike_bookings.update({
        where: { id: bookingId },
        data: {
          status: 'COMPLETED',
          tripEndVerifiedAt: new Date(),
          actualReturnDate: new Date(),
          returnedAt: new Date(),
          // Clear OTP
          tripEndOtp: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Trip completed successfully!',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
          returnedAt: updatedBooking.returnedAt,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    logger.error('OTP verification error', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP', details: error?.message },
      { status: 500 }
    );
  }
}
