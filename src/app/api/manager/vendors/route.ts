import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get vendors for manager's assigned locations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user and verify they are a manager
    const manager = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
      include: {
        manager_locations: { include: { locations: true } },
        manager_services: { include: { services: true } },
      },
    });

    if (!manager || manager.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const assignedLocationIds = manager.manager_locations.map((ml) => ml.locationId);

    // Get query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';

    // Build where clause
    const whereClause: any = {
      vendor_approved_locations: {
        some: {
          locationId: { in: assignedLocationIds },
        },
      },
    };

    if (status !== 'all') {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { businessName: { contains: search } },
        { ownerName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    // Get vendors
    const vendors = assignedLocationIds.length > 0
      ? await prisma.vendors.findMany({
          where: whereClause,
          select: {
            id: true,
            businessName: true,
            ownerName: true,
            phone: true,
            email: true,
            status: true,
            createdAt: true,
            vendor_approved_locations: {
              where: { locationId: { in: assignedLocationIds } },
              include: { locations: { select: { id: true, name: true } } },
            },
            vendor_approved_services: {
              include: { services: { select: { id: true, name: true } } },
            },
            _count: {
              select: {
                documents: true,
                fleets: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        })
      : [];

    // Get stats
    const stats = {
      total: vendors.length,
      approved: vendors.filter((v) => v.status === 'APPROVED').length,
      pending: vendors.filter((v) => v.status === 'PENDING' || v.status === 'UNDER_REVIEW').length,
      suspended: vendors.filter((v) => v.status === 'SUSPENDED').length,
    };

    return NextResponse.json({
      success: true,
      stats,
      vendors: vendors.map((v) => ({
        id: v.id,
        businessName: v.businessName,
        ownerName: v.ownerName,
        phone: v.phone,
        email: v.email,
        status: v.status,
        createdAt: v.createdAt,
        locations: v.vendor_approved_locations.map((al) => al.locations.name),
        services: v.vendor_approved_services.map((as) => as.services.name),
        documentCount: v._count.documents,
        fleetCount: v._count.fleets,
      })),
    });
  } catch (error: any) {
    logger.error('Manager vendors list error', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors', details: error?.message },
      { status: 500 }
    );
  }
}
