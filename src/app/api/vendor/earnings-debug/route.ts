// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Debug endpoint to see all bookings with their vendor fields and statuses
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    // Get ALL bookings without status filter to see what's in DB
    const [
      carBookings,
      bikeBookings,
      busBookings,
      truckBookings,
      packersBookings,
      equipmentBookings,
      luxuryBookings,
    ] = await Promise.all([
      // Car bookings
      prisma.car_bookings.findMany({
        where: {
          OR: [
            { acceptedVendorId: vendorId },
            { assignedVendorId: vendorId },
          ],
        },
        select: {
          id: true,
          bookingNumber: true,
          status: true,
          acceptedVendorId: true,
          assignedVendorId: true,
          grandTotal: true,
        },
        take: 10,
      }).catch(() => []),

      // Bike bookings
      prisma.bike_bookings.findMany({
        where: {
          OR: [
            { acceptedVendorId: vendorId },
            { assignedVendorId: vendorId },
          ],
        },
        select: {
          id: true,
          bookingNumber: true,
          status: true,
          acceptedVendorId: true,
          assignedVendorId: true,
          grandTotal: true,
        },
        take: 10,
      }).catch(() => []),

      // Bus bookings
      prisma.bus_bookings.findMany({
        where: {
          vendorId: vendorId,
        },
        select: {
          id: true,
          bookingNumber: true,
          status: true,
          vendorId: true,
          grandTotal: true,
        },
        take: 10,
      }).catch(() => []),

      // Truck bookings
      prisma.truck_bookings.findMany({
        where: {
          vendorId: vendorId,
        },
        select: {
          id: true,
          bookingNumber: true,
          status: true,
          vendorId: true,
          totalAmount: true,
        },
        take: 10,
      }).catch(() => []),

      // Packers bookings
      prisma.packers_bookings.findMany({
        where: {
          vendorId: vendorId,
        },
        select: {
          id: true,
          bookingNumber: true,
          status: true,
          vendorId: true,
          totalAmount: true,
        },
        take: 10,
      }).catch(() => []),

      // Equipment bookings
      prisma.equipment_bookings.findMany({
        where: {
          vendorId: vendorId,
        },
        select: {
          id: true,
          bookingNumber: true,
          status: true,
          vendorId: true,
          totalAmount: true,
        },
        take: 10,
      }).catch(() => []),

      // Luxury bookings
      prisma.luxury_bookings.findMany({
        where: {
          OR: [
            { acceptedVendorId: vendorId },
            { assignedVendorId: vendorId },
          ],
        },
        select: {
          id: true,
          bookingNumber: true,
          status: true,
          acceptedVendorId: true,
          assignedVendorId: true,
          grandTotal: true,
        },
        take: 10,
      }).catch(() => []),
    ]);

    return NextResponse.json({
      success: true,
      vendorId,
      debug: {
        bike: {
          count: bikeBookings.length,
          bookings: bikeBookings,
        },
        car: {
          count: carBookings.length,
          bookings: carBookings,
        },
        bus: {
          count: busBookings.length,
          bookings: busBookings,
        },
        truck: {
          count: truckBookings.length,
          bookings: truckBookings,
        },
        packers: {
          count: packersBookings.length,
          bookings: packersBookings,
        },
        equipment: {
          count: equipmentBookings.length,
          bookings: equipmentBookings,
        },
        luxury: {
          count: luxuryBookings.length,
          bookings: luxuryBookings,
        },
      },
    });
  } catch (error: any) {
    logger.error('Earnings debug error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch debug data', details: error?.message },
      { status: 500 }
    );
  }
}
