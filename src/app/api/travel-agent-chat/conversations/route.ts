// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// POST — create or get an existing conversation between an agent and a customer.
// PUBLIC: customer can hit this with their phone (no auth) to start a chat.
// AUTH: agent calls this with travelAgentId + customer details to spin up a conv from a lead.
//
// Body:
//   { travelAgentId, customerName, customerPhone, customerEmail?, customerId?,
//     leadId?, tourId?, subject? }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      travelAgentId,
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      leadId,
      tourId,
      subject,
    } = body;

    if (!travelAgentId) {
      return NextResponse.json({ error: 'travelAgentId is required' }, { status: 400 });
    }
    if (!customerName?.trim() || !customerPhone?.trim()) {
      return NextResponse.json(
        { error: 'customerName and customerPhone are required' },
        { status: 400 },
      );
    }

    const phoneClean = String(customerPhone).replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(phoneClean)) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    // Confirm agent is in good standing — block convs to suspended/rejected/blocked
    const agent = await prisma.travel_agents.findUnique({
      where: { id: travelAgentId },
      select: { id: true, status: true },
    });
    if (!agent) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }
    if (['BLOCKED', 'SUSPENDED', 'REJECTED'].includes(agent.status)) {
      return NextResponse.json({ error: 'Agency not available' }, { status: 403 });
    }

    // Try to reuse an existing conversation between this customer + agent (same tour if specified)
    const existing = await prisma.travel_agent_chat_conversations.findFirst({
      where: {
        travelAgentId,
        customerPhone: phoneClean,
        ...(tourId ? { tourId } : {}),
      },
    });

    if (existing) {
      return NextResponse.json({ success: true, conversation: existing, isNew: false });
    }

    const conv = await prisma.travel_agent_chat_conversations.create({
      data: {
        travelAgentId,
        customerId: customerId || null,
        customerName: String(customerName).trim(),
        customerPhone: phoneClean,
        customerEmail: customerEmail || null,
        leadId: leadId || null,
        tourId: tourId || null,
        subject: subject || 'Travel Enquiry',
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({ success: true, conversation: conv, isNew: true });
  } catch (error: any) {
    logger.error('Create travel-agent chat conversation error', error);
    return NextResponse.json(
      { error: 'Failed to create conversation', details: error?.message },
      { status: 500 },
    );
  }
}

// GET — list conversations.
// AUTH: travel-agent → all their conversations.
// PUBLIC: customer → their conversations matched by ?phone=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const statusParam = searchParams.get('status') || 'ACTIVE';
    // 'ALL' means don't filter by status at all — every other value is an
    // exact match against the status column.
    const statusWhere = statusParam === 'ALL' ? {} : { status: statusParam };

    // Try agent auth first
    const auth = await getTravelAgentAuth(request);
    if (auth.authenticated && auth.travelAgentId) {
      const conversations = await prisma.travel_agent_chat_conversations.findMany({
        where: { travelAgentId: auth.travelAgentId, ...statusWhere },
        orderBy: { lastMessageAt: 'desc' },
        include: {
          travel_agent_chat_messages: {
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
      });

      const totalUnread = conversations.reduce((s, c) => s + (c.agentUnread || 0), 0);

      return NextResponse.json({
        success: true,
        conversations: conversations.map((c) => ({
          id: c.id,
          subject: c.subject,
          status: c.status,
          lastMessageAt: c.lastMessageAt,
          unreadCount: c.agentUnread,
          lastMessage: c.travel_agent_chat_messages[0] || null,
          participant: {
            name: c.customerName,
            phone: c.customerPhone,
            email: c.customerEmail,
          },
          leadId: c.leadId,
          tourId: c.tourId,
          createdAt: c.createdAt,
        })),
        totalUnread,
      });
    }

    // Fall back to customer-by-phone lookup
    if (!phone) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const phoneClean = String(phone).replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(phoneClean)) {
      return NextResponse.json({ error: 'Invalid phone' }, { status: 400 });
    }

    const conversations = await prisma.travel_agent_chat_conversations.findMany({
      where: { customerPhone: phoneClean, ...statusWhere },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        travel_agents: {
          select: { id: true, agencyName: true, logo: true, phone: true },
        },
        travel_agent_chat_messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { id: true, content: true, senderType: true, createdAt: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      conversations: conversations.map((c) => ({
        id: c.id,
        subject: c.subject,
        status: c.status,
        lastMessageAt: c.lastMessageAt,
        unreadCount: c.customerUnread,
        lastMessage: c.travel_agent_chat_messages[0] || null,
        agency: c.travel_agents,
        createdAt: c.createdAt,
      })),
    });
  } catch (error: any) {
    logger.error('List travel-agent chat conversations error', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations', details: error?.message },
      { status: 500 },
    );
  }
}
