import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import razorpayInstance from '@/lib/razorpay/config';
import logger from '@/lib/security/logger';
import {
  sendVendorDirectNotification,
  sendQuoteRequestNotificationToVendors,
} from '@/lib/utils/vendor-notification-sender';

export const dynamic = 'force-dynamic';

type BookingType =
  | 'bike'
  | 'car'
  | 'self-drive'
  | 'truck'
  | 'bus'
  | 'packers'
  | 'equipment'
  | 'luxury'
  | 'chauffeur';

// GET - Check if a Razorpay order has been paid (used for async UPI polling)
// Security: We verify orderId belongs to bookingId via Razorpay order notes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const bookingId = searchParams.get('bookingId');
    const bookingType = searchParams.get('bookingType') as BookingType;

    if (!orderId || !bookingId || !bookingType) {
      return NextResponse.json({ error: 'Missing required params' }, { status: 400 });
    }

    // Fetch order from Razorpay — handle API errors gracefully (don't 500 on 404/401)
    let order: any;
    try {
      order = await (razorpayInstance.orders as any).fetch(orderId);
    } catch (rzpErr: any) {
      const code = rzpErr?.statusCode ?? rzpErr?.status ?? 0;
      logger.error('Razorpay order fetch error', { orderId, code, error: rzpErr?.error ?? rzpErr?.message });
      // 404 = order not found yet, 401 = auth issue — return isPaid:false, not 500
      return NextResponse.json({ isPaid: false, status: 'razorpay_error', code });
    }

    if (!order) {
      return NextResponse.json({ isPaid: false, status: 'not_found' });
    }

    // Security: verify this order belongs to this booking
    if (order.notes?.bookingId !== bookingId) {
      logger.error('Order bookingId mismatch', { orderId, expected: bookingId, got: order.notes?.bookingId });
      return NextResponse.json({ error: 'Order does not match booking' }, { status: 403 });
    }

    if (order.status !== 'paid') {
      return NextResponse.json({ isPaid: false, status: order.status });
    }

    // Order is paid — get the captured payment
    let paymentsResponse: any;
    try {
      paymentsResponse = await razorpayInstance.orders.fetchPayments(orderId);
    } catch (rzpErr: any) {
      logger.error('Razorpay fetchPayments error', { orderId, error: rzpErr?.message });
      return NextResponse.json({ isPaid: false, status: 'payments_fetch_error' });
    }

    const payments = (paymentsResponse as any).items ?? [];
    const capturedPayment = payments.find((p: any) => p.status === 'captured');

    if (!capturedPayment) {
      return NextResponse.json({ isPaid: false, status: 'payment_pending' });
    }

    const razorpay_payment_id: string = capturedPayment.id;
    const paidAt = new Date(capturedPayment.created_at * 1000);

    // Update booking — same logic as verify/route.ts but using Razorpay API as source of truth
    const result = await updateBookingAfterPayment(
      bookingType,
      bookingId,
      razorpay_payment_id,
      paidAt
    );

    if (!result) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({
      isPaid: true,
      paymentId: razorpay_payment_id,
      booking: result,
    });
  } catch (error: any) {
    logger.error('Check order status error', error);
    return NextResponse.json(
      { error: 'Failed to check order status', details: error?.message },
      { status: 500 }
    );
  }
}

