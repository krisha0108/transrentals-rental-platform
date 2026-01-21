import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';
import logger from '@/lib/security/logger';

// Helper to generate a cuid-like unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

export const dynamic = 'force-dynamic';

// POST - Sync approved service/location requests to approved tables
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

    let servicesFixed = 0;
    let locationsFixed = 0;

    // Find all approved service requests without corresponding approved entries
    const approvedServiceRequests = await prisma.vendor_service_requests.findMany({
      where: { status: 'APPROVED' },
      select: {
        id: true,
        vendorId: true,
        serviceId: true,
      },
    });

    for (const request of approvedServiceRequests) {
      const existing = await prisma.vendor_approved_services.findUnique({
        where: {
          vendorId_serviceId: {
            vendorId: request.vendorId,
            serviceId: request.serviceId,
          },
        },
      });

      if (!existing) {
        await prisma.vendor_approved_services.create({
          data: {
            id: generateId(),
            vendorId: request.vendorId,
            serviceId: request.serviceId,
            isActive: true,
          },
        });
        servicesFixed++;
      }
    }

    // Find all approved location requests without corresponding approved entries
    const approvedLocationRequests = await prisma.vendor_location_requests.findMany({
      where: { status: 'APPROVED' },
      select: {
        id: true,
        vendorId: true,
        locationId: true,
      },
    });

    for (const request of approvedLocationRequests) {
      const existing = await prisma.vendor_approved_locations.findUnique({
        where: {
          vendorId_locationId: {
            vendorId: request.vendorId,
            locationId: request.locationId,
          },
        },
      });

      if (!existing) {
        await prisma.vendor_approved_locations.create({
          data: {
            id: generateId(),
            vendorId: request.vendorId,
            locationId: request.locationId,
            isActive: true,
          },
        });
        locationsFixed++;
      }
    }

    logger.info('Synced approved services and locations', {
      servicesFixed,
      locationsFixed,
      adminId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${servicesFixed} services and ${locationsFixed} locations`,
      servicesFixed,
      locationsFixed,
    });
  } catch (error: any) {
    logger.error('Sync approved services error', error);
    return NextResponse.json(
      { error: 'Failed to sync', details: error?.message },
      { status: 500 }
    );
  }
}
