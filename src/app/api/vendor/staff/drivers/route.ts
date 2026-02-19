import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';



import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Helper: Find driver phones that are busy (assigned to active bookings) for a date range
async function getBusyDriverPhones(
  vendorId: string,
  startDate: Date,
  endDate: Date,
  driverPhones: string[]
): Promise<Set<string>> {
  if (driverPhones.length === 0) return new Set();

  const busyPhones = new Set<string>();

  try {
    // Query all booking tables in parallel for assigned drivers with overlapping dates
    const [busBookings, chauffeurBookings, luxuryBookings, truckBookings, equipmentBookings, packersBookings] = await Promise.all([
      // Bus bookings: pickupDate to returnDate (or pickupDate if no return)
      prisma.bus_bookings.findMany({
        where: {
          vendorId,
          driverPhone: { in: driverPhones },
          status: { notIn: ['CANCELLED', 'COMPLETED'] },
          pickupDate: { lte: endDate },
          OR: [
            { returnDate: { gte: startDate } },
            { returnDate: null, pickupDate: { gte: startDate } },
          ],
        },
        select: { driverPhone: true },
      }).catch(() => []),

      // Chauffeur bookings: pickupDate to returnDate
      prisma.chauffeur_bookings.findMany({
        where: {
          vendorId,
          driverPhone: { in: driverPhones },
          status: { notIn: ['CANCELLED', 'COMPLETED', 'EXPIRED', 'REFUNDED'] },
          pickupDate: { lte: endDate },
          OR: [
            { returnDate: { gte: startDate } },
            { returnDate: null, pickupDate: { gte: startDate } },
          ],
        },
        select: { driverPhone: true },
      }).catch(() => []),

      // Luxury bookings: pickupDate to returnDate
      prisma.luxury_bookings.findMany({
        where: {
          vendorId,
          driverPhone: { in: driverPhones },
          status: { notIn: ['CANCELLED', 'COMPLETED', 'EXPIRED'] },
          pickupDate: { lte: endDate },
          OR: [
            { returnDate: { gte: startDate } },
            { returnDate: null, pickupDate: { gte: startDate } },
          ],
        },
        select: { driverPhone: true },
      }).catch(() => []),

      // Truck bookings: pickupDate (single day)
      prisma.truck_bookings.findMany({
        where: {
          vendorId,
          driverPhone: { in: driverPhones },
          status: { notIn: ['CANCELLED', 'COMPLETED'] },
          pickupDate: { gte: startDate, lte: endDate },
        },
        select: { driverPhone: true },
      }).catch(() => []),

      // Equipment bookings: startDate to endDate, uses operatorPhone
      prisma.equipment_bookings.findMany({
        where: {
          vendorId,
          operatorPhone: { in: driverPhones },
          status: { notIn: ['CANCELLED', 'COMPLETED', 'RETURNED'] },
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
        select: { operatorPhone: true },
      }).catch(() => []),

      // Packers bookings: scheduledDate (single day), uses teamLeaderPhone
      prisma.packers_bookings.findMany({
        where: {
          vendorId,
          teamLeaderPhone: { in: driverPhones },
          status: { notIn: ['CANCELLED', 'COMPLETED'] },
          scheduledDate: { gte: startDate, lte: endDate },
        },
        select: { teamLeaderPhone: true },
      }).catch(() => []),
    ]);

    // Collect all busy phones
    for (const b of busBookings) if (b.driverPhone) busyPhones.add(b.driverPhone);
    for (const b of chauffeurBookings) if (b.driverPhone) busyPhones.add(b.driverPhone);
    for (const b of luxuryBookings) if (b.driverPhone) busyPhones.add(b.driverPhone);
    for (const b of truckBookings) if (b.driverPhone) busyPhones.add(b.driverPhone);
    for (const b of equipmentBookings) if (b.operatorPhone) busyPhones.add(b.operatorPhone);
    for (const b of packersBookings) if (b.teamLeaderPhone) busyPhones.add(b.teamLeaderPhone);
  } catch (e) {
    logger.error('Error checking driver availability', e);
  }

  return busyPhones;
}

// GET - Get available drivers for booking assignment
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const vendorId = auth.vendorId;
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');
    const checkStartDate = searchParams.get('startDate');
    const checkEndDate = searchParams.get('endDate');

    // Get all active drivers for this vendor
    const drivers = await prisma.vendor_staff.findMany({
      where: {
        vendorId,
        role: 'DRIVER',
        status: { in: ['ACTIVE', 'ON_LEAVE'] }, // Include on-leave for display
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        profilePhoto: true,
        status: true,
        licenseNumber: true,
        licenseType: true,
        licenseExpiry: true,
      },
      orderBy: [
        { status: 'asc' }, // Active first
        { name: 'asc' },
      ],
    });

    // Check date-based booking availability if dates provided
    let busyDriverPhones = new Set<string>();
    if (checkStartDate && checkEndDate) {
      const driverPhones = drivers.map(d => d.phone).filter(Boolean);
      busyDriverPhones = await getBusyDriverPhones(
        vendorId,
        new Date(checkStartDate),
        new Date(checkEndDate),
        driverPhones
      );
    }

    // If date provided, check attendance status for that date
    let driversWithAvailability = drivers.map(d => ({
      ...d,
      isAvailable: d.status === 'ACTIVE',
      licenseExpired: d.licenseExpiry ? new Date(d.licenseExpiry) < new Date() : false,
      ...(checkStartDate && checkEndDate
        ? { isAvailableForDates: !busyDriverPhones.has(d.phone) }
        : {}),
    }));

    if (dateStr) {
      const checkDate = new Date(dateStr);
      checkDate.setHours(0, 0, 0, 0);

      // Get attendance for that date
      const attendanceRecords = await prisma.staff_attendance.findMany({
        where: {
          staffId: { in: drivers.map(d => d.id) },
          date: checkDate,
        },
      });

      const attendanceMap = new Map(attendanceRecords.map(a => [a.staffId, a]));

      driversWithAvailability = drivers.map(d => {
        const attendance = attendanceMap.get(d.id);
        let isAvailable = d.status === 'ACTIVE';

        // If attendance is marked for that day and it's not PRESENT, driver is not available
        if (attendance && attendance.status !== 'PRESENT') {
          isAvailable = false;
        }

        return {
          ...d,
          isAvailable,
          attendanceStatus: attendance?.status || null,
          licenseExpired: d.licenseExpiry ? new Date(d.licenseExpiry) < new Date() : false,
          ...(checkStartDate && checkEndDate
            ? { isAvailableForDates: !busyDriverPhones.has(d.phone) }
            : {}),
        };
      });
    }

    // Also get helpers (they might assist drivers)
    const helpers = await prisma.vendor_staff.findMany({
      where: {
        vendorId,
        role: 'HELPER',
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        phone: true,
        status: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      drivers: driversWithAvailability,
      helpers,
      total: driversWithAvailability.length,
      available: driversWithAvailability.filter(d => d.isAvailable).length,
    });
  } catch (error: any) {
    logger.error('Failed to fetch drivers', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch drivers', details: error?.message },
      { status: 500 }
    );
  }
}
