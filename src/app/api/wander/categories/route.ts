// @ts-nocheck
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await (prisma as any).wander_categories.findMany({
      where: { isActive: true, parentId: null },
      include: {
        _count: { select: { listings: { where: { status: 'ACTIVE' } } } },
        subCategories: {
          where: { isActive: true },
          orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('[Public Wander Categories]', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
