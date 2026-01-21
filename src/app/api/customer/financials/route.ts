import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

/**
 * GET - Get customer financial summary from local trans_cms database
 * Aggregates all booking payments/expenses
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customer_id') || '';

  if (!customerId) {
    return NextResponse.json(
      { success: false, message: 'customer_id is required to fetch expenses.' },
      { status: 400 }
    );
  }

  try {
    // Build filter - customerId could be a CUID, phone, or email
    const customerFilter = {
      OR: [
        { customerPhone: customerId },
        { customerEmail: customerId },
        { customerId: customerId },
      ],
    };

    // Get completed bike bookings with payments
    // Status: COMPLETED, ACCEPTED, IN_PROGRESS (those that have been paid for)
    let bikeExpenses: any[] = [];
    try {
      bikeExpenses = await prisma.bike_bookings.findMany({
        where: {
          ...customerFilter,
          status: { in: ['COMPLETED', 'ACCEPTED', 'IN_PROGRESS'] },
          totalAmount: { gt: 0 },
        },
        select: {
          id: true,
          bookingNumber: true,
          requestedVehicleName: true,
          totalAmount: true,
          createdAt: true,
          pickupDate: true,
          locationName: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    } catch (e) {
      logger.error('Error fetching bike expenses', e);
    }

    // Get completed car bookings with payments
    let carExpenses: any[] = [];
    try {
      carExpenses = await prisma.car_bookings.findMany({
        where: {
          ...customerFilter,
          status: { in: ['COMPLETED', 'ACCEPTED', 'IN_PROGRESS'] },
          grandTotal: { gt: 0 },
        },
        select: {
          id: true,
          bookingNumber: true,
          requestedVehicleName: true,
          grandTotal: true,
          createdAt: true,
          pickupDate: true,
          locationName: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    } catch (e) {
      logger.error('Error fetching car expenses', e);
    }

    // Get completed chauffeur bookings with payments
    let chauffeurExpenses: any[] = [];
    try {
      chauffeurExpenses = await prisma.chauffeur_bookings.findMany({
        where: {
          ...customerFilter,
          status: { in: ['COMPLETED', 'ACCEPTED', 'DRIVER_ASSIGNED', 'IN_PROGRESS'] },
          grandTotal: { gt: 0 },
        },
        select: {
          id: true,
          bookingNumber: true,
          carCategoryName: true,
          carCategory: true,
          grandTotal: true,
          createdAt: true,
          pickupDate: true,
          locationName: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    } catch (e) {
      logger.error('Error fetching chauffeur expenses', e);
    }

    // Transform to common expense format
    const expenses = [
      ...bikeExpenses.map((b) => ({
        id: b.id,
        source_name: 'Bike Rental',
        heading: b.requestedVehicleName || 'Bike Rental',
        description: `Booking #${b.bookingNumber} - ${b.locationName || 'N/A'}`,
        amount: b.totalAmount || 0,
        date: b.createdAt.toISOString(),
        created_at: b.createdAt.toISOString(),
      })),
      ...carExpenses.map((b) => ({
        id: b.id,
        source_name: 'Self-Drive Car',
        heading: b.requestedVehicleName || 'Car Rental',
        description: `Booking #${b.bookingNumber} - ${b.locationName || 'N/A'}`,
        amount: b.grandTotal || 0,
        date: b.createdAt.toISOString(),
        created_at: b.createdAt.toISOString(),
      })),
      ...chauffeurExpenses.map((b) => ({
        id: b.id,
        source_name: 'Car with Driver',
        heading: b.carCategoryName || b.carCategory || 'Chauffeur Service',
        description: `Booking #${b.bookingNumber} - ${b.locationName || 'N/A'}`,
        amount: b.grandTotal || 0,
        date: b.createdAt.toISOString(),
        created_at: b.createdAt.toISOString(),
      })),
    ];

    // Sort by date descending
    expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate total expense
    const totalExpense = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);

    return NextResponse.json({
      success: true,
      total_expense: totalExpense,
      expenses,
    });
  } catch (error) {
    logger.error('Customer financials error', error);
    return NextResponse.json(
      { success: false, message: 'Unable to load expenses' },
      { status: 500 }
    );
  }
}
