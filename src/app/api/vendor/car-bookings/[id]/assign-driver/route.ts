// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import { sendPushNotification } from '@/lib/services/push-notification-service';
import { saveDriverNotification } from '@/lib/utils/driver-notification-sender';
import logger from '@/lib/security/logger';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';
export const dynamic = 'force-dynamic';

// POST - Vendor assigns a driver to accepted Car Booking
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
    const booking = await prisma.chauffeur_bookings.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if vendor owns this booking
    if (booking.acceptedVendorId !== vendorId) {
      return NextResponse.json(
        { error: 'You are not authorized to update this booking' },
        { status: 403 }
      );
    }

    // Check if driver can be assigned
    if (!['ACCEPTED', 'DRIVER_ASSIGNED'].includes(booking.status)) {
      return NextResponse.json(
        { error: 'Driver can only be assigned to accepted bookings' },
        { status: 400 }
      );
    }

    // Parse request body for driver info
    const body = await request.json();
    const { driverName, driverPhone, driverPhoto, vehicleNumber, vehicleModel } = body;

    if (!driverName || !driverPhone || !vehicleNumber) {
      return NextResponse.json(
        { error: 'Driver name, phone, and vehicle number are required' },
        { status: 400 }
      );
    }

    // Generate trip OTP (driver will send this to customer when ready to start)
    const tripStartOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Update booking with driver details
    const updatedBooking = await prisma.chauffeur_bookings.update({
      where: { id },
      data: {
        status: 'DRIVER_ASSIGNED',
        driverName,
        driverPhone,
        driverPhoto: driverPhoto || null,
        vehicleNumber,
        vehicleModel: vehicleModel || null,
        driverAssignedAt: new Date(),
        tripStartOtp,
      },
    });

    // Notify assigned driver via FCM
    try {
      const driverStaff = await prisma.vendor_staff.findFirst({
        where: { phone: driverPhone, vendorId },
        select: { id: true, fcmToken: true },
      });
      if (driverStaff) {
        const notifTitle = '🚗 New Booking Assigned!';
        const notifBody = `You have been assigned to Chauffeur Booking #${booking.bookingNumber}. Vehicle: ${vehicleNumber}. Please check your app for details.`;
        const notifData = { type: 'driver_assigned', bookingId: booking.id, bookingNumber: booking.bookingNumber, serviceType: 'car' };
        if (driverStaff.fcmToken) {
          sendPushNotification(driverStaff.fcmToken, { title: notifTitle, body: notifBody }, notifData)
            .catch((err: any) => console.error('[CarAssign] Driver FCM failed:', err));
        }
        saveDriverNotification({
          staffId: driverStaff.id,
          title: notifTitle,
          body: notifBody,
          type: 'booking_assigned',
          serviceType: 'car',
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
        }).catch((err: any) => console.error('[CarAssign] Driver in-app notif failed:', err));
      }
    } catch (driverNotifErr) {
      console.error('[CarAssign] Driver notification lookup failed:', driverNotifErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Driver assigned successfully. Customer has been notified.',
      booking: {
        id: updatedBooking.id,
        bookingNumber: updatedBooking.bookingNumber,
        status: updatedBooking.status,
        driverName: updatedBooking.driverName,
        driverPhone: updatedBooking.driverPhone,
        vehicleNumber: updatedBooking.vehicleNumber,
        vehicleModel: updatedBooking.vehicleModel,
        // Note: OTP is not exposed to vendor - it will be sent to customer when driver starts trip
      },
    });
  } catch (error: any) {
    logger.error('Failed to assign driver', error);
    return NextResponse.json(
      { error: 'Failed to assign driver', details: error?.message },
      { status: 500 }
    );
  }
}
