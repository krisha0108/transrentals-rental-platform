// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

async function resolveCustomerFromBody(body: any) {
  const { customerId, phone, email } = body;
  if (customerId) return prisma.customers.findUnique({ where: { id: customerId }, select: { id: true, name: true } });
  if (phone) return prisma.customers.findFirst({ where: { phone }, select: { id: true, name: true } });
  if (email) return prisma.customers.findFirst({ where: { email }, select: { id: true, name: true } });
  return null;
}

// GET - Fetch messages for a driver conversation (customer side)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');

    const conversation = await prisma.chat_conversations.findUnique({
      where: { id: conversationId },
      select: {
        id: true, customerId: true, driverId: true, staffDriverId: true,
        participantType: true, bookingType: true, bookingId: true, subject: true, status: true,
        drivers: { select: { id: true, name: true, phone: true, profilePhoto: true } },
      },
    });

    if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!['driver', 'staff_driver'].includes(conversation.participantType)) {
      return NextResponse.json({ error: 'Not a driver conversation' }, { status: 400 });
    }

    const where: any = { conversationId, isDeleted: false };
    if (since) where.createdAt = { gt: new Date(since) };

    const messages = await prisma.chat_messages.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    // Mark customer unread as read + mark driver messages as read
    await Promise.all([
      prisma.chat_messages.updateMany({
        where: { conversationId, senderType: 'driver', status: { not: 'READ' } },
        data: { status: 'READ', readAt: new Date() },
      }),
      prisma.chat_conversations.update({
        where: { id: conversationId },
        data: { customerUnread: 0 },
      }),
    ]);

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        bookingType: conversation.bookingType,
        bookingId: conversation.bookingId,
        subject: conversation.subject,
        status: conversation.status,
        participantType: conversation.participantType,
        driver: conversation.drivers || { id: conversation.driverId || conversation.staffDriverId, name: 'Driver' },
      },
      messages,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST - Customer sends a message to driver
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const body = await request.json();
    const { content, customerId, phone, email, senderName } = body;

    if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 });

    const conversation = await prisma.chat_conversations.findUnique({
      where: { id: conversationId },
      select: {
        id: true, customerId: true, driverId: true, staffDriverId: true,
        participantType: true, status: true,
      },
    });

    if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!['driver', 'staff_driver'].includes(conversation.participantType)) {
      return NextResponse.json({ error: 'Not a driver conversation' }, { status: 400 });
    }
    if (conversation.status === 'BLOCKED') return NextResponse.json({ error: 'Blocked' }, { status: 403 });

    // Verify customer identity loosely (customerId, phone, or email must match)
    if (customerId && conversation.customerId && customerId !== conversation.customerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Generate message ID
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
        senderType: 'customer',
        senderId: conversation.customerId || customerId || undefined,
        senderName: senderName || 'Customer',
        messageType: 'TEXT',
        content: content.trim(),
        status: 'SENT',
      },
    });

    // Update conversation + increment driverUnread
    await prisma.chat_conversations.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessageText: content.substring(0, 200),
        lastSenderType: 'customer',
        driverUnread: { increment: 1 },
      },
    });

    // Send FCM push to driver (best effort)
    const driverId = conversation.driverId;
    if (driverId && conversation.participantType === 'driver') {
      try {
        const driver = await prisma.drivers.findUnique({
          where: { id: driverId },
          select: { fcmToken: true },
        });
        if (driver?.fcmToken) {
          const { sendPushNotification } = await import('@/lib/services/push-notification-service');
          const preview = content.length > 60 ? content.substring(0, 60) + '...' : content;
          await sendPushNotification(
            driver.fcmToken,
            { title: '💬 New message from customer', body: preview },
            { type: 'driver_chat', conversationId, channelId: 'driver_default' }
          );
        }
      } catch {}
    }

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to send message', details: error?.message }, { status: 500 });
  }
}
