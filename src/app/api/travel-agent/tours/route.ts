// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import crypto from 'crypto';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

// Per-agent slug uniqueness
async function uniqueSlugForAgent(travelAgentId: string, base: string): Promise<string> {
  let attempt = base || 'tour';
  for (let i = 0; i < 5; i++) {
    const exists = await (prisma as any).travel_agent_tours.findFirst({
      where: { travelAgentId, slug: attempt },
      select: { id: true },
    });
    if (!exists) return attempt;
    attempt = `${base}-${crypto.randomBytes(2).toString('hex')}`;
  }
  return `${base}-${crypto.randomBytes(4).toString('hex')}`;
}

// Helper: ensure value is stored as JSON string for LongText fields
function asJsonString(v: any): string | null {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v === 'string') {
    // Already JSON-ish? Try parse; if it doesn't parse, wrap as quoted string
    try {
      JSON.parse(v);
      return v;
    } catch {
      return JSON.stringify(v);
    }
  }
  return JSON.stringify(v);
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');
    const isPublic = searchParams.get('isPublic');
    const status = searchParams.get('status');

    const where: any = { travelAgentId: auth.travelAgentId };
    if (isActive === 'true') where.isActive = true;
    if (isActive === 'false') where.isActive = false;
    if (isPublic === 'true') where.isPublic = true;
    if (isPublic === 'false') where.isPublic = false;
    if (status && status !== 'all') where.status = status.toUpperCase();
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { destination: { contains: search } },
        { category: { contains: search } },
      ];
    }

    const tours = await (prisma as any).travel_agent_tours.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const stats = {
      total: tours.length,
      active: tours.filter((t: any) => t.isActive).length,
      published: tours.filter((t: any) => t.isPublic).length,
    };

    return NextResponse.json({ tours, stats });
  } catch (error: any) {
    logger.error('List travel agent tours error', error);
    return NextResponse.json(
      { error: 'Failed to fetch tours', details: error?.message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      // Identification
      categoryId, subCategoryId, experienceId, mainLocationId,
      // Core
      title, shortDescription, description, duration,
      durationDays, durationNights,
      // Pricing
      priceType, basePrice, startingPrice, priceTiers,
      // Content
      highlights, customPlaces, inclusions, exclusions, itinerary, termsConditions,
      // Vehicle
      vehicleIds, vehicleOptions,
      // Logistics
      pickupType, meetingPoint, guideLanguages, availableDays,
      advanceNoticeHours, cancellationPolicy, cancellationNotes,
      requireAdvancePayment, advancePaymentType, advancePaymentValue,
      // Dates
      tourStartDate, tourEndDate,
      // Media
      coverImage, galleryImages, images,
      // Lifecycle
      createMode, status, publish,
      // Legacy
      category, destination,
    } = body;

    if (!title || !String(title).trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // For publishing (DETAILED flow) — require richer fields
    if (publish || status === 'ACTIVE') {
      if (!mainLocationId && !destination) {
        return NextResponse.json({ error: 'Main location is required to publish' }, { status: 400 });
      }
      if (!duration && !durationDays) {
        return NextResponse.json({ error: 'Duration is required to publish' }, { status: 400 });
      }
    }

    const safeCreateMode = createMode === 'QUICK' ? 'QUICK' : 'DETAILED';
    const safeStatus =
      status === 'ACTIVE' || publish === true
        ? 'ACTIVE'
        : status === 'PAUSED'
          ? 'PAUSED'
          : status === 'INACTIVE'
            ? 'INACTIVE'
            : 'DRAFT';
    const safePriceType =
      priceType === 'PER_PERSON' || priceType === 'PER_GROUP' || priceType === 'ON_REQUEST'
        ? priceType
        : 'ON_REQUEST';
    const safeCancellationPolicy =
      cancellationPolicy === 'FLEXIBLE' || cancellationPolicy === 'STRICT'
        ? cancellationPolicy
        : 'MODERATE';

    // Resolve destination (prefer explicit, otherwise look up the location)
    let resolvedDestination = String(destination || '').trim();
    if (!resolvedDestination && mainLocationId) {
      try {
        const loc = await (prisma as any).locations.findUnique({
          where: { id: mainLocationId },
          select: { name: true },
        });
        resolvedDestination = loc?.name || '';
      } catch {
        /* ignore */
      }
    }
    if (!resolvedDestination) resolvedDestination = 'TBD';

    // Cover/gallery normalization (support both `images` array from Quick + cover/gallery from Detailed)
    let coverImg = coverImage || null;
    let galleryArr: string[] = [];
    if (Array.isArray(images) && images.length > 0) {
      // Quick add: first image becomes cover, rest are gallery
      if (!coverImg) coverImg = images[0];
      galleryArr = images.filter((u: string) => u && u !== coverImg);
    } else if (galleryImages) {
      if (Array.isArray(galleryImages)) galleryArr = galleryImages;
      else if (typeof galleryImages === 'string') {
        try {
          const parsed = JSON.parse(galleryImages);
          galleryArr = Array.isArray(parsed) ? parsed : [];
        } catch {
          galleryArr = [];
        }
      }
    }

    const baseSlug = slugify(String(title));
    const slug = await uniqueSlugForAgent(auth.travelAgentId, baseSlug);

    const finalBasePrice = basePrice != null && basePrice !== '' ? Number(basePrice) : null;
    const finalStartingPrice =
      startingPrice != null && startingPrice !== ''
        ? Number(startingPrice)
        : finalBasePrice; // mirror basePrice into legacy startingPrice

    const newId = 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
    const now = new Date();

    // Use raw insert to bypass any stale Prisma client validation on new fields
    await (prisma as any).$executeRawUnsafe(
      `INSERT INTO travel_agent_tours (
        id, travelAgentId, title, slug, shortDescription, description,
        destination, mainLocationId, categoryId, subCategoryId, experienceId, category,
        duration, durationDays, durationNights,
        priceType, basePrice, startingPrice, priceTiers,
        highlights, customPlaces, inclusions, exclusions, itinerary, termsConditions,
        coverImage, galleryImages,
        vehicleIds, vehicleOptions,
        pickupType, meetingPoint, guideLanguages, availableDays,
        advanceNoticeHours, cancellationPolicy, cancellationNotes,
        requireAdvancePayment, advancePaymentType, advancePaymentValue,
        tourStartDate, tourEndDate,
        status, createMode, isActive, isPublic,
        totalBookings, rating, totalRatings,
        createdAt, updatedAt
      ) VALUES (?,?,?,?,?,?, ?,?,?,?,?,?, ?,?,?, ?,?,?,?, ?,?,?,?,?,?, ?,?, ?,?, ?,?,?,?, ?,?,?, ?,?,?, ?,?, ?,?,?,?, 0,0,0, ?,?)`,
      newId,
      auth.travelAgentId,
      String(title).trim(),
      slug,
      shortDescription?.trim() || null,
      description || null,

      resolvedDestination,
      mainLocationId || null,
      categoryId || null,
      subCategoryId || null,
      experienceId || null,
      category || null,

      duration?.trim() || null,
      durationDays ? Number(durationDays) : 1,
      durationNights ? Number(durationNights) : 0,

      safePriceType,
      finalBasePrice,
      finalStartingPrice,
      asJsonString(priceTiers),

      asJsonString(highlights),
      asJsonString(customPlaces),
      asJsonString(inclusions),
      asJsonString(exclusions),
      asJsonString(itinerary),
      termsConditions || null,

      coverImg || null,
      galleryArr.length > 0 ? JSON.stringify(galleryArr) : null,

      asJsonString(vehicleIds),
      asJsonString(vehicleOptions),

      pickupType || null,
      meetingPoint?.trim() || null,
      asJsonString(guideLanguages),
      asJsonString(availableDays),

      advanceNoticeHours ? parseInt(advanceNoticeHours) : 24,
      safeCancellationPolicy,
      cancellationNotes?.trim() || null,

      requireAdvancePayment === true ? 1 : 0,
      requireAdvancePayment ? advancePaymentType || null : null,
      requireAdvancePayment && advancePaymentValue ? parseFloat(advancePaymentValue) : null,

      tourStartDate ? new Date(tourStartDate) : null,
      tourEndDate ? new Date(tourEndDate) : null,

      safeStatus,
      safeCreateMode,
      1, // isActive (default true)
      safeStatus === 'ACTIVE' ? 1 : 0, // isPublic mirrors ACTIVE for now (admin can later gate further)

      now,
      now,
    );

    const tour = await (prisma as any).travel_agent_tours.findUnique({ where: { id: newId } });
    return NextResponse.json({ tour, id: newId }, { status: 201 });
  } catch (error: any) {
    logger.error('Create travel agent tour error', error);
    return NextResponse.json(
      { error: 'Failed to create tour', details: error?.message },
      { status: 500 },
    );
  }
}