async function updateBookingAfterPayment(
  bookingType: BookingType,
  bookingId: string,
  razorpay_payment_id: string,
  paidAt: Date
) {
  if (bookingType === 'bike') {
    const booking = await prisma.bike_bookings.findUnique({ where: { id: bookingId } });
    if (!booking) return null;
    if (booking.paymentStatus === 'PAID') {
      return { id: booking.id, bookingNumber: booking.bookingNumber, status: booking.status, paymentStatus: booking.paymentStatus, transactionId: booking.transactionId, paidAmount: booking.paidAmount };
    }
    await prisma.bike_bookings.update({
      where: { id: bookingId },
      data: { status: 'PAYMENT_VERIFIED', paymentStatus: 'PAID', paidAmount: booking.advanceAmount ?? 0, transactionId: razorpay_payment_id, paymentMethod: 'ONLINE', razorpayPaymentId: razorpay_payment_id, lastPaymentError: null },
    });
    const vendorId = booking.assignedVendorId || booking.acceptedVendorId;
    if (vendorId) {
      await sendVendorDirectNotification({ vendorId, title: 'Advance Payment Received', body: `Customer ${booking.customerName} has paid the advance for booking #${booking.bookingNumber}.`, type: 'advance_paid', serviceType: 'bike', bookingId: booking.id, bookingNumber: booking.bookingNumber }).catch(() => {});
    }
    return { id: booking.id, bookingNumber: booking.bookingNumber, status: 'PAYMENT_VERIFIED', paymentStatus: 'PAID', transactionId: razorpay_payment_id, paidAmount: booking.advanceAmount ?? 0 };
  }

  if (bookingType === 'car' || bookingType === 'self-drive') {
    const booking = await prisma.car_bookings.findUnique({ where: { id: bookingId } });
    if (!booking) return null;
    if (booking.paymentStatus === 'PAID') {
      return { id: booking.id, bookingNumber: booking.bookingNumber, status: booking.status, paymentStatus: booking.paymentStatus, transactionId: booking.transactionId, paidAmount: booking.paidAmount };
    }
    await prisma.car_bookings.update({
      where: { id: bookingId },
      data: { status: 'PAYMENT_VERIFIED', paymentStatus: 'PAID', paidAmount: booking.advanceAmount ?? 0, transactionId: razorpay_payment_id, paymentMethod: 'ONLINE' },
    });
    const vendorId = booking.assignedVendorId || booking.acceptedVendorId;
    if (vendorId) {
      await sendVendorDirectNotification({ vendorId, title: 'Advance Payment Received', body: `Customer ${booking.customerName} has paid the advance for booking #${booking.bookingNumber}.`, type: 'advance_paid', serviceType: 'car', bookingId: booking.id, bookingNumber: booking.bookingNumber }).catch(() => {});
    }
    return { id: booking.id, bookingNumber: booking.bookingNumber, status: 'PAYMENT_VERIFIED', paymentStatus: 'PAID', transactionId: razorpay_payment_id, paidAmount: booking.advanceAmount ?? 0 };
  }

  if (bookingType === 'truck') {
    const booking = await prisma.truck_bookings.findUnique({ where: { id: bookingId } });
    if (!booking) return null;
    if (booking.paymentStatus === 'PAID') {
      return { id: booking.id, bookingNumber: booking.bookingNumber, status: booking.status, paymentStatus: booking.paymentStatus, transactionId: booking.advancePaymentRef, paidAmount: booking.advancePaid };
    }
    await prisma.truck_bookings.update({
      where: { id: bookingId },
      data: { status: 'ADVANCE_PAID', paymentStatus: 'PAID', advancePaid: booking.advanceAmount ?? 0, advancePaidAt: paidAt, paymentMethod: 'ONLINE', advancePaymentRef: razorpay_payment_id },
    });
    if (booking.vendorId) await sendVendorDirectNotification({ vendorId: booking.vendorId, title: 'Advance Payment Received', body: `Customer ${booking.customerName} has paid the advance for booking #${booking.bookingNumber}.`, type: 'advance_paid', serviceType: 'truck', bookingId: booking.id, bookingNumber: booking.bookingNumber }).catch(() => {});
    return { id: booking.id, bookingNumber: booking.bookingNumber, status: 'ADVANCE_PAID', paymentStatus: 'PAID', transactionId: razorpay_payment_id, paidAmount: booking.advanceAmount ?? 0 };
  }

  if (bookingType === 'bus') {
    const booking = await prisma.bus_bookings.findUnique({ where: { id: bookingId } });
    if (!booking) return null;
    if (booking.paymentStatus === 'PAID') {
      return { id: booking.id, bookingNumber: booking.bookingNumber, status: booking.status, paymentStatus: booking.paymentStatus, transactionId: booking.transactionIds, paidAmount: booking.advancePaid };
    }
    await prisma.bus_bookings.update({
      where: { id: bookingId },
      data: { status: 'ADVANCE_PAID', paymentStatus: 'PAID', advancePaid: booking.advanceAmount ?? 0, advancePaidAt: paidAt, paymentMethod: 'ONLINE', transactionIds: razorpay_payment_id },
    });
    if (booking.vendorId) await sendVendorDirectNotification({ vendorId: booking.vendorId, title: 'Advance Payment Received', body: `Customer ${booking.customerName} has paid the advance for booking #${booking.bookingNumber}.`, type: 'advance_paid', serviceType: 'bus', bookingId: booking.id, bookingNumber: booking.bookingNumber }).catch(() => {});
    return { id: booking.id, bookingNumber: booking.bookingNumber, status: 'ADVANCE_PAID', paymentStatus: 'PAID', transactionId: razorpay_payment_id, paidAmount: booking.advanceAmount ?? 0 };
  }

  if (bookingType === 'packers') {
    const booking = await prisma.packers_bookings.findUnique({ where: { id: bookingId } });
    if (!booking) return null;
    if (booking.paymentStatus === 'PAID') {
      return { id: booking.id, bookingNumber: booking.bookingNumber, status: booking.status, paymentStatus: booking.paymentStatus, transactionId: null, paidAmount: booking.advancePaid };
    }
    await prisma.packers_bookings.update({
      where: { id: bookingId },
      data: { status: 'ADVANCE_PAID', paymentStatus: 'PAID', advancePaid: booking.advanceAmount ?? 0, advancePaidAt: paidAt },
    });
    if (booking.vendorId) await sendVendorDirectNotification({ vendorId: booking.vendorId, title: 'Advance Payment Received', body: `Customer ${booking.customerName} has paid the advance for booking #${booking.bookingNumber}.`, type: 'advance_paid', serviceType: 'packers', bookingId: booking.id, bookingNumber: booking.bookingNumber }).catch(() => {});
    return { id: booking.id, bookingNumber: booking.bookingNumber, status: 'ADVANCE_PAID', paymentStatus: 'PAID', transactionId: razorpay_payment_id, paidAmount: booking.advanceAmount ?? 0 };
  }

  if (bookingType === 'equipment') {
    const booking = await prisma.equipment_bookings.findUnique({ where: { id: bookingId } });
    if (!booking) return null;
    if (booking.paymentStatus === 'PAID') {
      return { id: booking.id, bookingNumber: booking.bookingNumber, status: booking.status, paymentStatus: booking.paymentStatus, transactionId: null, paidAmount: booking.advancePaid };
    }
    await prisma.equipment_bookings.update({
      where: { id: bookingId },
      data: { status: 'ADVANCE_PAID', paymentStatus: 'PAID', advancePaid: booking.advanceAmount ?? 0, advancePaidAt: paidAt },
    });
    if (booking.vendorId) await sendVendorDirectNotification({ vendorId: booking.vendorId, title: 'Advance Payment Received', body: `Customer ${booking.customerName} has paid the advance for booking #${booking.bookingNumber}.`, type: 'advance_paid', serviceType: 'equipment', bookingId: booking.id, bookingNumber: booking.bookingNumber }).catch(() => {});
    return { id: booking.id, bookingNumber: booking.bookingNumber, status: 'ADVANCE_PAID', paymentStatus: 'PAID', transactionId: razorpay_payment_id, paidAmount: booking.advanceAmount ?? 0 };
  }

  if (bookingType === 'luxury') {
    const booking = await prisma.luxury_bookings.findUnique({ where: { id: bookingId } });
    if (!booking) return null;
    const vendorId = booking.assignedVendorId || booking.acceptedVendorId;
    if (booking.paymentStatus === 'PAID') {
      return { id: booking.id, bookingNumber: booking.bookingNumber, status: booking.status, paymentStatus: booking.paymentStatus, transactionId: booking.paymentTransactionId, paidAmount: booking.advancePaid };
    }
    await prisma.luxury_bookings.update({
      where: { id: bookingId },
      data: { status: 'ADVANCE_PAID', paymentStatus: 'PAID', advancePaid: booking.advanceAmount ?? 0, advancePaidAt: paidAt, paymentMethod: 'ONLINE', paymentTransactionId: razorpay_payment_id },
    });
    if (vendorId) await sendVendorDirectNotification({ vendorId, title: 'Advance Payment Received', body: `Customer ${booking.customerName} has paid the advance for booking #${booking.bookingNumber}.`, type: 'advance_paid', serviceType: 'luxury', bookingId: booking.id, bookingNumber: booking.bookingNumber }).catch(() => {});
    return { id: booking.id, bookingNumber: booking.bookingNumber, status: 'ADVANCE_PAID', paymentStatus: 'PAID', transactionId: razorpay_payment_id, paidAmount: booking.advanceAmount ?? 0 };
  }

  if (bookingType === 'chauffeur') {
    const booking = await prisma.chauffeur_bookings.findUnique({ where: { id: bookingId } });
    if (!booking) return null;
    if (booking.paymentStatus === 'PARTIAL' || booking.paymentStatus === 'PAID') {
      return { id: booking.id, bookingNumber: booking.bookingNumber, status: booking.status, paymentStatus: booking.paymentStatus, transactionId: booking.transactionId, paidAmount: booking.paidAmount };
    }
    const advanceAmount = booking.partialPayment || Math.round(booking.grandTotal * 0.20);
    const responseDeadline = new Date(paidAt.getTime() + 4 * 60 * 60 * 1000);
    await prisma.chauffeur_bookings.update({
      where: { id: bookingId },
      data: { status: 'BROADCASTED', paymentStatus: 'PARTIAL', paidAmount: advanceAmount, partialPayment: advanceAmount, remainingPayment: booking.grandTotal - advanceAmount, broadcastedAt: paidAt, responseDeadline, transactionId: razorpay_payment_id, paymentMethod: 'ONLINE' },
    });
    if (booking.locationId) {
      await sendQuoteRequestNotificationToVendors({ requestId: booking.id, requestNumber: booking.bookingNumber, locationId: booking.locationId, locationName: booking.locationName, customerName: booking.customerName, serviceType: 'chauffeur', serviceDisplayName: 'Chauffeur Service' }).catch(() => {});
    }
    return { id: booking.id, bookingNumber: booking.bookingNumber, status: 'BROADCASTED', paymentStatus: 'PARTIAL', transactionId: razorpay_payment_id, paidAmount: advanceAmount };
  }

  return null;
}
