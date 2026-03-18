// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// PATCH - Update a category or sub-category
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, icon, description, coverImage, displayOrder, isActive } = body;

    const data: Record<string, any> = {};
    if (name !== undefined) data.name = name.trim();
    if (icon !== undefined) data.icon = icon?.trim() || null;
    if (description !== undefined) data.description = description?.trim() || null;
    if (coverImage !== undefined) data.coverImage = coverImage?.trim() || null;
    if (displayOrder !== undefined) data.displayOrder = displayOrder;
    if (isActive !== undefined) data.isActive = isActive;

    const category = await (prisma as any).wander_categories.update({
      where: { id: params.id },
      data,
      include: { _count: { select: { listings: true } }, subCategories: true },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('[Wander Categories PATCH]', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// DELETE - Delete a category or sub-category
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check listings
    const listingCount = await (prisma as any).wander_listings.count({
      where: { categoryId: params.id },
    });
    if (listingCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${listingCount} listing(s) use this category` },
        { status: 400 }
      );
    }

    // Check sub-categories (only for parent categories)
    const subCount = await (prisma as any).wander_categories.count({
      where: { parentId: params.id },
    });
    if (subCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: this category has ${subCount} sub-categor${subCount === 1 ? 'y' : 'ies'}. Delete them first.` },
        { status: 400 }
      );
    }

    await (prisma as any).wander_categories.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Wander Categories DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
