// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// GET /api/customer/wander-groups?customer_id=xxx — My groups (created + joined)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    if (!customerId) return NextResponse.json({ error: 'customer_id required' }, { status: 400 });

    // Groups where I am a member (covers created + joined)
    const memberships = await (prisma as any).wander_friend_group_members.findMany({
      where: { customerId },
      include: {
        group: {
          include: {
            members: { select: { id: true, name: true, role: true, joinedAt: true } },
            trips: {
              where: { status: { not: 'CANCELLED' } },
              orderBy: { createdAt: 'desc' },
              take: 5,
              include: {
                listing: {
                  select: { id: true, title: true, images: true, duration: true, mainLocation: { select: { name: true } } },
                },
                tripMembers: {
                  select: { isGoing: true, groupMemberId: true },
                },
              },
            },
            // Latest message for unread indicator
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { createdAt: true, memberId: true },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const groups = memberships.map(m => {
      const latestMsg = m.group.messages?.[0] || null;
      const hasUnread = latestMsg
        ? (!m.lastReadAt || new Date(latestMsg.createdAt) > new Date(m.lastReadAt))
        : false;
      const { messages, ...groupData } = m.group;
      return {
        ...groupData,
        myRole: m.role,
        myMemberId: m.id,
        hasUnread,
      };
    });

    return NextResponse.json({ groups });
  } catch (error) {
    console.error('[Customer Wander Groups GET]', error);
    return NextResponse.json({ error: 'Failed to load groups' }, { status: 500 });
  }
}
