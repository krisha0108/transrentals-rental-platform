import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { sanitizeInput } from '@/lib/utils/sanitize';
import { smartRateLimit, getClientIdentifier } from '@/lib/utils/smart-rate-limit';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';
import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

/**
 * GET - Get messages for a chat conversation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // For pagination

    // Verify conversation exists
    const conversation = await prisma.chat_conversations.findUnique({
      where: { id: conversationId },
      include: {
        vendors: {
          select: {
            id: true,
            businessName: true,
            logo: true,
            phone: true,
          },
        },
        customers: {
          select: {
            id: true,
            name: true,
            avatar: true,
            phone: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, message: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Get messages
    const whereClause: any = { conversationId };
    if (before) {
      whereClause.createdAt = { lt: new Date(before) };
    }

    const messages = await prisma.chat_messages.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Mark customer's unread messages as read
    await prisma.chat_messages.updateMany({
      where: {
        conversationId,
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
      where: { id: conversationId },
      data: { customerUnread: 0 },
    });

    // Transform messages
    const transformedMessages = messages.reverse().map((msg) => ({
      id: msg.id,
      conversation_id: msg.conversationId,
      sender_type: msg.senderType,
      sender_id: msg.senderId,
      sender_name: msg.senderName,
      message: msg.content,
      message_type: msg.messageType.toLowerCase(),
      attachment_url: msg.attachmentUrl,
      is_read: msg.status === 'READ',
      created_at: msg.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        vendor: conversation.vendors ? {
          id: conversation.vendors.id,
          name: conversation.vendors.businessName,
          image: conversation.vendors.logo,
          phone: conversation.vendors.phone,
        } : null,
        customer: conversation.customers ? {
          id: conversation.customers.id,
          name: conversation.customers.name,
          image: conversation.customers.avatar,
          phone: conversation.customers.phone,
        } : null,
        booking_id: conversation.bookingId,
        booking_type: conversation.bookingType,
      },
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
 * POST - Send a message in a conversation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    // ===== RATE LIMITING =====
    const clientId = getClientIdentifier(request);
    const rateLimitCheck = await smartRateLimit(clientId, true, {});
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: rateLimitCheck.error,
          requiresCaptcha: rateLimitCheck.requiresCaptcha,
          type: 'rate_limit',
        },
        { status: 429 }
      );
    }

    const { conversationId } = await params;
    const body = await request.json();
    let { message, sender_type = 'customer', sender_id, sender_name } = body;

    // ===== INPUT SANITIZATION (XSS Protection) =====
    message = sanitizeInput(message);
    sender_name = sanitizeInput(sender_name);

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, message: 'Message content is required' },
        { status: 400 }
      );
    }

    // Verify conversation exists
    const conversation = await prisma.chat_conversations.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, message: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Create message
    const chatMessage = await prisma.chat_messages.create({
      data: {
        conversationId,
        senderType: sender_type,
        senderId: sender_id,
        senderName: sender_name,
        messageType: 'TEXT',
        content: message.trim(),
        status: 'SENT',
      },
    });

    // Update conversation
    const updateData: any = {
      lastMessageAt: new Date(),
      lastMessageText: message.trim().substring(0, 100),
      lastSenderType: sender_type,
    };

    // Increment unread count for the other party
    if (sender_type === 'customer') {
      updateData.vendorUnread = { increment: 1 };
    } else {
      updateData.customerUnread = { increment: 1 };
    }

    await prisma.chat_conversations.update({
      where: { id: conversationId },
      data: updateData,
    });

    // Notify the recipient. For now only the customer→vendor direction is
    // pushed (vendor app uses the chat_channel + multi-device tokens) and
    // also saved to the vendor's in-app NotificationsScreen list.
    if (sender_type === 'customer' && conversation.vendorId) {
      const msgPreview = message.trim().length > 60 ? message.trim().slice(0, 60) + '…' : message.trim();
      sendVendorDirectNotification({
        vendorId: conversation.vendorId,
        title: sender_name || 'Customer',
        body: msgPreview,
        type: 'chat',
        serviceType: conversation.bookingType || 'general',
        bookingId: conversation.bookingId || undefined,
        data: { screen: 'ChatScreen' },
      }).catch((err) => {
        logger.error('Vendor chat push notification failed', { vendorId: conversation.vendorId, conversationId, err });
      });
    }

    return NextResponse.json({
      success: true,
      message: {
        id: chatMessage.id,
        conversation_id: chatMessage.conversationId,
        sender_type: chatMessage.senderType,
        sender_id: chatMessage.senderId,
        sender_name: chatMessage.senderName,
        message: chatMessage.content,
        message_type: chatMessage.messageType.toLowerCase(),
        is_read: false,
        created_at: chatMessage.createdAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Send chat message error', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send message' },
      { status: 500 }
    );
  }
}
