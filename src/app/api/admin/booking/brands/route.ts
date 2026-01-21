import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - List all brands
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const unassigned = searchParams.get('unassigned');

    // Build where clause
    let where: any = undefined;
    if (unassigned === 'true') {
      // Get brands with null serviceId (unassigned)
      where = { serviceId: null };
    } else if (serviceId) {
      where = { serviceId };
    }
    // No filter = get all brands

    const brands = await prisma.brands.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: {
        services: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            vehicle_models: true,
          },
        },
      },
    });

    return NextResponse.json(brands);
  } catch (error: any) {
    logger.error('Brands list error', error);
    return NextResponse.json({ error: 'Failed to fetch brands', details: error?.message }, { status: 500 });
  }
}

// POST - Create new brand
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
      logo,
      description,
      country,
      serviceId,
      isActive,
      displayOrder,
    } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    // Check if slug already exists
    const existing = await prisma.brands.findFirst({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json({ error: 'A brand with this slug already exists' }, { status: 400 });
    }

    const brand = await prisma.brands.create({
      data: {
        name,
        slug,
        logo: logo || null,
        description: description || null,
        country: country || null,
        serviceId,
        isActive: isActive !== false,
        displayOrder: displayOrder || 0,
      },
    });

    return NextResponse.json(brand, { status: 201 });
  } catch (error: any) {
    logger.error('Brand create error', error);
    return NextResponse.json({ error: 'Failed to create brand', details: error?.message }, { status: 500 });
  }
}
