// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';
import { sendPushNotification } from '@/lib/services/push-notification-service';
import { saveDriverNotification } from '@/lib/utils/driver-notification-sender';
import { canStartTrip, canCompleteTrip } from '@/lib/utils/booking-date-guard';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';
export const dynamic = 'force-dynamic';

// Helper function to generate OTP
function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// GET - Get Luxury Booking details for vendor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId!;


    const vendor = await prisma.vendors.findFirst({
      where: { id: vendorId },
      select: { id: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const { id } = await params;

    const booking = await prisma.luxury_bookings.findFirst({
      where: {
        id,
        OR: [
          { assignedVendorId: vendor.id },
          { acceptedVendorId: vendor.id },
        ],
      },
      include: {
        luxury_quote_requests: true,
        luxury_quotes: {
          select: {
            quoteNumber: true,
            vehicleName: true,
            vehicleCategory: true,
            totalAmount: true,
            advancePercent: true,
            advanceAmount: true,
            inclusions: true,
            exclusions: true,
            termsConditions: true,
            vendorMessage: true,
            validTill: true,
          },
        },
        locations: true,
        customers: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        vendors_luxury_bookings_acceptedVendorIdTovendors: {
          select: {
            id: true,
            businessName: true,
          },
        },
        vendors_luxury_bookings_assignedVendorIdTovendors: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Add backward-compatible aliases for frontend
    const response = {
      ...booking,
      quoteRequest: booking.luxury_quote_requests,
      acceptedQuote: booking.luxury_quotes,
      location: booking.locations,
      customer: booking.customers,
      vendor: booking.vendors_luxury_bookings_acceptedVendorIdTovendors || booking.vendors_luxury_bookings_assignedVendorIdTovendors,
      // Full accepted-quote terms for the "Quote Details" section
      quote: booking.luxury_quotes ? {
        quoteNumber:     booking.luxury_quotes.quoteNumber,
        vehicleName:     booking.luxury_quotes.vehicleName,
        vehicleCategory: booking.luxury_quotes.vehicleCategory,
        totalAmount:     booking.luxury_quotes.totalAmount,
        advancePercent:  booking.luxury_quotes.advancePercent,
        advanceAmount:   booking.luxury_quotes.advanceAmount,
        inclusions:      booking.luxury_quotes.inclusions,
        exclusions:      booking.luxury_quotes.exclusions,
        termsConditions: booking.luxury_quotes.termsConditions,
        vendorMessage:   booking.luxury_quotes.vendorMessage,
        validTill:       booking.luxury_quotes.validTill?.toISOString() || null,
      } : null,
    };

    return NextResponse.json({ success: true, booking: response });
  } catch (error: any) {
    logger.error('Failed to fetch vendor luxury booking', error);
    return NextResponse.json({ error: 'Failed to fetch booking', details: error?.message }, { status: 500 });
  }
}

// PATCH - Update Luxury Booking status (vendor actions)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId!;

    // Block rejected/suspended/blocked vendors from write operations
    const guard = await vendorStatusGuard(vendorId);
    if (guard.blocked) return guard.response;

    const vendor = await prisma.vendors.findFirst({
      where: { id: vendorId },
      select: { id: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, ...data } = body;

    const booking = await prisma.luxury_bookings.findFirst({
      where: {
        id,
        OR: [
          { assignedVendorId: vendor.id },
          { acceptedVendorId: vendor.id },
        ],
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    switch (action) {
      // Quote-based flow: Assign Driver (NO OTP generated yet)
      case 'assign_driver': {
        if (!['ADVANCE_PAID', 'CONFIRMED'].includes(booking.status)) {
          return NextResponse.json({ error: 'Cannot assign driver in current status' }, { status: 400 });
        }

        const { driverName, driverPhone, driverPhoto, vehicleNumber, vehicle_model, vehicle_models, vehicleBrand, vehicleColor } = data;

        if (!driverName || !driverPhone) {
          return NextResponse.json({ error: 'Driver details are required' }, { status: 400 });
        }

        const updatedBooking = await prisma.luxury_bookings.update({
          where: { id },
          data: {
            status: 'DRIVER_ASSIGNED',
            driverName,
            driverPhone,
            driverPhoto: driverPhoto || null,
            vehicleNumber: vehicleNumber || booking.vehicleNumber,
            vehicleModel: vehicle_models || vehicle_model || booking.vehicleModel,
            vehicleBrand: vehicleBrand || booking.vehicleBrand,
            vehicleColor: vehicleColor || booking.vehicleColor,
            // No OTP generated here - driver will generate when ready
            tripStartOtp: null,
            tripEndOtp: null,
          },
        });

        // Notify assigned driver via FCM
        try {
          const driverStaff = await prisma.vendor_staff.findFirst({
            where: { phone: driverPhone, vendorId: vendor.id },
            select: { id: true, fcmToken: true },
          });
          if (driverStaff) {
            const notifTitle = '🚘 New Booking Assigned!';
            const notifBody = `You have been assigned to Luxury Booking #${booking.bookingNumber}. Please check your app for details.`;
            const notifData = { type: 'driver_assigned', bookingId: booking.id, bookingNumber: booking.bookingNumber, serviceType: 'luxury' };
            if (driverStaff.fcmToken) {
              sendPushNotification(driverStaff.fcmToken, { title: notifTitle, body: notifBody }, notifData)
                .catch((err: any) => console.error('[LuxuryAssign] Driver FCM failed:', err));
            }
            saveDriverNotification({
              staffId: driverStaff.id,
              title: notifTitle,
              body: notifBody,
              type: 'booking_assigned',
              serviceType: 'luxury',
              bookingId: booking.id,
              bookingNumber: booking.bookingNumber,
            }).catch((err: any) => console.error('[LuxuryAssign] Driver in-app notif failed:', err));
          }
        } catch (driverNotifErr) {
          console.error('[LuxuryAssign] Driver notification lookup failed:', driverNotifErr);
        }

        return NextResponse.json({
          success: true,
          message: 'Driver assigned successfully. Driver can generate OTP when ready to start trip.',
          booking: {
            id: updatedBooking.id,
            status: updatedBooking.status,
            driverName: updatedBooking.driverName,
          },
        });
      }

      // Driver generates Start OTP (shown to customer)
      case 'generate_start_otp': {
        if (booking.status !== 'DRIVER_ASSIGNED') {
          return NextResponse.json({ error: 'Driver must be assigned first' }, { status: 400 });
        }

        // Block OTP generation before pickup date/time
        const otpStartCheck = canStartTrip(booking.pickupDate, booking.pickupTime);
        if (!otpStartCheck.allowed) {
          return NextResponse.json({ error: otpStartCheck.message }, { status: 400 });
        }

        const tripStartOtp = generateOTP();

        const updatedBooking = await prisma.luxury_bookings.update({
          where: { id },
          data: {
            tripStartOtp,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'OTP generated! Ask customer for this OTP to start trip.',
          otp: updatedBooking.tripStartOtp,
        });
      }

      // Start Trip with OTP verification
      case 'start_trip': {
        if (booking.status !== 'DRIVER_ASSIGNED') {
          return NextResponse.json({ error: 'Driver must be assigned first' }, { status: 400 });
        }

        // Block trip start before pickup date/time
        const tripStartCheck = canStartTrip(booking.pickupDate, booking.pickupTime);
        if (!tripStartCheck.allowed) {
          return NextResponse.json({ error: tripStartCheck.message }, { status: 400 });
        }

        if (!booking.tripStartOtp) {
          return NextResponse.json({ error: 'Please generate OTP first' }, { status: 400 });
        }

        const { otp } = data;
        if (!otp) {
          return NextResponse.json({ error: 'OTP is required' }, { status: 400 });
        }

        if (otp !== booking.tripStartOtp) {
          return NextResponse.json({ error: 'Invalid OTP. Please ask customer for correct OTP.' }, { status: 400 });
        }

        const updatedBooking = await prisma.luxury_bookings.update({
          where: { id },
          data: {
            status: 'IN_PROGRESS',
            tripStartedAt: new Date(),
          },
        });

        sendVendorDirectNotification({
          vendorId: vendor.id,
          title: '🚀 Trip Started!',
          body: `Booking #${updatedBooking.bookingNumber} luxury car trip has been started successfully.`,
          type: 'trip_started',
          serviceType: 'luxury',
          bookingId: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
        }).catch((err: any) => console.error('[LuxuryStart] Vendor notify failed:', err));

        return NextResponse.json({
          success: true,
          message: 'Trip started successfully!',
          booking: {
            id: updatedBooking.id,
            status: updatedBooking.status,
          },
        });
      }

      // Complete Trip (by driver)
      case 'complete_trip': {
        if (booking.status !== 'IN_PROGRESS') {
          return NextResponse.json({ error: 'Trip must be in progress' }, { status: 400 });
        }

        // Block completion before return date/time
        {
          const endDate = booking.returnDate || booking.pickupDate;
          const endTime = booking.returnTime || booking.pickupTime;
          const luxuryCompleteCheck = canCompleteTrip(endDate, endTime);
          if (!luxuryCompleteCheck.allowed) {
            return NextResponse.json({ error: luxuryCompleteCheck.message }, { status: 400 });
          }
        }

        const { actualHours, extraCharges, extraChargesReason } = data;

        // Calculate extra hour charges if applicable
        let extraHourCharges = 0;
        if (actualHours && booking.totalHours && actualHours > booking.totalHours && booking.extraHourRate) {
          extraHourCharges = (actualHours - booking.totalHours) * booking.extraHourRate;
        }

        const finalAmount = booking.grandTotal + extraHourCharges + (extraCharges || 0);

        const updatedBooking = await prisma.luxury_bookings.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            tripEndedAt: new Date(),
            completedAt: new Date(),
            actualHours: actualHours || booking.totalHours,
            extraHourCharges,
            finalAmount,
            paymentStatus: 'PAID',
          },
        });

        sendVendorDirectNotification({
          vendorId: vendor.id,
          title: '✅ Trip Completed!',
          body: `Booking #${updatedBooking.bookingNumber} luxury car trip has been completed successfully.`,
          type: 'trip_completed',
          serviceType: 'luxury',
          bookingId: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
        }).catch((err: any) => console.error('[LuxuryComplete] Vendor notify failed:', err));

        return NextResponse.json({
          success: true,
          message: 'Trip completed successfully!',
          booking: {
            id: updatedBooking.id,
            status: updatedBooking.status,
            finalAmount: updatedBooking.finalAmount,
          },
        });
      }

      // === Legacy Chauffeur-style flow (for backward compatibility) ===

      case 'assign_chauffeur': {
        if (!['ADVANCE_PAID', 'CONFIRMED', 'ACCEPTED'].includes(booking.status)) {
          return NextResponse.json({ error: 'Cannot assign chauffeur in current status' }, { status: 400 });
        }

        const { chauffeurName, chauffeurPhone, chauffeurPhoto, vehicleNumber } = data;
        if (!chauffeurName || !chauffeurPhone) {
          return NextResponse.json({ error: 'Chauffeur details are required' }, { status: 400 });
        }

        // Generate OTPs
        const tripStartOtp = generateOTP();
        const tripEndOtp = generateOTP();

        const updatedBooking = await prisma.luxury_bookings.update({
          where: { id },
          data: {
            status: 'DRIVER_ASSIGNED',
            driverName: chauffeurName,
            driverPhone: chauffeurPhone,
            driverPhoto: chauffeurPhoto || null,
            vehicleNumber: vehicleNumber || booking.vehicleNumber,
            tripStartOtp,
            tripEndOtp,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Chauffeur assigned successfully',
          booking: { id: updatedBooking.id, status: updatedBooking.status, driverName: updatedBooking.driverName },
        });
      }

      case 'complete': {
        if (booking.status !== 'IN_PROGRESS') {
          return NextResponse.json({ error: 'Trip must be in progress' }, { status: 400 });
        }

        // Block completion before return date/time
        {
          const endDate2 = booking.returnDate || booking.pickupDate;
          const endTime2 = booking.returnTime || booking.pickupTime;
          const legacyCompleteCheck = canCompleteTrip(endDate2, endTime2);
          if (!legacyCompleteCheck.allowed) {
            return NextResponse.json({ error: legacyCompleteCheck.message }, { status: 400 });
          }
        }

        const { otp, actualHours, tollCharges, parkingCharges, extraCharges, extraChargesReason } = data;

        // Check OTP if provided
        if (otp && otp !== booking.tripEndOtp) {
          return NextResponse.json({ error: 'Invalid end OTP' }, { status: 400 });
        }

        let extraHourCharges = 0;
        if (actualHours && booking.totalHours && actualHours > booking.totalHours && booking.extraHourRate) {
          extraHourCharges = (actualHours - booking.totalHours) * booking.extraHourRate;
        }

        const finalAmount = booking.grandTotal + extraHourCharges + (tollCharges || 0) + (parkingCharges || 0) + (extraCharges || 0);

        const updatedBooking = await prisma.luxury_bookings.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            tripEndedAt: new Date(),
            completedAt: new Date(),
            actualHours: actualHours || booking.totalHours,
            extraHourCharges,
            finalAmount,
            paymentStatus: 'PAID',
          },
        });

        sendVendorDirectNotification({
          vendorId: vendor.id,
          title: '✅ Trip Completed!',
          body: `Booking #${updatedBooking.bookingNumber} luxury car trip has been completed successfully.`,
          type: 'trip_completed',
          serviceType: 'luxury',
          bookingId: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
        }).catch((err: any) => console.error('[LuxuryComplete] Vendor notify failed:', err));

        return NextResponse.json({
          success: true,
          message: 'Trip completed successfully',
          booking: { id: updatedBooking.id, status: updatedBooking.status, finalAmount: updatedBooking.finalAmount },
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    logger.error('Failed to update vendor luxury booking', error);
    return NextResponse.json({
      error: 'Failed to update booking',
      details: error?.message,
      code: error?.code,
      meta: error?.meta
    }, { status: 500 });
  }
}
