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

    const stats = {
      total: properties.length,
      active: properties.filter((p) => p.isActive).length,
      published: properties.filter((p) => p.isPublic).length,
    };

    return NextResponse.json({ properties, stats });
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
      latitude,
      longitude,
      totalRooms,
      startingPrice,
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
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        totalRooms: totalRooms ? Number(totalRooms) : 1,
        startingPrice: startingPrice ? Number(startingPrice) : null,
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
