import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const revalidate = 43200; // 12 hours

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const locationSlug = searchParams.get('locationSlug');
    const popularOnly = searchParams.get('popular') === 'true';

    // Get car-rental service id
    const service = await prisma.services.findFirst({
      where: { slug: 'car-rental', isActive: true },
      select: { id: true },
    });

    if (!service) {
      return NextResponse.json({ success: true, packages: [] });
    }

    // Resolve location id from slug
    let locationId: string | null = null;
    if (locationSlug) {
      const loc = await prisma.locations.findFirst({
        where: { slug: locationSlug },
        select: { id: true },
      });
      locationId = loc?.id ?? null;
    }

    // Build where: packages for car-rental vehicle categories + this city (or global)
    const whereClause: any = {
      isActive: true,
      ...(popularOnly && { isPopular: true }),
      chauffeur_vehicle_categories: {
        serviceId: service.id,
        isActive: true,
      },
    };

    if (locationSlug) {
      whereClause.OR = [
        { locationId: locationId ?? 'no-match' },
        { locationId: null },
      ];
    }

    const packages = await prisma.chauffeur_local_packages.findMany({
      where: whereClause,
      orderBy: [
        { chauffeur_vehicle_categories: { displayOrder: 'asc' } },
        { hours: 'asc' },
        { displayOrder: 'asc' },
      ],
      include: {
        chauffeur_vehicle_categories: {
          select: {
            id: true,
            name: true,
            slug: true,
            seatingCapacity: true,
            luggageCapacity: true,
            acType: true,
            fuelType: true,
            image: true,
            exampleVehicles: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      packages: packages.map((p) => ({
        id: p.id,
        name: p.name,
        hours: p.hours,
        kms: p.kms,
        basePrice: p.basePrice,
        extraKmCharge: p.extraKmCharge,
        extraHourCharge: p.extraHourCharge,
        isPopular: p.isPopular,
        vehicleCategory: {
          ...p.chauffeur_vehicle_categories,
          exampleVehicles: (() => {
            try {
              const ev = p.chauffeur_vehicle_categories.exampleVehicles;
              if (!ev) return [];
              return typeof ev === 'string' ? JSON.parse(ev) : ev;
            } catch { return []; }
          })(),
        },
      })),
    });
  } catch (error) {
    console.error('Hourly car packages error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch packages' }, { status: 500 });
  }
}
