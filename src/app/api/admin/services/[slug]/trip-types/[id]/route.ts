import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// DELETE - Disable a trip type for this service
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug, id } = params;

    // Get the service
    const service = await prisma.services.findFirst({
      where: { slug },
      select: { id: true },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Find the ServiceTripType
    const serviceTripType = await prisma.service_trip_types.findUnique({
      where: { id },
    });

    if (!serviceTripType) {
      return NextResponse.json({ error: 'Service trip type not found' }, { status: 404 });
    }

    // Verify it belongs to this service
    if (serviceTripType.serviceId !== service.id) {
      return NextResponse.json({ error: 'Trip type does not belong to this service' }, { status: 403 });
    }

    // Soft delete by setting isActive to false (or hard delete)
    await prisma.service_trip_types.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Trip type disabled' });
  } catch (error: any) {
    logger.error('Failed to disable trip type', error);
    return NextResponse.json(
      { error: 'Failed to disable trip type', details: error?.message },
      { status: 500 }
    );
  }
}
