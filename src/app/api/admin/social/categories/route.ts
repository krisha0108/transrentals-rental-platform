import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function GET() {
  try {
    const categories = await prisma.social_categories.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      include: { _count: { select: { social_posts: true } } },
    });
    return NextResponse.json({ categories });
  } catch (error: any) {
    logger.error('Get social categories error', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, description, isSOS, displayOrder } = await request.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const slug = slugify(name);
    const existing = await prisma.social_categories.findUnique({ where: { slug } });
    if (existing) return NextResponse.json({ error: 'Category with this name already exists' }, { status: 400 });

    const category = await prisma.social_categories.create({
      data: { name, slug, description, isSOS: !!isSOS, displayOrder: displayOrder ?? 0 },
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error: any) {
    logger.error('Create social category error', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
