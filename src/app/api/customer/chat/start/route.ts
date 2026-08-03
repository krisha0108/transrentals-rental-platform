import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { sanitizeInput } from '@/lib/utils/sanitize';
import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

/**
 * POST - Start or get existing conversation between customer and vendor
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { customer_id, vendor_id, booking_id, booking_type } = body;

    // ===== INPUT SANITIZATION =====
    booking_type = sanitizeInput(booking_type);

    if (!customer_id || !vendor_id) {
      return NextResponse.json(
        { success: false, message: 'Customer ID and Vendor ID are required' },
        { status: 400 }
      );
    }

    // Check if conversation already exists
    let conversation = await prisma.chat_conversations.findFirst({
      where: {
        customerId: customer_id,
        vendorId: vendor_id,
        bookingType: booking_type || 'general',
        bookingId: booking_id || null,
      },
      include: {
        vendors: {
          select: {
            id: true,
            businessName: true,
            logo: true,
            phone: true,
          },
        },
      },
    });

    // If no conversation exists, create one
    if (!conversation) {
      // Get vendor and customer info for subject
      const vendor = await prisma.vendors.findUnique({
        where: { id: vendor_id },
        select: { id: true, businessName: true, logo: true, phone: true },
      });

      if (!vendor) {
        return NextResponse.json(
          { success: false, message: 'Vendor not found' },
          { status: 404 }
        );
      }

      // Generate subject based on booking type
      const subject = booking_id
        ? `${formatBookingType(booking_type)} Booking #${booking_id}`
        : `Chat with ${vendor.businessName}`;

      conversation = await prisma.chat_conversations.create({
        data: {
          customerId: customer_id,
          vendorId: vendor_id,
          bookingType: booking_type || 'general',
          bookingId: booking_id || null,
          subject,
          status: 'ACTIVE',
        },
        include: {
          vendors: {
            select: {
              id: true,
              businessName: true,
              logo: true,
              phone: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        vendor_id: conversation.vendorId,
        vendor: conversation.vendors ? {
          id: conversation.vendors.id,
          name: conversation.vendors.businessName,
          image: conversation.vendors.logo,
          phone: conversation.vendors.phone,
        } : null,
        booking_id: conversation.bookingId,
        booking_type: conversation.bookingType,
        subject: conversation.subject,
        unread_count: conversation.customerUnread,
        last_message: conversation.lastMessageText,
        last_message_at: conversation.lastMessageAt?.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Start chat error', error);
    return NextResponse.json(
      { success: false, message: 'Failed to start conversation' },
      { status: 500 }
    );
  }
}

function formatBookingType(type?: string): string {
  if (!type) return 'General';
  const types: Record<string, string> = {
    bike: 'Bike Rental',
    car: 'Self-Drive Car',
    chauffeur: 'Car with Driver',
    luxury: 'Luxury Car',
    bus: 'Bus Rental',
    truck: 'Truck Rental',
    equipment: 'Equipment Rental',
    packers: 'Packers & Movers',
  };
  return types[type.toLowerCase()] || 'General';
}
