import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import logger from '@/lib/security/logger';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

/**
 * GET - Get chat messages for a booking (customer side)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Find the booking to get vendor info
    let booking: any = null;
    let bookingType = 'general';
    let vendorId: string | null = null;
    let customerId: string | null = null;

    // Try CarBooking (self-drive)
    const carBooking = await prisma.car_bookings.findUnique({
      where: { id: bookingId },
      include: {
        vendors_car_bookings_acceptedVendorIdTovendors: { select: { id: true, businessName: true, phone: true } },
        vendors_car_bookings_assignedVendorIdTovendors: { select: { id: true, businessName: true, phone: true } },
      },
    });

    if (carBooking) {
      booking = carBooking;
      bookingType = 'car';
      vendorId = carBooking.acceptedVendorId || carBooking.assignedVendorId;
      customerId = carBooking.customerId;
      booking.acceptedVendor = carBooking.vendors_car_bookings_acceptedVendorIdTovendors;
      booking.assignedVendor = carBooking.vendors_car_bookings_assignedVendorIdTovendors;
    }

    // Try BikeBooking
    if (!booking) {
      const bikeBooking = await prisma.bike_bookings.findUnique({
        where: { id: bookingId },
        include: {
          vendors_bike_bookings_acceptedVendorIdTovendors: { select: { id: true, businessName: true, phone: true } },
          vendors_bike_bookings_assignedVendorIdTovendors: { select: { id: true, businessName: true, phone: true } },
        },
      });
      if (bikeBooking) {
        booking = bikeBooking;
        bookingType = 'bike';
        vendorId = bikeBooking.acceptedVendorId || bikeBooking.assignedVendorId;
        customerId = bikeBooking.customerId;
        booking.acceptedVendor = bikeBooking.vendors_bike_bookings_acceptedVendorIdTovendors;
        booking.assignedVendor = bikeBooking.vendors_bike_bookings_assignedVendorIdTovendors;
      }
    }

    // Try BusBooking
    if (!booking) {
      const busBooking = await prisma.bus_bookings.findUnique({
        where: { id: bookingId },
        include: {
          vendors: { select: { id: true, businessName: true, phone: true } },
        },
      });
      if (busBooking) {
        booking = busBooking;
        bookingType = 'bus';
        vendorId = busBooking.vendorId;
        customerId = busBooking.customerId;
        booking.acceptedVendor = busBooking.vendors;
      }
    }

    // Try TruckBooking
    if (!booking) {
      const truckBooking = await prisma.truck_bookings.findUnique({
        where: { id: bookingId },
        include: {
          vendors: { select: { id: true, businessName: true, phone: true } },
        },
      });
      if (truckBooking) {
        booking = truckBooking;
        bookingType = 'truck';
        vendorId = truckBooking.vendorId;
        customerId = truckBooking.customerId;
        booking.acceptedVendor = truckBooking.vendors;
      }
    }

    // Try EquipmentBooking
    if (!booking) {
      const equipmentBooking = await prisma.equipment_bookings.findUnique({
        where: { id: bookingId },
        include: {
          vendors: { select: { id: true, businessName: true, phone: true } },
        },
      });
      if (equipmentBooking) {
        booking = equipmentBooking;
        bookingType = 'equipment';
        vendorId = equipmentBooking.vendorId;
        customerId = equipmentBooking.customerId;
        booking.acceptedVendor = equipmentBooking.vendors;
      }
    }

    // Try PackersBooking
    if (!booking) {
      const packersBooking = await prisma.packers_bookings.findUnique({
        where: { id: bookingId },
        include: {
          vendors: { select: { id: true, businessName: true, phone: true } },
        },
      });
      if (packersBooking) {
        booking = packersBooking;
        bookingType = 'packers';
        vendorId = packersBooking.vendorId;
        customerId = packersBooking.customerId;
        booking.acceptedVendor = packersBooking.vendors;
      }
    }

    // Try B2B Booking
    if (!booking) {
      const b2bBooking = await prisma.b2b_bookings.findUnique({
        where: { id: bookingId },
        include: {
          trips: {
            where: { status: { not: 'CANCELLED' } },
            include: { vendor: { select: { id: true, businessName: true, phone: true } } },
            orderBy: { createdAt: 'asc' },
            take: 1,
          },
          vendorQuotes: {
            where: { status: { in: ['CONFIRMED', 'SUBMITTED'] } },
            include: { vendor: { select: { id: true, businessName: true, phone: true } } },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });
      if (b2bBooking) {
        booking = b2bBooking;
        bookingType = 'b2b';
        customerId = b2bBooking.customerId;
        // Vendor from trips first, then from quotes
        const tripVendor = b2bBooking.trips?.[0]?.vendor;
        const quoteVendor = b2bBooking.vendorQuotes?.[0]?.vendor;
        const resolvedVendor = tripVendor || quoteVendor;
        vendorId = resolvedVendor?.id || null;
        booking.acceptedVendor = resolvedVendor || null;
      }
    }

    if (!booking) {
      return NextResponse.json({
        success: true,
        messages: [],
        vendor: null,
      });
    }

    if (!vendorId) {
      return NextResponse.json({
        success: true,
        messages: [],
        vendor: null,
        message: 'No vendor assigned yet',
      });
    }

    // For guest bookings (no customerId), use a placeholder
    const effectiveCustomerId = customerId || `guest-${bookingId}`;

    // Find conversation
    const conversation = await prisma.chat_conversations.findFirst({
      where: {
        customerId: effectiveCustomerId,
        vendorId,
        bookingId,
      },
    });

    if (!conversation) {
      // Return empty if no conversation exists
      const vendor = booking.acceptedVendor || booking.assignedVendor;
      return NextResponse.json({
        success: true,
        messages: [],
        vendor: vendor ? {
          id: vendor.id,
          name: vendor.businessName,
          phone: vendor.phone,
        } : null,
      });
    }

    // Get messages
    const messages = await prisma.chat_messages.findMany({
      where: {
        conversationId: conversation.id,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 100,
    });

    // Mark vendor messages as read
    await prisma.chat_messages.updateMany({
      where: {
        conversationId: conversation.id,
        senderType: 'vendor',
        status: { not: 'READ' },
      },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });

    // Reset customer unread count
    await prisma.chat_conversations.update({
      where: { id: conversation.id },
      data: { customerUnread: 0 },
    });

    // Transform messages
    const transformedMessages = messages.map((msg) => ({
      id: msg.id,
      booking_id: bookingId,
      customer_id: effectiveCustomerId,
      vendor_id: vendorId,
      sender_type: msg.senderType,
      message: msg.content,
      is_read: msg.status === 'READ',
      created_at: msg.createdAt.toISOString(),
    }));

    // Vendor info
    const vendor = booking.acceptedVendor || booking.assignedVendor;

    return NextResponse.json({
      success: true,
      messages: transformedMessages,
      vendor: vendor ? {
        id: vendor.id,
        name: vendor.businessName,
        phone: vendor.phone,
      } : null,
      unread_count: conversation.customerUnread || 0,
    });
  } catch (error) {
    logger.error('Get customer chat messages error', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

/**
 * POST - Send a chat message from customer to vendor
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const body = await request.json();
    const { message, customer_name: customerName } = body;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: 'Booking ID is required' },
        { status: 400 }
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, message: 'Message content is required' },
        { status: 400 }
      );
    }

    // Find the booking to get vendor info
    let booking: any = null;
    let bookingType = 'general';
    let vendorId: string | null = null;
    let customerId: string | null = null;

    // Try CarBooking (self-drive)
    const carBooking = await prisma.car_bookings.findUnique({
      where: { id: bookingId },
    });

    if (carBooking) {
      booking = carBooking;
      bookingType = 'car';
      vendorId = carBooking.acceptedVendorId || carBooking.assignedVendorId;
      customerId = carBooking.customerId;
    }

    // Try BikeBooking
    if (!booking) {
      const bikeBooking = await prisma.bike_bookings.findUnique({
        where: { id: bookingId },
      });
      if (bikeBooking) {
        booking = bikeBooking;
        bookingType = 'bike';
        vendorId = bikeBooking.acceptedVendorId || bikeBooking.assignedVendorId;
        customerId = bikeBooking.customerId;
      }
    }

    // Try BusBooking
    if (!booking) {
      const busBooking = await prisma.bus_bookings.findUnique({
        where: { id: bookingId },
      });
      if (busBooking) {
        booking = busBooking;
        bookingType = 'bus';
        vendorId = busBooking.vendorId;
        customerId = busBooking.customerId;
      }
    }

    // Try TruckBooking
    if (!booking) {
      const truckBooking = await prisma.truck_bookings.findUnique({
        where: { id: bookingId },
      });
      if (truckBooking) {
        booking = truckBooking;
        bookingType = 'truck';
        vendorId = truckBooking.vendorId;
        customerId = truckBooking.customerId;
      }
    }

    // Try EquipmentBooking
    if (!booking) {
      const equipmentBooking = await prisma.equipment_bookings.findUnique({
        where: { id: bookingId },
      });
      if (equipmentBooking) {
        booking = equipmentBooking;
        bookingType = 'equipment';
        vendorId = equipmentBooking.vendorId;
        customerId = equipmentBooking.customerId;
      }
    }

    // Try PackersBooking
    if (!booking) {
      const packersBooking = await prisma.packers_bookings.findUnique({
        where: { id: bookingId },
      });
      if (packersBooking) {
        booking = packersBooking;
        bookingType = 'packers';
        vendorId = packersBooking.vendorId;
        customerId = packersBooking.customerId;
      }
    }

    // Try B2B Booking
    if (!booking) {
      const b2bBooking = await prisma.b2b_bookings.findUnique({
        where: { id: bookingId },
        include: {
          trips: {
            where: { status: { not: 'CANCELLED' } },
            select: { vendorId: true },
            orderBy: { createdAt: 'asc' },
            take: 1,
          },
          vendorQuotes: {
            where: { status: { in: ['CONFIRMED', 'SUBMITTED'] } },
            select: { vendorId: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });
      if (b2bBooking) {
        booking = b2bBooking;
        bookingType = 'b2b';
        customerId = b2bBooking.customerId;
        vendorId = b2bBooking.trips?.[0]?.vendorId || b2bBooking.vendorQuotes?.[0]?.vendorId || null;
      }
    }

    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found' },
        { status: 404 }
      );
    }

    if (!vendorId) {
      return NextResponse.json(
        { success: false, message: 'No vendor assigned to this booking yet' },
        { status: 400 }
      );
    }

    // For guest bookings (no customerId), use a placeholder
    const effectiveCustomerId = customerId || `guest-${bookingId}`;

    // Find or create conversation
    let conversation = await prisma.chat_conversations.findFirst({
      where: {
        customerId: effectiveCustomerId,
        vendorId,
        bookingId,
      },
    });

    if (!conversation) {
      conversation = await prisma.chat_conversations.create({
        data: {
          id: generateId(),
          customerId: effectiveCustomerId,
          vendorId,
          bookingType,
          bookingId,
          subject: `${bookingType.charAt(0).toUpperCase() + bookingType.slice(1)} Booking #${booking.bookingNumber || bookingId}`,
          status: 'ACTIVE',
        },
      });
    }

    // Create message
    const chatMessage = await prisma.chat_messages.create({
      data: {
        id: generateId(),
        conversationId: conversation.id,
        senderType: 'customer',
        senderId: effectiveCustomerId,
        senderName: customerName || booking.customerName || 'Customer',
        messageType: 'TEXT',
        content: message.trim(),
        status: 'SENT',
      },
    });

    // Update conversation
    await prisma.chat_conversations.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        lastMessageText: message.trim().substring(0, 100),
        lastSenderType: 'customer',
        vendorUnread: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      id: chatMessage.id,
      booking_id: bookingId,
      customer_id: effectiveCustomerId,
      vendor_id: vendorId,
      sender_type: 'customer',
      message: chatMessage.content,
      is_read: false,
      created_at: chatMessage.createdAt.toISOString(),
    });
  } catch (error) {
    logger.error('Send customer chat message error', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send message' },
      { status: 500 }
    );
  }
}
