// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - List active booking postings (for browsing by other vendors)
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const serviceType = searchParams.get('serviceType');
    const fromCity = searchParams.get('fromCity');
    const urgency = searchParams.get('urgency');
    const search = searchParams.get('search');
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'ACTIVE',
      vendorId: { not: auth.vendorId },
      OR: [
        { expiresAt: { gt: new Date() } },
        { expiresAt: null },
      ],
    };

    if (serviceType) {
      where.serviceType = { contains: serviceType };
    }

    if (fromCity) {
      where.fromCity = fromCity;
    }

    if (urgency) {
      where.urgency = urgency;
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { fromCity: { contains: search } },
            { toCity: { contains: search } },
            { serviceType: { contains: search } },
            { goodsType: { contains: search } },
            { notes: { contains: search } },
            { postingNumber: { contains: search } },
          ],
        },
      ];
    }

    const [postings, total] = await Promise.all([
      prisma.p2p_booking_postings.findMany({
        where,
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
              city: true,
              phone: true,
              rating: true,
              totalRatings: true,
              logo: true,
            },
          },
        },
        orderBy: [
          { urgency: 'asc' },
          { tripDate: 'asc' },
        ],
        skip,
        take: limit,
      }),
      prisma.p2p_booking_postings.count({ where }),
    ]);

    return NextResponse.json({
      postings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching booking postings', error);
    return NextResponse.json({ error: 'Failed to fetch booking postings' }, { status: 500 });
  }
}

// POST - Create new booking posting
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const {
      serviceType,
      bookingType,
      vehicleRequired,
      vehicleCategory,
      fromCity,
      toCity,
      tripDate,
      tripTime,
      returnDate,
      passengers,
      goodsType,
      goodsDescription,
      estimatedWeight,
      needInsurance,
      needPackaging,
      needLabour,
      labourCount,
      customerBudget,
      partnerEarning,
      commission,
      urgency,
      reason,
      notes,
    } = body;

    // Validate required fields
    if (!serviceType || !fromCity || !tripDate || !customerBudget) {
      return NextResponse.json(
        { error: 'serviceType, fromCity, tripDate, and customerBudget are required' },
        { status: 400 }
      );
    }

    // Generate ID
    const allIds = await prisma.p2p_booking_postings.findMany({
      where: { id: { startsWith: 'PBP_' } },
      select: { id: true },
    });
    const maxId = allIds.reduce((max: number, item: any) => {
      const num = parseInt(item.id.replace('PBP_', ''));
      return num > max ? num : max;
    }, 0);
    const newId = `PBP_${maxId + 1}`;

    // Generate posting number
    const allPostingNumbers = await prisma.p2p_booking_postings.findMany({
      where: { postingNumber: { startsWith: 'BP-' } },
      select: { postingNumber: true },
    });
    const maxPostingNum = allPostingNumbers.reduce((max: number, item: any) => {
      const num = parseInt(item.postingNumber.replace('BP-', ''));
      return num > max ? num : max;
    }, 0);
    const newPostingNumber = `BP-${maxPostingNum + 1}`;

    // Calculate expiresAt as end of trip date
    const expDate = new Date(tripDate);
    expDate.setHours(23, 59, 59, 999);

    const posting = await prisma.p2p_booking_postings.create({
      data: {
        id: newId,
        postingNumber: newPostingNumber,
        vendorId: auth.vendorId,
        serviceType,
        bookingType: bookingType || null,
        vehicleRequired: vehicleRequired || null,
        vehicleCategory: vehicleCategory || null,
        fromCity,
        toCity: toCity || null,
        tripDate: new Date(tripDate),
        tripTime: tripTime || null,
        returnDate: returnDate ? new Date(returnDate) : null,
        passengers: passengers ? parseInt(String(passengers)) : null,
        goodsType: goodsType || null,
        goodsDescription: goodsDescription || null,
        estimatedWeight: estimatedWeight ? String(estimatedWeight) : null,
        needInsurance: needInsurance === true,
        needPackaging: needPackaging === true,
        needLabour: needLabour === true,
        labourCount: labourCount ? parseInt(String(labourCount)) : null,
        customerBudget: parseFloat(String(customerBudget)),
        partnerEarning: partnerEarning ? parseFloat(String(partnerEarning)) : null,
        commission: commission ? parseFloat(String(commission)) : null,
        urgency: urgency || 'MEDIUM',
        reason: reason || null,
        notes: notes || null,
        status: 'ACTIVE',
        expiresAt: expDate,
      },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            city: true,
            rating: true,
            totalRatings: true,
            logo: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, posting }, { status: 201 });
  } catch (error: any) {
    const errMsg = error?.message || 'Failed to create booking posting';
    logger.error('Error creating booking posting', error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
