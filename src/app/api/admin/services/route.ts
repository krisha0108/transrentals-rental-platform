import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - List all services with hierarchy
export async function GET(request: NextRequest) {
  try {
    // Check database availability
    if (!prisma) {
      logger.error('[Admin Services] Database not available - Prisma client is undefined');
      return NextResponse.json(
        { error: 'Database not available', services: [] },
        { status: 503 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    const slug = searchParams.get('slug'); // Fetch specific service by slug
    const flowType = searchParams.get('flowType'); // FLEET_BASED, QUOTE_BASED
    const isActive = searchParams.get('isActive');
    const flat = searchParams.get('flat') === 'true'; // Get flat list without hierarchy
    const parentsOnly = searchParams.get('parentsOnly') === 'true'; // Only parent services

    // If slug is provided, return that specific service
    if (slug) {
      const service = await prisma.services.findFirst({
        where: { slug },
        include: {
          services: { select: { id: true, name: true, slug: true } },
          other_services: {
            orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
            select: { id: true, name: true, slug: true, isActive: true },
          },
          _count: { select: { other_services: true, service_locations: true } },
        },
      });

      if (!service) {
        return NextResponse.json([]);
      }

      return NextResponse.json([service]);
    }

    const where: any = {};

    if (flowType) {
      where.flowType = flowType;
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (parentsOnly) {
      where.parentId = null;
    }

    if (flat) {
      // Flat list - all services
      const services = await prisma.services.findMany({
        where,
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        include: {
          services: {
            select: { id: true, name: true, slug: true },
          },
          _count: {
            select: { other_services: true, service_locations: true },
          },
        },
      });

      return NextResponse.json(services);
    }

    // Hierarchical tree structure - get root services with nested children
    const services = await prisma.services.findMany({
      where: { ...where, parentId: parentId || null },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: {
        other_services: {
          orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
          include: {
            _count: {
              select: { other_services: true, service_locations: true },
            },
            other_services: {
              orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
              include: {
                _count: {
                  select: { other_services: true, service_locations: true },
                },
              },
            },
          },
        },
        _count: {
          select: { other_services: true, service_locations: true },
        },
      },
    });

    return NextResponse.json(services);
  } catch (error: any) {
    logger.error('Services list error', error);
    return NextResponse.json({ error: 'Failed to fetch services', details: error?.message }, { status: 500 });
  }
}

// POST - Create new service
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Validation
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Check if slug exists
    const existing = await prisma.services.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: 'A service with this slug already exists' },
        { status: 400 }
      );
    }

    // Validate parent if provided
    if (parentId) {
      const parent = await prisma.services.findUnique({ where: { id: parentId } });
      if (!parent) {
        return NextResponse.json(
          { error: 'Parent service not found' },
          { status: 400 }
        );
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
        flowType: flowType || 'QUOTE_BASED',
        config: config || null,
        formFields: formFields || null,
        isActive: isActive !== false,
        displayOrder: typeof displayOrder === 'string' ? parseInt(displayOrder) || 0 : (displayOrder || 0),
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
      },
      include: {
        services: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    logger.error('Service create error', error);
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}
