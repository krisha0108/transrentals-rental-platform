import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Helper to generate slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// GET - List all car brands
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Find car-rental service to get brands associated with it
    const carRentalService = await prisma.services.findFirst({
      where: {
        slug: 'car-rental',
        parentId: null,
      },
    });

    // Fetch brands - either those associated with car rental or all
    const brands = await prisma.brands.findMany({
      where: carRentalService ? {
        OR: [
          { serviceId: carRentalService.id },
          { serviceId: null }, // Also include global brands
        ],
      } : {},
      include: {
        _count: {
          select: {
            vehicle_models: true,
          },
        },
        chauffeur_vehicle_categories: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });

    // Fetch vehicle categories for dropdown
    const vehicleCategories = await prisma.chauffeur_vehicle_categories.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      brands,
      vehicleCategories,
      serviceId: carRentalService?.id,
    });
  } catch (error: any) {
    logger.error('Failed to fetch brands', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch brands', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Create a new brand
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, logo, country, description, vehicleCategoryId } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Brand name is required' },
        { status: 400 }
      );
    }

    if (!vehicleCategoryId) {
      return NextResponse.json(
        { success: false, error: 'Vehicle category is required' },
        { status: 400 }
      );
    }

    // Verify vehicle category exists
    const vehicle_category = await prisma.chauffeur_vehicle_categories.findUnique({
      where: { id: vehicleCategoryId },
    });

    if (!vehicle_category) {
      return NextResponse.json(
        { success: false, error: 'Invalid vehicle category' },
        { status: 400 }
      );
    }

    // Find car-rental service
    const carRentalService = await prisma.services.findFirst({
      where: {
        slug: 'car-rental',
        parentId: null,
      },
    });

    // Generate slug
    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    // Check for unique slug
    while (await prisma.brands.findFirst({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Get next display order
    const maxOrder = await prisma.brands.aggregate({
      _max: { displayOrder: true },
    });

    const brand = await prisma.brands.create({
      data: {
        name: name.trim(),
        slug,
        logo: logo?.trim() || null,
        country: country?.trim() || null,
        description: description?.trim() || null,
        serviceId: carRentalService?.id || null,
        vehicleCategoryId: vehicleCategoryId,
        isActive: true,
        displayOrder: (maxOrder._max.displayOrder || 0) + 1,
      },
      include: {
        _count: {
          select: { vehicle_models: true },
        },
        chauffeur_vehicle_categories: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      brand,
      message: 'Brand created successfully',
    });
  } catch (error: any) {
    logger.error('Failed to create brand', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create brand', details: error?.message },
      { status: 500 }
    );
  }
}
