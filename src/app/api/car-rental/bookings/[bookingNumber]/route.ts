import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - Fetch car rental booking (chauffeur_bookings)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingNumber: string }> | { bookingNumber: string } }
) {
  try {
    const resolvedParams = 'then' in params ? await params : params;
    const { bookingNumber } = resolvedParams;

    const booking = await prisma.chauffeur_bookings.findFirst({
      where: { OR: [{ id: bookingNumber }, { bookingNumber }] },
      include: {
        locations: { select: { id: true, name: true, slug: true } },
        vendors_chauffeur_bookings_acceptedVendorIdTovendors: {
          select: { id: true, businessName: true, ownerName: true, phone: true, logo: true, city: true, rating: true },
        },
        accepted_driver: {
          select: { id: true, name: true, phone: true, profilePhoto: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    const acceptedVendor = (booking as any).vendors_chauffeur_bookings_acceptedVendorIdTovendors;
    const acceptedDriver = (booking as any).accepted_driver;

    // Driver name/phone: prefer drivers table (independent driver), fallback to booking fields (staff driver)
    const resolvedDriverName  = acceptedDriver?.name  ?? booking.driverName  ?? null;
    const resolvedDriverPhone = acceptedDriver?.phone ?? booking.driverPhone ?? null;
    const resolvedDriverPhoto = acceptedDriver?.profilePhoto ?? null;

    return NextResponse.json({
      success: true,
      booking: {
        id:              booking.id,
        bookingNumber:   booking.bookingNumber,
        customerId:      booking.customerId,
        customerName:    booking.customerName,
        customerEmail:   booking.customerEmail,
        customerPhone:   booking.customerPhone,
        tripType:        booking.tripType,
        carCategory:     booking.carCategory,
        carCategoryName: booking.carCategoryName,
        pickupCity:      booking.pickupCity,
        dropCity:        booking.dropCity,
        pickupDate:      booking.pickupDate,
        pickupTime:      booking.pickupTime,
        returnDate:      booking.returnDate,
        totalDays:       booking.totalDays,
        pickupAddress:   booking.pickupAddress,
        dropAddress:     booking.dropAddress,
        baseFare:        booking.baseFare,
        perKmRate:       booking.perKmRate,
        chargeableKm:    booking.chargeableKm,
        kmCharges:       booking.kmCharges,
        driverBatta:     booking.driverBatta,
        gstAmount:       booking.gstAmount,
        platformFee:     booking.platformFee,
        grandTotal:      booking.grandTotal,
        partialPayment:  booking.partialPayment,
        paidAmount:      booking.paidAmount,
        paymentStatus:   booking.paymentStatus,
        paymentMethod:   booking.paymentMethod,
        transactionId:   booking.transactionId,
        status:          booking.status,
        acceptedDriverId:  booking.acceptedDriverId,
        acceptedStaffId:   booking.acceptedStaffId,
        acceptedVendorId:  booking.acceptedVendorId,
        driverName:        resolvedDriverName,
        driverPhone:       resolvedDriverPhone,
        driverPhoto:       resolvedDriverPhoto,
        vehicleNumber:   booking.vehicleNumber,
        vehicleModel:    booking.vehicleModel,
        tripStartOtp:    booking.tripStartOtp,
        customerNotes:   booking.customerNotes,
        vendorNotes:     booking.vendorNotes,
        localPackageId:   booking.localPackageId,
        localPackageHours: booking.localPackageHours,
        localPackageKm:   booking.localPackageKm,
        cancelledAt:     booking.cancelledAt,
        cancellationReason: booking.cancellationReason,
        rating:          booking.rating,
        review:          booking.review,
        location:        booking.locations,
        vendor: (acceptedVendor && !booking.acceptedDriverId && !booking.acceptedStaffId) ? {
          id: acceptedVendor.id,
          businessName: acceptedVendor.businessName,
          ownerName: acceptedVendor.ownerName,
          phone: acceptedVendor.phone,
          logo: acceptedVendor.logo,
          city: acceptedVendor.city,
          rating: acceptedVendor.rating,
        } : null,
        createdAt:       booking.createdAt,
        updatedAt:       booking.updatedAt,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch car rental booking', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch booking', details: error?.message }, { status: 500 });
  }
}

// PATCH - Cancel or rate
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bookingNumber: string }> | { bookingNumber: string } }
) {
  try {
    const resolvedParams = 'then' in params ? await params : params;
    const { bookingNumber } = resolvedParams;
    const body = await request.json();
    const { action } = body;

    const booking = await prisma.chauffeur_bookings.findFirst({
      where: { OR: [{ id: bookingNumber }, { bookingNumber }] },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    switch (action) {
      case 'cancel': {
        const cancellable = ['PENDING_PAYMENT', 'PENDING_VENDOR', 'BROADCASTED', 'ACCEPTED'];
        if (!cancellable.includes(booking.status)) {
          return NextResponse.json({ success: false, error: 'Booking cannot be cancelled at this stage' }, { status: 400 });
        }
        const updated = await prisma.chauffeur_bookings.update({
          where: { id: booking.id },
          data: { status: 'CANCELLED', cancelledAt: new Date(), cancellationReason: body.cancellationReason || 'Customer cancelled' },
        });
        return NextResponse.json({ success: true, message: 'Booking cancelled successfully', booking: { id: updated.id, status: updated.status } });
      }
      case 'review':
      case 'rate': {
        if (booking.status !== 'COMPLETED') {
          return NextResponse.json({ success: false, error: 'Only completed bookings can be rated' }, { status: 400 });
        }
        if (booking.rating) {
          return NextResponse.json({ success: false, error: 'Already rated' }, { status: 400 });
        }
        const { rating, review } = body;
        if (!rating || rating < 1 || rating > 5) {
          return NextResponse.json({ success: false, error: 'Rating must be 1-5' }, { status: 400 });
        }
        const updated = await prisma.chauffeur_bookings.update({
          where: { id: booking.id },
          data: { rating: parseInt(rating), review: review || null },
        });
        return NextResponse.json({ success: true, message: 'Thank you for your feedback!', booking: { id: updated.id, rating: updated.rating } });
      }
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    logger.error('Failed to update car rental booking', error);
    return NextResponse.json({ success: false, error: 'Failed to update booking', details: error?.message }, { status: 500 });
  }
}
