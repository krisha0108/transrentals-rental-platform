// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import logger from '@/lib/security/logger';
import { notifyTravelAgent } from '@/lib/notifications/travel-agent-notify';

export const dynamic = 'force-dynamic';

// Helper — returns { ok, conv, isAgent } if requester can access this conversation.
// Travel agents are auth-checked via session; customers are matched by ?phone=... query.
async function authorize(
  request: NextRequest,
  conversationId: string,
): Promise<{ ok: boolean; conv?: any; isAgent?: boolean; error?: string; status?: number }> {
  const conv = await prisma.travel_agent_chat_conversations.findUnique({
    where: { id: conversationId },
  });
  if (!conv) {
    return { ok: false, error: 'Conversation not found', status: 404 };
  }

  const auth = await getTravelAgentAuth(request);
  if (auth.authenticated && auth.travelAgentId === conv.travelAgentId) {
    return { ok: true, conv, isAgent: true };
  }

  // Customer access via phone match
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone');
  if (phone) {
    const phoneClean = String(phone).replace(/\D/g, '').slice(-10);
    if (phoneClean === conv.customerPhone) {
      return { ok: true, conv, isAgent: false };
    }
  }

  return { ok: false, error: 'Access denied', status: 403 };
}

// GET — list messages + mark read for the requesting side
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const guard = await authorize(request, params.id);
    if (!guard.ok) {
      return NextResponse.json({ error: guard.error }, { status: guard.status });
    }
    const { conv, isAgent } = guard;

    const messages = await prisma.travel_agent_chat_messages.findMany({
      where: { conversationId: conv.id },
      orderBy: { createdAt: 'asc' },
    });

    // Mark all incoming messages as read on this side
    const incomingType = isAgent ? 'customer' : 'agent';
    await prisma.travel_agent_chat_messages.updateMany({
      where: { conversationId: conv.id, senderType: incomingType, readAt: null },
      data: { readAt: new Date(), status: 'READ' },
    });
    await prisma.travel_agent_chat_conversations.update({
      where: { id: conv.id },
      data: isAgent ? { agentUnread: 0 } : { customerUnread: 0 },
    });

    return NextResponse.json({
      success: true,
      conversation: {
        id: conv.id,
        subject: conv.subject,
        status: conv.status,
        customerName: conv.customerName,
        customerPhone: conv.customerPhone,
        customerEmail: conv.customerEmail,
        leadId: conv.leadId,
        tourId: conv.tourId,
        createdAt: conv.createdAt,
        travelAgentId: conv.travelAgentId,
      },
      messages,
    });
  } catch (error: any) {
    logger.error('Get travel-agent chat conversation error', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation', details: error?.message },
      { status: 500 },
    );
  }
}

// POST — send a message
// Body: { senderType: 'agent'|'customer', senderId?, senderName?, content, messageType? }
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const guard = await authorize(request, params.id);
    if (!guard.ok) {
      return NextResponse.json({ error: guard.error }, { status: guard.status });
    }
    const { conv, isAgent } = guard;

    const body = await request.json();
    const { senderType, senderId, senderName, content, messageType } = body;

    if (!content || !String(content).trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }
    if (!['agent', 'customer'].includes(senderType)) {
      return NextResponse.json({ error: 'Invalid senderType' }, { status: 400 });
    }
    // Sender side must match the authorized side — you can't impersonate the other side
    if (isAgent && senderType !== 'agent') {
      return NextResponse.json({ error: 'Cannot send as customer from agent session' }, { status: 403 });
    }
    if (!isAgent && senderType !== 'customer') {
      return NextResponse.json({ error: 'Cannot send as agent from customer session' }, { status: 403 });
    }

    const trimmed = String(content).trim();

    const message = await prisma.travel_agent_chat_messages.create({
      data: {
        conversationId: conv.id,
        senderType,
        senderId: senderId || null,
        senderName: senderName || null,
        content: trimmed,
        messageType: messageType || 'TEXT',
        status: 'SENT',
      },
    });

    // Bump unread counter on the receiving side + last-message snapshot
    await prisma.travel_agent_chat_conversations.update({
      where: { id: conv.id },
      data: {
        lastMessageAt: new Date(),
        lastMessageText: trimmed.slice(0, 500),
        lastSenderType: senderType,
        ...(senderType === 'agent'
          ? { customerUnread: { increment: 1 } }
          : { agentUnread: { increment: 1 } }),
      },
    });

    // Notify the agent when a customer messages them. Agent-side messages are
    // self-initiated, no notification needed.
    if (senderType === 'customer') {
      await notifyTravelAgent(conv.travelAgentId, {
        type: 'CHAT',
        title: `Message from ${conv.customerName || 'customer'}`,
        body: trimmed.slice(0, 140),
        link: `/travel-agent/chats/${conv.id}`,
        metadata: { conversationId: conv.id, messageId: message.id },
      });
    }

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    logger.error('Send travel-agent chat message error', error);
    return NextResponse.json(
      { error: 'Failed to send message', details: error?.message },
      { status: 500 },
    );
  }
}
