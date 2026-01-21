import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// Debug endpoint to check vendor services
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json({ error: 'vendorId required' }, { status: 400 });
    }

    // Check service requests
    const serviceRequests = await prisma.vendor_service_requests.findMany({
      where: { vendorId },
      include: {
        services: true,
      },
    });

    // Check approved services
    const approvedServices = await prisma.vendor_approved_services.findMany({
      where: { vendorId },
      include: {
        services: true,
      },
    });

    // Check location requests
    const locationRequests = await prisma.vendor_location_requests.findMany({
      where: { vendorId },
      include: {
        locations: true,
      },
    });

    // Check approved locations
    const approvedLocations = await prisma.vendor_approved_locations.findMany({
      where: { vendorId },
      include: {
        locations: true,
      },
    });

    return NextResponse.json({
      vendorId,
      serviceRequests: {
        count: serviceRequests.length,
        approved: serviceRequests.filter(r => r.status === 'APPROVED').length,
        pending: serviceRequests.filter(r => r.status === 'PENDING').length,
        rejected: serviceRequests.filter(r => r.status === 'REJECTED').length,
        data: serviceRequests,
      },
      approvedServices: {
        count: approvedServices.length,
        data: approvedServices,
      },
      locationRequests: {
        count: locationRequests.length,
        approved: locationRequests.filter(r => r.status === 'APPROVED').length,
        pending: locationRequests.filter(r => r.status === 'PENDING').length,
        rejected: locationRequests.filter(r => r.status === 'REJECTED').length,
        data: locationRequests,
      },
      approvedLocations: {
        count: approvedLocations.length,
        data: approvedLocations,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch debug info', details: error?.message },
      { status: 500 }
    );
  }
}
