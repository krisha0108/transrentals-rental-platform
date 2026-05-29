import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';
export const dynamic = 'force-dynamic';

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

/**
 * GET - Get chat messages between customer and vendor for a booking
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; vendorId: string }> }
) {
  try {
    const { id: bookingId, vendorId } = await params;
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');

    console.log('[Customer Chat GET] Params:', { bookingId, vendorId, customerId });

    if (!bookingId || !vendorId) {
      return NextResponse.json(
        { success: false, message: 'Booking ID and Vendor ID are required' },
        { status: 400 }
      );
    }

    // Determine booking type by checking which table has this booking
    console.log('[Customer Chat GET] Checking booking type...');
    let bookingType = 'general';
    const bikeBooking = await prisma.bike_bookings.findUnique({ where: { id: bookingId } });
    if (bikeBooking) bookingType = 'bike';
    else {
      const carBooking = await prisma.car_bookings.findUnique({ where: { id: bookingId } });
      if (carBooking) bookingType = 'car';
      else {
        const chauffeurBooking = await prisma.chauffeur_bookings.findUnique({ where: { id: bookingId } });
        if (chauffeurBooking) bookingType = 'chauffeur';
        else {
          const luxuryBooking = await prisma.luxury_bookings.findUnique({ where: { id: bookingId } });
          if (luxuryBooking) bookingType = 'luxury';
          else {
            const busBooking = await prisma.bus_bookings.findUnique({ where: { id: bookingId } });
            if (busBooking) bookingType = 'bus';
            else {
              const packersBooking = await prisma.packers_bookings.findUnique({ where: { id: bookingId } });
              if (packersBooking) bookingType = 'packers';
              else {
                const truckBooking = await prisma.truck_bookings.findUnique({ where: { id: bookingId } });
                if (truckBooking) bookingType = 'truck';
                else {
                  const equipmentBooking = await prisma.equipment_bookings.findUnique({ where: { id: bookingId } });
                  if (equipmentBooking) bookingType = 'equipment';
                }
              }
            }
          }
        }
      }
    }

    console.log('[Customer Chat GET] Booking type:', bookingType);

    // For guest bookings (no customerId), use null
    const effectiveCustomerId = customerId || null;
    console.log('[Customer Chat GET] Effective customer ID:', effectiveCustomerId);
    console.log('[Customer Chat GET] Looking for conversation with:', {
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

    console.log('[Customer Chat GET] Conversation found:', conversation ? conversation.id : 'NOT FOUND - will create new');

    if (!conversation) {
      // Create conversation if it doesn't exist
      conversation = await prisma.chat_conversations.create({
        data: {
          id: generateId(),
          customerId: effectiveCustomerId,
          vendorId,
          bookingType,
          bookingId,
          subject: `${bookingType.charAt(0).toUpperCase() + bookingType.slice(1)} Booking #${bookingId}`,
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

    // Transform messages - use display ID for frontend
    const displayCustomerId = effectiveCustomerId || `guest-${bookingId}`;
    const transformedMessages = messages.map((msg) => ({
      id: msg.id,
      booking_id: bookingId,
      customer_id: displayCustomerId,
      vendor_id: vendorId,
      sender_type: msg.senderType,
      message: msg.content,
      is_read: msg.status === 'READ',
      created_at: msg.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      messages: transformedMessages,
    });
  } catch (error: any) {
    logger.error('Get chat messages error', error);
    console.error('[Customer Chat GET Error]', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch messages',
        error: error?.message,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Send a chat message from customer to vendor
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; vendorId: string }> }
) {
  try {
    const { id: bookingId, vendorId } = await params;
    const body = await request.json();
    const { message, customer_id: customerId, customer_name: customerName } = body;

    if (!bookingId || !vendorId) {
      return NextResponse.json(
        { success: false, message: 'Booking ID and Vendor ID are required' },
        { status: 400 }
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, message: 'Message content is required' },
        { status: 400 }
      );
    }

    // For guest bookings (no customerId), use null
    const effectiveCustomerId = customerId || null;

    // Determine booking type
    let bookingType = 'general';
    const bikeBooking = await prisma.bike_bookings.findUnique({ where: { id: bookingId } });
    if (bikeBooking) bookingType = 'bike';
    else {
      const carBooking = await prisma.car_bookings.findUnique({ where: { id: bookingId } });
      if (carBooking) bookingType = 'car';
      else {
        const chauffeurBooking = await prisma.chauffeur_bookings.findUnique({ where: { id: bookingId } });
        if (chauffeurBooking) bookingType = 'chauffeur';
        else {
          const luxuryBooking = await prisma.luxury_bookings.findUnique({ where: { id: bookingId } });
          if (luxuryBooking) bookingType = 'luxury';
          else {
            const busBooking = await prisma.bus_bookings.findUnique({ where: { id: bookingId } });
            if (busBooking) bookingType = 'bus';
            else {
              const packersBooking = await prisma.packers_bookings.findUnique({ where: { id: bookingId } });
              if (packersBooking) bookingType = 'packers';
              else {
                const truckBooking = await prisma.truck_bookings.findUnique({ where: { id: bookingId } });
                if (truckBooking) bookingType = 'truck';
                else {
                  const equipmentBooking = await prisma.equipment_bookings.findUnique({ where: { id: bookingId } });
                  if (equipmentBooking) bookingType = 'equipment';
                }
              }
            }
          }
        }
      }
    }

    console.log('[Customer Chat POST] Looking for conversation with:', {
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

    console.log('[Customer Chat POST] Conversation found:', conversation ? conversation.id : 'NOT FOUND - will create new');

    if (!conversation) {
      conversation = await prisma.chat_conversations.create({
        data: {
          id: generateId(),
          customerId: effectiveCustomerId,
          vendorId,
          bookingType,
          bookingId,
          subject: `${bookingType.charAt(0).toUpperCase() + bookingType.slice(1)} Booking #${bookingId}`,
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
        senderName: customerName,
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

    // Push notification + in-app entry to vendor. Multi-device, chat channel,
    // stale-token cleanup. Fire-and-forget so a slow FCM call doesn't block
    // the message-send response.
    const msgPreview = message.trim().length > 60 ? message.trim().slice(0, 60) + '…' : message.trim();
    const customerDisplayName = customerName || 'Customer';
    sendVendorDirectNotification({
      vendorId,
      title: customerDisplayName,
      body: msgPreview,
      type: 'chat',
      serviceType: bookingType,
      bookingId,
      data: { screen: 'ChatScreen' },
    }).catch((err) => {
      logger.error('Vendor chat push notification failed', { vendorId, bookingId, err });
    });

    // Use display ID for frontend
    const displayCustomerId = effectiveCustomerId || `guest-${bookingId}`;

    return NextResponse.json({
      success: true,
      id: chatMessage.id,
      booking_id: bookingId,
      customer_id: displayCustomerId,
      vendor_id: vendorId,
      sender_type: 'customer',
      message: chatMessage.content,
      is_read: false,
      created_at: chatMessage.createdAt.toISOString(),
    });
  } catch (error: any) {
    logger.error('Send chat message error', error);
    console.error('[Customer Chat POST Error]', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to send message',
        error: error?.message,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}
