import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - List all vendors with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { businessName: { contains: search } },
        { ownerName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [vendors, total] = await Promise.all([
      prisma.vendors.findMany({
        where,
        include: {
          _count: {
            select: {
              vendor_documents: true,
              vendor_service_requests: true,
              vendor_location_requests: true,
              vendor_approved_services: true,
              vendor_approved_locations: true,
              vendor_fleets: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.vendors.count({ where }),
    ]);

    // Remove passwords and transform field names for frontend compatibility
    const safeVendors = vendors.map(({ password, _count, ...vendor }) => ({
      ...vendor,
      _count: {
        documents: _count?.vendor_documents || 0,
        serviceRequests: _count?.vendor_service_requests || 0,
        locationRequests: _count?.vendor_location_requests || 0,
        approvedServices: _count?.vendor_approved_services || 0,
        approvedLocations: _count?.vendor_approved_locations || 0,
        fleets: _count?.vendor_fleets || 0,
      },
    }));

    return NextResponse.json({
      vendors: safeVendors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    logger.error('Get vendors error', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors', details: error?.message },
      { status: 500 }
    );
  }
}
