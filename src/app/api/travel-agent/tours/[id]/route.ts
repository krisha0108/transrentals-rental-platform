// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

function asJsonString(v: any): string | null {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v === 'string') {
    try {
      JSON.parse(v);
      return v;
    } catch {
      return JSON.stringify(v);
    }
  }
  return JSON.stringify(v);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const tour: any = await (prisma as any).travel_agent_tours.findUnique({ where: { id } });
    if (!tour || tour.travelAgentId !== auth.travelAgentId) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    // Resolve attached fleet vehicles (vehicleIds is JSON array of fleet IDs)
    let attachedVehicles: any[] = [];
    try {
      const ids: string[] = tour.vehicleIds ? JSON.parse(tour.vehicleIds) : [];
      if (ids.length > 0) {
        attachedVehicles = await (prisma as any).travel_agent_fleets.findMany({
          where: { id: { in: ids }, travelAgentId: auth.travelAgentId },
        });
      }
    } catch {
      /* ignore */
    }

    // Resolve mainLocation (for prefilling location-picker on edit pages)
    let mainLocation: any = null;
    if (tour.mainLocationId) {
      try {
        mainLocation = await (prisma as any).locations.findUnique({
          where: { id: tour.mainLocationId },
          select: { id: true, name: true, slug: true, type: true },
        });
      } catch {
        /* ignore */
      }
    }

    // Build a unified `images` array (cover + gallery) for Quick edit prefill
    let images: string[] = [];
    if (tour.coverImage) images.push(tour.coverImage);
    if (tour.galleryImages) {
      try {
        const arr = JSON.parse(tour.galleryImages);
        if (Array.isArray(arr)) images = images.concat(arr.filter((u: string) => u && u !== tour.coverImage));
      } catch {
        /* ignore */
      }
    }

    return NextResponse.json({ ...tour, attachedVehicles, mainLocation, images });
  } catch (error: any) {
    logger.error('Get tour error', error);
    return NextResponse.json(
      { error: 'Failed to fetch tour', details: error?.message },
      { status: 500 },
    );
  }
}

// Build an update-data dict for both PUT and PATCH from the body
function buildUpdateData(body: any): Record<string, any> {
  const data: Record<string, any> = {};

  // Plain string fields
  const stringFields = [
    'title',
    'shortDescription',
    'description',
    'duration',
    'destination',
    'meetingPoint',
    'pickupType',
    'cancellationNotes',
    'category',
    'termsConditions',
    'advancePaymentType',
  ];
  stringFields.forEach((f) => {
    if (body[f] !== undefined) {
      const v = body[f];
      data[f] = v === null ? null : typeof v === 'string' ? v.trim() || null : v;
    }
  });

  // FK / IDs (allow null to clear)
  ['categoryId', 'subCategoryId', 'experienceId', 'mainLocationId'].forEach((f) => {
    if (body[f] !== undefined) data[f] = body[f] || null;
  });

  // Enums
  if (body.priceType !== undefined) {
    const v = body.priceType;
    data.priceType =
      v === 'PER_PERSON' || v === 'PER_GROUP' || v === 'ON_REQUEST' ? v : 'ON_REQUEST';
  }
  if (body.cancellationPolicy !== undefined) {
    const v = body.cancellationPolicy;
    data.cancellationPolicy =
      v === 'FLEXIBLE' || v === 'STRICT' ? v : 'MODERATE';
  }
  if (body.status !== undefined) {
    const v = body.status;
    data.status =
      v === 'ACTIVE' || v === 'PAUSED' || v === 'INACTIVE' || v === 'DRAFT' ? v : 'DRAFT';
  }
  if (body.createMode !== undefined) {
    data.createMode = body.createMode === 'QUICK' ? 'QUICK' : 'DETAILED';
  }

  // Numerics
  if (body.basePrice !== undefined) {
    data.basePrice = body.basePrice != null && body.basePrice !== '' ? Number(body.basePrice) : null;
  }
  if (body.startingPrice !== undefined) {
    data.startingPrice =
      body.startingPrice != null && body.startingPrice !== '' ? Number(body.startingPrice) : null;
  }
  if (body.durationDays !== undefined) data.durationDays = Number(body.durationDays) || 1;
  if (body.durationNights !== undefined) data.durationNights = Number(body.durationNights) || 0;
  if (body.advanceNoticeHours !== undefined)
    data.advanceNoticeHours = parseInt(body.advanceNoticeHours) || 24;
  if (body.advancePaymentValue !== undefined)
    data.advancePaymentValue =
      body.advancePaymentValue != null && body.advancePaymentValue !== ''
        ? parseFloat(body.advancePaymentValue)
        : null;

  // Booleans
  if (body.isActive !== undefined) data.isActive = !!body.isActive;
  if (body.isPublic !== undefined) data.isPublic = !!body.isPublic;
  if (body.requireAdvancePayment !== undefined)
    data.requireAdvancePayment = !!body.requireAdvancePayment;

  // JSON fields (LongText) — accept arrays/objects/null and stringify
  const jsonFields = [
    'priceTiers',
    'highlights',
    'customPlaces',
    'inclusions',
    'exclusions',
    'itinerary',
    'guideLanguages',
    'availableDays',
    'vehicleIds',
    'vehicleOptions',
    'galleryImages',
  ];
  jsonFields.forEach((f) => {
    if (body[f] !== undefined) data[f] = asJsonString(body[f]);
  });

  // Cover image: allow null/empty to clear
  if (body.coverImage !== undefined) data.coverImage = body.coverImage || null;

  // Dates
  if (body.tourStartDate !== undefined)
    data.tourStartDate = body.tourStartDate ? new Date(body.tourStartDate) : null;
  if (body.tourEndDate !== undefined)
    data.tourEndDate = body.tourEndDate ? new Date(body.tourEndDate) : null;

  // Synthetic: handle Quick-Add `images` array — first becomes cover, rest gallery
  if (body.images !== undefined && Array.isArray(body.images)) {
    if (body.images.length > 0) {
      data.coverImage = body.images[0];
      const gallery = body.images.slice(1);
      data.galleryImages = gallery.length > 0 ? JSON.stringify(gallery) : null;
    } else {
      data.coverImage = null;
      data.galleryImages = null;
    }
  }

  return data;
}

