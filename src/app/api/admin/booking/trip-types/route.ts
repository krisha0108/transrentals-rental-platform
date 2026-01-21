import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - List all trip types
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tripTypes = await prisma.trip_types.findMany({
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            serviceTripTypes: true,
            localPackages: true,
          },
        },
      },
    });

    return NextResponse.json(tripTypes);
  } catch (error: any) {
    logger.error('Trip types list error', error);
    return NextResponse.json({ error: 'Failed to fetch trip types', details: error?.message }, { status: 500 });
  }
}

// POST - Create new trip type
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
      description,
      icon,
      requiresFromLocation,
      requiresToLocation,
      requiresReturnDate,
      isActive,
      displayOrder,
    } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    // Check if slug already exists
    const existing = await prisma.trip_types.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json({ error: 'A trip type with this slug already exists' }, { status: 400 });
    }

    const tripType = await prisma.trip_types.create({
      data: {
        name,
        slug,
        description: description || null,
        icon: icon || null,
        requiresFromLocation: requiresFromLocation !== false,
        requiresToLocation: requiresToLocation === true,
        requiresReturnDate: requiresReturnDate === true,
        isActive: isActive !== false,
        displayOrder: displayOrder || 0,
      },
    });

    return NextResponse.json(tripType, { status: 201 });
  } catch (error: any) {
    logger.error('Trip type create error', error);
    return NextResponse.json({ error: 'Failed to create trip type', details: error?.message }, { status: 500 });
  }
}
