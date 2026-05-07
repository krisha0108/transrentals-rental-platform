// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyDriverToken } from '@/lib/auth/driver-auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

// GET - List all conversations for the authenticated driver
export async function GET(request: NextRequest) {
  try {
    const payload = await verifyDriverToken(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isVendorStaff = payload.userType === 'vendor_staff';
    const driverId = payload.driverId;

    const whereClause = isVendorStaff ? { staffDriverId: driverId } : { driverId };

    const conversations = await prisma.chat_conversations.findMany({
      where: whereClause,
      include: {
        customers: { select: { id: true, name: true, avatar: true, phone: true } },
        chat_messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { id: true, content: true, senderType: true, createdAt: true },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      conversations: conversations.map(conv => ({
        id: conv.id,
        bookingType: conv.bookingType,
        bookingId: conv.bookingId,
        subject: conv.subject,
        status: conv.status,
        unreadCount: conv.driverUnread,
        lastMessage: conv.chat_messages[0] || null,
        lastMessageAt: conv.lastMessageAt,
        customer: conv.customers,
        createdAt: conv.createdAt,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

// POST - Get or create a conversation for a booking
export async function POST(request: NextRequest) {
  try {
    const payload = await verifyDriverToken(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { bookingId, bookingType = 'chauffeur', customerId } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId required' }, { status: 400 });
    }

    const isVendorStaff = payload.userType === 'vendor_staff';
    const driverId = payload.driverId;
    const participantType = isVendorStaff ? 'staff_driver' : 'driver';
    const driverField = isVendorStaff ? 'staffDriverId' : 'driverId';

    // Resolve customerId if not provided — look up from the booking
    let resolvedCustomerId = customerId;
    if (!resolvedCustomerId && bookingType === 'chauffeur') {
      try {
        const booking = await prisma.chauffeur_bookings.findUnique({
          where: { id: bookingId },
          select: { customerId: true },
        });
        resolvedCustomerId = booking?.customerId || null;
      } catch {}
    }

    // Check for existing conversation
    const existing = await prisma.chat_conversations.findFirst({
      where: { [driverField]: driverId, customerId: resolvedCustomerId, bookingType, bookingId },
      include: { customers: { select: { id: true, name: true, avatar: true, phone: true } } },
    });

    if (existing) {
      return NextResponse.json({ success: true, conversation: existing, isNew: false });
    }

    // Create new conversation
    const conversation = await prisma.chat_conversations.create({
      data: {
        id: generateId(),
        customerId: resolvedCustomerId,
        [driverField]: driverId,
        participantType,
        bookingType,
        bookingId,
        subject: 'Chat with Driver',
        status: 'ACTIVE',
      },
      include: { customers: { select: { id: true, name: true, avatar: true, phone: true } } },
    });

    return NextResponse.json({ success: true, conversation, isNew: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create conversation', details: error?.message },
      { status: 500 }
    );
  }
}
