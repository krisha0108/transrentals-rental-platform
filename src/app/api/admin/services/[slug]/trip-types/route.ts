import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get all trip types with service-specific enabled status
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = params;

    // Get the service
    const service = await prisma.services.findFirst({
      where: { slug },
      select: { id: true },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Get all trip types
    const tripTypes = await prisma.trip_types.findMany({
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: {
        serviceTripTypes: {
          where: { serviceId: service.id },
          select: { id: true, isActive: true },
        },
      },
    });

    // Transform to include isEnabled flag
    const result = tripTypes.map((tt) => ({
      id: tt.id,
      name: tt.name,
      slug: tt.slug,
      description: tt.description,
      icon: tt.icon,
      requiresFromLocation: tt.requiresFromLocation,
      requiresToLocation: tt.requiresToLocation,
      requiresReturnDate: tt.requiresReturnDate,
      isActive: tt.isActive,
      displayOrder: tt.displayOrder,
      isEnabled: tt.serviceTripTypes.length > 0 && tt.serviceTripTypes[0].isActive,
      serviceTripTypeId: tt.serviceTripTypes.length > 0 ? tt.serviceTripTypes[0].id : null,
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('Failed to fetch trip types', error);
    return NextResponse.json(
      { error: 'Failed to fetch trip types', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Enable a trip type for this service
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = params;
    const body = await request.json();
    const { tripTypeId } = body;

    if (!tripTypeId) {
      return NextResponse.json({ error: 'Trip type ID is required' }, { status: 400 });
    }

    // Get the service
    const service = await prisma.services.findFirst({
      where: { slug },
      select: { id: true },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Check if already exists
    const existing = await prisma.service_trip_types.findFirst({
      where: {
        serviceId: service.id,
        tripTypeId,
      },
    });

    if (existing) {
      // Reactivate if inactive
      if (!existing.isActive) {
        await prisma.service_trip_types.update({
          where: { id: existing.id },
          data: { isActive: true },
        });
      }
      return NextResponse.json({ success: true, message: 'Trip type already enabled' });
    }

    // Create new ServiceTripType
    await prisma.service_trip_types.create({
      data: {
        serviceId: service.id,
        tripTypeId,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, message: 'Trip type enabled' });
  } catch (error: any) {
    logger.error('Failed to enable trip type', error);
    return NextResponse.json(
      { error: 'Failed to enable trip type', details: error?.message },
      { status: 500 }
    );
  }
}
