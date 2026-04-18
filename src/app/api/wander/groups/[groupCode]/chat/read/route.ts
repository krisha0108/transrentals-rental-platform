// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// POST /api/wander/groups/[groupCode]/chat/read — Mark chat as read for a member
export async function POST(
  request: NextRequest,
  { params }: { params: { groupCode: string } }
) {
  try {
    const body = await request.json();
    const { memberId } = body;

    if (!memberId) {
      return NextResponse.json({ error: 'memberId is required' }, { status: 400 });
    }

    // Find group by groupCode
    const group = await (prisma as any).wander_friend_groups.findUnique({
      where: { groupCode: params.groupCode },
    });
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Update lastReadAt for this member in this group
    const updated = await (prisma as any).wander_friend_group_members.updateMany({
      where: { id: memberId, groupId: group.id },
      data: { lastReadAt: new Date() },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: 'Member not found in this group' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Wander Chat Read POST]', error);
    return NextResponse.json({ error: String(error?.message || error) }, { status: 500 });
  }
}
