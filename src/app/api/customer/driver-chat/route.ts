// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// Identify customer from request (phone/email/customerId query param)
async function resolveCustomer(searchParams: URLSearchParams) {
  const customerId = searchParams.get('customerId');
  const phone = searchParams.get('phone');
  const email = searchParams.get('email');

  if (customerId) {
    return prisma.customers.findUnique({ where: { id: customerId }, select: { id: true, name: true } });
  }
  if (phone) {
    return prisma.customers.findFirst({ where: { phone }, select: { id: true, name: true } });
  }
  if (email) {
    return prisma.customers.findFirst({ where: { email }, select: { id: true, name: true } });
  }
  return null;
}

// GET - List driver-type conversations for a customer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customer = await resolveCustomer(searchParams);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const conversations = await prisma.chat_conversations.findMany({
      where: {
        customerId: customer.id,
        participantType: { in: ['driver', 'staff_driver'] },
      },
      include: {
        drivers: { select: { id: true, name: true, phone: true, profilePhoto: true } },
        chat_messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { id: true, content: true, senderType: true, createdAt: true },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    const totalUnread = conversations.reduce((s, c) => s + (c.customerUnread || 0), 0);

    return NextResponse.json({
      success: true,
      conversations: conversations.map(conv => ({
        id: conv.id,
        bookingType: conv.bookingType,
        bookingId: conv.bookingId,
        subject: conv.subject,
        status: conv.status,
        participantType: conv.participantType,
        unreadCount: conv.customerUnread,
        lastMessage: conv.chat_messages[0] || null,
        lastMessageAt: conv.lastMessageAt,
        driver: conv.drivers || { id: conv.driverId || conv.staffDriverId, name: 'Driver' },
        createdAt: conv.createdAt,
      })),
      totalUnread,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch driver conversations' }, { status: 500 });
  }
}
