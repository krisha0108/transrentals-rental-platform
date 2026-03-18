// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search')?.trim();
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');

    const where: any = {};
    if (status && status !== 'all') where.status = status.toUpperCase();
    if (categoryId) where.categoryId = categoryId;
    if (search) where.title = { contains: search };

    const [listings, total] = await Promise.all([
      (prisma as any).wander_listings.findMany({
        where,
        include: {
          vendor: { select: { id: true, businessName: true, phone: true } },
          category: { select: { id: true, name: true, icon: true } },
          mainLocation: { select: { id: true, name: true } },
          experience: { select: { id: true, title: true } },
          _count: { select: { quoteRequests: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).wander_listings.count({ where }),
    ]);

    return NextResponse.json({ listings, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('[Admin Wander Listings GET]', error);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, status, experienceId, metaTitle, metaDescription, metaKeywords, ogImage, slug } = await request.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const data: any = {};
    if (status !== undefined) data.status = status;
    if (experienceId !== undefined) data.experienceId = experienceId || null;
    if (metaTitle !== undefined) data.metaTitle = metaTitle?.trim() || null;
    if (metaDescription !== undefined) data.metaDescription = metaDescription?.trim() || null;
    if (metaKeywords !== undefined) data.metaKeywords = metaKeywords?.trim() || null;
    if (ogImage !== undefined) data.ogImage = ogImage?.trim() || null;
    if (slug !== undefined) data.slug = slug?.trim() || null;

    const listing = await (prisma as any).wander_listings.update({
      where: { id },
      data,
    });

    return NextResponse.json(listing);
  } catch (error) {
    console.error('[Admin Wander Listings PATCH]', error);
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
  }
}
