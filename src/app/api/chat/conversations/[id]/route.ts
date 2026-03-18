// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

import logger from '@/lib/security/logger';
import { sendPushNotification, sendNotificationToCustomer } from '@/lib/services/push-notification-service';
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

    // Verify conversation exists
    const conversation = await prisma.chat_conversations.findUnique({
      where: { id: conversationId },
      select: { id: true, vendorId: true, customerId: true, status: true, bookingId: true },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conversation.status === 'BLOCKED') {
      return NextResponse.json({ error: 'This conversation is blocked' }, { status: 403 });
    }

    // Create the message
    const message = await prisma.chat_messages.create({
      data: {
        id: generateId(),
        conversationId,
        senderType,
        senderId,
        senderName,
        messageType,
        content,
        attachmentUrl,
        attachmentName,
        attachmentSize,
        attachmentType,
        latitude,
        longitude,
        locationName,
        quickReplyId,
        metadata,
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

    // Send notifications (FCM push + in-app) for new message
    try {
      const msgPreview = content.length > 60 ? content.substring(0, 60) + '...' : content;
      if (isFromVendor && conversation.customerId) {
        // Vendor sent → notify customer (FCM + in-app DB notification)
        await sendNotificationToCustomer(
          conversation.customerId,
          { title: '💬 New message from vendor', body: msgPreview },
          { type: 'chat', screen: 'BookingChat', conversationId, bookingId: conversation.bookingId || '', bookingType: conversation.bookingType || '' }
        );
        // Save in-app notification for customer
        try {
          await prisma.notifications.create({
            data: {
              customerId: conversation.customerId,
              title: '💬 New message from vendor',
              body: msgPreview,
              type: 'chat',
              serviceType: 'wander',
              bookingId: conversation.bookingId || null,
            },
          });
        } catch {}
      } else if (!isFromVendor && conversation.vendorId) {
        // Customer sent → notify vendor (FCM push + in-app settings notification)
        await sendVendorDirectNotification({
          vendorId: conversation.vendorId,
          title: '💬 New message from customer',
          body: msgPreview,
          type: 'new_message',
          serviceType: conversation.bookingType || 'wander',
          bookingId: conversation.bookingId || undefined,
          data: { screen: 'ChatDetail', conversationId, bookingId: conversation.bookingId || '' },
        });
      }
    } catch (notifErr) {
      console.error('[Chat] Push notification failed:', notifErr);
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
