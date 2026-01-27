export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

// GET - Fetch transfer routes for an airport
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceSlug = searchParams.get('serviceSlug');

    // Get service ID if serviceSlug provided
    let serviceId: string | undefined;
    if (serviceSlug) {
      const service = await prisma.services.findUnique({
        where: { slug: serviceSlug },
      });
      serviceId = service?.id;
    }

    // Fetch routes from/to this airport
    const routes = await prisma.chauffeur_route_packages.findMany({
      where: {
        OR: [{ fromLocationId: params.id }, { toLocationId: params.id }],
        ...(serviceId && {
          chauffeur_vehicle_categories: { serviceId },
        }),
        isActive: true,
      },
      include: {
        locations_chauffeur_route_packages_fromLocationIdTolocations: {
          select: { id: true, name: true, code: true, type: true },
        },
        locations_chauffeur_route_packages_toLocationIdTolocations: {
          select: { id: true, name: true, code: true, type: true },
        },
        chauffeur_vehicle_categories: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: [
        { chauffeur_vehicle_categories: { displayOrder: 'asc' } },
        { basePrice: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      routes: routes.map((r) => ({
        id: r.id,
        fromLocation: r.fromLocation,
        toLocation: r.toLocation,
        chauffeur_vehicle_categories: r.vehicle_category,
        estimatedKm: r.estimatedKm,
        estimatedDuration: r.estimatedDuration,
        basePrice: r.basePrice,
        returnMultiplier: r.returnMultiplier,
        tollsEstimate: r.tollsEstimate,
        isPopular: r.isPopular,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch airport routes:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch routes' }, { status: 500 });
  }
}
