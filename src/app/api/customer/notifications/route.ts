export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

// GET /api/customer/notifications - Get customer notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');

    if (!customerId) {
      return NextResponse.json(
        { success: false, message: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Check if customer exists
    const customer = await prisma.customers.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get notifications for customer
    const notifications = await prisma.notifications.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });

    // Add relative time to each notification
    const notificationsWithTime = notifications.map((notification) => {
      const timeDiff = Date.now() - new Date(notification.createdAt).getTime();
      const minutes = Math.floor(timeDiff / 60000);
      const hours = Math.floor(timeDiff / 3600000);
      const days = Math.floor(timeDiff / 86400000);

      let relativeTime = '';
      if (minutes < 1) {
        relativeTime = 'Just now';
      } else if (minutes < 60) {
        relativeTime = `${minutes}m ago`;
      } else if (hours < 24) {
        relativeTime = `${hours}h ago`;
      } else {
        relativeTime = `${days}d ago`;
      }

      return {
        id: notification.id,
        title: notification.title,
        body: notification.body,
        image: notification.image,
        booking_id: notification.bookingId,
        quote_id: notification.quoteId,
        type: notification.type,
        service_type: notification.serviceType, // ⭐ Add service type
        is_read: notification.isRead,
        created_at: notification.createdAt,
        relative_time: relativeTime,
      };
    });

    return NextResponse.json({
      success: true,
      notifications: notificationsWithTime,
      total: notifications.length,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/customer/notifications - Create a notification (for testing)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_id, title, body: notificationBody, image, booking_id, quote_id, type } = body;

    if (!customer_id || !title || !notificationBody) {
      return NextResponse.json(
        { success: false, message: 'Customer ID, title, and body are required' },
        { status: 400 }
      );
    }

    // Create notification
    const notification = await prisma.notifications.create({
      data: {
        customerId: customer_id,
        title,
        body: notificationBody,
        image: image || null,
        bookingId: booking_id || null,
        quoteId: quote_id || null,
        type: type || 'general',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Notification created successfully',
      notification,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
