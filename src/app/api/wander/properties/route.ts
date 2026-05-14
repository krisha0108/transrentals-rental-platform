// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/wander/properties
 *
 * Public listing of travel-agent properties (resorts / homestays / villas etc.)
 * shown on the wander discovery page as a horizontal scroll strip just above
 * the "How It Works" section.
 *
 * Only returns properties that are:
 *   - isPublic = true
 *   - isActive = true
 *   - owned by an active (non-blocked/suspended) travel agent
 */
export async function POST(request: NextRequest) {
  return GET(request);
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10) || 20, 50);

    const rows: any[] = await (prisma as any).travel_agent_properties.findMany({
      where: {
        isPublic: true,
        isActive: true,
        travel_agents: {
          status: { notIn: ['BLOCKED', 'SUSPENDED', 'REJECTED'] },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        propertyType: true,
        city: true,
        state: true,
        startingPrice: true,
        coverImage: true,
        rating: true,
        totalRatings: true,
        createdAt: true,
        travel_agents: {
          select: {
            id: true,
            slug: true,
            agencyName: true,
            logo: true,
          },
        },
      },
      orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });

    const properties = rows.map((p) => ({
      id: p.id,
      slug: p.slug || p.id,
      name: p.name,
      propertyType: p.propertyType,
      city: p.city,
      state: p.state,
      startingPrice: p.startingPrice,
      coverImage: p.coverImage,
      rating: p.rating,
      totalRatings: p.totalRatings,
      agencyId: p.travel_agents?.id || null,
      agencySlug: p.travel_agents?.slug || null,
      agencyName: p.travel_agents?.agencyName || null,
      agencyLogo: p.travel_agents?.logo || null,
    }));

    return NextResponse.json({ success: true, properties, total: properties.length });
  } catch (error) {
    console.error('[GET /api/wander/properties]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch properties', properties: [] },
      { status: 500 },
    );
  }
}
