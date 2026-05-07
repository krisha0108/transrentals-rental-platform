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

    const source = searchParams.get('source');     // 'admin' | 'vendor' | null
    const vendorId = searchParams.get('vendorId'); // specific vendor id

    const where: any = {};
    if (status && status !== 'all') where.status = status.toUpperCase();
    if (categoryId) where.categoryId = categoryId;
    if (search) where.title = { contains: search };
    if (source === 'admin') where.vendorId = null;
    else if (source === 'vendor') where.vendorId = { not: null };
    if (vendorId) where.vendorId = vendorId;

    const [listings, total] = await Promise.all([
      (prisma as any).wander_listings.findMany({
        where,
        include: {
          vendor: { select: { id: true, businessName: true, phone: true } } as any,
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      categoryId, subCategoryId, experienceId, mainLocationId,
      title, shortDescription, description, duration,
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
    if (body.publish) {
      if (!mainLocationId) return NextResponse.json({ error: 'Main location is required to publish' }, { status: 400 });
      if (!duration?.trim()) return NextResponse.json({ error: 'Duration is required to publish' }, { status: 400 });
    }

    const count = await (prisma as any).wander_listings.count();
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
        id, listingId, slug, categoryId, subCategoryId, experienceId,
        mainLocationId, title, shortDescription, description, duration,
        highlights, basePrice, priceType, minGroupSize, maxGroupSize,
        customPlaces, itinerary, priceTiers, vehicleOptions, inclusions, exclusions,
        images, pickupType, meetingPoint, guideLanguages, availableDays,
        advanceNoticeHours, cancellationPolicy, cancellationNotes,
        requireAdvancePayment, advancePaymentType, advancePaymentValue,
        tourStartDate, tourEndDate, createMode, rating, totalRatings, totalBookings, status, createdAt, updatedAt
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,0,0,?,?,?)`,
      newId, listingId, slug, categoryId,
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
    console.error('[Admin Wander Listings POST]', error);
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, status, experienceId, metaTitle, metaDescription, metaKeywords, ogImage, slug, createMode } = await request.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const data: any = {};
    if (status !== undefined) data.status = status;
    if (experienceId !== undefined) data.experienceId = experienceId || null;
    if (metaTitle !== undefined) data.metaTitle = metaTitle?.trim() || null;
    if (metaDescription !== undefined) data.metaDescription = metaDescription?.trim() || null;
    if (metaKeywords !== undefined) data.metaKeywords = metaKeywords?.trim() || null;
    if (ogImage !== undefined) data.ogImage = ogImage?.trim() || null;
    if (slug !== undefined) data.slug = slug?.trim() || null;
    if (createMode === 'QUICK' || createMode === 'DETAILED') data.createMode = createMode;

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
