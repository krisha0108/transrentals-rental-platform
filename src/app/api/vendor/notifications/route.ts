// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Fetch all notifications for the logged-in vendor
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    // Fetch notifications from SiteSetting
    const settingKey = `vendor_notifications_${vendorId}`;
    const setting = await prisma.settings.findUnique({
      where: { key: settingKey },
    });

    const notifications = (setting?.value as any)?.notifications || getSampleNotifications();

    return NextResponse.json({ notifications });
  } catch (error) {
    logger.error('Failed to fetch notifications', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST - Mark notifications as read
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    const body = await request.json();
    const settingKey = `vendor_notifications_${vendorId}`;
    const existing = await prisma.settings.findUnique({
      where: { key: settingKey },
    });

    const data = (existing?.value as any) || { notifications: getSampleNotifications() };

    if (body.action === 'markAllRead') {
      data.notifications = data.notifications.map((n: any) => ({ ...n, read: true }));
    } else if (body.action === 'markRead' && body.notificationIds) {
      data.notifications = data.notifications.map((n: any) =>
        body.notificationIds.includes(n.id) ? { ...n, read: true } : n
      );
    } else if (body.action === 'delete' && body.notificationIds) {
      data.notifications = data.notifications.filter(
        (n: any) => !body.notificationIds.includes(n.id)
      );
    }

    await prisma.settings.upsert({
      where: { key: settingKey },
      create: { key: settingKey, value: data },
      update: { value: data },
    });

    return NextResponse.json({ success: true, notifications: data.notifications });
  } catch (error) {
    logger.error('Failed to update notifications', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

// Sample notifications for demonstration
function getSampleNotifications() {
  const now = Date.now();
  return [
    {
      id: 'n1',
      type: 'booking',
      title: 'New Booking Request',
      message: 'You have a new booking request for Toyota Fortuner from Rahul Sharma.',
      bookingId: 'BK001',
      read: false,
      createdAt: new Date(now - 1800000).toISOString(), // 30 mins ago
    },
    {
      id: 'n2',
      type: 'booking',
      title: 'Booking Confirmed',
      message: 'Booking #TR2024110045 has been confirmed by customer Amit Kumar.',
      bookingId: 'BK003',
      read: false,
      createdAt: new Date(now - 7200000).toISOString(), // 2 hours ago
    },
    {
      id: 'n3',
      type: 'review',
      title: 'New Review Received',
      message: 'Priya Patel left a 4-star review for your Honda City service.',
      reviewId: '2',
      read: false,
      createdAt: new Date(now - 86400000).toISOString(), // 1 day ago
    },
    {
      id: 'n4',
      type: 'payment',
      title: 'Payment Received',
      message: 'Payment of ₹8,500 received for booking #TR2024110032.',
      bookingId: 'BK004',
      read: true,
      createdAt: new Date(now - 172800000).toISOString(), // 2 days ago
    },
    {
      id: 'n5',
      type: 'system',
      title: 'Profile Approved',
      message: 'Congratulations! Your vendor profile has been approved. You can now receive bookings.',
      read: true,
      createdAt: new Date(now - 604800000).toISOString(), // 7 days ago
    },
    {
      id: 'n6',
      type: 'system',
      title: 'Document Expiring Soon',
      message: 'Your vehicle insurance for Maruti Swift (MH01AB1234) expires in 15 days. Please update.',
      read: true,
      createdAt: new Date(now - 864000000).toISOString(), // 10 days ago
    },
    {
      id: 'n7',
      type: 'payout',
      title: 'Payout Processed',
      message: 'Your payout of ₹25,000 has been processed and will be credited to your bank account within 2-3 business days.',
      read: true,
      createdAt: new Date(now - 1209600000).toISOString(), // 14 days ago
    },
    {
      id: 'n8',
      type: 'review',
      title: 'New Review Received',
      message: 'Sneha Reddy left a 5-star review for your Mercedes E-Class service. Great job!',
      reviewId: '4',
      read: true,
      createdAt: new Date(now - 1728000000).toISOString(), // 20 days ago
    },
  ];
}
