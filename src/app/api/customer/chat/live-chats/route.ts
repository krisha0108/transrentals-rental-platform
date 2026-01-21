import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

/**
 * GET - Get live chat conversations for the logged-in customer
 * Returns active chat conversations with vendors
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get('identifier');

    if (!identifier) {
      return NextResponse.json([], { status: 200 });
    }

    // Find customer by phone or email
    const customer = await prisma.customers.findFirst({
      where: {
        OR: [
          { phone: identifier },
          { email: identifier },
        ],
      },
      select: { id: true },
    });

    if (!customer) {
      return NextResponse.json([], { status: 200 });
    }

    // Get active chat conversations for this customer
    const conversations = await prisma.chat_conversations.findMany({
      where: {
        customerId: customer.id,
        status: 'ACTIVE',
      },
      include: {
        vendors: {
          select: {
            id: true,
            businessName: true,
            logo: true,
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
      take: 20,
    });

    // Transform to expected format
    const liveChats = conversations.map((conv) => ({
      vendor_id: conv.vendorId,
      vendor_name: conv.vendors?.businessName || 'Vendor',
      booking_id: conv.bookingId || conv.id,
      service_name: conv.bookingType ? formatServiceName(conv.bookingType) : 'Chat',
      last_message: conv.lastMessageText || 'No messages yet',
      unread_count: conv.customerUnread || 0,
      conversation_id: conv.id,
    }));

    return NextResponse.json(liveChats);
  } catch (error) {
    logger.error('Live chats error', error);
    return NextResponse.json([], { status: 200 });
  }
}

function formatServiceName(bookingType: string): string {
  const serviceNames: Record<string, string> = {
    bike: 'Bike Rental',
    car: 'Self-Drive Car',
    chauffeur: 'Car with Driver',
    luxury: 'Luxury Car',
    bus: 'Bus Rental',
    truck: 'Truck Rental',
    equipment: 'Equipment Rental',
    packers: 'Packers & Movers',
  };
  return serviceNames[bookingType.toLowerCase()] || 'Service';
}
