// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get vendor's available drivers and vehicles
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);

    if (!auth.authenticated || !auth.vendorId) {

      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });

    }

    const vendorId = auth.vendorId;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'drivers', 'vehicles', or 'all'
    const checkStartDate = searchParams.get('startDate');
    const checkEndDate = searchParams.get('endDate');

    const result: any = {};

    // Fetch drivers (VendorStaff with role=DRIVER)
    if (!type || type === 'all' || type === 'drivers') {
      const drivers = await prisma.vendor_staff.findMany({
        where: {
          vendorId: vendorId,
          role: 'DRIVER',
          status: 'ACTIVE',
        },
        select: {
          id: true,
          name: true,
          phone: true,
          licenseNumber: true,
          licenseType: true,
          profilePhoto: true,
        },
        orderBy: { name: 'asc' },
      });
      // Check date-based driver availability if dates provided
      if (checkStartDate && checkEndDate && drivers.length > 0) {
        try {
          const driverPhones = drivers.map((d: any) => d.phone).filter(Boolean);
          const sd = new Date(checkStartDate);
          const ed = new Date(checkEndDate);
          const busyPhones = new Set<string>();

          const [busB, chauffeurB, luxuryB, truckB, equipB, packB] = await Promise.all([
            prisma.bus_bookings.findMany({ where: { vendorId, driverPhone: { in: driverPhones }, status: { notIn: ['CANCELLED', 'COMPLETED'] }, pickupDate: { lte: ed }, OR: [{ returnDate: { gte: sd } }, { returnDate: null, pickupDate: { gte: sd } }] }, select: { driverPhone: true } }).catch(() => []),
            prisma.chauffeur_bookings.findMany({ where: { vendorId, driverPhone: { in: driverPhones }, status: { notIn: ['CANCELLED', 'COMPLETED', 'EXPIRED', 'REFUNDED'] }, pickupDate: { lte: ed }, OR: [{ returnDate: { gte: sd } }, { returnDate: null, pickupDate: { gte: sd } }] }, select: { driverPhone: true } }).catch(() => []),
            prisma.luxury_bookings.findMany({ where: { vendorId, driverPhone: { in: driverPhones }, status: { notIn: ['CANCELLED', 'COMPLETED', 'EXPIRED'] }, pickupDate: { lte: ed }, OR: [{ returnDate: { gte: sd } }, { returnDate: null, pickupDate: { gte: sd } }] }, select: { driverPhone: true } }).catch(() => []),
            prisma.truck_bookings.findMany({ where: { vendorId, driverPhone: { in: driverPhones }, status: { notIn: ['CANCELLED', 'COMPLETED'] }, pickupDate: { gte: sd, lte: ed } }, select: { driverPhone: true } }).catch(() => []),
            prisma.equipment_bookings.findMany({ where: { vendorId, operatorPhone: { in: driverPhones }, status: { notIn: ['CANCELLED', 'COMPLETED', 'RETURNED'] }, startDate: { lte: ed }, endDate: { gte: sd } }, select: { operatorPhone: true } }).catch(() => []),
            prisma.packers_bookings.findMany({ where: { vendorId, teamLeaderPhone: { in: driverPhones }, status: { notIn: ['CANCELLED', 'COMPLETED'] }, scheduledDate: { gte: sd, lte: ed } }, select: { teamLeaderPhone: true } }).catch(() => []),
          ]);

          for (const b of busB) if (b.driverPhone) busyPhones.add(b.driverPhone);
          for (const b of chauffeurB) if (b.driverPhone) busyPhones.add(b.driverPhone);
          for (const b of luxuryB) if (b.driverPhone) busyPhones.add(b.driverPhone);
          for (const b of truckB) if (b.driverPhone) busyPhones.add(b.driverPhone);
          for (const b of equipB) if (b.operatorPhone) busyPhones.add(b.operatorPhone);
          for (const b of packB) if (b.teamLeaderPhone) busyPhones.add(b.teamLeaderPhone);

          result.drivers = drivers.map((d: any) => ({
            ...d,
            isAvailableForDates: !busyPhones.has(d.phone),
          }));
        } catch (e) {
          logger.error('Error checking driver availability', e);
          result.drivers = drivers;
        }
      } else {
        result.drivers = drivers;
      }
    }

    // Fetch vehicles (VendorFleet)
    if (!type || type === 'all' || type === 'vehicles') {
      const vehicles = await prisma.vendor_fleets.findMany({
        where: {
          vendorId: vendorId,
          isActive: true,
          isAvailable: true,
        },
        select: {
          id: true,
          registrationNumber: true,
          yearOfManufacture: true,
          color: true,
          vehicle_models: {
            select: { id: true, name: true },
          },
          services: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      // Check date-based availability if dates provided
      if (checkStartDate && checkEndDate && vehicles.length > 0) {
        try {
          const vehicleIds = vehicles.map((v: any) => v.id);
          const conflicts = await prisma.vendor_fleet_blocked_dates.findMany({
            where: {
              vendorFleetId: { in: vehicleIds },
              isActive: true,
              startDate: { lte: new Date(checkEndDate) },
              endDate: { gte: new Date(checkStartDate) },
            },
            select: { vendorFleetId: true },
          });
          const unavailableIds = new Set(conflicts.map((c: any) => c.vendorFleetId));
          result.vehicles = vehicles.map((v: any) => ({
            ...v,
            isAvailableForDates: !unavailableIds.has(v.id),
          }));
        } catch (e) {
          logger.error('Error checking vehicle availability', e);
          result.vehicles = vehicles;
        }
      } else {
        result.vehicles = vehicles;
      }
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    logger.error('Failed to fetch vendor resources', error);
    return NextResponse.json({ error: 'Failed to fetch resources', details: error?.message }, { status: 500 });
  }
}
