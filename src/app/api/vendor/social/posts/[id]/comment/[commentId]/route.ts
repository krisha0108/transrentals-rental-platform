import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> | { id: string; commentId: string } }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;
    const resolvedParams = 'then' in params ? await params : params;
    const { commentId } = resolvedParams;

    const comment = await prisma.social_post_comments.findUnique({ where: { id: commentId } });
    if (!comment || comment.vendorId !== vendorId) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    await prisma.social_post_comments.update({ where: { id: commentId }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Delete comment error', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
