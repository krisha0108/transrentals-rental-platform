import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import razorpayInstance, { RAZORPAY_CONFIG } from '@/lib/razorpay/config';
import logger from '@/lib/security/logger';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';

export const dynamic = 'force-dynamic';

type BookingType = 'bike' | 'car' | 'self-drive' | 'truck' | 'bus' | 'packers' | 'equipment' | 'luxury' | 'chauffeur' | 'wander_quote';

async function fetchBooking(bookingType: BookingType, bookingId: string) {
  switch (bookingType) {
    case 'bike':
      return prisma.bike_bookings.findUnique({
        where: { id: bookingId },
        select: {
          id: true, bookingNumber: true, status: true, paymentStatus: true,
          advanceAmount: true, grandTotal: true,
          customerName: true, customerEmail: true, customerPhone: true,
          requestedVehicleName: true, razorpayOrderId: true,
        },
      }).then(b => b ? { ...b, vehicleName: b.requestedVehicleName, hasRazorpayOrder: true } : null);

    case 'car':
    case 'self-drive':
      return prisma.car_bookings.findUnique({
        where: { id: bookingId },
        select: {
          id: true, bookingNumber: true, status: true, paymentStatus: true,
          advanceAmount: true, grandTotal: true,
          customerName: true, customerEmail: true, customerPhone: true,
          requestedVehicleName: true,
        },
      }).then(b => b ? {
        ...b,
        vehicleName: b.requestedVehicleName,
        advanceAmount: b.advanceAmount || Math.round(b.grandTotal * 0.20),
        hasRazorpayOrder: false,
        razorpayOrderId: null,
      } : null);

    case 'truck':
      return prisma.truck_bookings.findUnique({
        where: { id: bookingId },
        select: {
          id: true, bookingNumber: true, status: true, paymentStatus: true,
          advanceAmount: true, totalAmount: true,
          customerName: true, customerEmail: true, customerPhone: true,
          vehicleName: true,
        },
      }).then(b => b ? { ...b, grandTotal: b.totalAmount, hasRazorpayOrder: false, razorpayOrderId: null } : null);

    case 'bus':
      return prisma.bus_bookings.findUnique({
        where: { id: bookingId },
        select: {
          id: true, bookingNumber: true, status: true, paymentStatus: true,
          advanceAmount: true, totalAmount: true,
          customerName: true, customerEmail: true, customerPhone: true,
          vehicleName: true,
        },
      }).then(b => b ? { ...b, grandTotal: b.totalAmount, hasRazorpayOrder: false, razorpayOrderId: null } : null);

    case 'packers':
      return prisma.packers_bookings.findUnique({
        where: { id: bookingId },
        select: {
          id: true, bookingNumber: true, status: true, paymentStatus: true,
          advanceAmount: true, totalAmount: true,
          customerName: true, customerEmail: true, customerPhone: true,
          serviceType: true,
        },
      }).then(b => b ? { ...b, vehicleName: b.serviceType || 'Packers & Movers', grandTotal: b.totalAmount, hasRazorpayOrder: false, razorpayOrderId: null } : null);

    case 'equipment':
      return prisma.equipment_bookings.findUnique({
        where: { id: bookingId },
        select: {
          id: true, bookingNumber: true, status: true, paymentStatus: true,
          advanceAmount: true, totalAmount: true,
          customerName: true, customerEmail: true, customerPhone: true,
          equipmentName: true, equipmentType: true,
        },
      }).then(b => b ? { ...b, vehicleName: b.equipmentName || b.equipmentType, grandTotal: b.totalAmount, hasRazorpayOrder: false, razorpayOrderId: null } : null);

    case 'luxury':
      return prisma.luxury_bookings.findUnique({
        where: { id: bookingId },
        select: {
          id: true, bookingNumber: true, status: true, paymentStatus: true,
          advanceAmount: true, grandTotal: true,
          customerName: true, customerEmail: true, customerPhone: true,
          carCategoryName: true, carCategory: true,
        },
      }).then(b => b ? { ...b, vehicleName: b.carCategoryName || b.carCategory, hasRazorpayOrder: false, razorpayOrderId: null } : null);

    case 'chauffeur':
      return prisma.chauffeur_bookings.findUnique({
        where: { id: bookingId },
        select: {
          id: true, bookingNumber: true, status: true, paymentStatus: true,
          grandTotal: true, partialPayment: true,
          customerName: true, customerEmail: true, customerPhone: true,
          carCategoryName: true,
        },
      }).then(b => b ? {
        ...b,
        vehicleName: b.carCategoryName,
        advanceAmount: b.partialPayment || Math.round(b.grandTotal * 0.20),
        grandTotal: b.grandTotal,
        hasRazorpayOrder: false,
        razorpayOrderId: null,
      } : null);

    case 'wander_quote':
      return (prisma as any).wander_bookings.findUnique({
        where: { id: bookingId },
        include: {
          customer: { select: { name: true, phone: true, email: true } },
        },
      }).then((b: any) => b ? {
        ...b,
        bookingNumber: b.bookingId,
        customerName: b.customer?.name || 'Customer',
        customerEmail: b.customer?.email || '',
        customerPhone: b.customer?.phone || '',
        vehicleName: 'Wander Tour',
        grandTotal: b.amount,
        hasRazorpayOrder: false,
        razorpayOrderId: null,
      } : null);

    default:
      return null;
  }
}

