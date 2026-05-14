// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// PUT - Vendor edits their quote (only while customer hasn't accepted/rejected)
export async function PUT(
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
    const { vehicles, pricePerVehicle, totalPrice, vehiclePricing, notes } = body;

    if (!vehicles || !Array.isArray(vehicles) || vehicles.length === 0) {
      return NextResponse.json(
        { error: 'vehicles (array of {vendorFleetId, driverStaffId}) is required' },
        { status: 400 }
      );
    }
    if (totalPrice === undefined || totalPrice === null) {
      return NextResponse.json({ error: 'totalPrice is required' }, { status: 400 });
    }

    // Load quote and verify ownership + editable status
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
        { error: `Quote cannot be edited once it is ${quote.status}` },
        { status: 400 }
      );
    }

    // Verify all vehicles belong to this vendor. CUSTOM_BULK quotes reuse
    // the same vehicle across multiple days, so dedupe ids first — Prisma's
    // findMany returns unique rows and would otherwise undercount.
    const fleetIds = vehicles.map((v: any) => v.vendorFleetId);
    const uniqueFleetIds = Array.from(new Set(fleetIds));
    const vendorFleets = await prisma.vendor_fleets.findMany({
      where: { id: { in: uniqueFleetIds }, vendorId: auth.vendorId },
      select: { id: true, vehicleName: true, registrationNumber: true },
    });
    if (vendorFleets.length !== uniqueFleetIds.length) {
      return NextResponse.json({ error: 'Some vehicles do not belong to your fleet' }, { status: 400 });
    }

    // Verify drivers belong to this vendor (if provided). Same dedupe logic.
    const driverIds = vehicles.map((v: any) => v.driverStaffId).filter(Boolean);
    const uniqueDriverIds = Array.from(new Set(driverIds));
    let driverMap = new Map<string, { id: string; name: string | null; phone: string | null }>();
    if (uniqueDriverIds.length > 0) {
      const vendorDrivers = await prisma.vendor_staff.findMany({
        where: { id: { in: uniqueDriverIds }, vendorId: auth.vendorId, role: 'DRIVER' },
        select: { id: true, name: true, phone: true },
      });
      if (vendorDrivers.length !== uniqueDriverIds.length) {
        return NextResponse.json({ error: 'Some drivers do not belong to your staff' }, { status: 400 });
      }
      vendorDrivers.forEach(d => driverMap.set(d.id, d));
    }

    const fleetMap = new Map(vendorFleets.map(f => [f.id, f]));
    const pricingMap = new Map<string, any>();
    if (Array.isArray(vehiclePricing)) {
      vehiclePricing.forEach((vp: any) => pricingMap.set(vp.vendorFleetId, vp));
    }

    const quoteVehiclesData = vehicles.map((v: any) => {
      const fleet = fleetMap.get(v.vendorFleetId);
      const driver = v.driverStaffId ? driverMap.get(v.driverStaffId) : null;
      const pricing = pricingMap.get(v.vendorFleetId) || {};
      return {
        id: 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24),
        quoteId,
        vendorFleetId: v.vendorFleetId,
        driverStaffId: v.driverStaffId || null,
        vehicleName: fleet?.vehicleName || null,
        vehicleNumber: fleet?.registrationNumber || null,
        driverName: driver?.name || null,
        driverPhone: driver?.phone || null,
        basePrice: pricing.basePrice ?? null,
        perKmRate: pricing.perKmRate ?? null,
        perHourRate: pricing.perHourRate ?? null,
        perDayRate: pricing.perDayRate ?? null,
        driverAllowance: pricing.driverAllowance ?? null,
        nightCharges: pricing.nightCharges ?? null,
        extraKmCharge: pricing.extraKmCharge ?? null,
        extraHourCharge: pricing.extraHourCharge ?? null,
      };
    });

    // Replace vehicles + update quote in a single transaction
    await prisma.$transaction([
      prisma.b2b_vendor_quote_vehicles.deleteMany({ where: { quoteId } }),
      prisma.b2b_vendor_quote_vehicles.createMany({ data: quoteVehiclesData }),
      prisma.b2b_vendor_quotes.update({
        where: { id: quoteId },
        data: {
          vehicleCount: vehicles.length,
          pricePerVehicle: pricePerVehicle ?? null,
          totalPrice: parseFloat(totalPrice),
          notes: notes ?? null,
        },
      }),
    ]);

    return NextResponse.json({
      status: 'success',
      message: 'Quote updated successfully',
      quote: { id: quoteId, vehicleCount: vehicles.length, totalPrice },
    });
  } catch (error: any) {
    console.error('B2B Vendor Quote PUT error:', error);
    return NextResponse.json({ error: 'Failed to update quote' }, { status: 500 });
  }
}

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
            specialNotes: true, bulkBreakdown: true,
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
          },
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
