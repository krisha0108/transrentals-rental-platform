// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryIds = searchParams.get('categoryIds')?.split(',').filter(Boolean) || [];
    const subCategoryIds = searchParams.get('subCategoryIds')?.split(',').filter(Boolean) || [];
    const search = searchParams.get('search')?.trim();
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const priceMin = searchParams.get('priceMin') ? parseFloat(searchParams.get('priceMin')!) : null;
    const priceMax = searchParams.get('priceMax') ? parseFloat(searchParams.get('priceMax')!) : null;
    const locationId = searchParams.get('locationId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const month = searchParams.get('month'); // e.g. "2026-03"

    const where: any = { status: 'ACTIVE' };
    const andConditions: any[] = [];

    // Auto-hide expired tours: only show tours with no endDate OR endDate >= today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    andConditions.push({
      OR: [
        { tourEndDate: null },
        { tourEndDate: { gte: today } },
      ],
    });

    if (categoryIds.length || subCategoryIds.length) {
      if (categoryIds.length) andConditions.push({ categoryId: { in: categoryIds } });
      if (subCategoryIds.length) andConditions.push({ subCategoryId: { in: subCategoryIds } });
    }
    if (locationId) andConditions.push({ mainLocationId: locationId });
    if (search) {
      andConditions.push({
        OR: [
          { title: { contains: search } },
          { shortDescription: { contains: search } },
        ],
      });
    }
    // Date-based filter
    if (dateFrom) {
      andConditions.push({
        OR: [
          { tourEndDate: { gte: new Date(dateFrom) } },
          { tourEndDate: null, tourStartDate: { gte: new Date(dateFrom) } },
        ],
      });
    }
    if (dateTo) {
      andConditions.push({
        OR: [
          { tourStartDate: { lte: new Date(dateTo) } },
          { tourStartDate: null },
        ],
      });
    }
    if (month) {
      const [y, m] = month.split('-').map(Number);
      const monthStart = new Date(y, m - 1, 1);
      const monthEnd = new Date(y, m, 0, 23, 59, 59);
      andConditions.push({
        OR: [
          { tourStartDate: { lte: monthEnd }, tourEndDate: { gte: monthStart } },
          { tourStartDate: { gte: monthStart, lte: monthEnd }, tourEndDate: null },
          { tourStartDate: null, tourEndDate: null },
        ],
      });
    }
    if (andConditions.length) where.AND = andConditions;
    if (priceMin !== null || priceMax !== null) {
      where.priceType = { not: 'ON_REQUEST' };
      where.basePrice = {};
      if (priceMin !== null) where.basePrice.gte = priceMin;
      if (priceMax !== null) where.basePrice.lte = priceMax;
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'popular') orderBy = [{ quoteRequests: { _count: 'desc' } }, { createdAt: 'desc' }];
    else if (sortBy === 'priceAsc') orderBy = [{ basePrice: 'asc' }, { createdAt: 'desc' }];
    else if (sortBy === 'priceDesc') orderBy = [{ basePrice: 'desc' }, { createdAt: 'desc' }];

    const [listings, total] = await Promise.all([
      (prisma as any).wander_listings.findMany({
        where,
        select: {
          id: true, slug: true, title: true, shortDescription: true, duration: true, images: true,
          basePrice: true, priceType: true, priceTiers: true, status: true,
          rating: true, totalRatings: true,
          tourStartDate: true, tourEndDate: true,
          createdAt: true,
          category: { select: { id: true, name: true, icon: true, slug: true } },
          mainLocation: { select: { id: true, name: true } },
          vendor: { select: { id: true, businessName: true, logo: true } },
          _count: { select: { quoteRequests: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).wander_listings.count({ where }),
    ]);

    return NextResponse.json({ listings, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('[Public Wander Listings]', error);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}