// POST - Create a Razorpay order for a booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, bookingType = 'bike' } = body as { bookingId: string; bookingType: BookingType };

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    if (!['bike', 'car', 'self-drive', 'truck', 'bus', 'packers', 'equipment', 'luxury', 'chauffeur', 'wander_quote'].includes(bookingType)) {
      return NextResponse.json({ error: 'Invalid booking type' }, { status: 400 });
    }

    const booking = await fetchBooking(bookingType, bookingId);

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const payableStatuses = ['PENDING', 'PENDING_PAYMENT', 'PAYMENT_PENDING'];
    if (!payableStatuses.includes(booking.status)) {
      return NextResponse.json(
        { error: 'Booking is not available for payment at this stage' },
        { status: 400 }
      );
    }

    if (booking.paymentStatus === 'PAID' || booking.paymentStatus === 'PARTIAL') {
      return NextResponse.json({ error: 'Payment already completed for this booking' }, { status: 400 });
    }

    const advanceAmount = booking.advanceAmount ?? 0;
    if (!advanceAmount || advanceAmount <= 0) {
      return NextResponse.json({ error: 'No advance amount set for this booking' }, { status: 400 });
    }
    const amountInPaise = Math.round(advanceAmount * 100);

    // ── Recovery: check if a previous Razorpay order was already paid ─────────
    const existingOrderId = (booking as any).razorpayOrderId as string | null;
    if (existingOrderId) {
      try {
        const existingOrder = await (razorpayInstance.orders as any).fetch(existingOrderId);
        if (existingOrder?.status === 'paid') {
          // Order already paid — recover the payment and update the booking
          const paymentsRes = await razorpayInstance.orders.fetchPayments(existingOrderId);
          const captured = ((paymentsRes as any).items ?? []).find((p: any) => p.status === 'captured');
          if (captured && bookingType === 'bike') {
            const paidAt = new Date(captured.created_at * 1000);
            await prisma.bike_bookings.update({
              where: { id: bookingId },
              data: {
                status: 'PAYMENT_VERIFIED',
                paymentStatus: 'PAID',
                paidAmount: advanceAmount,
                transactionId: captured.id,
                paymentMethod: 'ONLINE',
                razorpayPaymentId: captured.id,
                lastPaymentError: null,
                advancePaymentDate: paidAt,
              },
            });
            const vendorId = (booking as any).assignedVendorId || (booking as any).acceptedVendorId;
            if (vendorId) {
              await sendVendorDirectNotification({
                vendorId,
                title: 'Advance Payment Received',
                body: `Customer ${booking.customerName} has paid the advance for booking #${booking.bookingNumber}.`,
                type: 'advance_paid',
                serviceType: 'bike',
                bookingId: booking.id,
                bookingNumber: booking.bookingNumber,
              }).catch(() => {});
            }
            return NextResponse.json({
              success: true,
              alreadyPaid: true,
              message: 'Payment already captured. Booking updated.',
              booking: { id: booking.id, bookingNumber: booking.bookingNumber, status: 'PAYMENT_VERIFIED', paymentStatus: 'PAID', transactionId: captured.id, paidAmount: advanceAmount },
            });
          }
        }
        // If existing order is still 'created' (not yet paid), reuse it
        if (existingOrder?.status === 'created') {
          return NextResponse.json({
            success: true,
            order: { id: existingOrder.id, amount: existingOrder.amount, currency: existingOrder.currency, receipt: existingOrder.receipt },
            booking: { id: booking.id, bookingNumber: booking.bookingNumber, customerName: booking.customerName, customerEmail: booking.customerEmail, customerPhone: booking.customerPhone, vehicleName: booking.vehicleName || '', advanceAmount, grandTotal: (booking as any).grandTotal ?? advanceAmount },
            razorpayConfig: { key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '', name: RAZORPAY_CONFIG.name, description: `${booking.vehicleName || bookingType} - Advance Payment`, image: RAZORPAY_CONFIG.image, theme: RAZORPAY_CONFIG.theme, prefill: { name: booking.customerName, email: booking.customerEmail, contact: booking.customerPhone } },
          });
        }
      } catch {
        // If fetch fails (order not found/expired), fall through to create new order
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const order = await razorpayInstance.orders.create({
      amount: amountInPaise,
      currency: RAZORPAY_CONFIG.currency,
      receipt: booking.bookingNumber,
      notes: {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        bookingType,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        vehicleName: booking.vehicleName || '',
      },
    });

    // Only bike_bookings has razorpayOrderId field
    if (bookingType === 'bike') {
      await prisma.bike_bookings.update({
        where: { id: bookingId },
        data: {
          razorpayOrderId: order.id,
          paymentAttempts: { increment: 1 },
        },
      });
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      },
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        vehicleName: booking.vehicleName || '',
        advanceAmount,
        grandTotal: (booking as any).grandTotal ?? advanceAmount,
      },
      razorpayConfig: {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_dummy_key_id',
        name: RAZORPAY_CONFIG.name,
        description: `${booking.vehicleName || bookingType} - Advance Payment`,
        image: RAZORPAY_CONFIG.image,
        theme: RAZORPAY_CONFIG.theme,
        prefill: {
          name: booking.customerName,
          email: booking.customerEmail,
          contact: booking.customerPhone,
        },
      },
    });
  } catch (error: any) {
    logger.error('Failed to create Razorpay order', error);
    return NextResponse.json(
      { error: 'Failed to create payment order', details: error?.message },
      { status: 500 }
    );
  }
}
