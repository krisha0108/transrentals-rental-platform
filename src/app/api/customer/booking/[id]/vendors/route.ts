import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

/**
 * GET - Get vendors associated with a booking for chat
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Try to find the booking and its vendor in each booking type
    let vendor: any = null;
    let bookingType = 'general';

    // Try BikeBooking
    const bikeBooking = await prisma.bike_bookings.findUnique({
      where: { id: bookingId },
      include: {
        assignedVendor: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            email: true,
            logo: true,
          },
        },
        acceptedVendor: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            email: true,
            logo: true,
          },
        },
      },
    });

    if (bikeBooking) {
      vendor = bikeBooking.acceptedVendor || bikeBooking.assignedVendor;
      bookingType = 'bike';
    }

    // Try CarBooking if not found
    if (!vendor) {
      const carBooking = await prisma.car_bookings.findUnique({
        where: { id: bookingId },
        include: {
          assignedVendor: {
            select: {
              id: true,
              businessName: true,
              phone: true,
              email: true,
              logo: true,
            },
          },
          acceptedVendor: {
            select: {
              id: true,
              businessName: true,
              phone: true,
              email: true,
              logo: true,
            },
          },
        },
      });

      if (carBooking) {
        vendor = carBooking.acceptedVendor || carBooking.assignedVendor;
        bookingType = 'car';
      }
    }

    // Try ChauffeurBooking if not found
    if (!vendor) {
      const chauffeurBooking = await prisma.chauffeur_bookings.findUnique({
        where: { id: bookingId },
        include: {
          assignedVendor: {
            select: {
              id: true,
              businessName: true,
              phone: true,
              email: true,
              logo: true,
            },
          },
          acceptedVendor: {
            select: {
              id: true,
              businessName: true,
              phone: true,
              email: true,
              logo: true,
            },
          },
        },
      });

      if (chauffeurBooking) {
        vendor = chauffeurBooking.acceptedVendor || chauffeurBooking.assignedVendor;
        bookingType = 'chauffeur';
      }
    }

    if (!vendor) {
      return NextResponse.json({
        success: true,
        vendors: [],
        message: 'No vendor assigned to this booking',
      });
    }

    // Get chat conversation for unread count and last message
    let unreadCount = 0;
    let lastMessage = null;
    let lastMessageTime = null;

    if (customerId) {
      const conversation = await prisma.chat_conversations.findFirst({
        where: {
          customerId,
          vendorId: vendor.id,
          bookingId,
          bookingType,
        },
        select: {
          customerUnread: true,
          lastMessageText: true,
          lastMessageAt: true,
        },
      });

      if (conversation) {
        unreadCount = conversation.customerUnread || 0;
        lastMessage = conversation.lastMessageText;
        lastMessageTime = conversation.lastMessageAt?.toISOString();
      }
    }

    // Transform vendor to expected format
    const transformedVendor = {
      id: vendor.id,
      name: vendor.businessName,
      company_name: vendor.businessName,
      phone: vendor.phone,
      email: vendor.email,
      image: vendor.logo,
      unread_count: unreadCount,
      last_message: lastMessage,
      last_message_time: lastMessageTime,
      booking_type: bookingType,
    };

    return NextResponse.json({
      success: true,
      vendors: [transformedVendor],
    });
  } catch (error) {
    logger.error('Get booking vendors error', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}
