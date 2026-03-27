import { NextRequest, NextResponse } from 'next/server';
import { getDriverAppUser } from '@/lib/auth/driver-app-auth';
import { prisma } from '@/lib/db/prisma';
import { sendNotificationToCustomer } from '@/lib/services/push-notification-service';
import { prepareNotificationData } from '@/lib/utils/notification-helper';

export const dynamic = 'force-dynamic';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
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
    const { source = 'chauffeur' } = await request.json();
    const isStaff = (driver as any).userType === 'vendor_staff';

    // ── CHAUFFEUR ──────────────────────────────────────────────────────────────
    if (source === 'chauffeur') {
      const booking = await prisma.chauffeur_bookings.findUnique({
        where: { id: params.id },
        select: {
          id: true, bookingNumber: true, acceptedDriverId: true, acceptedVendorId: true,
          status: true, tripStartOtp: true, customerId: true, customerName: true,
        },
      });

      if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });

      const isAuthorized = isStaff
        ? booking.acceptedVendorId === (driver as any).vendorId
        : booking.acceptedDriverId === driver.id;

      if (!isAuthorized) return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });

      if (booking.status !== 'DRIVER_ASSIGNED') {
        return NextResponse.json({ success: false, error: 'Assign a vehicle first' }, { status: 409 });
      }

      // OTP already exists — just remind driver to ask customer
      const otp = booking.tripStartOtp;
      if (!otp) {
        return NextResponse.json({ success: false, error: 'No OTP found. Please re-assign vehicle.' }, { status: 409 });
      }

      // Send OTP to customer via push notification
      try {
        await sendNotificationToCustomer(
          booking.customerId,
          {
            title: '🔐 Your Trip OTP',
            body: `Your driver is ready. Share OTP ${otp} with the driver to start your trip. Booking #${booking.bookingNumber}`,
          },
          {
            type: 'trip_otp',
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber,
            otp,
          }
        );

        await prisma.notifications.create({
          data: prepareNotificationData({
            customerId: booking.customerId,
            title: '🔐 Your Trip OTP',
            body: `Your driver is ready. Share OTP ${otp} with the driver to start your trip. Booking #${booking.bookingNumber}`,
            type: 'booking',
            serviceType: 'chauffeur',
            bookingId: booking.id,
            quoteId: null,
          }),
        });
      } catch (notifErr) {
        console.error('[request-otp chauffeur] notification failed:', notifErr);
      }

      return NextResponse.json({ success: true, message: 'OTP sent to customer' });
    }

    // ── BUS ───────────────────────────────────────────────────────────────────
    if (source === 'bus') {
      const booking = await prisma.bus_bookings.findUnique({
        where: { id: params.id },
        select: {
          id: true, bookingNumber: true, vendorId: true, driverPhone: true,
          status: true, customerId: true, customerName: true,
        },
      });

      if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });

      const driverPhone = (driver as any).phone;
      const isAuthorized = normalizePhone(booking.driverPhone) === normalizePhone(driverPhone) &&
        booking.vendorId === (driver as any).vendorId;

      if (!isAuthorized) return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });

      if (booking.status !== 'VEHICLE_ASSIGNED') {
        return NextResponse.json({ success: false, error: 'Vehicle not yet assigned to this booking' }, { status: 409 });
      }

      // Generate fresh OTP
      const otp = generateOTP();

      await prisma.bus_bookings.update({
        where: { id: params.id },
        data: { tripStartOtp: otp },
      });

      // Send OTP to customer via push notification
      try {
        await sendNotificationToCustomer(
          booking.customerId,
          {
            title: '🔐 Your Trip OTP',
            body: `Your driver is ready. Share OTP ${otp} with the driver to start your trip. Booking #${booking.bookingNumber}`,
          },
          {
            type: 'trip_otp',
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber,
            otp,
          }
        );

        await prisma.notifications.create({
          data: prepareNotificationData({
            customerId: booking.customerId,
            title: '🔐 Your Trip OTP',
            body: `Your driver is ready. Share OTP ${otp} with the driver to start your trip. Booking #${booking.bookingNumber}`,
            type: 'booking',
            serviceType: 'bus',
            bookingId: booking.id,
            quoteId: null,
          }),
        });
      } catch (notifErr) {
        console.error('[request-otp bus] notification failed:', notifErr);
      }

      return NextResponse.json({ success: true, message: 'OTP sent to customer' });
    }

    // ── PACKERS ───────────────────────────────────────────────────────────────
    if (source === 'packers') {
      const booking = await prisma.packers_bookings.findUnique({
        where: { id: params.id },
        select: { id: true, bookingNumber: true, vendorId: true, teamLeaderPhone: true, status: true, customerId: true, customerName: true },
      });

      if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });

      const driverPhone = (driver as any).phone;
      const isAuthorized = normalizePhone(booking.teamLeaderPhone) === normalizePhone(driverPhone) &&
        booking.vendorId === (driver as any).vendorId;

      if (!isAuthorized) return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });

      const isPackingPhase = booking.status === 'TEAM_ASSIGNED';
      const isLoadingPhase = booking.status === 'PACKING';
      const isTransitPhase = booking.status === 'IN_TRANSIT';

      if (!isPackingPhase && !isLoadingPhase && !isTransitPhase) {
        return NextResponse.json({ success: false, error: `Cannot send OTP at status: ${booking.status}` }, { status: 409 });
      }

      const otp = generateOTP();
      const otpField = isPackingPhase ? 'packingOtp' : isLoadingPhase ? 'loadingOtp' : 'deliveryOtp';
      const otpSentField = isPackingPhase ? 'packingOtpSent' : isLoadingPhase ? 'loadingOtpSent' : 'deliveryOtpSent';
      const otpType = isPackingPhase ? 'Packing' : isLoadingPhase ? 'Loading' : 'Delivery';

      await prisma.packers_bookings.update({ where: { id: params.id }, data: { [otpField]: otp, [otpSentField]: true } });

      try {
        await sendNotificationToCustomer(
          booking.customerId,
          { title: `🔐 Your ${otpType} OTP`, body: `OTP ${otp} for ${otpType.toLowerCase()} verification. Booking #${booking.bookingNumber}` },
          { type: 'trip_otp', bookingId: booking.id, bookingNumber: booking.bookingNumber, otp }
        );
        await prisma.notifications.create({
          data: prepareNotificationData({
            customerId: booking.customerId,
            title: `🔐 Your ${otpType} OTP`,
            body: `OTP ${otp} for ${otpType.toLowerCase()} verification. Booking #${booking.bookingNumber}`,
            type: 'booking', serviceType: 'packers', bookingId: booking.id, quoteId: null,
          }),
        });
      } catch (notifErr) {
        console.error(`[request-otp packers ${otpType}] notification failed:`, notifErr);
      }

      return NextResponse.json({ success: true, message: `${otpType} OTP sent to customer` });
    }

    // ── TRUCK ─────────────────────────────────────────────────────────────────
    if (source === 'truck') {
      const booking = await prisma.truck_bookings.findUnique({
        where: { id: params.id },
        select: {
          id: true, bookingNumber: true, vendorId: true, driverPhone: true,
          status: true, customerId: true, customerName: true,
        },
      });

      if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });

      const driverPhone = (driver as any).phone;
      const isAuthorized = normalizePhone(booking.driverPhone) === normalizePhone(driverPhone) &&
        booking.vendorId === (driver as any).vendorId;

      if (!isAuthorized) return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });

      const isLoadingPhase = booking.status === 'VEHICLE_ASSIGNED';
      const isTransitPhase = booking.status === 'IN_TRANSIT';

      if (!isLoadingPhase && !isTransitPhase) {
        return NextResponse.json({ success: false, error: `Cannot send OTP at status: ${booking.status}` }, { status: 409 });
      }

      const otp = generateOTP();
      const otpField = isLoadingPhase ? 'loadingOtp' : 'deliveryOtp';
      const otpType = isLoadingPhase ? 'Loading' : 'Delivery';

      await prisma.truck_bookings.update({
        where: { id: params.id },
        data: { [otpField]: otp },
      });

      try {
        await sendNotificationToCustomer(
          booking.customerId,
          {
            title: `🔐 Your ${otpType} OTP`,
            body: `OTP ${otp} for ${otpType.toLowerCase()} verification. Booking #${booking.bookingNumber}`,
          },
          { type: 'trip_otp', bookingId: booking.id, bookingNumber: booking.bookingNumber, otp }
        );
        await prisma.notifications.create({
          data: prepareNotificationData({
            customerId: booking.customerId,
            title: `🔐 Your ${otpType} OTP`,
            body: `OTP ${otp} for ${otpType.toLowerCase()} verification. Booking #${booking.bookingNumber}`,
            type: 'booking', serviceType: 'truck', bookingId: booking.id, quoteId: null,
          }),
        });
      } catch (notifErr) {
        console.error(`[request-otp truck ${otpType}] notification failed:`, notifErr);
      }

      return NextResponse.json({ success: true, message: `${otpType} OTP sent to customer` });
    }

    // ── LUXURY ────────────────────────────────────────────────────────────────
    if (source === 'luxury') {
      const booking = await prisma.luxury_bookings.findUnique({
        where: { id: params.id },
        select: {
          id: true, bookingNumber: true, assignedVendorId: true, acceptedVendorId: true,
          driverPhone: true, status: true, customerId: true, customerName: true,
        },
      });

      if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });

      const driverPhone = (driver as any).phone;
      const driverVendorId = (driver as any).vendorId;
      const isAuthorized = normalizePhone(booking.driverPhone) === normalizePhone(driverPhone) &&
        (booking.assignedVendorId === driverVendorId || booking.acceptedVendorId === driverVendorId);

      if (!isAuthorized) return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });

      if (booking.status !== 'DRIVER_ASSIGNED') {
        return NextResponse.json({ success: false, error: 'Vehicle not yet assigned to this booking' }, { status: 409 });
      }

      // Generate fresh OTP
      const otp = generateOTP();

      await prisma.luxury_bookings.update({
        where: { id: params.id },
        data: { tripStartOtp: otp },
      });

      // Send OTP to customer via push notification
      try {
        await sendNotificationToCustomer(
          booking.customerId,
          {
            title: '🔐 Your Trip OTP',
            body: `Your driver is ready. Share OTP ${otp} with the driver to start your trip. Booking #${booking.bookingNumber}`,
          },
          {
            type: 'trip_otp',
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber,
            otp,
          }
        );

        await prisma.notifications.create({
          data: prepareNotificationData({
            customerId: booking.customerId,
            title: '🔐 Your Trip OTP',
            body: `Your driver is ready. Share OTP ${otp} with the driver to start your trip. Booking #${booking.bookingNumber}`,
            type: 'booking',
            serviceType: 'luxury',
            bookingId: booking.id,
            quoteId: null,
          }),
        });
      } catch (notifErr) {
        console.error('[request-otp luxury] notification failed:', notifErr);
      }

      return NextResponse.json({ success: true, message: 'OTP sent to customer' });
    }

    // ── EQUIPMENT ─────────────────────────────────────────────────────────────
    if (source === 'equipment') {
      const booking = await prisma.equipment_bookings.findUnique({
        where: { id: params.id },
        select: { id: true, bookingNumber: true, vendorId: true, operatorPhone: true, status: true, customerId: true, customerName: true, returnOtp: true },
      });

      if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });

      const driverPhone = (driver as any).phone;
      const isAuthorized = normalizePhone(booking.operatorPhone) === normalizePhone(driverPhone) &&
        booking.vendorId === (driver as any).vendorId;

      if (!isAuthorized) return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });

      const isDeliveryPhase = booking.status === 'CONFIRMED';
      const isReturnPhase = booking.status === 'PICKUP_SCHEDULED';

      if (!isDeliveryPhase && !isReturnPhase) {
        return NextResponse.json({ success: false, error: `Cannot send OTP at status: ${booking.status}` }, { status: 409 });
      }

      const otp = isReturnPhase && booking.returnOtp ? booking.returnOtp : generateOTP();
      const otpField = isDeliveryPhase ? 'deliveryOtp' : 'returnOtp';
      const otpType = isDeliveryPhase ? 'Delivery' : 'Return';

      await prisma.equipment_bookings.update({ where: { id: params.id }, data: { [otpField]: otp } });

      try {
        await sendNotificationToCustomer(
          booking.customerId,
          { title: `🔐 Your ${otpType} OTP`, body: `OTP ${otp} for equipment ${otpType.toLowerCase()} verification. Booking #${booking.bookingNumber}` },
          { type: 'trip_otp', bookingId: booking.id, bookingNumber: booking.bookingNumber, otp }
        );
        await prisma.notifications.create({
          data: prepareNotificationData({
            customerId: booking.customerId,
            title: `🔐 Your ${otpType} OTP`,
            body: `OTP ${otp} for equipment ${otpType.toLowerCase()} verification. Booking #${booking.bookingNumber}`,
            type: 'booking', serviceType: 'equipment', bookingId: booking.id, quoteId: null,
          }),
        });
      } catch (notifErr) {
        console.error(`[request-otp equipment ${otpType}] notification failed:`, notifErr);
      }

      return NextResponse.json({ success: true, message: `${otpType} OTP sent to customer` });
    }

    // ── B2B TRIP ───────────────────────────────────────────────────────────────
    if (source === 'b2b') {
      const trip = await prisma.b2b_trips.findUnique({
        where: { id: params.id },
        include: {
          booking: { select: { id: true, bookingNumber: true, customerId: true } },
        },
      });

      if (!trip) return NextResponse.json({ success: false, error: 'Trip not found' }, { status: 404 });
      if (trip.vendorId !== (driver as any).vendorId)
        return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
      if (!['PENDING', 'DRIVER_ARRIVED'].includes(trip.status))
        return NextResponse.json({ success: false, error: 'Cannot send OTP at this stage' }, { status: 409 });

      const otp = generateOTP();

      await prisma.b2b_trips.update({
        where: { id: params.id },
        data: { status: 'DRIVER_ARRIVED', driverArrivedAt: new Date(), otp, otpGeneratedAt: new Date() },
      });

      // Send OTP to customer via push notification
      if (trip.booking?.customerId) {
        try {
          await sendNotificationToCustomer(
            trip.booking.customerId,
            {
              title: '🔐 Your Trip OTP',
              body: `Your driver has arrived. Share OTP ${otp} with the driver to start your trip. Booking #${trip.booking.bookingNumber}`,
            },
            { type: 'trip_otp', bookingId: trip.bookingId, bookingNumber: trip.booking.bookingNumber, otp }
          );
          await prisma.notifications.create({
            data: prepareNotificationData({
              customerId: trip.booking.customerId,
              title: '🔐 Your Trip OTP',
              body: `Your driver has arrived. Share OTP ${otp} with the driver to start your trip. Booking #${trip.booking.bookingNumber}`,
              type: 'booking',
              serviceType: 'b2b',
              bookingId: trip.bookingId,
              quoteId: null,
            }),
          });
        } catch (notifErr) {
          console.error('[request-otp b2b] notification failed:', notifErr);
        }
      }

      return NextResponse.json({ success: true, message: 'OTP sent to customer' });
    }

    return NextResponse.json({ success: false, error: 'Unsupported booking type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
