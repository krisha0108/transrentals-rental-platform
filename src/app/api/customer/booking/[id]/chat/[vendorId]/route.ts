import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
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

    if (!bookingId || !vendorId) {
      return NextResponse.json(
        { success: false, message: 'Booking ID and Vendor ID are required' },
        { status: 400 }
      );
    }

    // Determine booking type by checking which table has this booking
    let bookingType = 'general';
    const bikeBooking = await prisma.bike_bookings.findUnique({ where: { id: bookingId } });
    if (bikeBooking) bookingType = 'bike';
    else {
      const carBooking = await prisma.car_bookings.findUnique({ where: { id: bookingId } });
      if (carBooking) bookingType = 'car';
      else {
        const chauffeurBooking = await prisma.chauffeur_bookings.findUnique({ where: { id: bookingId } });
        if (chauffeurBooking) bookingType = 'chauffeur';
      }
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

    return NextResponse.json({
      success: true,
      messages: transformedMessages,
    });
  } catch (error) {
    logger.error('Get chat messages error', error);
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

    // For guest bookings (no customerId), use a placeholder
    const effectiveCustomerId = customerId || `guest-${bookingId}`;

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
      }
    }

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
    logger.error('Send chat message error', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send message' },
      { status: 500 }
    );
  }
}
