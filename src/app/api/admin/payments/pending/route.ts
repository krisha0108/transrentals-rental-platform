import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Fetch bookings with pending payment verification
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingType = searchParams.get('type') || 'all'; // 'bike', 'chauffeur', 'bus', 'all'

    const results: any[] = [];

    // Fetch Bike Bookings with PAYMENT_SUBMITTED status (pending verification)
    if (bookingType === 'all' || bookingType === 'bike') {
      const bikeBookings = await prisma.bike_bookings.findMany({
        where: {
          status: 'PAYMENT_SUBMITTED',
        },
        orderBy: { advancePaymentDate: 'desc' },
        take: 50,
      });

      bikeBookings.forEach((b) => {
        results.push({
          id: b.id,
          bookingNumber: b.bookingNumber,
          bookingType: 'bike',
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          serviceType: 'Bike Rental',
          vehicleName: b.requestedVehicleName,
          location: b.locationName,
          pickupDate: b.pickupDate,
          grandTotal: b.grandTotal,
          advanceAmount: b.advanceAmount,
          advancePaymentRef: b.advancePaymentRef,
          advancePaymentProof: b.advancePaymentProof,
          advancePaymentDate: b.advancePaymentDate,
          paymentMethod: b.paymentMethod,
          paymentStatus: b.paymentStatus,
          status: b.status,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        });
      });
    }

    // Fetch Car Bookings (Self-Drive) with PAYMENT_SUBMITTED status
    if (bookingType === 'all' || bookingType === 'car' || bookingType === 'self-drive') {
      const carBookings = await prisma.car_bookings.findMany({
        where: {
          status: 'PAYMENT_SUBMITTED',
        },
        orderBy: { advancePaymentDate: 'desc' },
        take: 50,
      });

      carBookings.forEach((b) => {
        results.push({
          id: b.id,
          bookingNumber: b.bookingNumber,
          bookingType: 'car',
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          serviceType: 'Self-Drive Car Rental',
          vehicleName: b.requestedVehicleName,
          vehicleBrand: b.requestedBrand,
          chauffeur_vehicle_categories: b.requestedCategory,
          location: b.locationName,
          pickupDate: b.pickupDate,
          dropDate: b.dropDate,
          totalDays: b.totalDays,
          grandTotal: b.grandTotal,
          securityDeposit: b.securityDeposit,
          advanceAmount: b.advanceAmount,
          advancePaymentRef: b.advancePaymentRef,
          advancePaymentProof: b.advancePaymentProof,
          advancePaymentDate: b.advancePaymentDate,
          paymentMethod: b.paymentMethod,
          paymentStatus: b.paymentStatus,
          status: b.status,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        });
      });
    }

    // Fetch Chauffeur Bookings with PARTIAL status (pending verification)
    // Fetch Chauffeur Bookings (Car Rental) with PENDING_PAYMENT status and payment submitted
    if (bookingType === 'all' || bookingType === 'chauffeur') {
      const chauffeurBookings = await prisma.chauffeur_bookings.findMany({
        where: {
          status: 'PENDING_PAYMENT', // Only show bookings waiting for admin approval
          paymentStatus: 'PARTIAL',
          transactionId: { not: null },
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      });

      chauffeurBookings.forEach((b) => {
        results.push({
          id: b.id,
          bookingNumber: b.bookingNumber,
          bookingType: 'chauffeur',
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          serviceType: 'Car Rental',
          vehicleName: b.carCategoryName || b.carCategory,
          location: b.pickupCity,
          pickupDate: b.pickupDate,
          grandTotal: b.grandTotal,
          advanceAmount: b.partialPayment,
          advancePaymentRef: b.transactionId,
          advancePaymentProof: null,
          advancePaymentDate: b.updatedAt,
          paymentMethod: b.paymentMethod,
          paymentStatus: b.paymentStatus,
          status: b.status,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        });
      });
    }

    // Fetch Bus Bookings with PAYMENT_SUBMITTED status
    if (bookingType === 'all' || bookingType === 'bus') {
      const busBookings = await prisma.bus_bookings.findMany({
        where: {
          status: 'PAYMENT_SUBMITTED',
        },
        orderBy: { advancePaymentDate: 'desc' },
        take: 50,
      });

      busBookings.forEach((b) => {
        results.push({
          id: b.id,
          bookingNumber: b.bookingNumber,
          bookingType: 'bus',
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          serviceType: 'Bus Rental',
          vehicleName: b.vehicleName,
          location: b.pickupCity,
          pickupDate: b.pickupDate,
          grandTotal: b.totalAmount,
          advanceAmount: b.advanceAmount,
          advancePaymentRef: b.advancePaymentRef,
          advancePaymentProof: b.advancePaymentProof,
          advancePaymentDate: b.advancePaymentDate,
          paymentMethod: b.paymentMethod,
          paymentStatus: b.paymentStatus,
          status: b.status,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        });
      });
    }

    // Fetch Truck Bookings with PAYMENT_SUBMITTED status
    if (bookingType === 'all' || bookingType === 'truck') {
      const truckBookings = await prisma.truck_bookings.findMany({
        where: {
          status: 'PAYMENT_SUBMITTED',
        },
        orderBy: { advancePaymentDate: 'desc' },
        take: 50,
      });

      truckBookings.forEach((b) => {
        results.push({
          id: b.id,
          bookingNumber: b.bookingNumber,
          bookingType: 'truck',
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          serviceType: 'Truck Rental',
          vehicleName: b.vehicleName,
          location: b.pickupCity,
          pickupDate: b.pickupDate,
          grandTotal: b.totalAmount,
          advanceAmount: b.advanceAmount,
          advancePaymentRef: b.advancePaymentRef,
          advancePaymentProof: b.advancePaymentProof,
          advancePaymentDate: b.advancePaymentDate,
          paymentMethod: b.paymentMethod,
          paymentStatus: b.paymentStatus,
          status: b.status,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        });
      });
    }

    // Fetch Equipment Bookings with PAYMENT_SUBMITTED status
    if (bookingType === 'all' || bookingType === 'equipment') {
      const equipmentBookings = await prisma.equipment_bookings.findMany({
        where: {
          status: 'PAYMENT_SUBMITTED',
        },
        orderBy: { advancePaidAt: 'desc' },
        take: 50,
      });

      equipmentBookings.forEach((b) => {
        results.push({
          id: b.id,
          bookingNumber: b.bookingNumber,
          bookingType: 'equipment',
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          serviceType: 'Equipment Rental',
          vehicleName: b.equipmentName || b.equipmentType,
          equipmentCategory: b.equipmentCategory,
          location: b.deliveryCity,
          pickupDate: b.startDate,
          grandTotal: b.totalAmount,
          advanceAmount: b.advanceAmount,
          advancePaymentRef: null,
          advancePaymentProof: null,
          advancePaymentDate: b.advancePaidAt,
          paymentMethod: null,
          paymentStatus: b.paymentStatus,
          status: b.status,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        });
      });
    }

    // Fetch Packers Bookings with PAYMENT_SUBMITTED status
    if (bookingType === 'all' || bookingType === 'packers') {
      const packersBookings = await prisma.packers_bookings.findMany({
        where: {
          status: 'PAYMENT_SUBMITTED',
        },
        orderBy: { advancePaidAt: 'desc' },
        take: 50,
      });

      packersBookings.forEach((b) => {
        results.push({
          id: b.id,
          bookingNumber: b.bookingNumber,
          bookingType: 'packers',
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          serviceType: 'Packers & Movers',
          vehicleName: b.shiftingType || b.serviceType,
          location: `${b.pickupCity} → ${b.dropCity}`,
          pickupDate: b.scheduledDate,
          grandTotal: b.totalAmount,
          advanceAmount: b.advanceAmount,
          advancePaymentRef: null,
          advancePaymentProof: null,
          advancePaymentDate: b.advancePaidAt,
          paymentMethod: null,
          paymentStatus: b.paymentStatus,
          status: b.status,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        });
      });
    }

    // Fetch Luxury Car Bookings with PAYMENT_SUBMITTED status
    if (bookingType === 'all' || bookingType === 'luxury') {
      const luxuryBookings = await prisma.luxury_bookings.findMany({
        where: {
          status: 'PAYMENT_SUBMITTED',
        },
        include: {
          luxury_quotes: {
            select: {
              vehicleName: true,
            },
          },
        },
        orderBy: { paymentSubmittedAt: 'desc' },
        take: 50,
      });

      luxuryBookings.forEach((b) => {
        results.push({
          id: b.id,
          bookingNumber: b.bookingNumber,
          bookingType: 'luxury',
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          serviceType: 'Luxury Car Rental',
          vehicleName: b.luxury_quotes?.vehicleName || b.vehicleModel || b.carCategoryName || b.carCategory,
          location: b.pickupCity,
          pickupDate: b.pickupDate,
          grandTotal: b.grandTotal,
          advanceAmount: b.advanceAmount,
          advancePaymentRef: b.paymentTransactionId,
          advancePaymentProof: b.paymentProof,
          advancePaymentDate: b.paymentSubmittedAt,
          paymentMethod: b.paymentMethod,
          paymentStatus: b.paymentStatus,
          status: b.status,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        });
      });
    }

    // Sort all results by date
    results.sort((a, b) => {
      const dateA = new Date(a.advancePaymentDate || a.createdAt).getTime();
      const dateB = new Date(b.advancePaymentDate || b.createdAt).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({
      success: true,
      bookings: results,
      count: results.length,
    });
  } catch (error: any) {
    logger.error('Failed to fetch pending payments', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}
