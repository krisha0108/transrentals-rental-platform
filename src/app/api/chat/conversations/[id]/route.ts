// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
import { sendNotificationToCustomer } from '@/lib/services/push-notification-service';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';
export const dynamic = 'force-dynamic';

// GET - Get conversation with messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('userType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const conversation = await prisma.chat_conversations.findUnique({
      where: { id: conversationId },
      include: {
        customers: {
          select: { id: true, name: true, avatar: true, phone: true, email: true },
        },
        vendors: {
          select: { id: true, businessName: true, logo: true, phone: true, email: true },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Get messages with pagination (newest first, then reverse for display)
    const [messages, total] = await Promise.all([
      prisma.chat_messages.findMany({
        where: { conversationId, isDeleted: false },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.chat_messages.count({ where: { conversationId, isDeleted: false } }),
    ]);

    // Mark messages as read if userType is provided
    if (userType) {
      const isVendor = userType === 'vendor';
      const oppositeType = isVendor ? 'customer' : 'vendor';

      // Mark messages from the other party as read
      await prisma.chat_messages.updateMany({
        where: {
          conversationId,
          senderType: oppositeType,
          status: { not: 'READ' },
        },
        data: {
          status: 'READ',
          readAt: new Date(),
        },
      });

      // Reset unread count
      await prisma.chat_conversations.update({
        where: { id: conversationId },
        data: isVendor ? { vendorUnread: 0 } : { customerUnread: 0 },
      });
    }

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        bookingType: conversation.bookingType,
        bookingId: conversation.bookingId,
        quoteId: conversation.quoteId,
        subject: conversation.subject,
        status: conversation.status,
        customer: conversation.customers,
        vendor: conversation.vendors,
        createdAt: conversation.createdAt,
      },
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    logger.error('Failed to fetch conversation', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Send a message to the conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const body = await request.json();
    const {
      senderType,
      senderId,
      senderName,
      content,
      messageType = 'TEXT',
      attachmentUrl,
      attachmentName,
      attachmentSize,
      attachmentType,
      latitude,
      longitude,
      locationName,
      quickReplyId,
      metadata,
    } = body;

    if (!senderType || !content) {
      return NextResponse.json(
        { error: 'Sender type and content are required' },
        { status: 400 }
      );
    }

    // Verify conversation exists. We pull the customer name too so the push
    // notification shows the real sender instead of a generic "Customer".
    const conversation = await prisma.chat_conversations.findUnique({
      where: { id: conversationId },
      select: {
        id: true, vendorId: true, customerId: true, status: true,
        bookingId: true, bookingType: true,
        customers: { select: { name: true } },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conversation.status === 'BLOCKED') {
      return NextResponse.json({ error: 'This conversation is blocked' }, { status: 403 });
    }

    // Generate next message ID
    const lastMsg = await prisma.chat_messages.findFirst({
      where: { id: { startsWith: 'MSG_' } },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    let nextMsgNum = 1;
    if (lastMsg) {
      const num = parseInt(lastMsg.id.replace('MSG_', ''));
      if (!isNaN(num)) nextMsgNum = num + 1;
    }
    const msgId = `MSG_${nextMsgNum}`;

    // Create the message
    const message = await prisma.chat_messages.create({
      data: {
        id: msgId,
        conversationId,
        senderType,
        senderId: senderId || undefined,
        senderName: senderName || undefined,
        messageType,
        content,
        attachmentUrl: attachmentUrl || undefined,
        attachmentName: attachmentName || undefined,
        attachmentSize: attachmentSize || undefined,
        attachmentType: attachmentType || undefined,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        locationName: locationName || undefined,
        quickReplyId: quickReplyId || undefined,
        metadata: metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : undefined,
        status: 'SENT',
      },
    });

    // Update conversation's last message info and increment unread count
    const isFromVendor = senderType === 'vendor';
    await prisma.chat_conversations.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessageText: content.substring(0, 200),
        lastSenderType: senderType,
        ...(isFromVendor
          ? { customerUnread: { increment: 1 } }
          : { vendorUnread: { increment: 1 } }),
      },
    });

    // Send FCM push notification for new message.
    const msgPreview = content.length > 60 ? content.substring(0, 60) + '…' : content;
    if (isFromVendor && conversation.customerId) {
      // Vendor sent → notify customer (legacy single-token call).
      sendNotificationToCustomer(
        conversation.customerId,
        { title: '💬 New message from vendor', body: msgPreview },
        { type: 'chat', screen: 'Chat', conversationId },
      ).catch((err) => logger.error('Customer chat push failed', { customerId: conversation.customerId, err }));
    } else if (!isFromVendor && conversation.vendorId) {
      // Customer sent → notify vendor. Uses multi-device tokens, chat_channel
      // sound, and auto-cleans stale FCM tokens. bookingId is included so the
      // vendor app's deep-link handler can open the ChatScreen (App.js
      // expects `bookingId`, not `conversationId`). Also saved to the
      // in-app NotificationsScreen so the vendor sees a record even if the
      // OS-level banner is suppressed.
      const displayName = senderName || conversation.customers?.name || 'Customer';
      sendVendorDirectNotification({
        vendorId: conversation.vendorId,
        title: displayName,
        body: msgPreview,
        type: 'chat',
        serviceType: conversation.bookingType || 'general',
        bookingId: conversation.bookingId || undefined,
        data: { screen: 'ChatScreen', conversationId },
      }).catch((err) => logger.error('Vendor chat push failed', { vendorId: conversation.vendorId, conversationId, err }));
    }

    // Update quick reply usage if applicable
    if (quickReplyId) {
      await prisma.chat_quick_replies.update({
        where: { id: quickReplyId },
        data: { usageCount: { increment: 1 } },
      }).catch(() => {}); // Ignore if quick reply not found
    }

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error: any) {
    logger.error('Failed to send message', error);
    return NextResponse.json(
      { error: 'Failed to send message', details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH - Update conversation (archive, block, etc.) or mark messages as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const body = await request.json();
    const { action, userType } = body;

    const conversation = await prisma.chat_conversations.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (action === 'mark_read') {
      const isVendor = userType === 'vendor';
      const oppositeType = isVendor ? 'customer' : 'vendor';

      // Mark messages as read
      await prisma.chat_messages.updateMany({
        where: {
          conversationId,
          senderType: oppositeType,
          status: { not: 'READ' },
        },
        data: {
          status: 'READ',
          readAt: new Date(),
        },
      });

      // Reset unread count
      await prisma.chat_conversations.update({
        where: { id: conversationId },
        data: isVendor ? { vendorUnread: 0 } : { customerUnread: 0 },
      });

      return NextResponse.json({ success: true, message: 'Messages marked as read' });
    }

    if (action === 'archive') {
      await prisma.chat_conversations.update({
        where: { id: conversationId },
        data: { status: 'ARCHIVED' },
      });
      return NextResponse.json({ success: true, message: 'Conversation archived' });
    }

    if (action === 'unarchive') {
      await prisma.chat_conversations.update({
        where: { id: conversationId },
        data: { status: 'ACTIVE' },
      });
      return NextResponse.json({ success: true, message: 'Conversation unarchived' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    logger.error('Failed to update conversation', error);
    return NextResponse.json(
      { error: 'Failed to update conversation', details: error?.message },
      { status: 500 }
    );
  }
}
