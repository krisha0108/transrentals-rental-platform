import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import { sendNotificationToCustomer } from '@/lib/services/push-notification-service';
import crypto from 'crypto';
import logger from '@/lib/security/logger';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';

export const dynamic = 'force-dynamic';

// GET - Get car rental booking details (chauffeur_bookings)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingNumber: string }> | { bookingNumber: string } }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ success: false, error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const vendorId = auth.vendorId;

    const resolvedParams = 'then' in params ? await params : params;
    const { bookingNumber } = resolvedParams;

    const booking = await prisma.chauffeur_bookings.findFirst({
      where: { OR: [{ bookingNumber }, { id: bookingNumber }] },
      include: { locations: { select: { id: true, name: true, slug: true } } },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    const isAvailable = ['PENDING_VENDOR', 'BROADCASTED'].includes(booking.status) && !booking.acceptedVendorId;
    const isOwner     = booking.acceptedVendorId === vendorId;

    if (!isAvailable && !isOwner) {
      return NextResponse.json({ success: false, error: 'You do not have access to this booking' }, { status: 403 });
    }

    let intermediateStops: any[] = [];
    try {
      if (booking.intermediateStops) {
        const parsed = JSON.parse(booking.intermediateStops);
        if (Array.isArray(parsed)) intermediateStops = parsed;
      }
    } catch { /* malformed/legacy data — treat as no stops */ }

    return NextResponse.json({
      success: true,
      booking: {
        id:              booking.id,
        bookingNumber:   booking.bookingNumber,
        customerId:      booking.customerId,
        customerName:    booking.customerName,
        customerPhone:   booking.customerPhone,
        customerEmail:   booking.customerEmail,
        tripType:        booking.tripType,
        carCategory:     booking.carCategory,
        carCategoryName: booking.carCategoryName,
        locationName:    booking.locationName,
        pickupCity:      booking.pickupCity,
        dropCity:        booking.dropCity,
        pickupAddress:   booking.pickupAddress,
        dropAddress:     booking.dropAddress,
        intermediateStops,
        pickupDate:      booking.pickupDate,
        pickupTime:      booking.pickupTime,
        returnDate:      booking.returnDate,
        returnTime:      booking.returnTime,
        totalDays:       booking.totalDays,
        totalHours:      booking.totalHours,
        localPackageId:   booking.localPackageId,
        localPackageHours: booking.localPackageHours,
        localPackageKm:   booking.localPackageKm,
        baseFare:        booking.baseFare,
        baseAmount:      booking.baseFare,
        dailyRate:       booking.totalDays && booking.totalDays > 1
                           ? Number(((booking.baseFare ?? 0) / booking.totalDays).toFixed(2))
                           : (booking.baseFare ?? 0),
        perKmRate:       booking.perKmRate,
        chargeableKm:    booking.chargeableKm,
        kmCharges:       booking.kmCharges,
        driverBatta:     booking.driverBatta,
        gstAmount:       booking.gstAmount,
        platformFee:     booking.platformFee,
        grandTotal:      booking.grandTotal,
        paidAmount:      booking.paidAmount,
        paymentStatus:   booking.paymentStatus,
        paymentMethod:   booking.paymentMethod,
        transactionId:   booking.transactionId,
        status:          booking.status,
        driverName:      booking.driverName,
        driverPhone:     booking.driverPhone,
        vehicleNumber:   booking.vehicleNumber,
        vehicleModel:    booking.vehicleModel,
        acceptedVendorId: booking.acceptedVendorId,
        tripStartOtp:    booking.tripStartOtp,
        customerNotes:   booking.customerNotes,
        vendorNotes:     booking.vendorNotes,
        isOwnBooking:    isOwner,
        location:        booking.locations,
        createdAt:       booking.createdAt,
        updatedAt:       booking.updatedAt,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch car rental booking', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch booking', details: error?.message }, { status: 500 });
  }
}

// PATCH - Update car rental booking (chauffeur_bookings)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bookingNumber: string }> | { bookingNumber: string } }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ success: false, error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const vendorId = auth.vendorId;

    // Block rejected/suspended/blocked vendors from write operations
    const guard = await vendorStatusGuard(vendorId);
    if (guard.blocked) return guard.response;
    const resolvedParams = 'then' in params ? await params : params;
    const { bookingNumber } = resolvedParams;
    const body = await request.json();
    const { action, ...data } = body;

    const booking = await prisma.chauffeur_bookings.findUnique({ where: { bookingNumber } });
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    let updateData: any = {};
    let message = '';

    switch (action) {
      case 'accept': {
        if (!['PENDING_VENDOR', 'BROADCASTED'].includes(booking.status)) {
          return NextResponse.json({ success: false, error: 'Booking cannot be accepted in current status' }, { status: 400 });
        }
        if (booking.acceptedVendorId) {
          return NextResponse.json({ success: false, error: 'Already accepted by another vendor' }, { status: 400 });
        }

        const acceptResult = await prisma.$transaction(async (tx) => {
          const current = await tx.chauffeur_bookings.findUnique({ where: { bookingNumber } });
          if (current?.acceptedVendorId) throw new Error('ALREADY_ACCEPTED');
          return tx.chauffeur_bookings.update({
            where: { bookingNumber },
            data: { status: 'ACCEPTED', acceptedVendorId: vendorId, acceptedAt: new Date() },
          });
        });

        try {
          const vendor = await prisma.vendors.findUnique({ where: { id: vendorId }, select: { businessName: true } });
          const vendorName = vendor?.businessName || 'our vendor';
          const notificationId = 'NOTIF_' + crypto.randomBytes(8).toString('hex');
          await prisma.notifications.create({
            data: {
              id: notificationId,
              customerId: acceptResult.customerId!,
              title: '✅ Booking Confirmed!',
              body: `Your car rental booking has been confirmed by ${vendorName}! 🚗`,
              type: 'booking',
              serviceType: 'car-rental',
              bookingId: acceptResult.id,
              isRead: false,
            },
          });
          await sendNotificationToCustomer(
            acceptResult.customerId!,
            { title: '✅ Booking Confirmed!', body: `Your car rental booking has been confirmed by ${vendorName}! 🚗` },
            { type: 'booking_accepted', serviceType: 'car-rental', bookingId: acceptResult.id, bookingNumber: acceptResult.bookingNumber }
          );
        } catch (notifErr: any) {
          logger.error('Failed to send accept notification', notifErr);
        }

        return NextResponse.json({
          success: true,
          message: 'Booking accepted successfully!',
          booking: { id: acceptResult.id, bookingNumber: acceptResult.bookingNumber, status: acceptResult.status, acceptedVendorId: acceptResult.acceptedVendorId },
        });
      }

      case 'reject': {
        if (booking.acceptedVendorId && booking.acceptedVendorId !== vendorId) {
          return NextResponse.json({ success: false, error: 'This booking belongs to another vendor' }, { status: 403 });
        }
        if (!['PENDING_VENDOR', 'BROADCASTED'].includes(booking.status)) {
          return NextResponse.json({ success: false, error: 'Booking cannot be rejected in current status' }, { status: 400 });
        }
        const rejectedBy = booking.rejectedByVendors
          ? (() => { try { return JSON.parse(booking.rejectedByVendors); } catch { return []; } })()
          : [];
        updateData = {
          rejectedByVendors: JSON.stringify([...rejectedBy, { vendorId, reason: data.reason || 'Rejected', rejectedAt: new Date() }]),
          ...(booking.acceptedVendorId === vendorId ? { status: 'BROADCASTED', acceptedVendorId: null, acceptedAt: null } : {}),
        };
        message = 'Booking rejected';
        break;
      }

      case 'assign_driver': {
        if (booking.acceptedVendorId !== vendorId) {
          return NextResponse.json({ success: false, error: 'You can only assign drivers to your own bookings' }, { status: 403 });
        }
        if (!['ACCEPTED', 'DRIVER_ASSIGNED'].includes(booking.status)) {
          return NextResponse.json({ success: false, error: 'Driver can only be assigned to accepted bookings' }, { status: 400 });
        }
        updateData = {
          driverName:      data.driverName || null,
          driverPhone:     data.driverPhone || null,
          vehicleNumber:   data.vehicleNumber || null,
          vehicleModel:    data.vehicleModel || null,
          status:          'DRIVER_ASSIGNED',
          driverAssignedAt: new Date(),
        };
        message = 'Driver assigned successfully';
        break;
      }

      case 'start_trip': {
        if (booking.acceptedVendorId !== vendorId) {
          return NextResponse.json({ success: false, error: 'You can only update your own bookings' }, { status: 403 });
        }
        if (!['ACCEPTED', 'DRIVER_ASSIGNED'].includes(booking.status)) {
          return NextResponse.json({ success: false, error: 'Cannot start trip in current status' }, { status: 400 });
        }
        if (data.otp && data.otp !== booking.tripStartOtp) {
          return NextResponse.json({ success: false, error: 'Invalid OTP' }, { status: 400 });
        }
        updateData = {
          status:        'IN_PROGRESS',
          tripStartedAt: new Date(),
        };
        message = 'Trip started';
        break;
      }

      case 'complete_trip': {
        if (booking.acceptedVendorId !== vendorId) {
          return NextResponse.json({ success: false, error: 'You can only complete your own bookings' }, { status: 403 });
        }
        if (booking.status !== 'IN_PROGRESS') {
          return NextResponse.json({ success: false, error: 'Only in-progress bookings can be completed' }, { status: 400 });
        }
        updateData = {
          status:        'COMPLETED',
          tripEndedAt:   new Date(),
          actualKmTravelled: data.actualKm || null,
          actualHours:   data.actualHours || null,
          extraKmCharges: data.extraKmCharges || 0,
          extraHourCharges: data.extraHourCharges || 0,
          actualTollCharges: data.actualTollCharges || null,
        };
        message = 'Trip completed successfully';

        try {
          const notificationId = 'NOTIF_' + crypto.randomBytes(8).toString('hex');
          await prisma.notifications.create({
            data: {
              id: notificationId,
              customerId: booking.customerId!,
              title: '✅ Trip Completed!',
              body: `Your car rental trip has been completed. Thank you for choosing us! 🚗`,
              type: 'booking',
              serviceType: 'car-rental',
              bookingId: booking.id,
              isRead: false,
            },
          });
          await sendNotificationToCustomer(
            booking.customerId!,
            { title: '✅ Trip Completed!', body: 'Your car rental trip has been completed. Thank you!' },
            { type: 'trip_completed', serviceType: 'car-rental', bookingId: booking.id, bookingNumber: booking.bookingNumber }
          );
        } catch (notifErr: any) {
          logger.error('Failed to send complete notification', notifErr);
        }
        break;
      }

      case 'update_notes': {
        if (booking.acceptedVendorId !== vendorId) {
          return NextResponse.json({ success: false, error: 'You can only update notes for your own bookings' }, { status: 403 });
        }
        const newNote = { text: data.vendorNotes, sentAt: new Date().toISOString() };
        let existing: any[] = [];
        try {
          if (booking.vendorNotes) existing = JSON.parse(booking.vendorNotes);
          if (!Array.isArray(existing)) existing = [{ text: booking.vendorNotes, sentAt: new Date().toISOString() }];
        } catch {
          if (booking.vendorNotes) existing = [{ text: booking.vendorNotes, sentAt: new Date().toISOString() }];
        }
        updateData = { vendorNotes: JSON.stringify([...existing, newNote]) };
        message = 'Note sent successfully';
        break;
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    const updatedBooking = await prisma.chauffeur_bookings.update({ where: { bookingNumber }, data: updateData });

    return NextResponse.json({
      success: true,
      message,
      booking: {
        id:            updatedBooking.id,
        bookingNumber: updatedBooking.bookingNumber,
        status:        updatedBooking.status,
        driverName:    updatedBooking.driverName,
        driverPhone:   updatedBooking.driverPhone,
        vehicleNumber: updatedBooking.vehicleNumber,
        vehicleModel:  updatedBooking.vehicleModel,
        acceptedVendorId: updatedBooking.acceptedVendorId,
      },
    });
  } catch (error: any) {
    logger.error('Failed to update car rental booking', error);
    if (error.message === 'ALREADY_ACCEPTED') {
      return NextResponse.json({ success: false, error: 'Already accepted by another vendor' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Failed to update booking', details: error?.message }, { status: 500 });
  }
}
