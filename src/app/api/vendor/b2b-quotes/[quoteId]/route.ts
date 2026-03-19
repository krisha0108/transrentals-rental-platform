// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// PATCH - Vendor withdraws their quote
export async function PATCH(
  request: NextRequest,
  { params }: { params: { quoteId: string } }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { quoteId } = params;
    const body = await request.json();
    const { action } = body;

    if (action !== 'withdraw') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Find the quote and verify ownership
    const quote = await prisma.b2b_vendor_quotes.findUnique({
      where: { id: quoteId },
      select: { id: true, vendorId: true, status: true, bookingId: true },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }
    if (quote.vendorId !== auth.vendorId) {
      return NextResponse.json({ error: 'Not authorized to modify this quote' }, { status: 403 });
    }
    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(quote.status)) {
      return NextResponse.json(
        { error: `Cannot withdraw a quote with status ${quote.status}` },
        { status: 400 }
      );
    }

    // Withdraw the quote
    await prisma.b2b_vendor_quotes.update({
      where: { id: quoteId },
      data: { status: 'WITHDRAWN' },
    });

    return NextResponse.json({
      status: 'success',
      message: 'Quote withdrawn successfully',
    });
  } catch (error: any) {
    console.error('B2B Vendor Quote PATCH error:', error);
    return NextResponse.json({ error: 'Failed to withdraw quote' }, { status: 500 });
  }
}

// GET - Get a single quote detail
export async function GET(
  request: NextRequest,
  { params }: { params: { quoteId: string } }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { quoteId } = params;

    const quote = await prisma.b2b_vendor_quotes.findUnique({
      where: { id: quoteId },
      include: {
        booking: {
          select: {
            id: true, bookingNumber: true, companyName: true, serviceType: true,
            vehiclesRequired: true, pickupLocation: true, dropLocation: true,
            scheduledDate: true, scheduledTime: true, tripType: true, status: true,
            selfDriveDetails: true, notes: true,
          }
        },
        quoteVehicles: {
          include: {
            vehicle: {
              select: {
                id: true, vehicleName: true, registrationNumber: true,
                seatingCapacity: true, fuelType: true, transmission: true,
                color: true, yearOfManufacture: true, images: true,
                brands: { select: { name: true } },
                vehicle_models: { select: { name: true, brands: { select: { name: true } } } },
              }
            },
            driver: {
              select: {
                id: true, name: true, phone: true, profilePhoto: true,
                licenseNumber: true, licenseType: true,
              }
            }
          }
        }
      },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }
    if (quote.vendorId !== auth.vendorId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    return NextResponse.json({ status: 'success', quote });
  } catch (error: any) {
    console.error('B2B Vendor Quote GET [id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch quote' }, { status: 500 });
  }
}
