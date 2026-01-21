import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - List all service requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const requests = await prisma.vendor_service_requests.findMany({
      where,
      include: {
        services: {
          select: { id: true, name: true, slug: true },
        },
        vendors: {
          select: { id: true, businessName: true, ownerName: true },
        },
        admin_users: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to frontend expected format
    const transformedRequests = requests.map((req: any) => ({
      ...req,
      service: req.services,
      vendor: req.vendors,
      reviewedBy: req.admin_users,
      services: undefined,
      vendors: undefined,
      admin_users: undefined,
    }));

    return NextResponse.json({ requests: transformedRequests });
  } catch (error: any) {
    logger.error('Get service requests error', error);
    return NextResponse.json(
      { error: 'Failed to fetch service requests', details: error?.message },
      { status: 500 }
    );
  }
}
