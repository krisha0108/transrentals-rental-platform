// DELETE — disconnect a connected Page/Instagram account. Removes the stored
// access token and its synced posts/stats rather than just deactivating, since
// a re-connect refetches everything fresh anyway.
// PATCH — toggle isActive (pause syncing without forgetting the connection).

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const admin = await prisma.admin_users.findUnique({ where: { id: session.user.id } });
  if (!admin || !['SUPER_ADMIN', 'ADMIN'].includes(admin.role)) return null;
  return admin;
}

async function resolveParams(params: Promise<{ id: string }> | { id: string }) {
  return 'then' in params ? await params : params;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    const { id } = await resolveParams(params);

    await prisma.social_media_accounts.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to disconnect social media account', error);
    return NextResponse.json({ error: 'Failed to disconnect account' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    const { id } = await resolveParams(params);
    const body = await request.json().catch(() => ({}));

    if (typeof body?.isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive (boolean) is required' }, { status: 400 });
    }

    const updated = await prisma.social_media_accounts.update({
      where: { id },
      data: { isActive: body.isActive },
      select: { id: true, isActive: true },
    });
    return NextResponse.json({ success: true, account: updated });
  } catch (error) {
    logger.error('Failed to update social media account', error);
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
  }
}
