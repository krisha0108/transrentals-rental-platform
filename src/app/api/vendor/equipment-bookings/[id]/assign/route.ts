// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { sendPushNotification, sendNotificationToCustomer } from '@/lib/services/push-notification-service';
import { saveDriverNotification } from '@/lib/utils/driver-notification-sender';
import crypto from 'crypto';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// POST - Vendor assigns equipment and operator to Equipment Booking
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

    // Get vendor
    const vendor = await prisma.vendors.findFirst({
      where: { id: vendorId },
      select: { id: true, businessName: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Get booking
    const booking = await prisma.equipment_bookings.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify vendor owns this booking
    if (booking.vendorId !== vendorId) {
      return NextResponse.json(
        { error: 'You are not authorized to update this booking' },
        { status: 403 }
      );
    }

    // Check if booking can have equipment assigned
    if (!['ADVANCE_PAID', 'CONFIRMED'].includes(booking.status)) {
      return NextResponse.json(
        { error: 'Equipment can only be assigned after advance payment or confirmation' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      operatorName,
      operatorPhone,
    } = body;

    // Validate - operator name is required for assignment
    if (!operatorName) {
      return NextResponse.json(
        { error: 'Operator name is required' },
        { status: 400 }
      );
    }

    // Update booking with operator details (only fields that exist in schema)
    const updatedBooking = await prisma.equipment_bookings.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        operatorName: operatorName || null,
        operatorPhone: operatorPhone || null,
      },
    });

    // Notify assigned operator via FCM (if they are registered staff)
    if (operatorPhone) {
      try {
        const operatorStaff = await prisma.vendor_staff.findFirst({
          where: { phone: operatorPhone, vendorId },
          select: { id: true, fcmToken: true },
        });
        if (operatorStaff) {
          const notifTitle = '⚙️ New Job Assigned!';
          const notifBody = `You have been assigned to Equipment Booking #${booking.bookingNumber}. Please check your app for details.`;
          const notifData = { type: 'driver_assigned', bookingId: booking.id, bookingNumber: booking.bookingNumber, serviceType: 'equipment' };
          if (operatorStaff.fcmToken) {
            sendPushNotification(operatorStaff.fcmToken, { title: notifTitle, body: notifBody }, notifData)
              .catch((err: any) => console.error('[EquipAssign] Operator FCM failed:', err));
          }
          saveDriverNotification({
            staffId: operatorStaff.id,
            title: notifTitle,
            body: notifBody,
            type: 'booking_assigned',
            serviceType: 'equipment',
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber,
          }).catch((err: any) => console.error('[EquipAssign] Operator in-app notif failed:', err));
        }
      } catch (operatorNotifErr) {
        console.error('[EquipAssign] Operator notification lookup failed:', operatorNotifErr);
      }
    }

    // Notify customer that operator has been assigned
    if (booking.customerId) {
      try {
        const custTitle = '⚙️ Operator Assigned!';
        const custBody = `An operator has been assigned for your equipment booking #${booking.bookingNumber}. Operator: ${operatorName}. Track your booking in the app.`;
        const notifId = 'NOTIF_' + crypto.randomBytes(8).toString('hex');

        await prisma.notifications.create({
          data: {
            id: notifId,
            customerId: booking.customerId,
            title: custTitle,
            body: custBody,
            type: 'booking',
            serviceType: 'equipment-rental',
            bookingId: booking.id,
            isRead: false,
          },
        });
        console.log('✅ [EquipAssign] Customer in-app notification created:', notifId);

        const pushResult = await sendNotificationToCustomer(
          booking.customerId,
          { title: custTitle, body: custBody },
          {
            type: 'operator_assigned',
            serviceType: 'equipment-rental',
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber || '',
          }
        );
        if (pushResult.success) {
          console.log('✅ [EquipAssign] Customer push sent:', pushResult.messageId);
        } else {
          console.error('❌ [EquipAssign] Customer push failed:', pushResult.error);
        }
      } catch (custNotifErr) {
        console.error('❌ [EquipAssign] Customer notification failed:', custNotifErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Operator assigned successfully',
      booking: {
        id: updatedBooking.id,
        bookingNumber: updatedBooking.bookingNumber,
        status: updatedBooking.status,
        operatorName: updatedBooking.operatorName,
        operatorPhone: updatedBooking.operatorPhone,
      },
    });
  } catch (error: any) {
    logger.error('Failed to assign equipment to booking', error);
    return NextResponse.json(
      { error: 'Failed to assign equipment', details: error?.message },
      { status: 500 }
    );
  }
}
