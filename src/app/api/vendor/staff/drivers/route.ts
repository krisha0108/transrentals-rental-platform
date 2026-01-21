import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';



import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

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

    // If date provided, check attendance status for that date
    let driversWithAvailability = drivers.map(d => ({
      ...d,
      isAvailable: d.status === 'ACTIVE',
      licenseExpired: d.licenseExpiry ? new Date(d.licenseExpiry) < new Date() : false,
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
