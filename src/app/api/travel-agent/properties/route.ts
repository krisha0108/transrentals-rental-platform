import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import crypto from 'crypto';
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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

async function uniqueSlugForAgent(travelAgentId: string, base: string): Promise<string> {
  let attempt = base || 'property';
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.travel_agent_properties.findFirst({
      where: { travelAgentId, slug: attempt },
      select: { id: true },
    });
    if (!exists) return attempt;
    attempt = `${base}-${crypto.randomBytes(2).toString('hex')}`;
  }
  return `${base}-${crypto.randomBytes(4).toString('hex')}`;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const propertyType = searchParams.get('propertyType');
    const city = searchParams.get('city');
    const isActive = searchParams.get('isActive');
    const isPublic = searchParams.get('isPublic');

    const where: any = { travelAgentId: auth.travelAgentId };
    if (propertyType && VALID_TYPES.includes(propertyType)) where.propertyType = propertyType;
    if (city) where.city = { contains: city };
    if (isActive === 'true') where.isActive = true;
    if (isActive === 'false') where.isActive = false;
    if (isPublic === 'true') where.isPublic = true;
    if (isPublic === 'false') where.isPublic = false;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { city: { contains: search } },
      ];
    }

    const properties = await prisma.travel_agent_properties.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Enquiry/quote-request counts per property — every lead captured from a
    // property's public listing page carries propertyId (see the public
    // enquiry endpoint), so this is a simple group-by over this agent's leads.
    const enquiryCountRows = await prisma.travel_agent_leads.groupBy({
      by: ['propertyId'],
      where: { travelAgentId: auth.travelAgentId, propertyId: { not: null } },
      _count: { _all: true },
    });
    const enquiryCountByProperty: Record<string, number> = {};
    for (const row of enquiryCountRows) {
      if (row.propertyId) enquiryCountByProperty[row.propertyId] = row._count._all;
    }
    const propertiesWithCounts = properties.map((p) => ({
      ...p,
      enquiryCount: enquiryCountByProperty[p.id] || 0,
    }));

    const ratedProps = properties.filter((p) => (p.totalRatings || 0) > 0);
    const stats = {
      total: properties.length,
      active: properties.filter((p) => p.isActive).length,
      published: properties.filter((p) => p.isPublic).length,
      avgRating: ratedProps.length > 0
        ? Number((ratedProps.reduce((s, p) => s + (p.rating || 0), 0) / ratedProps.length).toFixed(1))
        : null,
      totalEnquiries: enquiryCountRows.reduce((s, r) => s + r._count._all, 0),
    };

    return NextResponse.json({ properties: propertiesWithCounts, stats });
  } catch (error: any) {
    logger.error('List travel agent properties error', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties', details: error?.message },
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
    } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: 'Property name is required' }, { status: 400 });
    }
    if (propertyType && !VALID_TYPES.includes(propertyType)) {
      return NextResponse.json({ error: 'Invalid propertyType' }, { status: 400 });
    }

    const baseSlug = slugify(String(name));
    const slug = await uniqueSlugForAgent(auth.travelAgentId, baseSlug);

    const property = await prisma.travel_agent_properties.create({
      data: {
        travelAgentId: auth.travelAgentId,
        name: String(name).trim(),
        slug,
        propertyType: propertyType || 'RESORT',
        description: description || null,
        address: address || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        landmark: landmark || null,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        totalRooms: totalRooms ? Number(totalRooms) : 1,
        bedroomsCount: bedroomsCount ? Number(bedroomsCount) : null,
        bathroomsCount: bathroomsCount ? Number(bathroomsCount) : null,
        maxGuests: maxGuests ? Number(maxGuests) : null,
        startingPrice: startingPrice ? Number(startingPrice) : null,
        minNights: minNights ? Number(minNights) : 1,
        maxNights: maxNights ? Number(maxNights) : null,
        cancellationPolicy: cancellationPolicy || null,
        highlights: highlights || null,
        amenities: amenities || null,
        inclusions: inclusions || null,
        exclusions: exclusions || null,
        rules: rules || null,
        checkInTime: checkInTime || null,
        checkOutTime: checkOutTime || null,
        coverImage: coverImage || null,
        galleryImages: galleryImages || null,
        isActive: true,
        isPublic: false,
      },
    });

    return NextResponse.json({ property }, { status: 201 });
  } catch (error: any) {
    logger.error('Create travel agent property error', error);
    return NextResponse.json(
      { error: 'Failed to create property', details: error?.message },
      { status: 500 },
    );
  }
}
