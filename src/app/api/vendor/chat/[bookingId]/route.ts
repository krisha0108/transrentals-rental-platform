import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { sendFCMNotification } from '@/lib/utils/fcm-helper';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

/**
 * GET - Get chat messages for a booking (vendor side)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    const { bookingId } = await params;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Find the booking to get customer info and booking type
    let booking: any = null;
    let bookingType = 'general';
    let customerId: string | null = null;

    // Try CarBooking (self-drive)
    const carBooking = await prisma.car_bookings.findUnique({
      where: { id: bookingId },
      include: {
        customers: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    if (carBooking) {
      booking = carBooking;
      bookingType = 'car';
      customerId = carBooking.customerId;
    }

    // Try BikeBooking
    if (!booking) {
      const bikeBooking = await prisma.bike_bookings.findUnique({
        where: { id: bookingId },
        include: {
          customers: { select: { id: true, name: true, email: true, phone: true } },
        },
      });
      if (bikeBooking) {
        booking = bikeBooking;
        bookingType = 'bike';
        customerId = bikeBooking.customerId;
      }
    }

    // Try ChauffeurBooking
    if (!booking) {
      const chauffeurBooking = await prisma.chauffeur_bookings.findUnique({
        where: { id: bookingId },
        include: {
          customers: { select: { id: true, name: true, email: true, phone: true } },
        },
      });
      if (chauffeurBooking) {
        booking = chauffeurBooking;
        bookingType = 'chauffeur';
        customerId = chauffeurBooking.customerId;
      }
    }

    // Try LuxuryBooking
    if (!booking) {
      const luxuryBooking = await prisma.luxury_bookings.findUnique({
        where: { id: bookingId },
        include: {
          customers: { select: { id: true, name: true, email: true, phone: true } },
        },
      });
      if (luxuryBooking) {
        booking = luxuryBooking;
        bookingType = 'luxury';
        customerId = luxuryBooking.customerId;
      }
    }

    // Try BusBooking
    if (!booking) {
      const busBooking = await prisma.bus_bookings.findUnique({
        where: { id: bookingId },
        include: {
          customers: { select: { id: true, name: true, email: true, phone: true } },
        },
      });
      if (busBooking) {
        booking = busBooking;
        bookingType = 'bus';
        customerId = busBooking.customerId;
      }
    }

    // Try PackersBooking
    if (!booking) {
      const packersBooking = await prisma.packers_bookings.findUnique({
        where: { id: bookingId },
        include: {
          customers: { select: { id: true, name: true, email: true, phone: true } },
        },
      });
      if (packersBooking) {
        booking = packersBooking;
        bookingType = 'packers';
        customerId = packersBooking.customerId;
      }
    }

    // Try TruckBooking
    if (!booking) {
      const truckBooking = await prisma.truck_bookings.findUnique({
        where: { id: bookingId },
        include: {
          customers: { select: { id: true, name: true, email: true, phone: true } },
        },
      });
      if (truckBooking) {
        booking = truckBooking;
        bookingType = 'truck';
        customerId = truckBooking.customerId;
      }
    }

    // Try EquipmentBooking
    if (!booking) {
      const equipmentBooking = await prisma.equipment_bookings.findUnique({
        where: { id: bookingId },
        include: {
          customers: { select: { id: true, name: true, email: true, phone: true } },
        },
      });
      if (equipmentBooking) {
        booking = equipmentBooking;
        bookingType = 'equipment';
        customerId = equipmentBooking.customerId;
      }
    }

    // Try B2B Booking
    if (!booking) {
      const b2bBooking = await prisma.b2b_bookings.findUnique({
        where: { id: bookingId },
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
        },
      });
      if (b2bBooking) {
        booking = b2bBooking;
        bookingType = 'b2b';
        customerId = b2bBooking.customerId;
        // Map customer relation to match the expected `customers` field
        booking.customers = b2bBooking.customer;
      }
    }

    if (!booking) {
      return NextResponse.json({
        success: true,
        messages: [],
        customer: null,
      });
    }

    // For guest bookings (no customerId), use null
    const effectiveCustomerId = customerId || null;

    console.log('[Vendor Chat GET] Looking for conversation with:', {
      customerId: effectiveCustomerId,
      vendorId,
      bookingType,
      bookingId,
    });

    // Find or create conversation
    let conversation = await prisma.chat_conversations.findFirst({
      where: {
        customerId: effectiveCustomerId,
        vendorId,
        bookingType,
        bookingId,
      },
    });

    console.log('[Vendor Chat GET] Conversation found:', conversation ? conversation.id : 'NOT FOUND - will create new');

    if (!conversation) {
      // Create conversation if it doesn't exist
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

    // Mark customer messages as read
    await prisma.chat_messages.updateMany({
      where: {
        conversationId: conversation.id,
        senderType: 'customer',
        status: { not: 'READ' },
      },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });

    // Reset vendor unread count
    await prisma.chat_conversations.update({
      where: { id: conversation.id },
      data: { vendorUnread: 0 },
    });

    // Transform messages - return camelCase for mobile app, use display ID for frontend
    const displayCustomerId = effectiveCustomerId || `guest-${bookingId}`;
    const transformedMessages = messages.map((msg) => ({
      id: msg.id,
      bookingId: bookingId,
      customerId: displayCustomerId,
      vendorId: vendorId,
      senderType: msg.senderType,
      message: msg.content,
      isRead: msg.status === 'READ',
      createdAt: msg.createdAt.toISOString(),
      // Also include snake_case for backward compatibility with web
      booking_id: bookingId,
      customer_id: displayCustomerId,
      vendor_id: vendorId,
      sender_type: msg.senderType,
      is_read: msg.status === 'READ',
      created_at: msg.createdAt.toISOString(),
    }));

    // Customer info - use booking data for guest bookings
    const customer = booking.customers
      ? {
          id: booking.customers.id,
          name: booking.customers.name || booking.customerName,
          email: booking.customers.email || booking.customerEmail,
          phone: booking.customers.phone || booking.customerPhone,
          image: null,
        }
      : {
          id: displayCustomerId,
          name: booking.customerName,
          email: booking.customerEmail,
          phone: booking.customerPhone,
          image: null,
        };

    return NextResponse.json({
      success: true,
      messages: transformedMessages,
      customer,
      // Surface booking meta so the mobile ChatScreen can self-populate its
      // header (customer name, service badge, booking number) even when it
      // was opened via a notification deep-link that only carried bookingId.
      booking: {
        bookingId,
        bookingNumber: booking.bookingNumber || null,
        bookingType,
      },
      unread_count: conversation.vendorUnread || 0,
    });
  } catch (error) {
    logger.error('Get vendor chat messages error', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

/**
 * POST - Send a chat message from vendor to customer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    const { bookingId } = await params;
    const body = await request.json();
    const { message, vendor_name: vendorName } = body;

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

    // Find the booking to get customer info and booking type
    let booking: any = null;
    let bookingType = 'general';
    let customerId: string | null = null;

    // Try CarBooking (self-drive)
    const carBooking = await prisma.car_bookings.findUnique({
      where: { id: bookingId },
    });

    if (carBooking) {
      booking = carBooking;
      bookingType = 'car';
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
        customerId = bikeBooking.customerId;
      }
    }

    // Try ChauffeurBooking
    if (!booking) {
      const chauffeurBooking = await prisma.chauffeur_bookings.findUnique({
        where: { id: bookingId },
      });
      if (chauffeurBooking) {
        booking = chauffeurBooking;
        bookingType = 'chauffeur';
        customerId = chauffeurBooking.customerId;
      }
    }

    // Try LuxuryBooking
    if (!booking) {
      const luxuryBooking = await prisma.luxury_bookings.findUnique({
        where: { id: bookingId },
      });
      if (luxuryBooking) {
        booking = luxuryBooking;
        bookingType = 'luxury';
        customerId = luxuryBooking.customerId;
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
        customerId = busBooking.customerId;
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
        customerId = packersBooking.customerId;
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
        customerId = equipmentBooking.customerId;
      }
    }

    // Try B2B Booking
    if (!booking) {
      const b2bBooking = await prisma.b2b_bookings.findUnique({
        where: { id: bookingId },
      });
      if (b2bBooking) {
        booking = b2bBooking;
        bookingType = 'b2b';
        customerId = b2bBooking.customerId;
      }
    }

    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found' },
        { status: 404 }
      );
    }

    // For guest bookings (no customerId), use null
    const effectiveCustomerId = customerId || null;

    console.log('[Vendor Chat POST] Looking for conversation with:', {
      customerId: effectiveCustomerId,
      vendorId,
      bookingType,
      bookingId,
    });

    // Find or create conversation
    let conversation = await prisma.chat_conversations.findFirst({
      where: {
        customerId: effectiveCustomerId,
        vendorId,
        bookingType,
        bookingId,
      },
    });

    console.log('[Vendor Chat POST] Conversation found:', conversation ? conversation.id : 'NOT FOUND - will create new');

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
        senderType: 'vendor',
        senderId: vendorId,
        senderName: vendorName,
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
        lastSenderType: 'vendor',
        customerUnread: { increment: 1 },
      },
    });

    // Send FCM push notification to customer
    if (effectiveCustomerId) {
      try {
        const msgPreview = message.trim().length > 60 ? message.trim().substring(0, 60) + '...' : message.trim();
        await sendFCMNotification({
          customerId: effectiveCustomerId,
          title: '💬 New message from vendor',
          body: msgPreview,
          data: {
            type: 'chat',
            screen: 'BookingChat',
            bookingId,
            bookingType,
          },
        });
      } catch (notifErr) {
        console.error('[Vendor Chat] Push notification failed:', notifErr);
      }
    }

    // Use display ID for frontend
    const displayCustomerId = effectiveCustomerId || `guest-${bookingId}`;

    return NextResponse.json({
      success: true,
      id: chatMessage.id,
      bookingId: bookingId,
      customerId: displayCustomerId,
      vendorId: vendorId,
      senderType: 'vendor',
      message: chatMessage.content,
      isRead: false,
      createdAt: chatMessage.createdAt.toISOString(),
      // Also include snake_case for backward compatibility
      booking_id: bookingId,
      customer_id: displayCustomerId,
      vendor_id: vendorId,
      sender_type: 'vendor',
      is_read: false,
      created_at: chatMessage.createdAt.toISOString(),
    });
  } catch (error) {
    logger.error('Send vendor chat message error', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send message' },
      { status: 500 }
    );
  }
}
