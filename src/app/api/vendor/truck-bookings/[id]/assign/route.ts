// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { sendPushNotification, sendNotificationToCustomer } from '@/lib/services/push-notification-service';
import { saveDriverNotification } from '@/lib/utils/driver-notification-sender';
import crypto from 'crypto';
import logger from '@/lib/security/logger';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';

export const dynamic = 'force-dynamic';

// POST - Vendor assigns vehicle and driver to Truck Booking
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
    const booking = await prisma.truck_bookings.findUnique({
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

    // Check if booking can have vehicle assigned
    if (!['ADVANCE_PAID', 'CONFIRMED'].includes(booking.status)) {
      return NextResponse.json(
        { error: 'Vehicle can only be assigned after advance payment or confirmation' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      vehicleNumber,
      driverName,
      driverPhone,
      driverPhoto,
      labourCount,
    } = body;

    // Validate required fields
    if (!vehicleNumber || !driverName || !driverPhone) {
      return NextResponse.json(
        { error: 'Vehicle number, driver name, and driver phone are required' },
        { status: 400 }
      );
    }

    // Update booking with vehicle and driver details
    const updatedBooking = await prisma.truck_bookings.update({
      where: { id },
      data: {
        status: 'VEHICLE_ASSIGNED',
        vehicleNumber,
        driverName,
        driverPhone,
        driverPhoto: driverPhoto || null,
        labourCount: labourCount || booking.labourCount,
      },
    });

    // Notify assigned driver via FCM
    try {
      const driverStaff = await prisma.vendor_staff.findFirst({
        where: { phone: driverPhone, vendorId },
        select: { id: true, fcmToken: true },
      });
      if (driverStaff) {
        const notifTitle = '🚚 New Booking Assigned!';
        const notifBody = `You have been assigned to Truck Booking #${booking.bookingNumber}. Vehicle: ${vehicleNumber}. Please check your app for details.`;
        const notifData = { type: 'driver_assigned', bookingId: booking.id, bookingNumber: booking.bookingNumber, serviceType: 'truck' };
        if (driverStaff.fcmToken) {
          sendPushNotification(driverStaff.fcmToken, { title: notifTitle, body: notifBody }, notifData)
            .catch((err: any) => console.error('[TruckAssign] Driver FCM failed:', err));
        }
        saveDriverNotification({
          staffId: driverStaff.id,
          title: notifTitle,
          body: notifBody,
          type: 'booking_assigned',
          serviceType: 'truck',
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
        }).catch((err: any) => console.error('[TruckAssign] Driver in-app notif failed:', err));
      }
    } catch (driverNotifErr) {
      console.error('[TruckAssign] Driver notification lookup failed:', driverNotifErr);
    }

    // Notify customer that driver has been assigned
    if (booking.customerId) {
      try {
        const custNotifTitle = '🚚 Driver Assigned!';
        const custNotifBody = `A driver has been assigned for your truck booking #${booking.bookingNumber}. Driver: ${driverName}, Vehicle: ${vehicleNumber}. Track your booking in the app.`;
        const notificationId = 'NOTIF_' + crypto.randomBytes(8).toString('hex');

        await prisma.notifications.create({
          data: {
            id: notificationId,
            customerId: booking.customerId,
            title: custNotifTitle,
            body: custNotifBody,
            type: 'booking',
            serviceType: 'truck-rental',
            bookingId: booking.id,
            isRead: false,
          },
        });
        console.log('✅ [TruckAssign] Customer in-app notification created:', notificationId);

        const pushResult = await sendNotificationToCustomer(
          booking.customerId,
          { title: custNotifTitle, body: custNotifBody },
          {
            type: 'driver_assigned',
            serviceType: 'truck-rental',
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber || '',
          }
        );
        if (pushResult.success) {
          console.log('✅ [TruckAssign] Customer push sent:', pushResult.messageId);
        } else {
          console.error('❌ [TruckAssign] Customer push failed:', pushResult.error);
        }
      } catch (custNotifErr) {
        console.error('❌ [TruckAssign] Customer notification failed:', custNotifErr);
      }
    } else {
      console.log('⚠️ [TruckAssign] No customerId on booking, skipping customer notification');
    }

    return NextResponse.json({
      success: true,
      message: 'Vehicle and driver assigned successfully',
      booking: {
        id: updatedBooking.id,
        bookingNumber: updatedBooking.bookingNumber,
        status: updatedBooking.status,
        vehicleNumber: updatedBooking.vehicleNumber,
        driverName: updatedBooking.driverName,
        driverPhone: updatedBooking.driverPhone,
        labourCount: updatedBooking.labourCount,
      },
    });
  } catch (error: any) {
    logger.error('Failed to assign vehicle to truck booking', error);
    return NextResponse.json(
      { error: 'Failed to assign vehicle', details: error?.message },
      { status: 500 }
    );
  }
}
