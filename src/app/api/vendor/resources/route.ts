// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get vendor's available drivers and vehicles
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);

    if (!auth.authenticated || !auth.vendorId) {

      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });

    }

    const vendorId = auth.vendorId;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'drivers', 'vehicles', or 'all'

    const result: any = {};

    // Fetch drivers (VendorStaff with role=DRIVER)
    if (!type || type === 'all' || type === 'drivers') {
      const drivers = await prisma.vendor_staff.findMany({
        where: {
          vendorId: vendorId,
          role: 'DRIVER',
          status: 'ACTIVE',
        },
        select: {
          id: true,
          name: true,
          phone: true,
          licenseNumber: true,
          licenseType: true,
          profilePhoto: true,
        },
        orderBy: { name: 'asc' },
      });
      result.drivers = drivers;
    }

    // Fetch vehicles (VendorFleet)
    if (!type || type === 'all' || type === 'vehicles') {
      const vehicles = await prisma.vendor_fleets.findMany({
        where: {
          vendorId: vendorId,
          isActive: true,
          isAvailable: true,
        },
        select: {
          id: true,
          registrationNumber: true,
          yearOfManufacture: true,
          color: true,
          vehicle_models: {
            select: { id: true, name: true },
          },
          services: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      result.vehicles = vehicles;
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    logger.error('Failed to fetch vendor resources', error);
    return NextResponse.json({ error: 'Failed to fetch resources', details: error?.message }, { status: 500 });
  }
}
