import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - List all chat conversations for the vendor
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    // Get all conversations for this vendor
    const conversations = await prisma.chat_conversations.findMany({
      where: {
        vendorId,
        status: 'ACTIVE',
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
      take: 50,
    });

    // Fetch booking details for each conversation
    const chatsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        let booking: any = null;
        let customer: any = null;

        // Try to find the booking
        if (conv.bookingId) {
          // Try CarBooking
          const carBooking = await prisma.car_bookings.findUnique({
            where: { id: conv.bookingId },
            include: {
              customers: { select: { id: true, name: true, email: true, phone: true } },
            },
          });
          if (carBooking) {
            booking = carBooking;
            customer = carBooking.customer;
          }

          // Try BikeBooking
          if (!booking) {
            const bikeBooking = await prisma.bike_bookings.findUnique({
              where: { id: conv.bookingId },
              include: {
                customers: { select: { id: true, name: true, email: true, phone: true } },
              },
            });
            if (bikeBooking) {
              booking = bikeBooking;
              customer = bikeBooking.customer;
            }
          }

          // Try ChauffeurBooking
          if (!booking) {
            const chauffeurBooking = await prisma.chauffeur_bookings.findUnique({
              where: { id: conv.bookingId },
              include: {
                customers: { select: { id: true, name: true, email: true, phone: true } },
              },
            });
            if (chauffeurBooking) {
              booking = chauffeurBooking;
              customer = chauffeurBooking.customer;
            }
          }
        }

        return {
          id: conv.id,
          bookingId: conv.bookingId,
          bookingNumber: booking?.bookingNumber || null,
          bookingType: conv.bookingType,
          subject: conv.subject,
          customer: customer || {
            id: conv.customerId,
            name: booking?.customerName || 'Guest',
            email: booking?.customerEmail,
            phone: booking?.customerPhone,
          },
          lastMessage: conv.lastMessageText,
          lastMessageAt: conv.lastMessageAt?.toISOString(),
          lastSenderType: conv.lastSenderType,
          unreadCount: conv.vendorUnread || 0,
          createdAt: conv.createdAt.toISOString(),
        };
      })
    );

    return NextResponse.json({
      success: true,
      chats: chatsWithDetails,
    });
  } catch (error: any) {
    logger.error('Get vendor chats error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chats', details: error?.message },
      { status: 500 }
    );
  }
}
