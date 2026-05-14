// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - Total unread customer-chat messages for the logged-in vendor,
// plus the number of conversations carrying those unread messages. Used by
// VendorSidebar to render the badge next to "Customer Chats".
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ unreadCount: 0, conversationsWithUnread: 0 }, { status: 401 });
    }

    const vendor = await prisma.vendors.findFirst({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!vendor) {
      return NextResponse.json({ unreadCount: 0, conversationsWithUnread: 0 }, { status: 404 });
    }

    const baseWhere = {
      vendorId: vendor.id,
      status: 'ACTIVE',
      vendorUnread: { gt: 0 },
    };

    const [agg, convsWithUnread] = await Promise.all([
      prisma.chat_conversations.aggregate({
        where: baseWhere,
        _sum: { vendorUnread: true },
      }),
      prisma.chat_conversations.count({ where: baseWhere }),
    ]);

    return NextResponse.json({
      unreadCount: agg._sum.vendorUnread ?? 0,
      conversationsWithUnread: convsWithUnread,
    });
  } catch (error) {
    logger.error('Failed to fetch vendor chat unread count', error);
    return NextResponse.json({ unreadCount: 0, conversationsWithUnread: 0 }, { status: 500 });
  }
}
