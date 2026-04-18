// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// POST /api/wander/groups/[groupCode]/chat/react — Toggle emoji reaction on a message
export async function POST(
  request: NextRequest,
  { params }: { params: { groupCode: string } }
) {
  try {
    const body = await request.json();
    const { memberId, messageId, emoji } = body;

    if (!memberId || !messageId || !emoji) {
      return NextResponse.json(
        { error: 'memberId, messageId, and emoji are required' },
        { status: 400 }
      );
    }

    // Find group by groupCode
    const group = await (prisma as any).wander_friend_groups.findUnique({
      where: { groupCode: params.groupCode },
    });
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Verify memberId is in this group
    const member = await (prisma as any).wander_friend_group_members.findFirst({
      where: { id: memberId, groupId: group.id },
    });
    if (!member) {
      return NextResponse.json({ error: 'Member not found in this group' }, { status: 403 });
    }

    // Verify the message belongs to this group
    const message = await (prisma as any).wander_group_messages.findFirst({
      where: { id: messageId, groupId: group.id },
    });
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Toggle: check if reaction already exists (unique on messageId + memberId + emoji)
    const existingReaction = await (prisma as any).wander_group_message_reactions.findFirst({
      where: { messageId, memberId, emoji },
    });

    if (existingReaction) {
      // Delete reaction (un-react)
      await (prisma as any).wander_group_message_reactions.delete({
        where: { id: existingReaction.id },
      });
      return NextResponse.json({ success: true, reacted: false, emoji });
    } else {
      // Create reaction
      await (prisma as any).wander_group_message_reactions.create({
        data: { messageId, memberId, emoji },
      });
      return NextResponse.json({ success: true, reacted: true, emoji });
    }
  } catch (error) {
    console.error('[Wander Chat React POST]', error);
    return NextResponse.json({ error: String(error?.message || error) }, { status: 500 });
  }
}
