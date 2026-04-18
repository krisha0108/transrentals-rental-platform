// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// DELETE /api/wander/groups/[groupCode]/members/[memberId] — Admin removes a member from the group
export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupCode: string; memberId: string } }
) {
  try {
    const body = await request.json();
    const { adminMemberId } = body;

    if (!adminMemberId) {
      return NextResponse.json({ error: 'adminMemberId is required' }, { status: 400 });
    }

    // Find group by groupCode
    const group = await (prisma as any).wander_friend_groups.findUnique({
      where: { groupCode: params.groupCode },
    });
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Verify adminMemberId has role ADMIN in this group
    const adminMember = await (prisma as any).wander_friend_group_members.findFirst({
      where: { id: adminMemberId, groupId: group.id, role: 'ADMIN' },
    });
    if (!adminMember) {
      return NextResponse.json({ error: 'Only an admin can remove members' }, { status: 403 });
    }

    // Cannot remove the ADMIN themselves
    if (adminMemberId === params.memberId) {
      return NextResponse.json({ error: 'Admin cannot remove themselves from the group' }, { status: 400 });
    }

    // Verify the target member belongs to this group
    const targetMember = await (prisma as any).wander_friend_group_members.findFirst({
      where: { id: params.memberId, groupId: group.id },
    });
    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found in this group' }, { status: 404 });
    }

    // Delete the member record — cascade handles trip members etc.
    await (prisma as any).wander_friend_group_members.delete({
      where: { id: params.memberId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Wander Member DELETE]', error);
    return NextResponse.json({ error: String(error?.message || error) }, { status: 500 });
  }
}
