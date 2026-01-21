import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

// GET - Get sub-services for a specific service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle both Promise and direct params (Next.js 14.2+ compatibility)
    const resolvedParams = 'then' in params ? await params : params;
    const { slug } = resolvedParams;

    // Find the service by slug
    const service = await prisma.services.findUnique({
      where: { slug },
      include: {
        other_services: {
          orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
          include: {
            _count: {
              select: {
                vehicle_models_vehicle_models_serviceIdToservices: true,
                vehicle_models_vehicle_models_subServiceIdToservices: true,
              },
            },
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Transform sub-services
    const subServices = service.other_services.map((child) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      description: child.description,
      shortDesc: child.shortDesc,
      icon: child.icon,
      image: child.image,
      isActive: child.isActive,
      displayOrder: child.displayOrder,
      vehicleCount: child._count.vehicle_models_vehicle_models_serviceIdToservices + child._count.vehicle_models_vehicle_models_subServiceIdToservices,
      createdAt: child.createdAt,
    }));

    return NextResponse.json({
      success: true,
      service: {
        id: service.id,
        name: service.name,
        slug: service.slug,
      },
      subServices,
      stats: {
        total: subServices.length,
        active: subServices.filter((s) => s.isActive).length,
        inactive: subServices.filter((s) => !s.isActive).length,
        totalVehicles: subServices.reduce((acc, s) => acc + s.vehicleCount, 0),
      },
    });
  } catch (error: any) {
    logger.error('Service sub-services error', error);
    return NextResponse.json(
      { error: 'Failed to fetch sub-services', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Create new sub-service
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle both Promise and direct params (Next.js 14.2+ compatibility)
    const resolvedParams = 'then' in params ? await params : params;
    const { slug } = resolvedParams;
    const body = await request.json();

    // Find the parent service
    const parentService = await prisma.services.findUnique({
      where: { slug },
    });

    if (!parentService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const {
      name,
      subServiceSlug,
      description,
      shortDesc,
      icon,
      image,
      isActive,
      displayOrder,
    } = body;

    // Validate required fields
    if (!name || !subServiceSlug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Check if slug exists
    const existing = await prisma.services.findUnique({
      where: { slug: subServiceSlug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A sub-service with this slug already exists' },
        { status: 400 }
      );
    }

    // Create sub-service with generated ID
    const sub_service = await prisma.services.create({
      data: {
        id: generateId(),
        name,
        slug: subServiceSlug,
        parentId: parentService.id,
        description: description || null,
        shortDesc: shortDesc || null,
        icon: icon || null,
        image: image || null,
        flowType: parentService.flowType, // Inherit from parent
        isActive: isActive !== false,
        displayOrder: displayOrder || 0,
      },
    });

    return NextResponse.json({ success: true, sub_service }, { status: 201 });
  } catch (error: any) {
    logger.error('Service sub-service create error', error);
    return NextResponse.json(
      { error: 'Failed to create sub-service', details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH - Update sub-service order
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle both Promise and direct params (Next.js 14.2+ compatibility)
    const resolvedParams = 'then' in params ? await params : params;
    const { slug } = resolvedParams;
    const body = await request.json();
    const { orderedIds } = body;

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: 'orderedIds must be an array' },
        { status: 400 }
      );
    }

    // Find the parent service
    const parentService = await prisma.services.findUnique({
      where: { slug },
    });

    if (!parentService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Update display order for each sub-service
    await prisma.$transaction(
      orderedIds.map((id: string, index: number) =>
        prisma.services.update({
          where: { id },
          data: { displayOrder: index },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: 'Sub-service order updated',
    });
  } catch (error: any) {
    logger.error('Service sub-service order update error', error);
    return NextResponse.json(
      { error: 'Failed to update order', details: error?.message },
      { status: 500 }
    );
  }
}
