import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

function safeJson(val: any, fallback: any = []) {
  if (Array.isArray(val) || (val && typeof val === 'object')) return val;
  if (!val) return fallback;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

// PUBLIC — no auth required. Returns full agent profile with their published
// tours, properties, fleet, and stats. Blocked / suspended / rejected agents
// return 404 (link looks dead so it's not exposed).
export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const { slug } = params;

    // Match either slug or raw id, so the share URL stays useful even if the
    // agent hasn't picked a custom slug yet.
    const agent = await prisma.travel_agents.findFirst({
      where: { OR: [{ slug }, { id: slug }] },
      select: {
        id: true,
        slug: true,
        agencyName: true,
        agencyType: true,
        ownerName: true,
        logo: true,
        description: true,
        website: true,
        phone: true,
        email: true,
        city: true,
        state: true,
        pincode: true,
        address: true,
        status: true,
        rating: true,
        totalRatings: true,
        createdAt: true,
      },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    if (['BLOCKED', 'SUSPENDED', 'REJECTED'].includes(agent.status)) {
      return NextResponse.json({ error: 'Agency not available' }, { status: 404 });
    }

    // Pull the agency's public-facing inventory in parallel
    const [tours, properties, fleet, bookingsCount, totalLeadsCount] = await Promise.all([
      prisma.travel_agent_tours.findMany({
        where: { travelAgentId: agent.id, isPublic: true, isActive: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.travel_agent_properties.findMany({
        where: { travelAgentId: agent.id, isPublic: true, isActive: true },
        orderBy: { createdAt: 'desc' },
      }),
      (prisma as any).travel_agent_fleets.findMany({
        where: { travelAgentId: agent.id, isActive: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.travel_agent_bookings.count({
        where: { travelAgentId: agent.id, status: { in: ['CONFIRMED', 'COMPLETED'] as any } },
      }),
      prisma.travel_agent_leads.count({
        where: { travelAgentId: agent.id },
      }),
    ]);

    // Normalize JSON-string fields so the front-end gets ready-to-use arrays
    const normalizedTours = tours.map((t: any) => {
      const inclusionsRaw = safeJson(t.inclusions, null);
      let inclusionsList: string[] = [];
      let highlights: string[] = [];
      if (Array.isArray(inclusionsRaw)) {
        inclusionsList = inclusionsRaw;
      } else if (inclusionsRaw && typeof inclusionsRaw === 'object') {
        inclusionsList = Array.isArray(inclusionsRaw.items) ? inclusionsRaw.items : [];
        highlights = Array.isArray(inclusionsRaw.highlights) ? inclusionsRaw.highlights : [];
      }
      return {
        id: t.id,
        slug: t.slug,
        title: t.title,
        destination: t.destination,
        description: t.description,
        durationDays: t.durationDays,
        durationNights: t.durationNights,
        startingPrice: t.startingPrice,
        category: t.category,
        coverImage: t.coverImage,
        galleryImages: safeJson(t.galleryImages, []),
        highlights,
        inclusions: inclusionsList,
        rating: t.rating,
        totalRatings: t.totalRatings,
      };
    });

    const normalizedProperties = properties.map((p: any) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      propertyType: p.propertyType,
      description: p.description,
      address: p.address,
      city: p.city,
      state: p.state,
      totalRooms: p.totalRooms,
      startingPrice: p.startingPrice,
      amenities: safeJson(p.amenities, []),
      coverImage: p.coverImage,
      galleryImages: safeJson(p.galleryImages, []),
      rating: p.rating,
      totalRatings: p.totalRatings,
    }));

    const normalizedFleet = fleet.map((f: any) => ({
      id: f.id,
      vehicleType: f.vehicleType,
      vehicleName: f.vehicleName,
      brand: f.brand,
      model: f.model,
      yearOfManufacture: f.yearOfManufacture,
      color: f.color,
      fuelType: f.fuelType,
      transmission: f.transmission,
      seatingCapacity: f.seatingCapacity,
      luggageCapacity: f.luggageCapacity,
      chauffeurIncluded: f.chauffeurIncluded,
      amenities: safeJson(f.amenities, []),
      ratePerDay: f.ratePerDay,
      ratePerKm: f.ratePerKm,
      coverImage: f.coverImage,
      galleryImages: safeJson(f.galleryImages, []),
      isAvailable: f.isAvailable,
      baseLocation: f.baseLocation,
    }));

    const memberSinceMonths = Math.max(
      1,
      Math.floor(
        (Date.now() - new Date(agent.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30),
      ),
    );

    return NextResponse.json({
      agency: {
        id: agent.id,
        slug: agent.slug || agent.id,
        agencyName: agent.agencyName,
        agencyType: agent.agencyType,
        ownerName: agent.ownerName,
        logo: agent.logo,
        description: agent.description,
        website: agent.website,
        phone: agent.phone,
        email: agent.email,
        city: agent.city,
        state: agent.state,
        pincode: agent.pincode,
        address: agent.address,
        status: agent.status,
        isVerified: agent.status === 'APPROVED',
        rating: agent.rating,
        totalRatings: agent.totalRatings,
        memberSince: agent.createdAt,
        memberSinceMonths,
      },
      tours: normalizedTours,
      properties: normalizedProperties,
      fleet: normalizedFleet,
      stats: {
        toursCount: normalizedTours.length,
        propertiesCount: normalizedProperties.length,
        fleetCount: normalizedFleet.length,
        bookingsCount,
        leadsCount: totalLeadsCount,
      },
    });
  } catch (error: any) {
    logger.error('Public agent profile error', error);
    return NextResponse.json(
      { error: 'Failed to load agency profile', details: error?.message },
      { status: 500 },
    );
  }
}
