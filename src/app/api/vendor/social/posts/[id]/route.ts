import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;
    const resolvedParams = 'then' in params ? await params : params;
    const { id } = resolvedParams;

    const post = await prisma.social_posts.findUnique({ where: { id } });
    if (!post || post.vendorId !== vendorId) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    await prisma.social_posts.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Delete social post error', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
