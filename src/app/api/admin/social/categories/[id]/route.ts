import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const resolvedParams = 'then' in params ? await params : params;
    const { id } = resolvedParams;
    const body = await request.json();

    const data: any = {};
    if (body.name !== undefined) { data.name = body.name; data.slug = slugify(body.name); }
    if (body.description !== undefined) data.description = body.description;
    if (body.isSOS !== undefined) data.isSOS = body.isSOS;
    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (body.displayOrder !== undefined) data.displayOrder = body.displayOrder;

    const category = await prisma.social_categories.update({ where: { id }, data });
    return NextResponse.json({ category });
  } catch (error: any) {
    logger.error('Update social category error', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const resolvedParams = 'then' in params ? await params : params;
    const { id } = resolvedParams;

    await prisma.social_categories.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Delete social category error', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
