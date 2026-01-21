import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Helper to generate a cuid-like unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

// GET - List all vehicle categories
export async function GET() {
  try {
    const categories = await prisma.chauffeur_vehicle_categories.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: {
            chauffeur_city_pricing: true,
            chauffeur_local_packages: true,
            chauffeur_route_packages: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        seatingCapacity: c.seatingCapacity,
        luggageCapacity: c.luggageCapacity,
        acType: c.acType,
        fuelType: c.fuelType,
        image: c.image,
        icon: c.icon,
        displayOrder: c.displayOrder,
        isActive: c.isActive,
        isPopular: c.isPopular,
        exampleVehicles: c.exampleVehicles,
        cityPricingCount: c._count.chauffeur_city_pricing,
        localPackagesCount: c._count.chauffeur_local_packages,
        routePackagesCount: c._count.chauffeur_route_packages,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    });
  } catch (error: any) {
    logger.error('Failed to fetch vehicle categories', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vehicle categories' },
      { status: 500 }
    );
  }
}

// POST - Create new vehicle category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      slug,
      description,
      seatingCapacity,
      luggageCapacity,
      acType,
      fuelType,
      image,
      icon,
      displayOrder,
      isActive,
      isPopular,
      exampleVehicles,
    } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Check for duplicate slug
    const existing = await prisma.chauffeur_vehicle_categories.findFirst({
      where: { OR: [{ slug }, { name }] },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Vehicle category with this name or slug already exists' },
        { status: 400 }
      );
    }

    const category = await prisma.chauffeur_vehicle_categories.create({
      data: {
        id: generateId(),
        name,
        slug: slug.toLowerCase().replace(/\s+/g, '-'),
        description,
        seatingCapacity: seatingCapacity || 4,
        luggageCapacity,
        acType,
        fuelType,
        image,
        icon,
        displayOrder: displayOrder || 0,
        isActive: isActive !== false,
        isPopular: isPopular || false,
        exampleVehicles: exampleVehicles || [],
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Vehicle category created successfully',
      category,
    });
  } catch (error: any) {
    logger.error('Failed to create vehicle category', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create vehicle category', details: error?.message },
      { status: 500 }
    );
  }
}
