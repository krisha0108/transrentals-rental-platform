// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - Get a specific quote details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;
    const { id } = await params;

    const quote = await prisma.bus_quotes.findFirst({
      where: {
        id,
        vendorId: vendorId,
      },
      include: {
        bus_quote_requests_bus_quotes_requestIdTobus_quote_requests: {
          select: {
            id: true,
            requestNumber: true,
            customerName: true,
            customerPhone: true,
            customerEmail: true,
            tripType: true,
            vehicleCategory: true,
            passengers: true,
            pickupCity: true,
            pickupAddress: true,
            dropCity: true,
            dropAddress: true,
            pickupDate: true,
            pickupTime: true,
            returnDate: true,
            tripDays: true,
            status: true,
          },
        },
      },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Parse JSON fields
    const parseJsonField = (field: any) => {
      if (!field) return [];
      if (Array.isArray(field)) return field;
      if (typeof field === 'string') {
        try {
          return JSON.parse(field);
        } catch {
          return [];
        }
      }
      return [];
    };

    return NextResponse.json({
      success: true,
      quote: {
        ...quote,
        inclusions: parseJsonField(quote.inclusions),
        exclusions: parseJsonField(quote.exclusions),
        termsConditions: parseJsonField(quote.termsConditions),
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch quote details', error);
    return NextResponse.json(
      { error: 'Failed to fetch quote', details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH - Update quote (withdraw, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    // Find the quote
    const quote = await prisma.bus_quotes.findFirst({
      where: { id, vendorId },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    if (action === 'withdraw') {
      if (!['SENT', 'VIEWED'].includes(quote.status)) {
        return NextResponse.json(
          { error: 'Cannot withdraw quote in current status' },
          { status: 400 }
        );
      }

      const updatedQuote = await prisma.bus_quotes.update({
        where: { id },
        data: { status: 'WITHDRAWN' },
      });

      return NextResponse.json({
        success: true,
        message: 'Quote withdrawn successfully',
        quote: updatedQuote,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    logger.error('Failed to update quote', error);
    return NextResponse.json(
      { error: 'Failed to update quote', details: error?.message },
      { status: 500 }
    );
  }
}
