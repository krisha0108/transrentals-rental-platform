import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - List all local packages
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user as any).userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');

    const packages = await prisma.local_packages.findMany({
      where: serviceId ? { serviceId } : undefined,
      include: {
        service: {
          select: { id: true, name: true, slug: true },
        },
        tripType: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: [{ service: { name: 'asc' } }, { displayOrder: 'asc' }, { hours: 'asc' }],
    });

    return NextResponse.json({ success: true, packages });
  } catch (error: any) {
    logger.error('Get local packages error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch packages', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Create new local package
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user as any).userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { serviceId, tripTypeId, name, hours, kms, description, isActive, displayOrder } = body;

    if (!serviceId || !tripTypeId || !hours || !kms) {
      return NextResponse.json(
        { success: false, error: 'Service, Trip Type, Hours, and Kms are required' },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await prisma.local_packages.findFirst({
      where: {
        serviceId,
        hours,
        kms,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Package ${hours}hr/${kms}km already exists for this service` },
        { status: 400 }
      );
    }

    const packageName = name || `${hours}hr/${kms}km`;

    const newPackage = await prisma.local_packages.create({
      data: {
        serviceId,
        tripTypeId,
        name: packageName,
        hours,
        kms,
        description: description || null,
        isActive: isActive ?? true,
        displayOrder: displayOrder ?? 0,
      },
      include: {
        service: {
          select: { id: true, name: true, slug: true },
        },
        tripType: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json({ success: true, package: newPackage });
  } catch (error: any) {
    logger.error('Create local package error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create package', details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH - Update existing local package
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user as any).userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, hours, kms, description, isActive, displayOrder } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Package ID is required' }, { status: 400 });
    }

    const existingPackage = await prisma.local_packages.findUnique({
      where: { id },
    });

    if (!existingPackage) {
      return NextResponse.json({ success: false, error: 'Package not found' }, { status: 404 });
    }

    // Check for duplicate if hours or kms changed
    if (hours !== existingPackage.hours || kms !== existingPackage.kms) {
      const duplicate = await prisma.local_packages.findFirst({
        where: {
          serviceId: existingPackage.serviceId,
          hours,
          kms,
          NOT: { id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { success: false, error: `Package ${hours}hr/${kms}km already exists for this service` },
          { status: 400 }
        );
      }
    }

    const packageName = name || `${hours}hr/${kms}km`;

    const updatedPackage = await prisma.local_packages.update({
      where: { id },
      data: {
        name: packageName,
        hours,
        kms,
        description: description || null,
        isActive,
        displayOrder,
      },
      include: {
        service: {
          select: { id: true, name: true, slug: true },
        },
        tripType: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json({ success: true, package: updatedPackage });
  } catch (error: any) {
    logger.error('Update local package error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update package', details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete local package
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user as any).userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Package ID is required' }, { status: 400 });
    }

    // Check if package is used in any fleet pricing
    const usedInPricing = await prisma.fleet_pricing.count({
      where: { localPackageId: id },
    });

    if (usedInPricing > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete: This package is used in ${usedInPricing} fleet pricing configuration(s)`,
        },
        { status: 400 }
      );
    }

    await prisma.local_packages.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Package deleted successfully' });
  } catch (error: any) {
    logger.error('Delete local package error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete package', details: error?.message },
      { status: 500 }
    );
  }
}
