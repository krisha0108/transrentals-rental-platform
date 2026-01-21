// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

function generateRequestNumber(): string {
  const prefix = 'PQR';
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}-${random}`;
}

// POST - Customer creates a Packers Quote Request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerName, customerEmail, customerPhone, customerId,
      serviceType, shiftingType, propertySize,
      inventoryList, hasHeavyItems, heavyItemsDesc, hasFragileItems, fragileItemsDesc, hasVehicle, vehicleDetails,
      pickupCity, pickupAddress, pickupFloor, hasPickupLift, pickupParkingDist,
      dropCity, dropAddress, dropFloor, hasDropLift, dropParkingDist,
      preferredDate, isFlexibleDate, flexibleDateRange,
      needPacking, needUnpacking, needStorage, storageDays, needInsurance, insuranceValue,
      requirements, budgetMin, budgetMax,
    } = body;

    if (!customerName || !customerEmail || !customerPhone) {
      return NextResponse.json({ error: 'Customer details are required' }, { status: 400 });
    }
    if (!pickupCity || !dropCity || !pickupAddress || !dropAddress || !preferredDate || !shiftingType) {
      return NextResponse.json({ error: 'Location and shifting details are required' }, { status: 400 });
    }

    // MySQL is case-insensitive by default with utf8mb4_general_ci collation
    const location = await prisma.locations.findFirst({
      where: {
        OR: [{ name: { contains: pickupCity } }, { slug: pickupCity.toLowerCase().replace(/\s+/g, '-') }],
        isActive: true,
      },
    });

    const requestNumber = generateRequestNumber();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const quotesOpenTill = new Date();
    quotesOpenTill.setHours(quotesOpenTill.getHours() + 48);

    const quoteRequest = await prisma.packers_quote_requests.create({
      data: {
        requestNumber,
        customerId: customerId || null,
        customerName, customerEmail, customerPhone,
        serviceType: serviceType || 'home-intercity',
        shiftingType,
        propertySize: propertySize || null,
        inventoryList: inventoryList || null,
        hasHeavyItems: hasHeavyItems || false,
        heavyItemsDesc: heavyItemsDesc || null,
        hasFragileItems: hasFragileItems || false,
        fragileItemsDesc: fragileItemsDesc || null,
        hasVehicle: hasVehicle || false,
        vehicleDetails: vehicleDetails || null,
        pickupCity, pickupAddress,
        pickupFloor: pickupFloor || null,
        hasPickupLift: hasPickupLift || false,
        pickupParkingDist: pickupParkingDist || null,
        dropCity, dropAddress,
        dropFloor: dropFloor || null,
        hasDropLift: hasDropLift || false,
        dropParkingDist: dropParkingDist || null,
        preferredDate: new Date(preferredDate),
        isFlexibleDate: isFlexibleDate || false,
        flexibleDateRange: flexibleDateRange || null,
        needPacking: needPacking !== false,
        needUnpacking: needUnpacking || false,
        needStorage: needStorage || false,
        storageDays: storageDays || null,
        needInsurance: needInsurance || false,
        insuranceValue: insuranceValue || null,
        requirements: requirements || null,
        budgetMin: budgetMin || null,
        budgetMax: budgetMax || null,
        locationId: location?.id || null,
        status: 'PENDING',
        expiresAt,
        quotesOpenTill,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Quote request submitted. Vendors will send quotes within 24-48 hours.',
      quoteRequest: {
        id: quoteRequest.id,
        requestNumber: quoteRequest.requestNumber,
        status: quoteRequest.status,
        shiftingType: quoteRequest.shiftingType,
        pickupCity: quoteRequest.pickupCity,
        dropCity: quoteRequest.dropCity,
        preferredDate: quoteRequest.preferredDate,
        expiresAt: quoteRequest.expiresAt,
      },
    });
  } catch (error: any) {
    logger.error('Failed to create packers quote request', error);
    return NextResponse.json({ error: 'Failed to create quote request', details: error?.message }, { status: 500 });
  }
}

// GET - List Packers Quote Requests for a customer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');
    const status = searchParams.get('status');

    if (!customerId && !phone && !email) {
      return NextResponse.json({ error: 'Customer ID, phone, or email required' }, { status: 400 });
    }

    const whereClause: any = {};
    if (customerId) whereClause.customerId = customerId;
    else if (phone) whereClause.customerPhone = phone;
    else if (email) whereClause.customerEmail = email;
    if (status && status !== 'all') whereClause.status = status;

    const requests = await prisma.packers_quote_requests.findMany({
      where: whereClause,
      include: {
        packers_quotes: {
          where: { status: { in: ['SENT', 'VIEWED'] } },
          select: { id: true, quoteNumber: true, vendorId: true, totalAmount: true, status: true, validTill: true },
          orderBy: { totalAmount: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      requests: requests.map((r) => ({
        id: r.id,
        requestNumber: r.requestNumber,
        serviceType: r.serviceType,
        shiftingType: r.shiftingType,
        pickupCity: r.pickupCity,
        dropCity: r.dropCity,
        preferredDate: r.preferredDate,
        status: r.status,
        totalQuotesReceived: r.totalQuotesReceived,
        quotes: r.packers_quotes,
        expiresAt: r.expiresAt,
        createdAt: r.createdAt,
      })),
    });
  } catch (error: any) {
    logger.error('Failed to fetch packers quote requests', error);
    return NextResponse.json({ error: 'Failed to fetch requests', details: error?.message }, { status: 500 });
  }
}
