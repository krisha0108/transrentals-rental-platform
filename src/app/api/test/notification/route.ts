export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { prepareNotificationData } from '@/lib/utils/notification-helper';
import { sendFCMNotification } from '@/lib/utils/fcm-helper';

// POST /api/test/notification - Send test notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_id, type = 'test', bookingId: customBookingId } = body;

    if (!customer_id) {
      return NextResponse.json(
        { success: false, message: 'customer_id is required' },
        { status: 400 }
      );
    }

    // Check if customer exists
    const customer = await prisma.customers.findUnique({
      where: { id: customer_id },
      select: { id: true, name: true, fcmToken: true },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'Customer not found' },
        { status: 404 }
      );
    }

    // Prepare test notification based on type
    let notifTitle = '';
    let notifBody = '';
    let serviceType = 'bike';
    let notifType = 'quote';

    switch (type) {
      case 'quote':
        notifTitle = '🏍️ Test Quote Notification';
        notifBody = `Hi ${customer.name}! This is a test quote notification. Tap to see details.`;
        serviceType = 'bike';
        notifType = 'quote';
        break;
      case 'payment':
        notifTitle = '✅ Test Payment Approved';
        notifBody = `Hi ${customer.name}! This is a test payment notification. Your payment of ₹999 was approved.`;
        serviceType = 'bike';
        notifType = 'payment';
        break;
      case 'booking':
        notifTitle = '🎉 Test Booking Confirmed';
        notifBody = `Hi ${customer.name}! This is a test booking confirmation notification.`;
        serviceType = 'bike';
        notifType = 'booking';
        break;
      case 'booking_accepted':
        notifTitle = '✅ Booking Accepted!';
        notifBody = `Hi ${customer.name}! Your booking has been accepted by a vendor! A driver will be assigned soon.`;
        serviceType = 'chauffeur-service';
        notifType = 'booking_accepted';
        break;
      default:
        notifTitle = '🔔 Test Notification';
        notifBody = `Hi ${customer.name}! This is a test notification from TransRentals.`;
        serviceType = 'bike';
        notifType = 'general';
    }

    // Save to database
    const notification = await prisma.notifications.create({
      data: prepareNotificationData({
        customerId: customer_id,
        title: notifTitle,
        body: notifBody,
        type: notifType,
        serviceType: serviceType,
        quoteId: 'TEST_QUOTE_123',
        bookingId: customBookingId || 'TEST_BOOKING_123',
      }),
    });

    // Send FCM push notification
    const fcmSent = await sendFCMNotification({
      customerId: customer_id,
      title: notifTitle,
      body: notifBody,
      data: {
        type: notifType,
        serviceType: serviceType,
        quoteId: 'TEST_QUOTE_123',
        bookingId: customBookingId || 'TEST_BOOKING_123',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Test notification sent!',
      notification: {
        id: notification.id,
        title: notifTitle,
        body: notifBody,
        fcm_sent: fcmSent,
        customer_has_fcm_token: !!customer.fcmToken,
      },
    });
  } catch (error: any) {
    console.error('Error sending test notification:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send test notification', error: error.message },
      { status: 500 }
    );
  }
}

// GET /api/test/notification - Get info about test endpoint
export async function GET() {
  return NextResponse.json({
    message: 'Test Notification Endpoint',
    usage: 'POST with { customer_id: "CUST_1", type: "quote" | "payment" | "booking" }',
    types: ['quote', 'payment', 'booking'],
    example: {
      method: 'POST',
      url: 'http://localhost:3000/api/test/notification',
      body: {
        customer_id: 'CUST_1',
        type: 'quote',
      },
    },
  });
}
