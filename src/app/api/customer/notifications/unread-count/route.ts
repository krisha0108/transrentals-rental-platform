import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

// GET /api/customer/notifications/unread-count - Get unread notification count
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

    // Count unread notifications
    const unreadCount = await prisma.notifications.count({
      where: {
        customerId,
        isRead: false,
      },
    });

    return NextResponse.json({
      success: true,
      total_unread: unreadCount,
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}
