import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { sendNotificationToCustomer } from '@/lib/services/push-notification-service';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';
import { saveDriverNotification } from '@/lib/utils/driver-notification-sender';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
import { canStartTrip, canCompleteTrip } from '@/lib/utils/booking-date-guard';
export const dynamic = 'force-dynamic';

// GET - Get booking details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingNumber: string }> | { bookingNumber: string } }
) {
  try {
    // Get current vendor session
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const vendorId = auth.vendorId;
    const resolvedParams = 'then' in params ? await params : params;
    const { bookingNumber } = resolvedParams;

    // Try by bookingNumber first, then by ID (for notification redirects that pass DB ID)
    let booking = await prisma.chauffeur_bookings.findUnique({
      where: { bookingNumber },
      include: {
        locations: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!booking) {
      booking = await prisma.chauffeur_bookings.findUnique({
        where: { id: bookingNumber },
        include: {
          locations: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    }

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if vendor can view this booking
    // Can view if: booking is available (PENDING_VENDOR/BROADCASTED) OR vendor owns it
    const isAvailable = ['PENDING_VENDOR', 'BROADCASTED'].includes(booking.status) && !booking.acceptedVendorId;
    const isOwner = booking.acceptedVendorId === vendorId;

    if (!isAvailable && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'You do not have access to this booking' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        customerId: booking.customerId,
        tripType: booking.tripType,
        carCategory: booking.carCategory,
        carCategoryName: booking.carCategoryName,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        customerEmail: booking.customerEmail,
        pickupCity: booking.pickupCity,
        dropCity: booking.dropCity,
        pickupAddress: booking.pickupAddress,
        dropAddress: booking.dropAddress,
        pickupDate: booking.pickupDate,
        pickupTime: booking.pickupTime,
        returnDate: booking.returnDate,
        totalDays: booking.totalDays,
        localPackageId: booking.localPackageId,
        localPackageHours: booking.localPackageHours,
        localPackageKm: booking.localPackageKm,
        intermediateStops: booking.intermediateStops
          ? (() => { try { return JSON.parse(booking.intermediateStops); } catch { return []; } })()
          : [],
        baseFare: booking.baseFare,
        chargeableKm: booking.chargeableKm,
        perKmRate: booking.perKmRate,
        kmCharges: booking.kmCharges,
        driverBatta: booking.driverBatta,
        nightCharges: booking.nightCharges,
        tollCharges: booking.tollCharges,
        gstAmount: booking.gstAmount,
        platformFee: booking.platformFee,
        grandTotal: booking.grandTotal,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        paidAmount: booking.paidAmount,
        transactionId: booking.transactionId,
        paymentMethod: booking.paymentMethod,
        driverName: booking.driverName,
        driverPhone: booking.driverPhone,
        vehicleNumber: booking.vehicleNumber,
        vehicleModel: booking.vehicleModel,
        tripStartOtp: booking.tripStartOtp,
        tripStartedAt: booking.tripStartedAt,
        tripEndedAt: booking.tripEndedAt,
        actualKmTravelled: booking.actualKmTravelled,
        actualHours: booking.actualHours,
        extraKmCharges: booking.extraKmCharges,
        extraHourCharges: booking.extraHourCharges,
        actualTollCharges: booking.actualTollCharges,
        actualParkingCharges: booking.actualParkingCharges,
        customerNotes: booking.customerNotes,
        vendorNotes: booking.vendorNotes,
        rating: booking.rating,
        review: booking.review,
        acceptedVendorId: booking.acceptedVendorId,
        isOwnBooking: isOwner,
        droppedAt: booking.droppedAt,
        dropReason: booking.dropReason,
        location: booking.locations,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch booking', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch booking', details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH - Update booking (accept, reject, assign driver, start trip, complete trip)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bookingNumber: string }> | { bookingNumber: string } }
) {
  try {
    // Get current vendor session
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const vendorId = auth.vendorId;
    const resolvedParams = 'then' in params ? await params : params;
    const { bookingNumber } = resolvedParams;

    const body = await request.json();
    const { action, ...data } = body;

    // Find the booking
    const booking = await prisma.chauffeur_bookings.findUnique({
      where: { bookingNumber },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    let updateData: any = {};
    let message = '';

    switch (action) {
      case 'accept':
        // Check if booking is available to accept
        if (booking.status !== 'PENDING_VENDOR' && booking.status !== 'BROADCASTED') {
          return NextResponse.json(
            { success: false, error: 'Booking cannot be accepted in current status' },
            { status: 400 }
          );
        }

        // Check if already accepted by another vendor
        if (booking.acceptedVendorId) {
          return NextResponse.json(
            { success: false, error: 'This booking has already been accepted by another vendor' },
            { status: 400 }
          );
        }

        console.log('Accept booking - vendorId from session:', vendorId);

        // Use transaction to ensure atomic operation (prevent race condition)
        const acceptResult = await prisma.$transaction(async (tx) => {
          // Re-check in transaction
          const currentBooking = await tx.chauffeur_bookings.findUnique({
            where: { bookingNumber },
          });

          if (currentBooking?.acceptedVendorId) {
            throw new Error('ALREADY_ACCEPTED');
          }

          // Accept the booking
          return tx.chauffeur_bookings.update({
            where: { bookingNumber },
            data: {
              status: 'ACCEPTED',
              acceptedVendorId: vendorId,
              acceptedAt: new Date(),
            },
          });
        });

        console.log('Accept booking result:', {
          bookingNumber: acceptResult.bookingNumber,
          status: acceptResult.status,
          acceptedVendorId: acceptResult.acceptedVendorId,
        });

        // Send booking accepted notification to customer
        try {
          // Get vendor name
          const vendor = await prisma.vendors.findUnique({
            where: { id: vendorId },
            select: { businessName: true },
          });

          const vendorName = vendor?.businessName || 'our vendor';
          const notificationId = 'NOTIF_' + crypto.randomBytes(8).toString('hex');

          await prisma.notifications.create({
            data: {
              id: notificationId,
              customerId: acceptResult.customerId,
              title: '✅ Booking Accepted!',
              body: `Your booking has been accepted by ${vendorName}! A driver will be assigned to you soon. 🚗`,
              type: 'booking',
              serviceType: 'chauffeur-service',
              bookingId: acceptResult.id,
              isRead: false,
            },
          });
          console.log('✅ Booking accepted in-app notification created:', notificationId);

          console.log('📤 Sending booking accepted push notification to customer:', acceptResult.customerId);
          const pushResult = await sendNotificationToCustomer(
            acceptResult.customerId,
            {
              title: '✅ Booking Accepted!',
              body: `Your booking has been accepted by ${vendorName}! A driver will be assigned to you soon. 🚗`,
            },
            {
              type: 'booking_accepted',
              serviceType: 'chauffeur-service',
              bookingId: acceptResult.id,
              bookingNumber: acceptResult.bookingNumber || '',
            }
          );

          if (pushResult.success) {
            console.log('✅ Booking accepted push notification sent successfully:', pushResult.messageId);
          } else {
            console.error('❌ Booking accepted push notification failed:', pushResult.error);
          }
        } catch (notificationError: any) {
          console.error('❌ Booking accepted notification error:', notificationError);
          logger.error('Failed to send booking accepted notification', notificationError);
        }

        return NextResponse.json({
          success: true,
          message: 'Booking accepted successfully! This booking is now assigned to you.',
          booking: {
            id: acceptResult.id,
            bookingNumber: acceptResult.bookingNumber,
            status: acceptResult.status,
            acceptedVendorId: acceptResult.acceptedVendorId,
          },
        });

      case 'reject':
        // For reject, only check if booking was available (not already accepted by someone else)
        if (booking.acceptedVendorId && booking.acceptedVendorId !== vendorId) {
          return NextResponse.json(
            { success: false, error: 'This booking belongs to another vendor' },
            { status: 403 }
          );
        }

        if (booking.status !== 'PENDING_VENDOR' && booking.status !== 'BROADCASTED') {
          return NextResponse.json(
            { success: false, error: 'Booking cannot be rejected in current status' },
            { status: 400 }
          );
        }

        // Track rejection
        const rejectedBy = booking.rejectedByVendors || [];
        const updatedRejections = [
          ...(Array.isArray(rejectedBy) ? rejectedBy : []),
          { vendorId, reason: data.reason || 'Rejected by vendor', rejectedAt: new Date() },
        ];

        updateData = {
          rejectedByVendors: updatedRejections,
          // If this vendor had accepted it, release it back
          ...(booking.acceptedVendorId === vendorId
            ? {
                status: 'BROADCASTED',
                acceptedVendorId: null,
                acceptedAt: null,
              }
            : {}),
        };
        message = 'Booking rejected';

        // Send booking rejected notification to customer (only if vendor had accepted it)
        if (booking.acceptedVendorId === vendorId) {
          try {
            const vendor = await prisma.vendors.findUnique({
              where: { id: vendorId },
              select: { businessName: true },
            });

            const vendorName = vendor?.businessName || 'the vendor';
            const notificationId = 'NOTIF_' + crypto.randomBytes(8).toString('hex');

            await prisma.notifications.create({
              data: {
                id: notificationId,
                customerId: booking.customerId,
                title: '❌ Booking Rejected',
                body: `Sorry! Your booking has been rejected by ${vendorName}. We're finding another vendor for you. 🔄`,
                type: 'booking',
                serviceType: 'chauffeur-service',
                bookingId: booking.id,
                isRead: false,
              },
            });
            console.log('✅ Booking rejected in-app notification created:', notificationId);

            console.log('📤 Sending booking rejected push notification to customer:', booking.customerId);
            const pushResult = await sendNotificationToCustomer(
              booking.customerId,
              {
                title: '❌ Booking Rejected',
                body: `Sorry! Your booking has been rejected by ${vendorName}. We're finding another vendor for you. 🔄`,
              },
              {
                type: 'booking_rejected',
                serviceType: 'chauffeur-service',
                bookingId: booking.id,
                bookingNumber: booking.bookingNumber || '',
              }
            );

            if (pushResult.success) {
              console.log('✅ Booking rejected push notification sent successfully:', pushResult.messageId);
            } else {
              console.error('❌ Booking rejected push notification failed:', pushResult.error);
            }
          } catch (notificationError: any) {
            console.error('❌ Booking rejected notification error:', notificationError);
            logger.error('Failed to send booking rejected notification', notificationError);
          }
        }

        break;

      case 'assign_driver':
        // Only the vendor who accepted can assign driver
        if (booking.acceptedVendorId !== vendorId) {
          return NextResponse.json(
            { success: false, error: 'You can only assign drivers to your own bookings' },
            { status: 403 }
          );
        }

        if (booking.status !== 'ACCEPTED') {
          return NextResponse.json(
            { success: false, error: 'Driver can only be assigned to accepted bookings' },
            { status: 400 }
          );
        }

        if (!data.driverName || !data.driverPhone || !data.vehicleNumber) {
          return NextResponse.json(
            { success: false, error: 'Driver name, phone and vehicle number are required' },
            { status: 400 }
          );
        }

        updateData = {
          status: 'DRIVER_ASSIGNED',
          driverName: data.driverName,
          driverPhone: data.driverPhone,
          vehicleNumber: data.vehicleNumber,
          vehicleModel: data.vehicleModel || data.vehicle_models || null,
          driverAssignedAt: new Date(),
          tripStartOtp: Math.floor(100000 + Math.random() * 900000).toString(),
        };
        message = 'Driver assigned successfully';
        break;

      case 'start_trip':
        // Only the vendor who accepted can start trip
        if (booking.acceptedVendorId !== vendorId) {
          return NextResponse.json(
            { success: false, error: 'You can only start trips for your own bookings' },
            { status: 403 }
          );
        }

        if (booking.status !== 'DRIVER_ASSIGNED') {
          return NextResponse.json(
            { success: false, error: 'Trip can only be started when driver is assigned' },
            { status: 400 }
          );
        }

        // Block trip start before pickup date/time
        {
          const startCheck = canStartTrip(booking.pickupDate, booking.pickupTime);
          if (!startCheck.allowed) {
            return NextResponse.json({ success: false, error: startCheck.message }, { status: 400 });
          }
        }

        // Verify OTP if provided
        if (data.otp && data.otp !== booking.tripStartOtp) {
          return NextResponse.json(
            { success: false, error: 'Invalid OTP' },
            { status: 400 }
          );
        }

        updateData = {
          status: 'IN_PROGRESS',
          tripStartedAt: new Date(),
        };
        message = 'Trip started successfully';
        break;

      case 'complete_trip':
        // Only the vendor who accepted can complete trip
        if (booking.acceptedVendorId !== vendorId) {
          return NextResponse.json(
            { success: false, error: 'You can only complete trips for your own bookings' },
            { status: 403 }
          );
        }

        if (booking.status !== 'IN_PROGRESS') {
          return NextResponse.json(
            { success: false, error: 'Only in-progress trips can be completed' },
            { status: 400 }
          );
        }

        // Block completion before return date/time
        {
          const endDate = booking.returnDate || booking.pickupDate;
          const endTime = booking.returnTime || booking.pickupTime;
          const completeCheck = canCompleteTrip(endDate, endTime);
          if (!completeCheck.allowed) {
            return NextResponse.json({ success: false, error: completeCheck.message }, { status: 400 });
          }
        }

        // Calculate extra charges based on actual km travelled
        let extraKmCharges = 0;

        if (data.actualKmTravelled) {
          const allowedKm = booking.localPackageKm || booking.estimatedDistance || 0;
          if (data.actualKmTravelled > allowedKm) {
            const extraKm = data.actualKmTravelled - allowedKm;
            extraKmCharges = extraKm * (booking.perKmRate || 15); // Use per km rate from booking
          }
        }

        updateData = {
          status: 'COMPLETED',
          tripEndedAt: new Date(),
          actualKmTravelled: data.actualKmTravelled || null,
          actualHours: data.actualHours || null,
          extraKmCharges,
          actualTollCharges: data.tollCharges || 0,
          actualParkingCharges: data.parkingCharges || 0,
        };
        message = 'Trip completed successfully';
        break;

      case 'update_notes':
        // Only the vendor who accepted can update notes
        if (booking.acceptedVendorId !== vendorId) {
          return NextResponse.json(
            { success: false, error: 'You can only update notes for your own bookings' },
            { status: 403 }
          );
        }

        {
          const newNote = { text: data.vendorNotes, sentAt: new Date().toISOString() };
          let existing: any[] = [];
          try {
            if (booking.vendorNotes) existing = JSON.parse(booking.vendorNotes);
            if (!Array.isArray(existing)) existing = [{ text: booking.vendorNotes, sentAt: booking.updatedAt?.toISOString() || new Date().toISOString() }];
          } catch {
            if (booking.vendorNotes) existing = [{ text: booking.vendorNotes, sentAt: new Date().toISOString() }];
          }
          updateData = { vendorNotes: JSON.stringify([...existing, newNote]) };
        }
        message = 'Note sent successfully';
        break;

      case 'update_driver':
        // Only the vendor who accepted can update driver
        if (booking.acceptedVendorId !== vendorId) {
          return NextResponse.json(
            { success: false, error: 'You can only update drivers for your own bookings' },
            { status: 403 }
          );
        }

        if (!['ACCEPTED', 'DRIVER_ASSIGNED'].includes(booking.status)) {
          return NextResponse.json(
            { success: false, error: 'Driver details can only be updated before trip starts' },
            { status: 400 }
          );
        }

        updateData = {
          driverName: data.driverName || booking.driverName,
          driverPhone: data.driverPhone || booking.driverPhone,
          vehicleNumber: data.vehicleNumber || booking.vehicleNumber,
          vehicleModel: data.vehicleModel || data.vehicle_models || booking.vehicleModel,
        };
        message = 'Driver details updated successfully';
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    const updatedBooking = await prisma.chauffeur_bookings.update({
      where: { bookingNumber },
      data: updateData,
    });

    // Send vendor notes notification to customer
    if (action === 'update_notes' && updatedBooking.customerId && data.vendorNotes) {
      try {
        const noteText: string = data.vendorNotes;
        const notificationId = 'NOTIF_' + crypto.randomBytes(8).toString('hex');
        await prisma.notifications.create({
          data: {
            id: notificationId,
            customerId: updatedBooking.customerId,
            title: '📋 Message from your Vendor',
            body: `Your vendor sent a note on booking ${updatedBooking.bookingNumber}: "${noteText.slice(0, 100)}${noteText.length > 100 ? '...' : ''}"`,
            type: 'booking',
            serviceType: 'chauffeur-service',
            bookingId: updatedBooking.id,
            isRead: false,
          },
        });
        await sendNotificationToCustomer(
          updatedBooking.customerId,
          {
            title: '📋 Message from your Vendor',
            body: `Your vendor has added a note to your booking ${updatedBooking.bookingNumber}. Tap to view.`,
          },
          {
            type: 'vendor_notes',
            serviceType: 'chauffeur-service',
            bookingId: updatedBooking.id,
            bookingNumber: updatedBooking.bookingNumber,
          }
        );
      } catch (notificationError: any) {
        console.error('❌ Vendor notes notification error:', notificationError);
      }
    }

    // Send driver assigned notification
    if (action === 'assign_driver') {
      try {
        const notificationId = 'NOTIF_' + crypto.randomBytes(8).toString('hex');

        await prisma.notifications.create({
          data: {
            id: notificationId,
            customerId: updatedBooking.customerId,
            title: '👨‍✈️ Driver Assigned!',
            body: `Great news! ${updatedBooking.driverName} has been assigned as your driver. Vehicle: ${updatedBooking.vehicleNumber}. Get ready for your trip! 🚗`,
            type: 'booking',
            serviceType: 'chauffeur-service',
            bookingId: updatedBooking.id,
            isRead: false,
          },
        });
        console.log('✅ Driver assigned in-app notification created:', notificationId);

        console.log('📤 Sending driver assigned push notification to customer:', updatedBooking.customerId);
        const pushResult = await sendNotificationToCustomer(
          updatedBooking.customerId,
          {
            title: '👨‍✈️ Driver Assigned!',
            body: `Great news! ${updatedBooking.driverName} has been assigned as your driver. Vehicle: ${updatedBooking.vehicleNumber}. Get ready for your trip! 🚗`,
          },
          {
            type: 'driver_assigned',
            serviceType: 'chauffeur-service',
            bookingId: updatedBooking.id,
            bookingNumber: updatedBooking.bookingNumber || '',
            driverName: updatedBooking.driverName || '',
            driverPhone: updatedBooking.driverPhone || '',
            vehicleNumber: updatedBooking.vehicleNumber || '',
          }
        );

        if (pushResult.success) {
          console.log('✅ Driver assigned push notification sent successfully:', pushResult.messageId);
        } else {
          console.error('❌ Driver assigned push notification failed:', pushResult.error);
        }
      } catch (notificationError: any) {
        console.error('❌ Driver assigned notification error:', notificationError);
        logger.error('Failed to send driver assigned notification', notificationError);
      }

      // Notify the assigned driver (vendor_staff)
      try {
        const assignedStaff = await prisma.vendor_staff.findFirst({
          where: { phone: updatedBooking.driverPhone ?? '', vendorId },
          select: { id: true },
        });
        if (assignedStaff) {
          await saveDriverNotification({
            staffId: assignedStaff.id,
            title: '🚗 New Trip Assigned!',
            body: `You have been assigned to Car Rental Booking #${updatedBooking.bookingNumber}. Vehicle: ${updatedBooking.vehicleNumber}. Pickup: ${updatedBooking.pickupCity} on ${updatedBooking.pickupDate}.`,
            type: 'booking_assigned',
            serviceType: 'car',
            bookingId: updatedBooking.id,
            bookingNumber: updatedBooking.bookingNumber,
          });
          console.log('✅ Driver notification sent for car rental booking:', updatedBooking.bookingNumber);
        }
      } catch (driverNotifError: any) {
        logger.error('Failed to send driver notification for car rental assignment', driverNotifError);
      }
    }

    // Notify vendor on trip completion
    if (updatedBooking.status === 'COMPLETED') {
      sendVendorDirectNotification({
        vendorId,
        title: '✅ Trip Completed!',
        body: `Car rental booking #${updatedBooking.bookingNumber} has been completed successfully.`,
        type: 'trip_completed',
        serviceType: 'car',
        bookingId: updatedBooking.id,
        bookingNumber: updatedBooking.bookingNumber,
      }).catch((err: any) => logger.error('[CarRentalComplete] Vendor notify failed:', err));
    }

    return NextResponse.json({
      success: true,
      message,
      booking: {
        id: updatedBooking.id,
        bookingNumber: updatedBooking.bookingNumber,
        status: updatedBooking.status,
        driverName: updatedBooking.driverName,
        driverPhone: updatedBooking.driverPhone,
        vehicleNumber: updatedBooking.vehicleNumber,
        vehicleModel: updatedBooking.vehicleModel,
        acceptedVendorId: updatedBooking.acceptedVendorId,
      },
    });
  } catch (error: any) {
    logger.error('Failed to update booking', error);

    // Handle race condition error
    if (error.message === 'ALREADY_ACCEPTED') {
      return NextResponse.json(
        { success: false, error: 'This booking has already been accepted by another vendor' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update booking', details: error?.message },
      { status: 500 }
    );
  }
}
