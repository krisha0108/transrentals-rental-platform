// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

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

    const [listings, total] = await Promise.all([
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
    ]);

    return NextResponse.json({ listings, total, page, totalPages: Math.ceil(total / limit) });
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

    const body = await request.json();
    const {
      categoryId, subCategoryId, experienceId, mainLocationId, title, shortDescription, description, duration,
      highlights, basePrice, priceType, priceTiers, minGroupSize, maxGroupSize,
      customPlaces, itinerary, vehicleOptions, inclusions, exclusions,
      images, pickupType, meetingPoint, guideLanguages, availableDays,
      advanceNoticeHours, cancellationPolicy, cancellationNotes,
      tourStartDate, tourEndDate,
      requireAdvancePayment, advancePaymentType, advancePaymentValue,
    } = body;

    if (!categoryId) return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    if (!mainLocationId) return NextResponse.json({ error: 'Main location is required' }, { status: 400 });
    if (!title?.trim()) return NextResponse.json({ error: 'Tour title is required' }, { status: 400 });
    if (!duration?.trim()) return NextResponse.json({ error: 'Duration is required' }, { status: 400 });

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

    const listing = await (prisma as any).wander_listings.create({
      data: {
        listingId,
        slug,
        vendorId: auth.vendorId,
        categoryId,
        subCategoryId: subCategoryId || null,
        experienceId: experienceId || null,
        mainLocationId,
        title: title.trim(),
        shortDescription: shortDescription?.trim() || null,
        description: description?.trim() || null,
        duration: duration.trim(),
        highlights: highlights ? JSON.stringify(highlights) : null,
        basePrice: basePrice ? parseFloat(basePrice) : null,
        priceType: priceType || 'ON_REQUEST',
        minGroupSize: minGroupSize ? parseInt(minGroupSize) : 1,
        maxGroupSize: maxGroupSize ? parseInt(maxGroupSize) : null,
        customPlaces: customPlaces ? JSON.stringify(customPlaces) : null,
        itinerary: itinerary ? JSON.stringify(itinerary) : null,
        priceTiers: priceTiers ? JSON.stringify(priceTiers) : null,
        vehicleOptions: vehicleOptions ? JSON.stringify(vehicleOptions) : null,
        inclusions: inclusions ? JSON.stringify(inclusions) : null,
        exclusions: exclusions ? JSON.stringify(exclusions) : null,
        images: images ? JSON.stringify(images) : null,
        pickupType: pickupType || null,
        meetingPoint: meetingPoint?.trim() || null,
        guideLanguages: guideLanguages ? JSON.stringify(guideLanguages) : null,
        availableDays: availableDays ? JSON.stringify(availableDays) : null,
        advanceNoticeHours: advanceNoticeHours ? parseInt(advanceNoticeHours) : 24,
        cancellationPolicy: cancellationPolicy || 'MODERATE',
        cancellationNotes: cancellationNotes?.trim() || null,
        tourStartDate: tourStartDate ? new Date(tourStartDate) : null,
        tourEndDate: tourEndDate ? new Date(tourEndDate) : null,
        requireAdvancePayment: requireAdvancePayment === true,
        advancePaymentType: requireAdvancePayment ? (advancePaymentType || null) : null,
        advancePaymentValue: requireAdvancePayment && advancePaymentValue ? parseFloat(advancePaymentValue) : null,
        status: body.publish ? 'ACTIVE' : 'DRAFT',
      },
    });

    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    console.error('[Vendor Wander Listings POST]', error);
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
  }
}
