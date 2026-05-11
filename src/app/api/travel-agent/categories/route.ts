// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';

export const dynamic = 'force-dynamic';

// GET - List shared wander categories (top-level + sub-categories), authenticated travel-agent.
// Same shape as /api/admin/wander/categories so the same UI components can consume both.
export async function GET(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const categories = await (prisma as any).wander_categories.findMany({
      where: { parentId: null, isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        subCategories: {
          where: { isActive: true },
          orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('[Travel Agent Categories]', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