// PATCH - partial update (kept for back-compat: isPublic / isActive / createMode toggles)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await (prisma as any).travel_agent_tours.findUnique({ where: { id } });
    if (!existing || existing.travelAgentId !== auth.travelAgentId) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    const body = await request.json();

    // Gate publishing on approved status
    if (body.isPublic === true) {
      const agent = await (prisma as any).travel_agents.findUnique({
        where: { id: auth.travelAgentId },
        select: { status: true },
      });
      if (agent?.status !== 'APPROVED') {
        return NextResponse.json(
          { error: 'Get verified to publish tours publicly' },
          { status: 403 },
        );
      }
    }

    const data = buildUpdateData(body);
    const updated = await (prisma as any).travel_agent_tours.update({
      where: { id },
      data,
    });
    return NextResponse.json({ tour: updated });
  } catch (error: any) {
    logger.error('Update tour error', error);
    return NextResponse.json(
      { error: 'Failed to update tour', details: error?.message },
      { status: 500 },
    );
  }
}

// PUT - full update (used by Quick Edit + Detailed Edit pages)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await (prisma as any).travel_agent_tours.findUnique({ where: { id } });
    if (!existing || existing.travelAgentId !== auth.travelAgentId) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    const body = await request.json();

    // Auto-publish/unpublish via status: ACTIVE → public, anything else → not public
    if (body.status === 'ACTIVE' && body.isPublic === undefined) {
      body.isPublic = true;
    }
    if (body.status && body.status !== 'ACTIVE' && body.isPublic === undefined) {
      body.isPublic = false;
    }

    if (body.isPublic === true) {
      const agent = await (prisma as any).travel_agents.findUnique({
        where: { id: auth.travelAgentId },
        select: { status: true },
      });
      if (agent?.status !== 'APPROVED') {
        // Don't fail save — silently keep private. Caller can show a banner.
        body.isPublic = false;
        if (body.status === 'ACTIVE') body.status = 'DRAFT';
      }
    }

    // Mirror basePrice <-> startingPrice
    if (body.basePrice !== undefined && body.startingPrice === undefined) {
      body.startingPrice = body.basePrice;
    }

    const data = buildUpdateData(body);
    const updated = await (prisma as any).travel_agent_tours.update({
      where: { id },
      data,
    });
    return NextResponse.json({ tour: updated, ...updated });
  } catch (error: any) {
    logger.error('Update tour error (PUT)', error);
    return NextResponse.json(
      { error: 'Failed to update tour', details: error?.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await (prisma as any).travel_agent_tours.findUnique({ where: { id } });
    if (!existing || existing.travelAgentId !== auth.travelAgentId) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    await (prisma as any).travel_agent_tours.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Delete tour error', error);
    return NextResponse.json(
      { error: 'Failed to delete tour', details: error?.message },
      { status: 500 },
    );
  }
}
