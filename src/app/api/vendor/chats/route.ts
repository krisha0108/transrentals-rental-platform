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
              customers: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
            },
          });
          if (carBooking) {
            booking = carBooking;
            customer = carBooking.customers;
          }

          // Try BikeBooking
          if (!booking) {
            const bikeBooking = await prisma.bike_bookings.findUnique({
              where: { id: conv.bookingId },
              include: {
                customers: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
              },
            });
            if (bikeBooking) {
              booking = bikeBooking;
              customer = bikeBooking.customers;
            }
          }

          // Try ChauffeurBooking
          if (!booking) {
            const chauffeurBooking = await prisma.chauffeur_bookings.findUnique({
              where: { id: conv.bookingId },
              include: {
                customers: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
              },
            });
            if (chauffeurBooking) {
              booking = chauffeurBooking;
              customer = chauffeurBooking.customers;
            }
          }

          // Try LuxuryBooking
          if (!booking) {
            const luxuryBooking = await prisma.luxury_bookings.findUnique({
              where: { id: conv.bookingId },
              include: {
                customers: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
              },
            });
            if (luxuryBooking) {
              booking = luxuryBooking;
              customer = luxuryBooking.customers;
            }
          }

          // Try BusBooking
          if (!booking) {
            const busBooking = await prisma.bus_bookings.findUnique({
              where: { id: conv.bookingId },
              include: {
                customers: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
              },
            });
            if (busBooking) {
              booking = busBooking;
              customer = busBooking.customers;
            }
          }

          // Try PackersBooking
          if (!booking) {
            const packersBooking = await prisma.packers_bookings.findUnique({
              where: { id: conv.bookingId },
              include: {
                customers: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
              },
            });
            if (packersBooking) {
              booking = packersBooking;
              customer = packersBooking.customers;
            }
          }

          // Try TruckBooking
          if (!booking) {
            const truckBooking = await prisma.truck_bookings.findUnique({
              where: { id: conv.bookingId },
              include: {
                customers: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
              },
            });
            if (truckBooking) {
              booking = truckBooking;
              customer = truckBooking.customers;
            }
          }

          // Try B2B Booking
          if (!booking) {
            const b2bBooking = await prisma.b2b_bookings.findUnique({
              where: { id: conv.bookingId },
              include: {
                customer: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
              },
            });
            if (b2bBooking) {
              booking = { ...b2bBooking, bookingNumber: b2bBooking.bookingNumber };
              customer = b2bBooking.customer;
            }
          }

          // Try EquipmentBooking
          if (!booking) {
            const equipmentBooking = await prisma.equipment_bookings.findUnique({
              where: { id: conv.bookingId },
              include: {
                customers: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
              },
            });
            if (equipmentBooking) {
              booking = equipmentBooking;
              customer = equipmentBooking.customers;
            }
          }
        }

        // Use display ID for guest bookings
        const displayCustomerId = conv.customerId || `guest-${conv.bookingId}`;

        // Build full avatar URL if avatar is just a filename
        const buildAvatarUrl = (avatar: string | null | undefined) => {
          if (!avatar) return null;
          if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('data:')) return avatar;
          const baseUrl = request.nextUrl.origin;
          return `${baseUrl}/uploads/profile_images/${avatar}`;
        };

        return {
          id: conv.id,
          bookingId: conv.bookingId,
          bookingNumber: booking?.bookingNumber || null,
          bookingType: conv.bookingType,
          subject: conv.subject,
          customerId: displayCustomerId,
          customerName: customer?.name || booking?.customerName || 'Guest Customer',
          customerEmail: customer?.email || booking?.customerEmail,
          customerPhone: customer?.phone || booking?.customerPhone,
          customerAvatar: buildAvatarUrl(customer?.avatar),
          lastMessage: conv.lastMessageText,
          lastMessageAt: conv.lastMessageAt?.toISOString(),
          lastSenderType: conv.lastSenderType,
          unreadCount: conv.vendorUnread || 0,
          isOnline: false,
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
