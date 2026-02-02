// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - List Bus Bookings for a customer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');
    const status = searchParams.get('status');

    if (!customerId && !phone && !email) {
      return NextResponse.json(
        { error: 'Customer ID, phone, or email required' },
        { status: 400 }
      );
    }

    const whereClause: any = {};

    if (customerId) {
      whereClause.customerId = customerId;
    } else if (phone) {
      whereClause.customerPhone = phone;
    } else if (email) {
      whereClause.customerEmail = email;
    }

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const bookings = await prisma.bus_bookings.findMany({
      where: whereClause,
      include: {
        vendors: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            rating: true,
          },
        },
        bus_quote_requests: {
          select: {
            id: true,
            requestNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      bookings: bookings.map((b) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        tripType: b.tripType,
        chauffeur_vehicle_categories: b.vehicle_category,
        vehicleName: b.vehicleName,
        passengers: b.passengers,
        pickupCity: b.pickupCity,
        pickupAddress: b.pickupAddress,
        dropCity: b.dropCity,
        dropAddress: b.dropAddress,
        routeDetails: b.routeDetails,
        pickupDate: b.pickupDate,
        pickupTime: b.pickupTime,
        returnDate: b.returnDate,
        returnTime: b.returnTime,
        tripDays: b.tripDays,
        baseAmount: b.baseAmount,
        gstAmount: b.gstAmount,
        totalAmount: b.totalAmount,
        advanceAmount: b.advanceAmount,
        advancePaid: b.advancePaid,
        balanceAmount: b.balanceAmount,
        status: b.status,
        paymentStatus: b.paymentStatus,
        driverName: b.driverName,
        driverPhone: b.driverPhone,
        vehicleNumber: b.vehicleNumber,
        vehicle_models: b.vehicle_models,
        tripStartOtp: b.tripStartOtp,
        tripStartedAt: b.tripStartedAt,
        tripEndedAt: b.tripEndedAt,
        rating: b.rating,
        review: b.review,
        vendor: b.vendor
          ? {
              name: b.vendor.businessName,
              phone: b.vendor.phone,
              rating: b.vendor.rating,
            }
          : null,
        quoteRequestId: b.bus_quote_requests?.id,
        quoteRequestNumber: b.bus_quote_requests?.requestNumber,
        createdAt: b.createdAt,
      })),
    });
  } catch (error: any) {
    logger.error('Failed to fetch bus bookings', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings', details: error?.message },
      { status: 500 }
    );
  }
}
