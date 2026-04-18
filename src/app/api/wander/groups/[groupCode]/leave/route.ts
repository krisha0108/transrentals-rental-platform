// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// DELETE /api/wander/groups/[groupCode]/leave — body: { memberId }
// Admin can delete the entire group; member just removes themselves
export async function DELETE(request: NextRequest, { params }: { params: { groupCode: string } }) {
  try {
    const body = await request.json();
    const { memberId } = body;

    if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 });

    const group = await (prisma as any).wander_friend_groups.findUnique({
      where: { groupCode: params.groupCode },
      include: { members: true },
    });
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const member = group.members.find((m: any) => m.id === memberId);
    if (!member) return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });

    if (member.role === 'ADMIN') {
      // Admin deletes the whole group
      await (prisma as any).wander_friend_groups.delete({ where: { id: group.id } });
      return NextResponse.json({ success: true, action: 'group_deleted' });
    } else {
      // Member leaves
      await (prisma as any).wander_friend_group_members.delete({ where: { id: memberId } });
      return NextResponse.json({ success: true, action: 'left_group' });
    }
  } catch (error) {
    console.error('[Wander Leave DELETE]', error);
    return NextResponse.json({ error: String(error?.message || error) }, { status: 500 });
  }
}
