// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// GET /api/wander/groups/[groupCode]/chat — last 60 messages
export async function GET(_req: NextRequest, { params }: { params: { groupCode: string } }) {
  try {
    const group = await (prisma as any).wander_friend_groups.findUnique({
      where: { groupCode: params.groupCode },
      select: { id: true },
    });
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const messages = await (prisma as any).wander_group_messages.findMany({
      where: { groupId: group.id },
      orderBy: { createdAt: 'asc' },
      take: 60,
      include: {
        member: { select: { id: true, name: true, role: true } },
        reactions: {
          include: { member: { select: { id: true, name: true } } },
        },
      },
    });

    // Read receipts: members and their lastReadAt
    const memberReads = await (prisma as any).wander_friend_group_members.findMany({
      where: { groupId: group.id },
      select: { id: true, name: true, lastReadAt: true },
    });

    return NextResponse.json({ messages, memberReads });
  } catch (error) {
    console.error('[Wander Chat GET]', error);
    return NextResponse.json({ error: 'Failed to load chat' }, { status: 500 });
  }
}

// POST /api/wander/groups/[groupCode]/chat — send message
export async function POST(request: NextRequest, { params }: { params: { groupCode: string } }) {
  try {
    const body = await request.json();
    const { memberId, message } = body;

    if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 });
    if (!message?.trim()) return NextResponse.json({ error: 'message required' }, { status: 400 });

    const group = await (prisma as any).wander_friend_groups.findUnique({
      where: { groupCode: params.groupCode },
      include: {
        members: {
          include: { customer: { select: { id: true, fcmToken: true } } },
        },
      },
    });
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const sender = group.members.find((m: any) => m.id === memberId);
    if (!sender) return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });

    const msg = await (prisma as any).wander_group_messages.create({
      data: {
        groupId: group.id,
        memberId,
        message: message.trim(),
      },
      include: {
        member: { select: { id: true, name: true, role: true } },
      },
    });

    // Push notifications + save to DB for all OTHER members
    const otherMembers = group.members.filter((m: any) => m.id !== memberId && m.customer?.id);
    const tokens = otherMembers.filter((m: any) => m.customer?.fcmToken).map((m: any) => m.customer.fcmToken);
    const notifTitle = `${group.name} — ${sender.name}`;
    const notifBody = message.trim().slice(0, 100);

    if (tokens.length > 0) {
      try {
        const { sendMulticastNotification } = await import('@/lib/services/push-notification-service');
        await sendMulticastNotification(tokens, { title: notifTitle, body: notifBody }, { type: 'GROUP_CHAT', groupCode: params.groupCode });
      } catch {}
    }
    // Save to notifications table
    try {
      await prisma.notifications.createMany({
        data: otherMembers.map((m: any) => ({
          customerId: m.customer.id,
          title: notifTitle,
          body: notifBody,
          type: 'GROUP_CHAT',
          bookingId: params.groupCode,
        })),
        skipDuplicates: true,
      });
    } catch {}

    return NextResponse.json({ success: true, message: msg });
  } catch (error) {
    console.error('[Wander Chat POST]', error);
    return NextResponse.json({ error: String(error?.message || error) }, { status: 500 });
  }
}
