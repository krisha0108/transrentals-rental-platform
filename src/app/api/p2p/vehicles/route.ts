// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - List active vehicle postings (for browsing by other vendors)
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const serviceType = searchParams.get('serviceType');
    const fromCity = searchParams.get('fromCity');
    const toCity = searchParams.get('toCity');
    const date = searchParams.get('date');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {
      status: 'ACTIVE',
      vendorId: { not: auth.vendorId }, // Don't show own postings
      OR: [
        { expiresAt: { gt: new Date() } },
        { expiresAt: null },
      ],
    };

    if (serviceType) {
      where.serviceType = { contains: serviceType };
    }

    if (fromCity) {
      where.fromCity = { contains: fromCity };
    }

    if (toCity) {
      where.toCity = { contains: toCity };
    }

    if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      where.departureDate = {
        gte: searchDate,
        lt: nextDay,
      };
    }

    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { vehicleName: { contains: search } },
            { fromCity: { contains: search } },
            { toCity: { contains: search } },
            { vehicleCategory: { contains: search } },
            { bodyType: { contains: search } },
          ],
        },
      ];
    }

    const [postings, total] = await Promise.all([
      prisma.p2p_vehicle_postings.findMany({
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
        orderBy: { departureDate: 'asc' },
        skip,
        take: limit,
      }),
      prisma.p2p_vehicle_postings.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      postings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    logger.error('P2P vehicles list error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vehicle postings' },
      { status: 500 }
    );
  }
}

// POST - Create new vehicle posting
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const {
      serviceType,
      vehicleId,
      vehicleCategory,
      vehicleName,
      vehicleNumber,
      capacity,
      bodyType,
      fromCity,
      toCity,
      departureDate,
      departureTime,
      arrivalDate,
      arrivalTime,
      priceFullLoad,
      pricePartLoad,
      acceptsPartLoad,
      availableSpace,
      driverIncluded,
      driverName,
      driverPhone,
      fuelIncluded,
      labourAvailable,
      labourCount,
      goodsAccepted,
      totalSeats,
      availableSeats,
      busType,
      isAC,
      notes,
    } = body;

    // Validate required fields
    if (!serviceType || !vehicleName || !fromCity || !toCity || !departureDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: serviceType, vehicleName, fromCity, toCity, departureDate',
        },
        { status: 400 }
      );
    }

    // Generate unique ID with PVP_ prefix
    const allIds = await prisma.p2p_vehicle_postings.findMany({
      where: { id: { startsWith: 'PVP_' } },
      select: { id: true },
    });
    const maxId = allIds.reduce((max, item) => {
      const num = parseInt(item.id.replace('PVP_', ''));
      return num > max ? num : max;
    }, 0);
    const newId = `PVP_${maxId + 1}`;

    // Generate unique posting number with VP- prefix
    const allPostingNumbers = await prisma.p2p_vehicle_postings.findMany({
      where: { postingNumber: { startsWith: 'VP-' } },
      select: { postingNumber: true },
    });
    const maxPostingNum = allPostingNumbers.reduce((max, item) => {
      const num = parseInt(item.postingNumber.replace('VP-', ''));
      return num > max ? num : max;
    }, 1000);
    const newPostingNumber = `VP-${maxPostingNum + 1}`;

    // Set expiresAt to end of departureDate (auto-expire after trip date passes)
    const parsedDepartureDate = new Date(departureDate);
    const expiresAt = new Date(parsedDepartureDate);
    expiresAt.setHours(23, 59, 59, 999);

    const posting = await prisma.p2p_vehicle_postings.create({
      data: {
        id: newId,
        postingNumber: newPostingNumber,
        vendorId: auth.vendorId,
        serviceType,
        vehicleId: vehicleId || null,
        vehicleCategory: vehicleCategory || null,
        vehicleName,
        vehicleNumber: vehicleNumber || null,
        capacity: capacity || null,
        bodyType: bodyType || null,
        fromCity,
        toCity,
        departureDate: parsedDepartureDate,
        departureTime: departureTime || null,
        arrivalDate: arrivalDate ? new Date(arrivalDate) : null,
        arrivalTime: arrivalTime || null,
        priceFullLoad: priceFullLoad ? parseFloat(String(priceFullLoad)) : null,
        pricePartLoad: pricePartLoad ? parseFloat(String(pricePartLoad)) : null,
        acceptsPartLoad: acceptsPartLoad === true || acceptsPartLoad === 'true',
        availableSpace: availableSpace || null,
        driverIncluded: driverIncluded !== false && driverIncluded !== 'false',
        driverName: driverName || null,
        driverPhone: driverPhone || null,
        fuelIncluded: fuelIncluded === true || fuelIncluded === 'true',
        labourAvailable: labourAvailable === true || labourAvailable === 'true',
        labourCount: labourCount ? parseInt(String(labourCount)) : null,
        goodsAccepted: goodsAccepted ? (Array.isArray(goodsAccepted) ? JSON.stringify(goodsAccepted) : String(goodsAccepted)) : null,
        totalSeats: totalSeats ? parseInt(String(totalSeats)) : null,
        availableSeats: availableSeats ? parseInt(String(availableSeats)) : null,
        busType: busType || null,
        isAC: isAC != null ? (isAC === true || isAC === 'true') : null,
        notes: notes || null,
        status: 'ACTIVE',
        expiresAt,
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

    return NextResponse.json({
      success: true,
      posting,
      message: 'Vehicle posting created successfully',
    });
  } catch (error: any) {
    logger.error('P2P vehicle posting create error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create vehicle posting' },
      { status: 500 }
    );
  }
}
