// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';
import { onVendorQuoteSubmitted } from '@/lib/utils/b2b-notification-helper';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';

export const dynamic = 'force-dynamic';

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

function generateQuoteNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `B2BQ-${year}-${random}`;
}

// GET - List open B2B bookings for vendors to quote OR vendor's own quotes
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId!;


    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'open'; // 'open' = open bookings, 'my' = my quotes
    // serviceType: 'CUSTOM_BULK' → only bulk; 'non-bulk' → exclude bulk; otherwise all.
    // Vendor side splits these into two lists (/vendor/b2b-bookings vs
    // /vendor/bulk-bookings) so the day-wise event plan stays out of the regular
    // single-service B2B view.
    const serviceTypeFilter = searchParams.get('serviceType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    if (view === 'my') {
      // Vendor's own submitted quotes
      const [quotes, total] = await Promise.all([
        prisma.b2b_vendor_quotes.findMany({
          where: { vendorId: vendorId },
          include: {
            booking: {
              select: {
                id: true, bookingNumber: true, companyName: true, serviceType: true,
                vehiclesRequired: true, pickupLocation: true, dropLocation: true,
                scheduledDate: true, scheduledTime: true, tripType: true, status: true,
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
                    chauffeur_vehicle_categories: { select: { name: true, image: true } },
                    vehicle_models: { select: { name: true, sideImage: true, brands: { select: { name: true } } } },
                  }
                },
                driver: {
                  select: {
                    id: true, name: true, phone: true, profilePhoto: true,
                    licenseNumber: true, licenseType: true, licenseExpiry: true,
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip, take: limit,
        }),
        prisma.b2b_vendor_quotes.count({ where: { vendorId: vendorId } }),
      ]);

      return NextResponse.json({
        status: 'success', quotes,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    // B2B bookings: open ones + any where this vendor has submitted a quote
    const whereClause: any = {
      OR: [
        { status: { in: ['OPEN_FOR_QUOTES', 'QUOTES_RECEIVED'] } },
        { vendorQuotes: { some: { vendorId: vendorId } } },
      ],
    };
    if (serviceTypeFilter === 'CUSTOM_BULK') {
      whereClause.serviceType = 'CUSTOM_BULK';
    } else if (serviceTypeFilter === 'non-bulk') {
      whereClause.serviceType = { not: 'CUSTOM_BULK' };
    }

    const [bookings, total] = await Promise.all([
      prisma.b2b_bookings.findMany({
        where: whereClause,
        include: {
          customer: { select: { name: true, companyName: true } },
          vendorQuotes: {
            where: { vendorId: vendorId },
            select: { id: true, status: true, vehicleCount: true, totalPrice: true, quoteNumber: true, notes: true }
          },
          _count: { select: { vendorQuotes: true, trips: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      prisma.b2b_bookings.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      status: 'success', bookings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('B2B Vendor Quotes GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch B2B data' }, { status: 500 });
  }
}

// POST - Vendor submits a quote with vehicles and drivers
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId!;

    // Block rejected/suspended/blocked vendors from write operations
    const guard = await vendorStatusGuard(vendorId);
    if (guard.blocked) return guard.response;

    const body = await request.json();
    const { bookingId, vehicles, pricePerVehicle, totalPrice, vehiclePricing, notes } = body;

    // vehicles = [{ vendorFleetId, driverStaffId }]
    // vehiclePricing = [{ vendorFleetId, basePrice, perKmRate, ... }] (optional detailed pricing)

    if (!bookingId || !vehicles || !Array.isArray(vehicles) || vehicles.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingId, vehicles (array of {vendorFleetId, driverStaffId})' },
        { status: 400 }
      );
    }
    // For direct assignment (car rental), totalPrice can be 0
    if (totalPrice === undefined || totalPrice === null) {
      return NextResponse.json({ error: 'totalPrice is required' }, { status: 400 });
    }

    // Verify booking exists and is open
    const booking = await prisma.b2b_bookings.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return NextResponse.json({ error: 'B2B booking not found' }, { status: 404 });
    }
    if (!['OPEN_FOR_QUOTES', 'QUOTES_RECEIVED'].includes(booking.status)) {
      return NextResponse.json({ error: 'Booking is no longer accepting quotes' }, { status: 400 });
    }

    // Check vendor hasn't already quoted
    const existingQuote = await prisma.b2b_vendor_quotes.findFirst({
      where: { bookingId, vendorId: vendorId, status: { notIn: ['REJECTED', 'WITHDRAWN'] } },
    });
    if (existingQuote) {
      return NextResponse.json({ error: 'You have already submitted a quote for this booking' }, { status: 400 });
    }

    // Verify all vehicles belong to this vendor. For CUSTOM_BULK quotes a
    // single vehicle can legitimately appear on multiple days, so dedupe the
    // ids before comparing — otherwise Prisma's unique findMany result would
    // falsely report a missing fleet entry.
    const fleetIds = vehicles.map((v: any) => v.vendorFleetId);
    const uniqueFleetIds = Array.from(new Set(fleetIds));
    const vendorFleets = await prisma.vendor_fleets.findMany({
      where: { id: { in: uniqueFleetIds }, vendorId: vendorId },
      select: { id: true, vehicleName: true, registrationNumber: true },
    });
    if (vendorFleets.length !== uniqueFleetIds.length) {
      return NextResponse.json({ error: 'Some vehicles do not belong to your fleet' }, { status: 400 });
    }

    // Verify drivers belong to this vendor (if provided). Same dedupe logic —
    // one driver may be assigned across multiple days of the same quote.
    const driverIds = vehicles.map((v: any) => v.driverStaffId).filter(Boolean);
    const uniqueDriverIds = Array.from(new Set(driverIds));
    if (uniqueDriverIds.length > 0) {
      const vendorDrivers = await prisma.vendor_staff.findMany({
        where: { id: { in: uniqueDriverIds }, vendorId: vendorId, role: 'DRIVER' },
        select: { id: true, name: true, phone: true },
      });
      if (vendorDrivers.length !== uniqueDriverIds.length) {
        return NextResponse.json({ error: 'Some drivers do not belong to your staff' }, { status: 400 });
      }
    }

    // Create quote with vehicles
    const quoteId = generateId();
    const quoteNumber = generateQuoteNumber();

    // Build vehicle-fleet lookup maps
    const fleetMap = new Map(vendorFleets.map(f => [f.id, f]));
    const driverMap = new Map();
    if (driverIds.length > 0) {
      const drivers = await prisma.vendor_staff.findMany({
        where: { id: { in: driverIds } },
        select: { id: true, name: true, phone: true },
      });
      drivers.forEach(d => driverMap.set(d.id, d));
    }

    // Create the quote
    await prisma.b2b_vendor_quotes.create({
      data: {
        id: quoteId,
        quoteNumber,
        bookingId,
        vendorId: vendorId,
        vehicleCount: vehicles.length,
        pricePerVehicle: pricePerVehicle || null,
        totalPrice: parseFloat(totalPrice),
        notes: notes || null,
        status: 'SUBMITTED',
      },
    });

    // Build pricing lookup from vehiclePricing array
    const pricingMap = new Map();
    if (Array.isArray(vehiclePricing)) {
      vehiclePricing.forEach((vp: any) => pricingMap.set(vp.vendorFleetId, vp));
    }

    // Create quote vehicles
    const quoteVehiclesData = vehicles.map((v: any) => {
      const fleet = fleetMap.get(v.vendorFleetId);
      const driver = v.driverStaffId ? driverMap.get(v.driverStaffId) : null;
      const pricing = pricingMap.get(v.vendorFleetId) || {};
      return {
        id: generateId(),
        quoteId,
        vendorFleetId: v.vendorFleetId,
        driverStaffId: v.driverStaffId || null,
        vehicleName: fleet?.vehicleName || null,
        vehicleNumber: fleet?.registrationNumber || null,
        driverName: driver?.name || null,
        driverPhone: driver?.phone || null,
        basePrice: pricing.basePrice || null,
        perKmRate: pricing.perKmRate || null,
        perHourRate: pricing.perHourRate || null,
        perDayRate: pricing.perDayRate || null,
        driverAllowance: pricing.driverAllowance || null,
        nightCharges: pricing.nightCharges || null,
        extraKmCharge: pricing.extraKmCharge || null,
        extraHourCharge: pricing.extraHourCharge || null,
      };
    });

    await prisma.b2b_vendor_quote_vehicles.createMany({ data: quoteVehiclesData });

    // Update booking status if first quote
    if (booking.status === 'OPEN_FOR_QUOTES') {
      await prisma.b2b_bookings.update({
        where: { id: bookingId },
        data: { status: 'QUOTES_RECEIVED' },
      });
    }

    // Send notification to customer about new vendor quote (async, non-blocking)
    const vendor = await prisma.vendors.findUnique({ where: { id: vendorId }, select: { businessName: true } });
    onVendorQuoteSubmitted({
      bookingId,
      bookingNumber: booking.bookingNumber,
      quoteNumber,
      vendorName: vendor?.businessName || 'A vendor',
      vehicleCount: vehicles.length,
      totalPrice,
      customerId: booking.customerId,
      serviceType: booking.serviceType,
    }).catch(e => console.error('B2B quote notification error:', e));

    return NextResponse.json({
      status: 'success',
      message: 'Quote submitted successfully',
      quote: { id: quoteId, quoteNumber, vehicleCount: vehicles.length, totalPrice },
    });
  } catch (error: any) {
    console.error('B2B Vendor Quote POST error:', error);
    return NextResponse.json({ error: 'Failed to submit quote' }, { status: 500 });
  }
}
