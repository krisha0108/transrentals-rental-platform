import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

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
    const tour: any = await prisma.travel_agent_tours.findUnique({ where: { id } });
    if (!tour || tour.travelAgentId !== auth.travelAgentId) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    // Resolve attached vehicles (vehicleIds is JSON array of fleet IDs)
    let attachedVehicles: any[] = [];
    try {
      const ids: string[] = tour.vehicleIds ? JSON.parse(tour.vehicleIds) : [];
      if (ids.length > 0) {
        attachedVehicles = await (prisma as any).travel_agent_fleets.findMany({
          where: { id: { in: ids }, travelAgentId: auth.travelAgentId },
        });
      }
    } catch {
      // ignore parse errors — return tour without vehicles
    }

    return NextResponse.json({ ...tour, attachedVehicles });
  } catch (error: any) {
    logger.error('Get tour error', error);
    return NextResponse.json(
      { error: 'Failed to fetch tour', details: error?.message },
      { status: 500 },
    );
  }
}

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
    const existing = await prisma.travel_agent_tours.findUnique({ where: { id } });
    if (!existing || existing.travelAgentId !== auth.travelAgentId) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      description,
      destination,
      durationDays,
      durationNights,
      startingPrice,
      inclusions,
      exclusions,
      itinerary,
      termsConditions,
      coverImage,
      galleryImages,
      vehicleIds,
      category,
      isActive,
      isPublic,
    } = body;

    // Gate publishing on approved status — non-approved agents can save listings
    // but cannot make them customer-visible.
    if (isPublic === true) {
      const agent = await prisma.travel_agents.findUnique({
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

    const updateData: any = {};
    if (title !== undefined) updateData.title = String(title).trim();
    if (description !== undefined) updateData.description = description || null;
    if (destination !== undefined) updateData.destination = String(destination).trim();
    if (durationDays !== undefined) updateData.durationDays = Number(durationDays) || 1;
    if (durationNights !== undefined) updateData.durationNights = Number(durationNights) || 0;
    if (startingPrice !== undefined)
      updateData.startingPrice = startingPrice ? Number(startingPrice) : null;
    if (inclusions !== undefined) updateData.inclusions = inclusions || null;
    if (exclusions !== undefined) updateData.exclusions = exclusions || null;
    if (itinerary !== undefined) updateData.itinerary = itinerary || null;
    if (termsConditions !== undefined) updateData.termsConditions = termsConditions || null;
    if (coverImage !== undefined) updateData.coverImage = coverImage || null;
    if (galleryImages !== undefined) updateData.galleryImages = galleryImages || null;
    if (vehicleIds !== undefined) updateData.vehicleIds = vehicleIds || null;
    if (category !== undefined) updateData.category = category || null;
    if (isActive !== undefined) updateData.isActive = !!isActive;
    if (isPublic !== undefined) updateData.isPublic = !!isPublic;

    const updated = await prisma.travel_agent_tours.update({
      where: { id },
      data: updateData,
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
    const existing = await prisma.travel_agent_tours.findUnique({ where: { id } });
    if (!existing || existing.travelAgentId !== auth.travelAgentId) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    await prisma.travel_agent_tours.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Delete tour error', error);
    return NextResponse.json(
      { error: 'Failed to delete tour', details: error?.message },
      { status: 500 },
    );
  }
}
