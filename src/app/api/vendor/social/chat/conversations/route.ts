import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// Normalize IDs so vendor1Id < vendor2Id (prevents duplicate conversations)
function normalizeIds(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

// GET /api/vendor/social/chat/conversations — list my conversations
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    const conversations = await prisma.vendor_conversations.findMany({
      where: { OR: [{ vendor1Id: vendorId }, { vendor2Id: vendorId }] },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        vendor1: { select: { id: true, businessName: true, ownerName: true, logo: true, city: true } },
        vendor2: { select: { id: true, businessName: true, ownerName: true, logo: true, city: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, createdAt: true, senderId: true, isRead: true },
        },
      },
    });

    // Count unread per conversation
    const unreadCounts = await Promise.all(
      conversations.map(c =>
        prisma.vendor_messages.count({
          where: { conversationId: c.id, isRead: false, senderId: { not: vendorId } },
        })
      )
    );

    const result = conversations.map((c, i) => {
      const other = c.vendor1Id === vendorId ? c.vendor2 : c.vendor1;
      const lastMsg = c.messages[0] ?? null;
      return {
        id: c.id,
        other,
        lastMessage: lastMsg
          ? { content: lastMsg.content, createdAt: lastMsg.createdAt, isMine: lastMsg.senderId === vendorId }
          : null,
        unreadCount: unreadCounts[i],
        lastMessageAt: c.lastMessageAt,
      };
    });

    return NextResponse.json({ conversations: result });
  } catch (error: any) {
    logger.error('Get vendor conversations error', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

// POST /api/vendor/social/chat/conversations — get or create conversation with another vendor
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;
    const { otherVendorId } = await request.json();

    if (!otherVendorId) return NextResponse.json({ error: 'otherVendorId required' }, { status: 400 });
    if (otherVendorId === vendorId) return NextResponse.json({ error: 'Cannot chat with yourself' }, { status: 400 });

    // Verify the other vendor exists
    const other = await prisma.vendors.findUnique({
      where: { id: otherVendorId },
      select: { id: true, businessName: true },
    });
    if (!other) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

    const [v1, v2] = normalizeIds(vendorId, otherVendorId);

    const conversation = await prisma.vendor_conversations.upsert({
      where: { vendor1Id_vendor2Id: { vendor1Id: v1, vendor2Id: v2 } },
      update: {},
      create: { vendor1Id: v1, vendor2Id: v2 },
    });

    return NextResponse.json({ conversationId: conversation.id });
  } catch (error: any) {
    logger.error('Create vendor conversation error', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
