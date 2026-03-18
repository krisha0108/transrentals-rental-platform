// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

export const dynamic = 'force-dynamic';

// GET - List active experiences for vendor dropdown (optionally filtered by categoryId / locationId)
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) return NextResponse.json({ error: auth.error }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const locationId = searchParams.get('locationId');

    const where: any = { status: 'ACTIVE' };
    if (categoryId) where.categoryId = categoryId;
    if (locationId) where.locationId = locationId;

    const experiences = await (prisma as any).wander_experiences.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        duration: true,
        category: { select: { name: true, icon: true } },
        location: { select: { name: true } },
      },
      orderBy: [{ displayOrder: 'asc' }, { title: 'asc' }],
    });

    return NextResponse.json(experiences);
  } catch (error) {
    console.error('[Vendor Wander Experiences GET]', error);
    return NextResponse.json({ error: 'Failed to fetch experiences' }, { status: 500 });
  }
}
