import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> | { id: string } };

async function resolveConversation(conversationId: string, vendorId: string) {
  const conv = await prisma.vendor_conversations.findUnique({
    where: { id: conversationId },
    select: { id: true, vendor1Id: true, vendor2Id: true },
  });
  if (!conv) return null;
  if (conv.vendor1Id !== vendorId && conv.vendor2Id !== vendorId) return null;
  return conv;
}

// GET — fetch messages, mark received ones as read
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;
    const { id } = 'then' in params ? await params : params;

    const conv = await resolveConversation(id, vendorId);
    if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

    // Mark messages sent by the other vendor as read
    await prisma.vendor_messages.updateMany({
      where: { conversationId: id, isRead: false, senderId: { not: vendorId } },
      data: { isRead: true },
    });

    const messages = await prisma.vendor_messages.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true, content: true, senderId: true, isRead: true, createdAt: true,
        sender: { select: { id: true, businessName: true, logo: true } },
      },
    });

    const otherVendorId = conv.vendor1Id === vendorId ? conv.vendor2Id : conv.vendor1Id;
    const other = await prisma.vendors.findUnique({
      where: { id: otherVendorId },
      select: { id: true, businessName: true, ownerName: true, logo: true, city: true },
    });

    return NextResponse.json({ messages, other });
  } catch (error: any) {
    logger.error('Get messages error', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST — send a message
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;
    const { id } = 'then' in params ? await params : params;

    const conv = await resolveConversation(id, vendorId);
    if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

    const { content } = await request.json();
    if (!content?.trim()) return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });

    const [message] = await prisma.$transaction([
      prisma.vendor_messages.create({
        data: { conversationId: id, senderId: vendorId, content: content.trim() },
        select: {
          id: true, content: true, senderId: true, isRead: true, createdAt: true,
          sender: { select: { id: true, businessName: true, logo: true } },
        },
      }),
      prisma.vendor_conversations.update({
        where: { id },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    return NextResponse.json({ message }, { status: 201 });
  } catch (error: any) {
    logger.error('Send message error', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
