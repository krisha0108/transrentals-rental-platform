// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

/**
 * GET - Fetch all payment transactions for a customer across all booking types
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');

    if (!customerId) {
      return NextResponse.json(
        { status: false, message: 'Customer ID is required' },
        { status: 400 }
      );
    }

    logger.info('Fetching customer expenses', { customerId });

    const expenses = [];

    // Fetch Bike Bookings with payments
    const bikeBookings = await prisma.bike_bookings.findMany({
      where: {
        customerId,
        paidAmount: { gt: 0 },
      },
      include: {
        vendors_bike_bookings_acceptedVendorIdTovendors: {
          select: {
            id: true,
            businessName: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    bikeBookings.forEach((booking) => {
      if (booking.paidAmount > 0) {
        expenses.push({
          id: `bike_${booking.id}`,
          booking_id: booking.id,
          booking_number: booking.bookingNumber,
          source_name: 'Bike Rental',
          service_type: 'bike',
          amount: booking.paidAmount,
          vendors: {
            name: booking.vendors_bike_bookings_acceptedVendorIdTovendors?.businessName || 'N/A',
            phone: booking.vendors_bike_bookings_acceptedVendorIdTovendors?.phone,
          },
          description: `Payment for bike rental - ${booking.bookingNumber}`,
          payment_date: booking.pickedUpAt || booking.createdAt,
          created_at: booking.createdAt,
        });
      }
    });

    // Fetch Self-Drive Car Bookings
    const carBookings = await prisma.car_bookings.findMany({
      where: {
        customerId,
        paidAmount: { gt: 0 },
      },
      include: {
        vendors_car_bookings_acceptedVendorIdTovendors: {
          select: {
            id: true,
            businessName: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    carBookings.forEach((booking) => {
      if (booking.paidAmount > 0) {
        expenses.push({
          id: `car_${booking.id}`,
          booking_id: booking.id,
          booking_number: booking.bookingNumber,
          source_name: 'Self-Drive Car',
          service_type: 'self-drive',
          amount: booking.paidAmount,
          vendors: {
            name: booking.vendors_car_bookings_acceptedVendorIdTovendors?.businessName || 'N/A',
            phone: booking.vendors_car_bookings_acceptedVendorIdTovendors?.phone,
          },
          description: `Payment for self-drive car - ${booking.bookingNumber}`,
          payment_date: booking.pickedUpAt || booking.createdAt,
          created_at: booking.createdAt,
        });
      }
    });

    // Fetch Luxury Bookings
    const luxuryBookings = await prisma.luxury_bookings.findMany({
      where: {
        customerId,
        paymentStatus: { in: ['SUBMITTED', 'PAID', 'PARTIAL'] },
      },
      include: {
        vendors_luxury_bookings_acceptedVendorIdTovendors: {
          select: {
            id: true,
            businessName: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    luxuryBookings.forEach((booking) => {
      if (booking.advanceAmount > 0) {
        expenses.push({
          id: `luxury_${booking.id}`,
          booking_id: booking.id,
          booking_number: booking.bookingNumber,
          source_name: 'Luxury Car Rental',
          service_type: 'luxury',
          amount: booking.advanceAmount,
          vendors: {
            name: booking.vendors_luxury_bookings_acceptedVendorIdTovendors?.businessName || 'N/A',
            phone: booking.vendors_luxury_bookings_acceptedVendorIdTovendors?.phone,
          },
          description: `Advance payment for luxury car - ${booking.bookingNumber}`,
          payment_date: booking.paymentSubmittedAt || booking.createdAt,
          created_at: booking.createdAt,
        });
      }
    });

    // Fetch Truck Bookings
    const truckBookings = await prisma.truck_bookings.findMany({
      where: {
        customerId,
        OR: [
          { advancePaid: { gt: 0 } },
          { paymentStatus: { in: ['SUBMITTED', 'PAID'] } },
        ],
      },
      include: {
        vendors: {
          select: {
            id: true,
            businessName: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    truckBookings.forEach((booking) => {
      if (booking.advancePaid > 0) {
        expenses.push({
          id: `truck_${booking.id}`,
          booking_id: booking.id,
          booking_number: booking.bookingNumber,
          source_name: 'Truck Rental',
          service_type: 'truck',
          amount: booking.advancePaid,
          vendors: {
            name: booking.vendor?.businessName || 'N/A',
            phone: booking.vendor?.phone,
          },
          description: `Advance payment for truck - ${booking.bookingNumber}`,
          payment_date: booking.advancePaidAt || booking.createdAt,
          created_at: booking.createdAt,
        });
      }
    });

    // Fetch Equipment Bookings
    const equipmentBookings = await prisma.equipment_bookings.findMany({
      where: {
        customerId,
        OR: [
          { advancePaid: { gt: 0 } },
          { paymentStatus: { in: ['SUBMITTED', 'PAID'] } },
        ],
      },
      include: {
        vendors: {
          select: {
            id: true,
            businessName: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    equipmentBookings.forEach((booking) => {
      if (booking.advancePaid > 0) {
        expenses.push({
          id: `equipment_${booking.id}`,
          booking_id: booking.id,
          booking_number: booking.bookingNumber,
          source_name: 'Equipment Rental',
          service_type: 'equipment',
          amount: booking.advancePaid,
          vendors: {
            name: booking.vendor?.businessName || 'N/A',
            phone: booking.vendor?.phone,
          },
          description: `Advance payment for equipment - ${booking.bookingNumber}`,
          payment_date: booking.advancePaidAt || booking.createdAt,
          created_at: booking.createdAt,
        });
      }
    });

    // Fetch Packers Bookings
    const packersBookings = await prisma.packers_bookings.findMany({
      where: {
        customerId,
        OR: [
          { advancePaid: { gt: 0 } },
          { paymentStatus: { in: ['SUBMITTED', 'PAID'] } },
        ],
      },
      include: {
        vendors: {
          select: {
            id: true,
            businessName: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    packersBookings.forEach((booking) => {
      if (booking.advancePaid > 0) {
        expenses.push({
          id: `packers_${booking.id}`,
          booking_id: booking.id,
          booking_number: booking.bookingNumber,
          source_name: 'Packers & Movers',
          service_type: 'packers',
          amount: booking.advancePaid,
          vendors: {
            name: booking.vendor?.businessName || 'N/A',
            phone: booking.vendor?.phone,
          },
          description: `Advance payment for packers & movers - ${booking.bookingNumber}`,
          payment_date: booking.advancePaidAt || booking.createdAt,
          created_at: booking.createdAt,
        });
      }
    });

    // Fetch Bus Bookings
    const busBookings = await prisma.bus_bookings.findMany({
      where: {
        customerId,
        OR: [
          { advancePaid: { gt: 0 } },
          { paymentStatus: { in: ['SUBMITTED', 'PAID'] } },
        ],
      },
      include: {
        vendors: {
          select: {
            id: true,
            businessName: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    busBookings.forEach((booking) => {
      if (booking.advancePaid > 0) {
        expenses.push({
          id: `bus_${booking.id}`,
          booking_id: booking.id,
          booking_number: booking.bookingNumber,
          source_name: 'Bus Rental',
          service_type: 'bus',
          amount: booking.advancePaid,
          vendors: {
            name: booking.vendor?.businessName || 'N/A',
            phone: booking.vendor?.phone,
          },
          description: `Advance payment for bus rental - ${booking.bookingNumber}`,
          payment_date: booking.advancePaidAt || booking.createdAt,
          created_at: booking.createdAt,
        });
      }
    });

    // Sort all expenses by payment date (newest first)
    expenses.sort((a, b) => {
      const dateA = new Date(a.payment_date);
      const dateB = new Date(b.payment_date);
      return dateB.getTime() - dateA.getTime();
    });

    logger.info('Fetched customer expenses', {
      customerId,
      totalExpenses: expenses.length,
    });

    return NextResponse.json({
      status: true,
      expenses,
      total: expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0),
    });
  } catch (error: any) {
    logger.error('Failed to fetch customer expenses', error);
    return NextResponse.json(
      { status: false, message: 'Failed to fetch expenses', details: error?.message },
      { status: 500 }
    );
  }
}
