// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { sendNotificationToCustomer } from '@/lib/services/push-notification-service';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';
import { creditBackrTokens } from '@/lib/utils/backr-tokens';
import { canCompleteTrip } from '@/lib/utils/booking-date-guard';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';
export const dynamic = 'force-dynamic';

// POST - Vendor completes the car rental trip
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

    // Check if this vendor accepted the booking
    if (booking.acceptedVendorId !== vendorId) {
      return NextResponse.json(
        { error: 'You are not authorized for this booking' },
        { status: 403 }
      );
    }

    // Check if booking is in progress
    if (booking.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Trip must be in progress to complete' },
        { status: 400 }
      );
    }

    // Block completion before drop date/time
    const completeCheck = canCompleteTrip(booking.dropDate, booking.dropTime);
    if (!completeCheck.allowed) {
      return NextResponse.json(
        { error: completeCheck.message },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const {
      odometerEnd,
      damageNotes,
      additionalCharges,
      additionalChargesReason,
      returnFuelLevel,
      refundSecurityDeposit = true,
    } = body;

    // Calculate extra km charges if applicable
    let extraKmCharges = 0;
    if (odometerEnd && booking.odometerStart) {
      const totalKm = odometerEnd - booking.odometerStart;
      const allowedKm = booking.kmLimitPerDay * booking.totalDays;
      if (totalKm > allowedKm) {
        extraKmCharges = (totalKm - allowedKm) * booking.extraKmRate;
      }
    }

    // Build update data
    const updateData: any = {
      status: 'COMPLETED',
      returnedAt: new Date(),
      completedAt: new Date(),
      odometerEnd: odometerEnd || null,
      extraKmCharges,
      returnFuelLevel: returnFuelLevel || null,
      paymentStatus: 'PAID',
    };

    // Add damage notes if provided
    if (damageNotes) {
      updateData.vendorNotes = booking.vendorNotes
        ? `${booking.vendorNotes}\n\nDamage Notes: ${damageNotes}`
        : `Damage Notes: ${damageNotes}`;
    }

    // Add additional charges if provided
    if (additionalCharges && additionalCharges > 0) {
      updateData.extraKmCharges = (extraKmCharges || 0) + additionalCharges;
      if (additionalChargesReason) {
        updateData.vendorNotes = updateData.vendorNotes
          ? `${updateData.vendorNotes}\nAdditional Charges (${additionalCharges}): ${additionalChargesReason}`
          : `Additional Charges (${additionalCharges}): ${additionalChargesReason}`;
      }
    }

    // Update booking
    const updatedBooking = await prisma.car_bookings.update({
      where: { id },
      data: updateData,
      include: {
        locations: { select: { name: true, slug: true } },
      },
    });

    // Send trip completion notification
    try {
      const notificationId = 'NOTIF_' + crypto.randomBytes(8).toString('hex');
      await prisma.notifications.create({
        data: {
          id: notificationId,
          customerId: booking.customerId,
          title: '🎉 Trip Completed Successfully!',
          body: `Your self-drive rental is complete! Hope you enjoyed the journey! 🚗 Book again for your next trip! ✨`,
          type: 'booking',
          serviceType: 'self-drive',
          bookingId: booking.id,
          isRead: false,
        },
      });
      console.log('✅ Self-drive trip completed in-app notification created:', notificationId);

      console.log('📤 Sending self-drive trip completed push notification to customer:', booking.customerId);
      const pushResult = await sendNotificationToCustomer(
        booking.customerId,
        {
          title: '🎉 Trip Completed Successfully!',
          body: `Your self-drive rental is complete! Hope you enjoyed the journey! 🚗 Book again for your next trip! ✨`,
        },
        {
          type: 'trip_completed',
          serviceType: 'self-drive',
          bookingId: booking.id,
          bookingNumber: updatedBooking.bookingNumber || '',
        }
      );

      if (pushResult.success) {
        console.log('✅ Self-drive trip completed push notification sent successfully:', pushResult.messageId);
      } else {
        console.error('❌ Self-drive trip completed push notification failed:', pushResult.error);
      }
    } catch (notificationError: any) {
      console.error('❌ Self-drive trip completed notification error:', notificationError);
      logger.error('Failed to send self-drive trip completed notification', notificationError);
    }

    // Notify vendor that trip has been completed
    sendVendorDirectNotification({
      vendorId,
      title: '✅ Trip Completed!',
      body: `Booking #${updatedBooking.bookingNumber} self-drive trip has been completed successfully.`,
      type: 'trip_completed',
      serviceType: 'self-drive',
      bookingId: booking.id,
      bookingNumber: updatedBooking.bookingNumber,
    }).catch((err: any) => console.error('[SelfDriveComplete] Vendor notify failed:', err));

    // Calculate total km driven
    const totalKmDriven = odometerEnd && booking.odometerStart
      ? odometerEnd - booking.odometerStart
      : null;

    // Credit 10% Backr tokens to customer
    creditBackrTokens({
      customerId: booking.customerId,
      bookingAmount: booking.grandTotal,
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      serviceType: 'self-drive',
    });

    return NextResponse.json({
      success: true,
      message: 'Trip completed successfully!',
      booking: {
        id: updatedBooking.id,
        bookingNumber: updatedBooking.bookingNumber,
        status: updatedBooking.status,
        returnedAt: updatedBooking.returnedAt,
        completedAt: updatedBooking.completedAt,
        odometerStart: updatedBooking.odometerStart,
        odometerEnd: updatedBooking.odometerEnd,
        totalKmDriven,
        allowedKm: booking.kmLimitPerDay * booking.totalDays,
        extraKmCharges: updatedBooking.extraKmCharges,
        grandTotal: updatedBooking.grandTotal,
        securityDeposit: updatedBooking.securityDeposit,
        refundSecurityDeposit,
      },
    });
  } catch (error: any) {
    logger.error('Trip completion error', error);
    return NextResponse.json(
      { error: 'Failed to complete trip', details: error?.message },
      { status: 500 }
    );
  }
}
