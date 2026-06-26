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

    // Parse JSON string fields stored as LongText
    const safeJson = (val: any, fallback: any = []) => {
      if (Array.isArray(val) || (val && typeof val === 'object')) return val;
      if (!val) return fallback;
      try { return JSON.parse(val); } catch { return fallback; }
    };

    const parsed = listings.map((l: any) => ({
      ...l,
      images:     safeJson(l.images, []),
      priceTiers: safeJson(l.priceTiers, []),
      inclusions: safeJson(l.inclusions, []),
      vendor: l.vendor ? { ...l.vendor, name: l.vendor.businessName } : null,
    }));

    // ── Merge public travel-agent tours into the same response ──
    // Travel-agent tours don't have category/sub-category/locationId fields, so we
    // only include them when no such filters are applied (skip otherwise to keep
    // filter semantics correct).
    let agentTours: any[] = [];
    const skipAgentTours =
      categoryIds.length > 0 ||
      subCategoryIds.length > 0 ||
      !!locationId ||
      priceMin !== null ||
      priceMax !== null ||
      !!dateFrom ||
      !!dateTo ||
      !!month;

    if (!skipAgentTours) {
      const agentWhere: any = { isPublic: true, isActive: true };
      if (search) {
        agentWhere.OR = [
          { title: { contains: search } },
          { description: { contains: search } },
          { destination: { contains: search } },
        ];
      }

      const agentRows = await (prisma as any).travel_agent_tours.findMany({
        where: agentWhere,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          travel_agents: {
            select: { id: true, agencyName: true, logo: true },
          },
        },
      });

      // Normalize travel_agent_tours rows into the wander listing card shape
      agentTours = agentRows.map((t: any) => {
        const gallery = safeJson(t.galleryImages, []);
        const allImages = [t.coverImage, ...gallery].filter(Boolean);
        // Inclusions on travel-agent tours may be stored as { highlights, items } JSON
        const inclusionsRaw = safeJson(t.inclusions, null);
        const inclusionsList = inclusionsRaw
          ? Array.isArray(inclusionsRaw)
            ? inclusionsRaw
            : Array.isArray(inclusionsRaw.items)
              ? inclusionsRaw.items
              : []
          : [];
        return {
          id: t.id,
          slug: t.slug,
          title: t.title,
          shortDescription: t.description,
          duration:
            t.durationDays > 0
              ? `${t.durationDays} Day${t.durationDays !== 1 ? 's' : ''}${
                  t.durationNights > 0
                    ? ` / ${t.durationNights} Night${t.durationNights !== 1 ? 's' : ''}`
                    : ''
                }`
              : '',
          images: allImages,
          basePrice: t.startingPrice,
          priceType: t.startingPrice ? 'PER_PERSON' : 'ON_REQUEST',
          priceTiers: [],
          status: t.isActive ? 'ACTIVE' : 'INACTIVE',
          rating: t.rating,
          totalRatings: t.totalRatings,
          tourStartDate: null,
          tourEndDate: null,
          createdAt: t.createdAt,
          inclusions: inclusionsList,
          category: t.category ? { id: null, name: t.category, icon: '🗺️', slug: null } : null,
          mainLocation: t.destination ? { id: null, name: t.destination } : null,
          vendor: {
            id: t.travel_agents.id,
            businessName: t.travel_agents.agencyName,
            logo: t.travel_agents.logo,
            name: t.travel_agents.agencyName,
          },
          _count: { quoteRequests: t.totalBookings || 0 },
          // Marker so the front-end can build the right detail URL if needed
          source: 'TRAVEL_AGENT' as const,
        };
      });
    }

    // Merge vendor wander_listings with travel-agent tours, then sort the combined
    // list by the requested order so the newest tour (vendor OR agent) is on top —
    // instead of always appending agent tours at the end.
    const merged = [...parsed, ...agentTours];

    const ts = (v: any) => (v ? new Date(v).getTime() : 0);
    const sorters: Record<string, (a: any, b: any) => number> = {
      newest: (a, b) => ts(b.createdAt) - ts(a.createdAt),
      priceAsc: (a, b) => (a.basePrice ?? Infinity) - (b.basePrice ?? Infinity),
      priceDesc: (a, b) => (b.basePrice ?? -Infinity) - (a.basePrice ?? -Infinity),
      popular: (a, b) => (b._count?.quoteRequests ?? 0) - (a._count?.quoteRequests ?? 0),
    };
    merged.sort(sorters[sortBy] || sorters.newest);

    return NextResponse.json({
      listings: merged,
      total: total + agentTours.length,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[Public Wander Listings]', error);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}
