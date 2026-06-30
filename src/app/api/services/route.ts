import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { unstable_cache } from 'next/cache';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

const getCachedServices = unstable_cache(
  async (parentId: string | null, parentsOnly: boolean) => {
    const where: any = { isActive: true };
    if (parentsOnly) {
      where.parentId = null;
    } else if (parentId) {
      where.parentId = parentId;
    }
    return prisma.services.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        shortDesc: true,
        icon: true,
        image: true,
        flowType: true,
      },
    });
  },
  ['services-list'],
  { revalidate: 3600, tags: ['services'] }
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    const parentsOnly = searchParams.get('parentsOnly') === 'true';

    const services = await getCachedServices(parentId, parentsOnly);

    return NextResponse.json({ success: true, services });
  } catch (error: any) {
    logger.error('Failed to fetch services', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}
