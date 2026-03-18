// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// GET - Public: single experience with all vendor listings
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const experience = await (prisma as any).wander_experiences.findUnique({
      where: { slug: params.slug },
      include: {
        category: { select: { id: true, name: true, icon: true, slug: true } },
        location: { select: { id: true, name: true } },
        listings: {
          where: { status: 'ACTIVE' },
          include: {
            vendor: { select: { id: true, businessName: true, logo: true } },
            _count: { select: { quoteRequests: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!experience) return NextResponse.json({ error: 'Experience not found' }, { status: 404 });
    if (experience.status !== 'ACTIVE') return NextResponse.json({ error: 'Experience not available' }, { status: 404 });

    return NextResponse.json(experience);
  } catch (error) {
    console.error('[Public Wander Experience Detail]', error);
    return NextResponse.json({ error: 'Failed to fetch experience' }, { status: 500 });
  }
}
