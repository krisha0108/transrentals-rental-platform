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

// GET - List all vehicle categories (sub-services of car-rental)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Find car-rental service
    const carRentalService = await prisma.services.findFirst({
      where: {
        slug: 'car-rental',
        parentId: null,
      },
    });

    if (!carRentalService) {
      return NextResponse.json({
        success: true,
        categories: [],
        message: 'Car rental service not found',
      });
    }

    // Fetch sub-services (categories)
    const categories = await prisma.services.findMany({
      where: {
        parentId: carRentalService.id,
      },
      include: {
        _count: {
          select: {
            vehicle_models: true,
          },
        },
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      categories,
      parentServiceId: carRentalService.id,
    });
  } catch (error: any) {
    logger.error('Failed to fetch categories', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Create a new vehicle category
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
    const { name, description, icon } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
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

    if (!carRentalService) {
      return NextResponse.json(
        { success: false, error: 'Car rental service not found. Please create it first.' },
        { status: 400 }
      );
    }

    // Generate slug
    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    // Check for unique slug
    while (await prisma.services.findFirst({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Get next display order
    const maxOrder = await prisma.services.aggregate({
      where: { parentId: carRentalService.id },
      _max: { displayOrder: true },
    });

    const category = await prisma.services.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        icon: icon || null,
        parentId: carRentalService.id,
        isActive: true,
        displayOrder: (maxOrder._max.displayOrder || 0) + 1,
      },
      include: {
        _count: {
          select: { vehicle_models: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      category,
      message: 'Category created successfully',
    });
  } catch (error: any) {
    logger.error('Failed to create category', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category', details: error?.message },
      { status: 500 }
    );
  }
}
