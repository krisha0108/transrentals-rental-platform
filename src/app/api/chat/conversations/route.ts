// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - List conversations for the authenticated user (vendor or customer)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('userType'); // 'vendor' or 'customer'
    const status = searchParams.get('status') || 'ACTIVE';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    let userId: string | null = null;
    let isVendor = false;

    // Check if vendor
    if (userType === 'vendor' && session?.user?.email) {
      const vendor = await prisma.vendors.findFirst({
        where: { email: session.user.email },
        select: { id: true, businessName: true },
      });
      if (vendor) {
        userId = vendor.id;
        isVendor = true;
      }
    }

    // Check if customer (via phone from query or session)
    if (!userId && userType === 'customer') {
      const phone = searchParams.get('phone');
      const email = searchParams.get('email');

      if (phone || email) {
        const customer = await prisma.customers.findFirst({
          where: phone ? { phone } : { email: email! },
          select: { id: true, name: true },
        });
        if (customer) {
          userId = customer.id;
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const whereClause: any = {
      status,
      ...(isVendor
        ? { vendorId: userId }
        : { customerId: userId, participantType: 'vendor' }),
    };

    const [conversations, total] = await Promise.all([
      prisma.chat_conversations.findMany({
        where: whereClause,
        include: {
          customers: {
            select: { id: true, name: true, avatar: true, phone: true },
          },
          vendors: {
            select: { id: true, businessName: true, logo: true, phone: true },
          },
          chat_messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              content: true,
              senderType: true,
              messageType: true,
              createdAt: true,
            },
          },
        },
        orderBy: { lastMessageAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.chat_conversations.count({ where: whereClause }),
    ]);

    // Calculate total unread for badge
    const totalUnread = conversations.reduce(
      (sum, conv) => sum + (isVendor ? conv.vendorUnread : conv.customerUnread),
      0
    );

    // Resolve bookingNumber for each conversation
    const bookingNumberMap = new Map<string, string | null>();
    await Promise.all(
      conversations
        .filter((c) => c.bookingId)
        .map(async (c) => {
          if (bookingNumberMap.has(c.bookingId!)) return;
          let bookingNumber: string | null = null;
          const id = c.bookingId!;
          const type = (c.bookingType || '').toLowerCase();
          try {
            if (type === 'bike') {
              const r = await prisma.bike_bookings.findUnique({ where: { id }, select: { bookingNumber: true } });
              bookingNumber = r?.bookingNumber || null;
            } else if (type === 'car') {
              const r = await prisma.car_bookings.findUnique({ where: { id }, select: { bookingNumber: true } });
              bookingNumber = r?.bookingNumber || null;
            } else if (type === 'chauffeur') {
              const r = await prisma.chauffeur_bookings.findUnique({ where: { id }, select: { bookingNumber: true } });
              bookingNumber = r?.bookingNumber || null;
            } else if (type === 'luxury') {
              const r = await prisma.luxury_bookings.findUnique({ where: { id }, select: { bookingNumber: true } });
              bookingNumber = r?.bookingNumber || null;
            } else if (type === 'bus') {
              const r = await prisma.bus_bookings.findUnique({ where: { id }, select: { bookingNumber: true } });
              bookingNumber = r?.bookingNumber || null;
            } else if (type === 'truck') {
              const r = await prisma.truck_bookings.findUnique({ where: { id }, select: { bookingNumber: true } });
              bookingNumber = r?.bookingNumber || null;
            } else if (type === 'packers') {
              const r = await prisma.packers_bookings.findUnique({ where: { id }, select: { bookingNumber: true } });
              bookingNumber = r?.bookingNumber || null;
            } else if (type === 'equipment') {
              const r = await prisma.equipment_bookings.findUnique({ where: { id }, select: { bookingNumber: true } });
              bookingNumber = r?.bookingNumber || null;
            } else if (type === 'b2b') {
              const r = await prisma.b2b_bookings.findUnique({ where: { id }, select: { bookingNumber: true } });
              bookingNumber = r?.bookingNumber || null;
            }
          } catch (_) {}
          bookingNumberMap.set(id, bookingNumber);
        })
    );

    return NextResponse.json({
      success: true,
      conversations: conversations.map((conv) => ({
        id: conv.id,
        bookingType: conv.bookingType,
        bookingId: conv.bookingId,
        bookingNumber: conv.bookingId ? (bookingNumberMap.get(conv.bookingId) || null) : null,
        subject: conv.subject,
        status: conv.status,
        unreadCount: isVendor ? conv.vendorUnread : conv.customerUnread,
        lastMessage: conv.chat_messages[0] || null,
        lastMessageAt: conv.lastMessageAt,
        participant: isVendor
          ? {
              id: conv.customers?.id,
              name: conv.customers?.name || 'Customer',
              avatar: conv.customers?.avatar,
              phone: conv.customers?.phone,
            }
          : {
              id: conv.vendors?.id,
              name: conv.vendors?.businessName || 'Vendor',
              logo: conv.vendors?.logo,
              phone: conv.vendors?.phone,
            },
        createdAt: conv.createdAt,
      })),
      totalUnread,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    logger.error('Failed to fetch conversations', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Create or get existing conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      vendorId,
      customerId,
      customerPhone,
      customerEmail,
      bookingType,
      bookingId,
      quoteId,
      subject,
    } = body;

    if (!vendorId || !bookingType) {
      return NextResponse.json(
        { error: 'Vendor ID and booking type are required' },
        { status: 400 }
      );
    }

    // Validate the vendor row exists — chat_conversations.vendorId has a
    // hard FK to vendors.id, and silently failing here surfaces as a 500.
    // Travel-agent IDs / stale IDs get caught with a clear message instead.
    const vendorRow = await prisma.vendors.findUnique({
      where: { id: vendorId },
      select: { id: true },
    });
    if (!vendorRow) {
      return NextResponse.json(
        { error: 'Vendor not found', details: `No vendor with id ${vendorId}` },
        { status: 404 }
      );
    }

    // Resolve customer
    let resolvedCustomerId = customerId;
    if (!resolvedCustomerId && (customerPhone || customerEmail)) {
      const customer = await prisma.customers.findFirst({
        where: customerPhone ? { phone: customerPhone } : { email: customerEmail },
        select: { id: true },
      });
      resolvedCustomerId = customer?.id;
    }

    // Same guard for customerId — FK to customers.id.
    if (resolvedCustomerId) {
      const customerRow = await prisma.customers.findUnique({
        where: { id: resolvedCustomerId },
        select: { id: true },
      });
      if (!customerRow) {
        return NextResponse.json(
          { error: 'Customer not found', details: `No customer with id ${resolvedCustomerId}` },
          { status: 404 }
        );
      }
    }

    // Check for existing conversation
    const existingConversation = await prisma.chat_conversations.findFirst({
      where: {
        vendorId,
        customerId: resolvedCustomerId,
        bookingType,
        bookingId: bookingId || null,
      },
      include: {
        customers: {
          select: { id: true, name: true, avatar: true, phone: true },
        },
        vendors: {
          select: { id: true, businessName: true, logo: true, phone: true },
        },
      },
    });

    if (existingConversation) {
      return NextResponse.json({
        success: true,
        conversation: existingConversation,
        isNew: false,
      });
    }

    // Create new conversation
    const conversation = await prisma.chat_conversations.create({
      data: {
        id: generateId(),
        vendorId,
        customerId: resolvedCustomerId,
        bookingType,
        bookingId: bookingId || null,
        quoteId: quoteId || null,
        subject: subject || `${bookingType} Inquiry`,
        status: 'ACTIVE',
      },
      include: {
        customers: {
          select: { id: true, name: true, avatar: true, phone: true },
        },
        vendors: {
          select: { id: true, businessName: true, logo: true, phone: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      conversation,
      isNew: true,
    });
  } catch (error: any) {
    logger.error('Failed to create conversation', error);
    return NextResponse.json(
      { error: 'Failed to create conversation', details: error?.message },
      { status: 500 }
    );
  }
}
