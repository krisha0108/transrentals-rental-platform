// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// POST /api/wander/groups/[groupCode]/avatar — Upload group avatar photo (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: { groupCode: string } }
) {
  try {
    const formData = await request.formData();

    const memberId = formData.get('memberId') as string | null;
    const file = formData.get('file') as File | null;

    if (!memberId) {
      return NextResponse.json({ error: 'memberId is required' }, { status: 400 });
    }
    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    // Find group by groupCode
    const group = await (prisma as any).wander_friend_groups.findUnique({
      where: { groupCode: params.groupCode },
    });
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Verify memberId is an admin of this group
    const adminMember = await (prisma as any).wander_friend_group_members.findFirst({
      where: { id: memberId, groupId: group.id, role: 'ADMIN' },
    });
    if (!adminMember) {
      return NextResponse.json({ error: 'Only the group admin can update the avatar' }, { status: 403 });
    }

    // Ensure upload directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'group_avatars');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Build filename and save file
    const filename = `${params.groupCode}-${Date.now()}.jpg`;
    const filePath = path.join(uploadsDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    // Update avatarUrl in DB (store full relative path)
    const avatarUrl = `/uploads/group_avatars/${filename}`;
    await (prisma as any).wander_friend_groups.update({
      where: { id: group.id },
      data: { avatarUrl },
    });

    return NextResponse.json({ success: true, avatarUrl });
  } catch (error) {
    console.error('[Wander Group Avatar POST]', error);
    return NextResponse.json({ error: String(error?.message || error) }, { status: 500 });
  }
}
