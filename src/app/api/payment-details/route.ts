import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/payment-details
 * Public endpoint to fetch payment details for customers
 * Query params:
 *   - service: Service slug (e.g., 'self-drive', 'bike-rental', 'car-rental')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceParam = searchParams.get('service');

    // Build query to get active bank details
    const where: any = {
      isActive: true,
    };

    // If service is specified, find the service and get its bank details
    if (serviceParam) {
      // Find the service by slug
      const service = await prisma.services.findFirst({
        where: { slug: serviceParam },
        select: { id: true },
      });

      if (service) {
        // Get bank details for this specific service OR primary global account
        const bankDetails = await prisma.bank_details.findMany({
          where: {
            isActive: true,
            OR: [
              { serviceId: service.id },
              { isPrimary: true, serviceId: null }, // Global primary account as fallback
            ],
          },
          orderBy: [
            { serviceId: 'desc' }, // Service-specific first
            { isPrimary: 'desc' }, // Then primary
            { displayOrder: 'asc' },
          ],
          take: 1, // Get the first matching account
        });

        if (bankDetails.length > 0) {
          return NextResponse.json({
            success: true,
            primaryAccount: bankDetails[0],
          });
        }
      }
    }

    // Fallback: Get the primary global bank account
    const primaryAccount = await prisma.bank_details.findFirst({
      where: {
        isActive: true,
        isPrimary: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!primaryAccount) {
      return NextResponse.json(
        {
          success: false,
          error: 'No payment details configured. Please contact support.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      primaryAccount,
    });
  } catch (error: any) {
    logger.error('Payment details fetch error', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch payment details',
        details: error?.message,
      },
      { status: 500 }
    );
  }
}
