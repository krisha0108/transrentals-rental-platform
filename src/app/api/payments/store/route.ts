// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/store
 * Customer confirms payment for a quote
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quotation_id, payment_amount } = body;

    if (!quotation_id || !payment_amount) {
      return NextResponse.json(
        { success: false, error: 'Quotation ID and payment amount are required' },
        { status: 400 }
      );
    }

    // Try to find the quote in different tables and update status
    // Check bike quote requests
    const bikeQuote = await prisma.bike_quote_requests.findUnique({
      where: { id: quotation_id },
    });

    if (bikeQuote) {
      await prisma.bike_quote_requests.update({
        where: { id: quotation_id },
        data: {
          status: 'QUOTE_ACCEPTED',
          updatedAt: new Date(),
        },
      });
      return NextResponse.json({
        success: true,
        message: 'Payment confirmation received. Our team will verify and confirm your booking.',
      });
    }

    // Check bus quote requests
    const busQuote = await prisma.bus_quote_requests.findUnique({
      where: { id: quotation_id },
    });

    if (busQuote) {
      await prisma.bus_quote_requests.update({
        where: { id: quotation_id },
        data: {
          status: 'QUOTE_ACCEPTED',
          updatedAt: new Date(),
        },
      });
      return NextResponse.json({
        success: true,
        message: 'Payment confirmation received. Our team will verify and confirm your booking.',
      });
    }

    // Check truck quote requests
    const truckQuote = await prisma.truck_quote_requests.findUnique({
      where: { id: quotation_id },
    });

    if (truckQuote) {
      await prisma.truck_quote_requests.update({
        where: { id: quotation_id },
        data: {
          status: 'QUOTE_ACCEPTED',
          updatedAt: new Date(),
        },
      });
      return NextResponse.json({
        success: true,
        message: 'Payment confirmation received. Our team will verify and confirm your booking.',
      });
    }

    // Check equipment quote requests
    const equipmentQuote = await prisma.equipment_quote_requests.findUnique({
      where: { id: quotation_id },
    });

    if (equipmentQuote) {
      await prisma.equipment_quote_requests.update({
        where: { id: quotation_id },
        data: {
          status: 'QUOTE_ACCEPTED',
          updatedAt: new Date(),
        },
      });
      return NextResponse.json({
        success: true,
        message: 'Payment confirmation received. Our team will verify and confirm your booking.',
      });
    }

    // Check packers quote requests
    const packersQuote = await prisma.packers_quote_requests.findUnique({
      where: { id: quotation_id },
    });

    if (packersQuote) {
      await prisma.packers_quote_requests.update({
        where: { id: quotation_id },
        data: {
          status: 'QUOTE_ACCEPTED',
          updatedAt: new Date(),
        },
      });
      return NextResponse.json({
        success: true,
        message: 'Payment confirmation received. Our team will verify and confirm your booking.',
      });
    }

    // Check self-drive quote requests
    const selfDriveQuote = await prisma.self_drive_quote_requests.findUnique({
      where: { id: quotation_id },
    });

    if (selfDriveQuote) {
      await prisma.self_drive_quote_requests.update({
        where: { id: quotation_id },
        data: {
          status: 'QUOTE_ACCEPTED',
          updatedAt: new Date(),
        },
      });
      return NextResponse.json({
        success: true,
        message: 'Payment confirmation received. Our team will verify and confirm your booking.',
      });
    }

    // Check luxury quote requests
    const luxuryQuote = await prisma.luxury_quote_requests.findUnique({
      where: { id: quotation_id },
    });

    if (luxuryQuote) {
      await prisma.luxury_quote_requests.update({
        where: { id: quotation_id },
        data: {
          status: 'QUOTE_ACCEPTED',
          updatedAt: new Date(),
        },
      });
      return NextResponse.json({
        success: true,
        message: 'Payment confirmation received. Our team will verify and confirm your booking.',
      });
    }

    // Quote not found
    return NextResponse.json(
      { success: false, error: 'Quote not found' },
      { status: 404 }
    );
  } catch (error: any) {
    logger.error('Failed to store payment confirmation', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process payment confirmation', details: error?.message },
      { status: 500 }
    );
  }
}
