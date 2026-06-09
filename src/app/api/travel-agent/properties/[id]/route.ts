import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

const VALID_TYPES = [
  'RESORT',
  'HOTEL',
  'HOMESTAY',
  'APARTMENT',
  'VILLA',
  'GUEST_HOUSE',
  'HOSTEL',
  'ROOMS',
  'OTHER',
];

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
    const property = await prisma.travel_agent_properties.findUnique({ where: { id } });
    if (!property || property.travelAgentId !== auth.travelAgentId) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json(property);
  } catch (error: any) {
    logger.error('Get property error', error);
    return NextResponse.json(
      { error: 'Failed to fetch property', details: error?.message },
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
    const existing = await prisma.travel_agent_properties.findUnique({ where: { id } });
    if (!existing || existing.travelAgentId !== auth.travelAgentId) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      propertyType,
      description,
      address,
      city,
      state,
      pincode,
      landmark,
      latitude,
      longitude,
      totalRooms,
      bedroomsCount,
      bathroomsCount,
      maxGuests,
      startingPrice,
      minNights,
      maxNights,
      cancellationPolicy,
      highlights,
      amenities,
      inclusions,
      exclusions,
      rules,
      checkInTime,
      checkOutTime,
      coverImage,
      galleryImages,
      isActive,
      isPublic,
    } = body;

    if (propertyType !== undefined && !VALID_TYPES.includes(propertyType)) {
      return NextResponse.json({ error: 'Invalid propertyType' }, { status: 400 });
    }

    if (isPublic === true) {
      const agent = await prisma.travel_agents.findUnique({
        where: { id: auth.travelAgentId },
        select: { status: true },
      });
      if (agent?.status !== 'APPROVED') {
        return NextResponse.json(
          { error: 'Get verified to publish properties publicly' },
          { status: 403 },
        );
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (propertyType !== undefined) updateData.propertyType = propertyType;
    if (description !== undefined) updateData.description = description || null;
    if (address !== undefined) updateData.address = address || null;
    if (city !== undefined) updateData.city = city || null;
    if (state !== undefined) updateData.state = state || null;
    if (pincode !== undefined) updateData.pincode = pincode || null;
    if (landmark !== undefined) updateData.landmark = landmark || null;
    if (latitude !== undefined) updateData.latitude = latitude ? Number(latitude) : null;
    if (longitude !== undefined) updateData.longitude = longitude ? Number(longitude) : null;
    if (totalRooms !== undefined) updateData.totalRooms = Number(totalRooms) || 1;
    if (bedroomsCount !== undefined) updateData.bedroomsCount = bedroomsCount ? Number(bedroomsCount) : null;
    if (bathroomsCount !== undefined) updateData.bathroomsCount = bathroomsCount ? Number(bathroomsCount) : null;
    if (maxGuests !== undefined) updateData.maxGuests = maxGuests ? Number(maxGuests) : null;
    if (startingPrice !== undefined)
      updateData.startingPrice = startingPrice ? Number(startingPrice) : null;
    if (minNights !== undefined) updateData.minNights = minNights ? Number(minNights) : 1;
    if (maxNights !== undefined) updateData.maxNights = maxNights ? Number(maxNights) : null;
    if (cancellationPolicy !== undefined) updateData.cancellationPolicy = cancellationPolicy || null;
    if (highlights !== undefined) updateData.highlights = highlights || null;
    if (amenities !== undefined) updateData.amenities = amenities || null;
    if (inclusions !== undefined) updateData.inclusions = inclusions || null;
    if (exclusions !== undefined) updateData.exclusions = exclusions || null;
    if (rules !== undefined) updateData.rules = rules || null;
    if (checkInTime !== undefined) updateData.checkInTime = checkInTime || null;
    if (checkOutTime !== undefined) updateData.checkOutTime = checkOutTime || null;
    if (coverImage !== undefined) updateData.coverImage = coverImage || null;
    if (galleryImages !== undefined) updateData.galleryImages = galleryImages || null;
    if (isActive !== undefined) updateData.isActive = !!isActive;
    if (isPublic !== undefined) updateData.isPublic = !!isPublic;

    const updated = await prisma.travel_agent_properties.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ property: updated });
  } catch (error: any) {
    logger.error('Update property error', error);
    return NextResponse.json(
      { error: 'Failed to update property', details: error?.message },
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
    const existing = await prisma.travel_agent_properties.findUnique({ where: { id } });
    if (!existing || existing.travelAgentId !== auth.travelAgentId) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    await prisma.travel_agent_properties.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Delete property error', error);
    return NextResponse.json(
      { error: 'Failed to delete property', details: error?.message },
      { status: 500 },
    );
  }
}
