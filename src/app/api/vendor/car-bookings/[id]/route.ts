// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - Fetch a single car rental booking for vendor
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

    // Fetch booking - support both ID and booking number
    const booking = await prisma.chauffeur_bookings.findFirst({
      where: {
        OR: [
          { id },
          { bookingNumber: id },
        ],
      },
      include: {
        locations: { select: { id: true, name: true, slug: true } },
        customers: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if vendor is authorized to view this booking
    const isAssigned = booking.assignedVendorId === vendor.id;
    const isAccepted = booking.acceptedVendorId === vendor.id;

    // For car rental (chauffeur), allow viewing of broadcasted bookings
    const isBroadcasted = ['BROADCASTED', 'PENDING_VENDOR'].includes(booking.status) && !booking.acceptedVendorId;

    // Vendor can view if:
    // 1. They are the assigned vendor
    // 2. They accepted the booking
    // 3. Booking is broadcasted (open for all)
    const canView = isAssigned || isAccepted || isBroadcasted;

    if (!canView) {
      return NextResponse.json(
        { error: 'You are not authorized to view this booking' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        tripType: booking.tripType,
        carCategory: booking.carCategory,
        carCategoryName: booking.carCategoryName,
        customerId: booking.customerId,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        pickupCity: booking.pickupCity,
        pickupAddress: booking.pickupAddress,
        pickupLocation: booking.pickupAddress, // For mobile app compatibility
        dropCity: booking.dropCity,
        dropAddress: booking.dropAddress,
        dropLocation: booking.dropAddress, // For mobile app compatibility
        pickupDate: booking.pickupDate,
        pickupTime: booking.pickupTime,
        returnDate: booking.returnDate,
        localPackageId: booking.localPackageId,
        localPackageHours: booking.localPackageHours,
        localPackageKm: booking.localPackageKm,
        estimatedDistance: booking.estimatedDistance,
        baseFare: booking.baseFare,
        gstAmount: booking.gstAmount,
        platformFee: booking.platformFee,
        grandTotal: booking.grandTotal,
        totalAmount: booking.grandTotal, // For mobile app compatibility
        securityDeposit: booking.securityDeposit,
        paidAmount: booking.paidAmount,
        advancePaid: booking.paidAmount, // For mobile app compatibility (chauffeur uses paidAmount)
        partialPayment: booking.partialPayment,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        driverName: booking.driverName,
        driverPhone: booking.driverPhone,
        vehicleNumber: booking.vehicleNumber,
        vehicleModel: booking.vehicleModel,
        tripStartOtp: booking.tripStartOtp,
        tripEndOtp: booking.tripEndOtp,
        tripStartedAt: booking.tripStartedAt,
        tripEndedAt: booking.tripEndedAt,
        rating: booking.rating,
        driverRating: booking.driverRating,
        customerNotes: booking.customerNotes,
        location: booking.locations,
        customer: booking.customers,
        acceptedAt: booking.acceptedAt,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        // Additional flags for UI
        canAccept: ['PENDING_VENDOR', 'BROADCASTED'].includes(booking.status) && !booking.acceptedVendorId,
        isOwnBooking: isAssigned || isAccepted,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch vendor car booking details', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking details', details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH - Update car rental booking (accept, reject, update status, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, ...data } = body;

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

    // Fetch booking
    const booking = await prisma.chauffeur_bookings.findFirst({
      where: {
        OR: [
          { id },
          { bookingNumber: id },
        ],
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    switch (action) {
      case 'accept': {
        // Check if booking can be accepted
        if (!['PENDING_VENDOR', 'BROADCASTED'].includes(booking.status)) {
          return NextResponse.json({ error: 'Booking cannot be accepted in current status' }, { status: 400 });
        }

        if (booking.acceptedVendorId) {
          return NextResponse.json({ error: 'Booking already accepted by another vendor' }, { status: 400 });
        }

        const updatedBooking = await prisma.chauffeur_bookings.update({
          where: { id: booking.id },
          data: {
            status: 'ACCEPTED',
            acceptedVendorId: vendor.id,
            acceptedAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Booking accepted successfully',
          booking: { id: updatedBooking.id, status: updatedBooking.status },
        });
      }

      case 'reject': {
        if (booking.acceptedVendorId !== vendor.id) {
          return NextResponse.json({ error: 'Only accepted vendor can reject' }, { status: 403 });
        }

        const updatedBooking = await prisma.chauffeur_bookings.update({
          where: { id: booking.id },
          data: {
            status: 'CANCELLED',
            acceptedVendorId: null,
            acceptedAt: null,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Booking rejected',
          booking: { id: updatedBooking.id, status: updatedBooking.status },
        });
      }

      case 'assign_driver': {
        if (booking.acceptedVendorId !== vendor.id) {
          return NextResponse.json({ error: 'Only accepted vendor can assign driver' }, { status: 403 });
        }

        if (!['ACCEPTED', 'DRIVER_ASSIGNED'].includes(booking.status)) {
          return NextResponse.json({ error: 'Cannot assign driver in current status' }, { status: 400 });
        }

        const { driverName, driverPhone, vehicleNumber, vehicleModel } = data;

        const updatedBooking = await prisma.chauffeur_bookings.update({
          where: { id: booking.id },
          data: {
            status: 'DRIVER_ASSIGNED',
            driverName: driverName || null,
            driverPhone: driverPhone || null,
            vehicleNumber: vehicleNumber || null,
            vehicleModel: vehicleModel || null,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Driver assigned successfully',
          booking: { id: updatedBooking.id, status: updatedBooking.status },
        });
      }

      case 'start_trip': {
        if (booking.acceptedVendorId !== vendor.id) {
          return NextResponse.json({ error: 'Only accepted vendor can start trip' }, { status: 403 });
        }

        if (booking.status !== 'DRIVER_ASSIGNED') {
          return NextResponse.json({ error: 'Must assign driver before starting trip' }, { status: 400 });
        }

        const { otp } = data;
        if (otp !== booking.tripStartOtp) {
          return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
        }

        const updatedBooking = await prisma.chauffeur_bookings.update({
          where: { id: booking.id },
          data: {
            status: 'IN_PROGRESS',
            tripStartedAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Trip started',
          booking: { id: updatedBooking.id, status: updatedBooking.status },
        });
      }

      case 'end_trip': {
        if (booking.acceptedVendorId !== vendor.id) {
          return NextResponse.json({ error: 'Only accepted vendor can end trip' }, { status: 403 });
        }

        if (booking.status !== 'IN_PROGRESS') {
          return NextResponse.json({ error: 'Trip must be in progress' }, { status: 400 });
        }

        const { endKmReading, extraHours, tollCharges, parkingCharges } = data;

        try {
          const updatedBooking = await prisma.chauffeur_bookings.update({
            where: { id: booking.id },
            data: {
              status: 'COMPLETED',
              tripEndedAt: new Date(),
              paymentStatus: 'COMPLETED',
              actualKmTravelled: endKmReading ? parseInt(endKmReading.toString()) : null,
              actualHours: extraHours ? parseInt(extraHours.toString()) : null,
              actualTollCharges: tollCharges ? parseFloat(tollCharges.toString()) : null,
              actualParkingCharges: parkingCharges ? parseFloat(parkingCharges.toString()) : null,
            },
          });

          return NextResponse.json({
            success: true,
            message: 'Trip completed',
            booking: { id: updatedBooking.id, status: updatedBooking.status },
          });
        } catch (error: any) {
          console.error('Error completing trip:', error);
          return NextResponse.json({
            success: false,
            error: 'Failed to update booking',
            details: error?.message
          }, { status: 500 });
        }
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    logger.error('Failed to update vendor car booking', error);
    return NextResponse.json(
      { error: 'Failed to update booking', details: error?.message },
      { status: 500 }
    );
  }
}
