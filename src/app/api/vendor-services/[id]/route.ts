import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

/**
 * GET - Get vendor service details by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = 'then' in params ? await params : params;
    const { id } = resolvedParams;

    // Try to find vendor approved service by ID
    const vendorService = await prisma.vendor_approved_services.findUnique({
      where: { id },
      include: {
        vendors: {
          select: {
            id: true,
            businessName: true,
            ownerName: true,
            phone: true,
            email: true,
            city: true,
            state: true,
            rating: true,
            logo: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!vendorService) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      service: {
        id: vendorService.id,
        vendor: vendorService.vendor,
        service: vendorService.service,
        isActive: vendorService.isActive,
        approvedAt: vendorService.approvedAt,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch vendor service', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch service', details: error?.message },
      { status: 500 }
    );
  }
}
