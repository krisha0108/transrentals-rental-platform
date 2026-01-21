// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';

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
      ...(isVendor ? { vendorId: userId } : { customerId: userId }),
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
          messages: {
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

    return NextResponse.json({
      success: true,
      conversations: conversations.map((conv) => ({
        id: conv.id,
        bookingType: conv.bookingType,
        bookingId: conv.bookingId,
        subject: conv.subject,
        status: conv.status,
        unreadCount: isVendor ? conv.vendorUnread : conv.customerUnread,
        lastMessage: conv.messages[0] || null,
        lastMessageAt: conv.lastMessageAt,
        participant: isVendor
          ? {
              id: conv.customers?.id,
              name: conv.customers?.name || 'Customer',
              avatar: conv.customers?.avatar,
              phone: conv.customers?.phone,
            }
          : {
              id: conv.vendors.id,
              name: conv.vendors.businessName,
              logo: conv.vendors.logo,
              phone: conv.vendors.phone,
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

    // Resolve customer
    let resolvedCustomerId = customerId;
    if (!resolvedCustomerId && (customerPhone || customerEmail)) {
      const customer = await prisma.customers.findFirst({
        where: customerPhone ? { phone: customerPhone } : { email: customerEmail },
        select: { id: true },
      });
      resolvedCustomerId = customer?.id;
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
