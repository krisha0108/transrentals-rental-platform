// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

function generateRequestNumber(): string {
  const prefix = 'TQR';
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}-${random}`;
}

// POST - Customer creates a Truck Quote Request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerName, customerEmail, customerPhone, customerId,
      serviceType, vehicle_category, vehicleCategoryName,
      goodsType, goodsDescription, estimatedWeight, estimatedVolume,
      requiresLabour, labourCount,
      pickupCity, pickupAddress, pickupFloor, hasPickupLift,
      dropCity, dropAddress, dropFloor, hasDropLift, estimatedDistance,
      pickupDate, pickupTime, isFlexibleDate,
      requirements, needInsurance, needPackaging,
      budgetMin, budgetMax,
    } = body;

    if (!customerName || !customerEmail || !customerPhone) {
      return NextResponse.json({ error: 'Customer details are required' }, { status: 400 });
    }
    if (!pickupCity || !dropCity || !pickupDate || !vehicle_category || !goodsType) {
      return NextResponse.json({ error: 'Trip and goods details are required' }, { status: 400 });
    }

    // MySQL is case-insensitive by default with utf8mb4_general_ci collation
    const location = await prisma.locations.findFirst({
      where: {
        OR: [
          { name: { contains: pickupCity } },
          { slug: pickupCity.toLowerCase().replace(/\s+/g, '-') },
        ],
        isActive: true,
      },
    });

    const requestNumber = generateRequestNumber();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const quotesOpenTill = new Date();
    quotesOpenTill.setHours(quotesOpenTill.getHours() + 48);

    const quoteRequest = await prisma.truck_quote_requests.create({
      data: {
        requestNumber,
        customerId: customerId || null,
        customerName, customerEmail, customerPhone,
        serviceType: serviceType || 'intercity',
        vehicle_category,
        vehicleCategoryName: vehicleCategoryName || vehicle_category,
        goodsType,
        goodsDescription: goodsDescription || null,
        estimatedWeight: estimatedWeight || null,
        estimatedVolume: estimatedVolume || null,
        requiresLabour: requiresLabour || false,
        labourCount: labourCount || null,
        pickupCity,
        pickupAddress: pickupAddress || null,
        pickupFloor: pickupFloor || null,
        hasPickupLift: hasPickupLift || false,
        dropCity,
        dropAddress: dropAddress || null,
        dropFloor: dropFloor || null,
        hasDropLift: hasDropLift || false,
        estimatedDistance: estimatedDistance || null,
        pickupDate: new Date(pickupDate),
        pickupTime: pickupTime || '08:00',
        isFlexibleDate: isFlexibleDate || false,
        requirements: requirements || null,
        needInsurance: needInsurance || false,
        needPackaging: needPackaging || false,
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
        chauffeur_vehicle_categories: quoteRequest.vehicleCategoryName,
        goodsType: quoteRequest.goodsType,
        pickupCity: quoteRequest.pickupCity,
        dropCity: quoteRequest.dropCity,
        pickupDate: quoteRequest.pickupDate,
        expiresAt: quoteRequest.expiresAt,
      },
    });
  } catch (error: any) {
    logger.error('Failed to create truck quote request', error);
    return NextResponse.json({ error: 'Failed to create quote request', details: error?.message }, { status: 500 });
  }
}

// GET - List Truck Quote Requests for a customer
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

    const requests = await prisma.truck_quote_requests.findMany({
      where: whereClause,
      include: {
        truck_quotes: {
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
        chauffeur_vehicle_categories: r.vehicleCategoryName,
        goodsType: r.goodsType,
        pickupCity: r.pickupCity,
        dropCity: r.dropCity,
        pickupDate: r.pickupDate,
        status: r.status,
        totalQuotesReceived: r.totalQuotesReceived,
        quotes: r.truck_quotes,
        expiresAt: r.expiresAt,
        createdAt: r.createdAt,
      })),
    });
  } catch (error: any) {
    logger.error('Failed to fetch truck quote requests', error);
    return NextResponse.json({ error: 'Failed to fetch requests', details: error?.message }, { status: 500 });
  }
}
