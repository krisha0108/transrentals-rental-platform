import { NextRequest, NextResponse } from 'next/server';
import { getDriverAppUser } from '@/lib/auth/driver-app-auth';
import { prisma } from '@/lib/db/prisma';
import { sendNotificationToCustomer } from '@/lib/services/push-notification-service';
import { prepareNotificationData } from '@/lib/utils/notification-helper';

export const dynamic = 'force-dynamic';

function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const driver = await getDriverAppUser(request);
  if (!driver) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const driverPhone = (driver as any).phone;
    const driverVendorId = (driver as any).vendorId;

    const booking = await prisma.equipment_bookings.findUnique({
      where: { id: params.id },
      select: { id: true, bookingNumber: true, vendorId: true, operatorPhone: true, status: true, customerId: true },
    });

    if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });

    const isAuthorized = normalizePhone(booking.operatorPhone) === normalizePhone(driverPhone) &&
      booking.vendorId === driverVendorId;

    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
    if (booking.status !== 'IN_USE') return NextResponse.json({ success: false, error: 'Equipment is not in use yet' }, { status: 409 });

    const returnOtp = generateOTP();

    const updated = await prisma.equipment_bookings.update({
      where: { id: params.id },
      data: { status: 'PICKUP_SCHEDULED', scheduledPickup: new Date(), returnOtp },
    });

    // Send return OTP to customer
    try {
      await sendNotificationToCustomer(
        booking.customerId,
        { title: '🔑 Equipment Return OTP', body: `Your OTP for equipment return is ${returnOtp}. Share this with the operator at pickup. Booking #${booking.bookingNumber}` },
        { type: 'trip_otp', bookingId: booking.id, bookingNumber: booking.bookingNumber, otp: returnOtp }
      );
      await prisma.notifications.create({
        data: prepareNotificationData({
          customerId: booking.customerId,
          title: '🔑 Equipment Return OTP',
          body: `Your OTP for equipment return is ${returnOtp}. Share this with the operator at pickup. Booking #${booking.bookingNumber}`,
          type: 'booking', serviceType: 'equipment', bookingId: booking.id, quoteId: null,
        }),
      });
    } catch (notifErr) {
      console.error('[schedule-pickup] notification failed:', notifErr);
    }

    return NextResponse.json({ success: true, booking: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
}
