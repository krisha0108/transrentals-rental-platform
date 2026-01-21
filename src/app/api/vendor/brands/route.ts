// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';


import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - List brands for a service (vendor use)
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceSlug = searchParams.get('serviceSlug');
    const serviceId = searchParams.get('serviceId');

    const where: any = {
      isActive: true, // Only active brands for vendors
    };

    // Filter by serviceId or serviceSlug
    if (serviceId) {
      where.serviceId = serviceId;
    } else if (serviceSlug) {
      const service = await prisma.services.findUnique({
        where: { slug: serviceSlug },
        select: { id: true },
      });
      if (service) {
        where.serviceId = service.id;
      } else {
        return NextResponse.json({ success: true, brands: [] });
      }
    } else {
      return NextResponse.json(
        { error: 'serviceSlug or serviceId is required' },
        { status: 400 }
      );
    }

    const brands = await prisma.brands.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ success: true, brands });
  } catch (error: any) {
    logger.error('Vendor brands list error', error);
    return NextResponse.json(
      { error: 'Failed to fetch brands', details: error?.message },
      { status: 500 }
    );
  }
}
