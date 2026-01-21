import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - List all fleet vehicles
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const status = searchParams.get('status') || '';

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { brand: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    const [vehicles, total] = await Promise.all([
      prisma.fleet.findMany({
        where,
        include: {
          fleet_categories: true,
          fleet_types: true,
          fleet_location_rates: {
            include: { fleet_locations: true },
          },
          fleet_availability: {
            include: { fleet_locations: true },
          },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.fleet.count({ where }),
    ]);

    return NextResponse.json({
      vehicles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Fleet list error', error);
    return NextResponse.json({ error: 'Failed to fetch fleet' }, { status: 500 });
  }
}

// POST - Create new fleet vehicle
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const {
      name,
      slug,
      brand,
      categoryId,
      typeId,
      vehicleType,
      basePrice,
      description,
      shortDesc,
      specs,
      features,
      primaryImage,
      images,
      availabilityType,
      seoKeywords,
      metaTitle,
      metaDescription,
      isActive,
      isFeatured,
      priority,
    } = body;

    // Validate required fields with specific error messages
    const missingFields: string[] = [];
    if (!name) missingFields.push('name');
    if (!slug) missingFields.push('slug');
    if (!brand) missingFields.push('brand');
    if (!categoryId) missingFields.push('categoryId');
    if (!vehicleType) missingFields.push('vehicleType');
    if (!basePrice && basePrice !== 0) missingFields.push('basePrice');

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate basePrice is a valid number
    const parsedPrice = parseFloat(basePrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json(
        { error: 'Base price must be a valid positive number' },
        { status: 400 }
      );
    }

    // Use a single transaction to validate and create - reduces connection usage
    // and ensures atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Validate categoryId exists
      const categoryExists = await tx.fleet_categories.findUnique({
        where: { id: categoryId },
      });
      if (!categoryExists) {
        throw new Error('VALIDATION:Invalid category ID. Category does not exist.');
      }

      // Validate typeId if provided
      if (typeId) {
        const typeExists = await tx.fleet_types.findUnique({
          where: { id: typeId },
        });
        if (!typeExists) {
          throw new Error('VALIDATION:Invalid type ID. Fleet type does not exist.');
        }
      }

      // Check if slug already exists
      const existing = await tx.fleet.findUnique({ where: { slug } });
      if (existing) {
        throw new Error(`VALIDATION:A vehicle with slug "${slug}" already exists. Please use a different slug.`);
      }

      // Create the vehicle
      const vehicle = await tx.fleet.create({
        data: {
          name,
          slug,
          brand,
          categoryId,
          typeId: typeId || null,
          vehicleType,
          basePrice: parsedPrice,
          description: description || null,
          shortDesc: shortDesc || null,
          specs: specs || null,
          features: features || null,
          primaryImage: primaryImage || null,
          images: images || null,
          availabilityType: availabilityType || 'ALL_INDIA',
          seoKeywords: seoKeywords || null,
          metaTitle: metaTitle || null,
          metaDescription: metaDescription || null,
          isActive: isActive !== false,
          isFeatured: isFeatured === true,
          priority: typeof priority === 'string' ? parseInt(priority) || 5 : (priority || 5),
        },
        include: {
          fleet_categories: true,
          fleet_types: true,
        },
      });

      return { vehicle, categorySlug: categoryExists.slug };
    }, {
      // Transaction options for better reliability
      maxWait: 10000, // Maximum time to wait for transaction slot (10s)
      timeout: 30000, // Maximum time for transaction to complete (30s)
    });

    // Revalidate cache for fleet pages (outside transaction)
    try {
      revalidatePath('/fleet');
      revalidatePath('/admin/fleet');
      if (result.categorySlug) {
        revalidatePath(`/fleet/${result.categorySlug}`);
      }
    } catch (revalidateError) {
      // Don't fail the request if revalidation fails
      logger.error('Revalidation error', revalidateError);
    }

    return NextResponse.json(result.vehicle, { status: 201 });
  } catch (error) {
    logger.error('Fleet create error', error);

    // Handle custom validation errors from transaction
    if (error instanceof Error && error.message.startsWith('VALIDATION:')) {
      return NextResponse.json(
        { error: error.message.replace('VALIDATION:', '') },
        { status: 400 }
      );
    }

    // Handle Prisma-specific errors with detailed messages
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          // Unique constraint violation
          const target = (error.meta?.target as string[])?.join(', ') || 'field';
          return NextResponse.json(
            { error: `A vehicle with this ${target} already exists. Please use a different value.` },
            { status: 400 }
          );
        case 'P2003':
          // Foreign key constraint failure
          return NextResponse.json(
            { error: 'Invalid category or type ID. The referenced record does not exist.' },
            { status: 400 }
          );
        case 'P2025':
          // Record not found
          return NextResponse.json(
            { error: 'Referenced record not found. Please check category and type IDs.' },
            { status: 400 }
          );
        case 'P2011':
          // Null constraint violation
          const field = error.meta?.constraint as string || 'required field';
          return NextResponse.json(
            { error: `Missing required field: ${field}` },
            { status: 400 }
          );
        default:
          return NextResponse.json(
            { error: `Database error (${error.code}): ${error.message}` },
            { status: 500 }
          );
      }
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        { error: 'Database connection error. Please try again later.' },
        { status: 503 }
      );
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      // Extract useful info from validation error
      const message = error.message.split('\n').pop() || 'Invalid data provided';
      return NextResponse.json(
        { error: `Validation error: ${message}` },
        { status: 400 }
      );
    }

    // Generic error handling
    if (error instanceof Error) {
      // Transaction timeout
      if (error.message.includes('Transaction') && error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Request timed out. The server is busy, please try again.' },
          { status: 504 }
        );
      }

      // Connection errors
      if (error.message.includes('Connection') || error.message.includes('ECONNREFUSED') || error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Database connection error. Please try again.' },
          { status: 503 }
        );
      }

      // Can't reach database
      if (error.message.includes('Can\'t reach database') || error.message.includes('connect')) {
        return NextResponse.json(
          { error: 'Cannot connect to database. Please try again in a few moments.' },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: `Failed to create vehicle: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create vehicle. Please try again.' },
      { status: 500 }
    );
  }
}
