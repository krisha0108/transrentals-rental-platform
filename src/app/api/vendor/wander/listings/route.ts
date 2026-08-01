// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';

export const dynamic = 'force-dynamic';

// GET - List vendor's wander listings
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) return NextResponse.json({ error: auth.error }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = { vendorId: auth.vendorId };
    if (status && status !== 'all') where.status = status.toUpperCase();

    // statusCounts and totalQuoteRequests are computed across ALL of the
    // vendor's listings (unscoped by the current status tab/page) — the
    // frontend was previously deriving "Total Listings" and the per-tab
    // badge counts from `listings.length` on the single fetched (and
    // status-filtered, max-20) page, which was wrong the moment there was
    // more than one page or more than one status represented.
    const [listings, total, statusCounts, totalQuoteRequests] = await Promise.all([
      (prisma as any).wander_listings.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, icon: true } },
          mainLocation: { select: { id: true, name: true } },
          _count: { select: { quoteRequests: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).wander_listings.count({ where }),
      (prisma as any).wander_listings.groupBy({
        by: ['status'],
        where: { vendorId: auth.vendorId },
        _count: { _all: true },
      }),
      (prisma as any).wander_quote_requests.count({ where: { listing: { vendorId: auth.vendorId } } }),
    ]);

    const counts = { all: 0, ACTIVE: 0, DRAFT: 0, PAUSED: 0, INACTIVE: 0 };
    for (const row of statusCounts) {
      counts[row.status as keyof typeof counts] = row._count._all;
      counts.all += row._count._all;
    }

    return NextResponse.json({
      listings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      counts,
      totalQuoteRequests,
    });
  } catch (error) {
    console.error('[Vendor Wander Listings GET]', error);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}

// POST - Create a new wander listing
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) return NextResponse.json({ error: auth.error }, { status: 401 });


    // Block rejected/suspended/blocked vendors from write operations
    const _guard = await vendorStatusGuard(auth.vendorId!);
    if (_guard.blocked) return _guard.response;

    const body = await request.json();
    const {
      categoryId, subCategoryId, experienceId, mainLocationId, title, shortDescription, description, duration,
      highlights, basePrice, priceType, priceTiers, minGroupSize, maxGroupSize,
      customPlaces, itinerary, vehicleOptions, inclusions, exclusions,
      images, pickupType, meetingPoint, guideLanguages, availableDays,
      advanceNoticeHours, cancellationPolicy, cancellationNotes,
      tourStartDate, tourEndDate,
      requireAdvancePayment, advancePaymentType, advancePaymentValue,
      createMode,
    } = body;
    const safeCreateMode = createMode === 'QUICK' ? 'QUICK' : 'DETAILED';

    if (!categoryId) return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    if (!title?.trim()) return NextResponse.json({ error: 'Tour title is required' }, { status: 400 });
    // For publishing, require location and duration
    if (body.publish) {
      if (!mainLocationId) return NextResponse.json({ error: 'Main location is required to publish' }, { status: 400 });
      if (!duration?.trim()) return NextResponse.json({ error: 'Duration is required to publish' }, { status: 400 });
    }

    // Generate listingId + slug
    const count = await (prisma as any).wander_listings.count({ where: { vendorId: auth.vendorId } });
    const listingId = `WND-LST-${Date.now()}-${count + 1}`;
    const slugBase = title.trim().toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 60);
    const slugHash = Math.random().toString(36).substring(2, 7);
    const slug = `${slugBase}-${slugHash}`;

    // Use raw SQL to bypass stale Prisma client DLL validation for nullable fields
    const newId = 'c' + require('crypto').randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
    const now = new Date();
    await (prisma as any).$executeRawUnsafe(
      `INSERT INTO wander_listings (
        id, listingId, slug, vendorId, categoryId, subCategoryId, experienceId,
        mainLocationId, title, shortDescription, description, duration,
        highlights, basePrice, priceType, minGroupSize, maxGroupSize,
        customPlaces, itinerary, priceTiers, vehicleOptions, inclusions, exclusions,
        images, pickupType, meetingPoint, guideLanguages, availableDays,
        advanceNoticeHours, cancellationPolicy, cancellationNotes,
        requireAdvancePayment, advancePaymentType, advancePaymentValue,
        tourStartDate, tourEndDate, createMode, rating, totalRatings, totalBookings, status, createdAt, updatedAt
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,0,0,?,?,?)`,
      newId, listingId, slug, auth.vendorId, categoryId,
      subCategoryId || null, experienceId || null, mainLocationId || null,
      title.trim(), shortDescription?.trim() || null, description?.trim() || null,
      duration?.trim() || null,
      highlights ? JSON.stringify(highlights) : null,
      basePrice ? parseFloat(basePrice) : null,
      priceType || 'ON_REQUEST',
      minGroupSize ? parseInt(minGroupSize) : 1,
      maxGroupSize ? parseInt(maxGroupSize) : null,
      customPlaces ? JSON.stringify(customPlaces) : null,
      itinerary ? JSON.stringify(itinerary) : null,
      priceTiers ? JSON.stringify(priceTiers) : null,
      vehicleOptions ? JSON.stringify(vehicleOptions) : null,
      inclusions ? JSON.stringify(inclusions) : null,
      exclusions ? JSON.stringify(exclusions) : null,
      images ? JSON.stringify(images) : null,
      pickupType || null, meetingPoint?.trim() || null,
      guideLanguages ? JSON.stringify(guideLanguages) : null,
      availableDays ? JSON.stringify(availableDays) : null,
      advanceNoticeHours ? parseInt(advanceNoticeHours) : 24,
      cancellationPolicy || 'MODERATE',
      cancellationNotes?.trim() || null,
      requireAdvancePayment === true ? 1 : 0,
      requireAdvancePayment ? (advancePaymentType || null) : null,
      requireAdvancePayment && advancePaymentValue ? parseFloat(advancePaymentValue) : null,
      tourStartDate ? new Date(tourStartDate) : null,
      tourEndDate ? new Date(tourEndDate) : null,
      safeCreateMode,
      body.publish ? 'ACTIVE' : 'DRAFT',
      now, now
    );

    const listing = await (prisma as any).wander_listings.findUnique({ where: { listingId } });
    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    console.error('[Vendor Wander Listings POST]', error);
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
  }
}
