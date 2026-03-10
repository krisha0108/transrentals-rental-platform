// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

/**
 * GET - Get vendors + their chat conversations for a B2B booking (customer side)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId'); // optional - get messages for specific vendor
    const customerId = searchParams.get('customer_id');

    const booking = await prisma.b2b_bookings.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        bookingNumber: true,
        customerId: true,
        serviceType: true,
        vendorQuotes: {
          where: { status: 'CONFIRMED' },
          select: {
            vendor: { select: { id: true, businessName: true, ownerName: true, phone: true } },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
    }

    const effectiveCustomerId = booking.customerId || customerId || `guest-${bookingId}`;

    // If specific vendor requested → return messages for that conversation
    if (vendorId) {
      let conversation = await prisma.chat_conversations.findFirst({
        where: { customerId: effectiveCustomerId, vendorId, bookingId },
      });

      const messages = conversation
        ? await prisma.chat_messages.findMany({
            where: { conversationId: conversation.id },
            orderBy: { createdAt: 'asc' },
            take: 100,
          })
        : [];

      // Mark vendor messages as read
      if (conversation) {
        await prisma.chat_messages.updateMany({
          where: { conversationId: conversation.id, senderType: 'vendor', status: { not: 'READ' } },
          data: { status: 'READ', readAt: new Date() },
        });
        await prisma.chat_conversations.update({
          where: { id: conversation.id },
          data: { customerUnread: 0 },
        });
      }

      return NextResponse.json({
        success: true,
        messages: messages.map(m => ({
          id: m.id,
          senderType: m.senderType,
          content: m.content,
          senderName: m.senderName,
          createdAt: m.createdAt.toISOString(),
          status: m.status,
        })),
        unreadCount: conversation?.customerUnread || 0,
      });
    }

    // No specific vendor → return vendor list with unread counts
    const vendors = booking.vendorQuotes.map(q => q.vendor).filter(Boolean);

    // Get unread counts for each vendor
    const vendorList = await Promise.all(
      vendors.map(async (vendor) => {
        const conv = await prisma.chat_conversations.findFirst({
          where: { customerId: effectiveCustomerId, vendorId: vendor.id, bookingId },
          select: { customerUnread: true, lastMessageText: true, lastMessageAt: true },
        });
        return {
          id: vendor.id,
          name: vendor.businessName,
          ownerName: vendor.ownerName,
          phone: vendor.phone,
          unreadCount: conv?.customerUnread || 0,
          lastMessage: conv?.lastMessageText || null,
          lastMessageAt: conv?.lastMessageAt?.toISOString() || null,
        };
      })
    );

    return NextResponse.json({ success: true, vendors: vendorList });
  } catch (e) {
    console.error('[B2B Chat GET]', e);
    return NextResponse.json({ success: false, message: 'Failed to fetch chat' }, { status: 500 });
  }
}

/**
 * POST - Send a message from customer to a vendor for this B2B booking
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    const body = await request.json();
    const { message, vendorId, customerId, customerName } = body;

    if (!message?.trim()) {
      return NextResponse.json({ success: false, message: 'Message is required' }, { status: 400 });
    }
    if (!vendorId) {
      return NextResponse.json({ success: false, message: 'Vendor ID is required' }, { status: 400 });
    }

    const booking = await prisma.b2b_bookings.findUnique({
      where: { id: bookingId },
      select: { id: true, bookingNumber: true, customerId: true, serviceType: true },
    });

    if (!booking) {
      return NextResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
    }

    const effectiveCustomerId = booking.customerId || customerId || `guest-${bookingId}`;

    // Find or create conversation
    let conversation = await prisma.chat_conversations.findFirst({
      where: { customerId: effectiveCustomerId, vendorId, bookingId },
    });

    if (!conversation) {
      conversation = await prisma.chat_conversations.create({
        data: {
          id: generateId(),
          customerId: effectiveCustomerId,
          vendorId,
          bookingType: 'b2b',
          bookingId,
          subject: `B2B Booking #${booking.bookingNumber}`,
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
        senderName: customerName || 'Customer',
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
      message: {
        id: chatMessage.id,
        senderType: 'customer',
        content: chatMessage.content,
        senderName: chatMessage.senderName,
        createdAt: chatMessage.createdAt.toISOString(),
        status: 'SENT',
      },
    });
  } catch (e) {
    console.error('[B2B Chat POST]', e);
    return NextResponse.json({ success: false, message: 'Failed to send message' }, { status: 500 });
  }
}
