// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// GET - List top-level categories with their sub-categories
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const categories = await (prisma as any).wander_categories.findMany({
      where: { parentId: null },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        _count: { select: { listings: true } },
        subCategories: {
          orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
          include: {
            _count: { select: { listings: true } },
          },
        },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('[Wander Categories GET]', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST - Create a category or sub-category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, icon, description, coverImage, displayOrder, parentId } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Validate parent exists if parentId given
    if (parentId) {
      const parent = await (prisma as any).wander_categories.findUnique({ where: { id: parentId } });
      if (!parent) return NextResponse.json({ error: 'Parent category not found' }, { status: 404 });
      if (parent.parentId) return NextResponse.json({ error: 'Cannot nest sub-categories more than one level' }, { status: 400 });
    }

    // Generate unique slug
    const baseSlug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    let slug = baseSlug;
    let counter = 1;
    while (await (prisma as any).wander_categories.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const category = await (prisma as any).wander_categories.create({
      data: {
        name: name.trim(),
        slug,
        icon: icon?.trim() || null,
        description: description?.trim() || null,
        coverImage: coverImage?.trim() || null,
        displayOrder: displayOrder ?? 0,
        isActive: true,
        parentId: parentId || null,
      },
      include: {
        _count: { select: { listings: true } },
        subCategories: true,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('[Wander Categories POST]', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
