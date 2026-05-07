// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

function safeJson(val: any, fallback: any = []) {
  if (Array.isArray(val) || (val && typeof val === 'object')) return val;
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const identifier = params.id;
    const isPreview = req.nextUrl.searchParams.get('preview') === '1';

    const whereClause: any = { OR: [{ slug: identifier }, { id: identifier }] };
    if (!isPreview) whereClause.status = 'ACTIVE';

    // 1) First try the vendor wander_listings table

    const raw = await (prisma as any).wander_listings.findFirst({
      where: whereClause,
      include: {
        category:     { select: { id: true, name: true, icon: true, slug: true, description: true } },
        mainLocation: { select: { id: true, name: true, slug: true } },
        vendor: {
          select: {
            id: true, businessName: true, phone: true, logo: true,
            description: true, rating: true, totalRatings: true, createdAt: true,
            _count: { select: { wander_listings: { where: { status: 'ACTIVE' } } } },
          },
        },
        _count: { select: { quoteRequests: true } },
      },
    });

    if (raw) {
      const listing = {
        ...raw,
        images:     safeJson(raw.images, []),
        priceTiers: safeJson(raw.priceTiers, []),
        inclusions: safeJson(raw.inclusions, []),
        exclusions: safeJson(raw.exclusions, []),
        highlights: safeJson(raw.highlights, []),
        itinerary:  safeJson(raw.itinerary, []),
        tripTypes:  safeJson(raw.tripTypes, []),
        occasions:  safeJson(raw.occasions, []),
        vendor: raw.vendor ? { ...raw.vendor, name: raw.vendor.businessName } : null,
        source: 'VENDOR',
      };
      return NextResponse.json({ listing });
    }

    // 2) Fallback: travel-agent published tours (matched by slug or id, must be public + active)
    const agentTour = await (prisma as any).travel_agent_tours.findFirst({
      where: {
        OR: [{ slug: identifier }, { id: identifier }],
        isPublic: true,
        isActive: true,
      },
      include: {
        travel_agents: {
          select: {
            id: true,
            agencyName: true,
            phone: true,
            logo: true,
            description: true,
            rating: true,
            totalRatings: true,
            createdAt: true,
            _count: {
              select: {
                travel_agent_tours: { where: { isPublic: true, isActive: true } },
              },
            },
          },
        },
      },
    });

    if (!agentTour) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    // Normalize travel_agent_tours into the wander listing shape so the front-end works.
    // Inclusions on agent tours may be stored as { highlights: [], items: [] } JSON.
    const inclusionsRaw = safeJson(agentTour.inclusions, null);
    let inclusions: string[] = [];
    let highlights: string[] = [];
    if (Array.isArray(inclusionsRaw)) {
      inclusions = inclusionsRaw;
    } else if (inclusionsRaw && typeof inclusionsRaw === 'object') {
      inclusions = Array.isArray(inclusionsRaw.items) ? inclusionsRaw.items : [];
      highlights = Array.isArray(inclusionsRaw.highlights) ? inclusionsRaw.highlights : [];
    }
    const exclusions = safeJson(agentTour.exclusions, []);
    const gallery = safeJson(agentTour.galleryImages, []);
    const allImages = [agentTour.coverImage, ...gallery].filter(Boolean);

    // Resolve attached vehicles (vehicleIds is JSON array of fleet IDs)
    let attachedVehicles: any[] = [];
    try {
      const vehicleIds: string[] = agentTour.vehicleIds ? JSON.parse(agentTour.vehicleIds) : [];
      if (vehicleIds.length > 0) {
        const fleets = await (prisma as any).travel_agent_fleets.findMany({
          where: {
            id: { in: vehicleIds },
            travelAgentId: agentTour.travel_agents.id,
            isActive: true,
          },
        });
        attachedVehicles = fleets.map((v: any) => ({
          id: v.id,
          vehicleType: v.vehicleType,
          vehicleName: v.vehicleName,
          brand: v.brand,
          model: v.model,
          yearOfManufacture: v.yearOfManufacture,
          seatingCapacity: v.seatingCapacity,
          luggageCapacity: v.luggageCapacity,
          fuelType: v.fuelType,
          transmission: v.transmission,
          chauffeurIncluded: v.chauffeurIncluded,
          amenities: safeJson(v.amenities, []),
          ratePerDay: v.ratePerDay,
          coverImage: v.coverImage,
        }));
      }
    } catch {
      // ignore — return tour without vehicles
    }

    // Itinerary on agent tours is plain text — wrap it as a single "Day" entry the
    // existing detail page can render.
    const itinerary = agentTour.itinerary
      ? [{ day: 1, title: 'Itinerary', description: agentTour.itinerary }]
      : [];

    const duration =
      agentTour.durationDays > 0
        ? `${agentTour.durationDays} Day${agentTour.durationDays !== 1 ? 's' : ''}${
            agentTour.durationNights > 0
              ? ` / ${agentTour.durationNights} Night${agentTour.durationNights !== 1 ? 's' : ''}`
              : ''
          }`
        : '';

    const listing = {
      id: agentTour.id,
      slug: agentTour.slug,
      title: agentTour.title,
      shortDescription: agentTour.description,
      description: agentTour.description,
      duration,
      images: allImages,
      basePrice: agentTour.startingPrice,
      priceType: agentTour.startingPrice ? 'PER_PERSON' : 'ON_REQUEST',
      priceTiers: [],
      inclusions,
      exclusions,
      highlights,
      itinerary,
      tripTypes: [],
      occasions: [],
      tourStartDate: null,
      tourEndDate: null,
      cancellationPolicy: 'MODERATE',
      cancellationNotes: agentTour.termsConditions || null,
      status: agentTour.isActive ? 'ACTIVE' : 'INACTIVE',
      rating: agentTour.rating,
      totalRatings: agentTour.totalRatings,
      createdAt: agentTour.createdAt,
      category: agentTour.category
        ? { id: null, name: agentTour.category, icon: '🗺️', slug: null, description: null }
        : null,
      mainLocation: agentTour.destination
        ? { id: null, name: agentTour.destination, slug: null }
        : null,
      vendor: {
        id: agentTour.travel_agents.id,
        businessName: agentTour.travel_agents.agencyName,
        name: agentTour.travel_agents.agencyName,
        phone: agentTour.travel_agents.phone,
        logo: agentTour.travel_agents.logo,
        description: agentTour.travel_agents.description,
        rating: agentTour.travel_agents.rating,
        totalRatings: agentTour.travel_agents.totalRatings,
        createdAt: agentTour.travel_agents.createdAt,
        _count: {
          wander_listings: agentTour.travel_agents._count.travel_agent_tours,
        },
      },
      _count: { quoteRequests: agentTour.totalBookings || 0 },
      attachedVehicles,
      source: 'TRAVEL_AGENT',
    };

    return NextResponse.json({ listing });
  } catch (error) {
    console.error('[Public Wander Listing GET]', error);
    return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 });
  }
}
