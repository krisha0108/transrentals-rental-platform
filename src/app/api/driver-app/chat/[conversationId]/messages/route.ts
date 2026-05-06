// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyDriverToken } from '@/lib/auth/driver-auth';

export const dynamic = 'force-dynamic';

// GET - Fetch messages (poll with ?since=<ISO timestamp> to get only new messages)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const payload = await verifyDriverToken(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');

    const conversation = await prisma.chat_conversations.findUnique({
      where: { id: conversationId },
      select: {
        id: true, customerId: true, driverId: true, staffDriverId: true,
        participantType: true, bookingType: true, bookingId: true,
        subject: true, status: true,
        customers: { select: { id: true, name: true, avatar: true, phone: true } },
      },
    });

    if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Verify this driver owns this conversation
    const isVendorStaff = payload.userType === 'vendor_staff';
    const driverId = payload.driverId;
    const ownerField = isVendorStaff ? 'staffDriverId' : 'driverId';
    if (conversation[ownerField] !== driverId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const where: any = { conversationId, isDeleted: false };
    if (since) {
      where.createdAt = { gt: new Date(since) };
    }

    const messages = await prisma.chat_messages.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    // Mark driver's unread messages as read and reset counter
    await Promise.all([
      prisma.chat_messages.updateMany({
        where: { conversationId, senderType: 'customer', status: { not: 'READ' } },
        data: { status: 'READ', readAt: new Date() },
      }),
      prisma.chat_conversations.update({
        where: { id: conversationId },
        data: { driverUnread: 0 },
      }),
    ]);

    return NextResponse.json({ success: true, conversation, messages });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST - Send a message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const payload = await verifyDriverToken(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { conversationId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 });
    }

    const conversation = await prisma.chat_conversations.findUnique({
      where: { id: conversationId },
      select: { id: true, customerId: true, driverId: true, staffDriverId: true, status: true },
    });

    if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (conversation.status === 'BLOCKED') {
      return NextResponse.json({ error: 'Conversation blocked' }, { status: 403 });
    }

    // Verify ownership
    const isVendorStaff = payload.userType === 'vendor_staff';
    const driverId = payload.driverId;
    const ownerField = isVendorStaff ? 'staffDriverId' : 'driverId';
    if (conversation[ownerField] !== driverId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Generate message ID (sequential MSG_ format consistent with existing messages)
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

    const message = await prisma.chat_messages.create({
      data: {
        id: msgId,
        conversationId,
        senderType: 'driver',
        senderId: driverId,
        senderName: payload.name,
        messageType: 'TEXT',
        content: content.trim(),
        status: 'SENT',
      },
    });

    // Update conversation last message + increment customer unread
    await prisma.chat_conversations.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessageText: content.substring(0, 200),
        lastSenderType: 'driver',
        customerUnread: { increment: 1 },
      },
    });

    // Send FCM push to customer (best effort)
    if (conversation.customerId) {
      try {
        const { sendNotificationToCustomer } = await import('@/lib/services/push-notification-service');
        const preview = content.length > 60 ? content.substring(0, 60) + '...' : content;
        await sendNotificationToCustomer(
          conversation.customerId,
          { title: '💬 New message from your driver', body: preview },
          { type: 'driver_chat', conversationId }
        );
      } catch {}
    }

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to send message', details: error?.message },
      { status: 500 }
    );
  }
}
