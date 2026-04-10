import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - List all services with sub-services
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parentOnly = searchParams.get('parentOnly') === 'true';
    const includeChildren = searchParams.get('includeChildren') !== 'false';
    const serviceId = searchParams.get('serviceId'); // Get sub-services for specific service

    let where: any = {};

    if (serviceId) {
      where.parentId = serviceId;
    } else if (parentOnly) {
      where.parentId = null;
    }

    const services = await prisma.services.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: includeChildren && !serviceId ? {
        other_services: {
          orderBy: { displayOrder: 'asc' },
        },
        serviceTripTypes: {
          include: {
            tripType: true,
          },
        },
        localPackages: {
          orderBy: { displayOrder: 'asc' },
        },
        _count: {
          select: {
            vehicle_models: true,
            vendor_fleets: true,
          },
        },
      } : {
        _count: {
          select: {
            vehicle_models: true,
            vendor_fleets: true,
            other_services: true,
          },
        },
      },
    });

    return NextResponse.json(services);
  } catch (error: any) {
    logger.error('Services list error', error);
    return NextResponse.json({ error: 'Failed to fetch services', details: error?.message }, { status: 500 });
  }
}

// POST - Create new service or sub-service
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser || !['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      slug,
      parentId,
      description,
      shortDesc,
      icon,
      image,
      flowType,
      config,
      formFields,
      isActive,
      displayOrder,
      metaTitle,
      metaDescription,
    } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    // Check if slug already exists
    const existing = await prisma.services.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json({ error: 'A service with this slug already exists' }, { status: 400 });
    }

    // If parentId is provided, inherit flowType from parent
    let finalFlowType = flowType || 'QUOTE_BASED';
    if (parentId) {
      const parent = await prisma.services.findUnique({
        where: { id: parentId },
      });
      if (parent) {
        finalFlowType = parent.flowType;
      }
    }

    const service = await prisma.services.create({
      data: {
        name,
        slug,
        parentId: parentId || null,
        description: description || null,
        shortDesc: shortDesc || null,
        icon: icon || null,
        image: image || null,
        flowType: finalFlowType,
        config: config || null,
        formFields: formFields || null,
        isActive: isActive !== false,
        displayOrder: displayOrder || 0,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
      },
      include: {
        other_services: true,
        services: true,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error: any) {
    logger.error('Service create error', error);
    return NextResponse.json({ error: 'Failed to create service', details: error?.message }, { status: 500 });
  }
}
