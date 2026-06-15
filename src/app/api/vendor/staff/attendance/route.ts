// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';

// Helper to generate a cuid-like unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}
export const dynamic = 'force-dynamic';

// GET - Get attendance records
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

    const month = parseInt(searchParams.get('month') || String(new Date().getMonth()));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const staffId = searchParams.get('staffId');

    // Get date range for the month
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    // Get all staff for this vendor
    const staffFilter: any = { vendorId };
    if (staffId) {
      staffFilter.id = staffId;
    }

    const staff = await prisma.vendor_staff.findMany({
      where: staffFilter,
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        profilePhoto: true,
      },
      orderBy: { name: 'asc' },
    });

    // Get attendance records for all staff in the month
    const attendance = await prisma.staff_attendance.findMany({
      where: {
        staffId: { in: staff.map(s => s.id) },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Build attendance map: staffId -> date -> attendance record
    const attendanceMap: Record<string, Record<string, any>> = {};
    attendance.forEach(a => {
      if (!attendanceMap[a.staffId]) {
        attendanceMap[a.staffId] = {};
      }
      const dateKey = a.date.toISOString().split('T')[0];
      attendanceMap[a.staffId][dateKey] = a;
    });

    // Calculate summary for the month
    const daysInMonth = endDate.getDate();
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
    const daysToConsider = isCurrentMonth ? today.getDate() : daysInMonth;

    const summary = {
      totalStaff: staff.length,
      totalPresent: attendance.filter(a => a.status === 'PRESENT').length,
      totalAbsent: attendance.filter(a => a.status === 'ABSENT').length,
      totalLeave: attendance.filter(a => a.status === 'LEAVE').length,
      totalHalfDay: attendance.filter(a => a.status === 'HALF_DAY').length,
      workingDays: daysToConsider,
      month,
      year,
    };

    // Today's attendance snapshot
    const todayStr = today.toISOString().split('T')[0];
    const todayAttendance = attendance.filter(a =>
      a.date.toISOString().split('T')[0] === todayStr
    );

    const todaySummary = {
      date: todayStr,
      present: todayAttendance.filter(a => a.status === 'PRESENT').length,
      absent: todayAttendance.filter(a => a.status === 'ABSENT').length,
      leave: todayAttendance.filter(a => a.status === 'LEAVE').length,
      notMarked: staff.length - todayAttendance.length,
    };

    return NextResponse.json({
      success: true,
      staff,
      attendanceMap,
      summary,
      todaySummary,
      daysInMonth,
    });
  } catch (error: any) {
    logger.error('Failed to fetch attendance', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attendance', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Mark attendance (single or bulk)
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const vendorId = auth.vendorId;

    // Block rejected/suspended/blocked vendors from write operations
    const guard = await vendorStatusGuard(vendorId);
    if (guard.blocked) return guard.response;
    const body = await request.json();

    // Handle bulk marking
    if (body.records && Array.isArray(body.records)) {
      const results = [];

      for (const record of body.records) {
        // Verify staff belongs to vendor
        const staff = await prisma.vendor_staff.findFirst({
          where: { id: record.staffId, vendorId },
        });

        if (!staff) continue;

        // Parse date string and create UTC date at midnight
        const [year, month, day] = record.date.split('-').map(Number);
        const dateObj = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

        // Upsert attendance record
        const attendance = await prisma.staff_attendance.upsert({
          where: {
            staffId_date: {
              staffId: record.staffId,
              date: dateObj,
            },
          },
          update: {
            status: record.status,
            checkIn: record.checkIn || null,
            checkOut: record.checkOut || null,
            leaveType: record.leaveType || null,
            leaveReason: record.leaveReason || null,
            notes: record.notes || null,
            markedBy: vendorId,
            markedAt: new Date(),
          },
          create: {
            id: generateId(),
            staffId: record.staffId,
            date: dateObj,
            status: record.status,
            checkIn: record.checkIn || null,
            checkOut: record.checkOut || null,
            leaveType: record.leaveType || null,
            leaveReason: record.leaveReason || null,
            notes: record.notes || null,
            markedBy: vendorId,
          },
        });

        results.push(attendance);
      }

      return NextResponse.json({
        success: true,
        message: `Marked attendance for ${results.length} records`,
        records: results,
      });
    }

    // Single record marking
    if (!body.staffId || !body.date || !body.status) {
      return NextResponse.json(
        { success: false, error: 'staffId, date, and status are required' },
        { status: 400 }
      );
    }

    // Verify staff belongs to vendor
    const staff = await prisma.vendor_staff.findFirst({
      where: { id: body.staffId, vendorId },
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Parse date string and create UTC date at midnight
    const [year, month, day] = body.date.split('-').map(Number);
    const dateObj = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    // Upsert attendance record
    const attendance = await prisma.staff_attendance.upsert({
      where: {
        staffId_date: {
          staffId: body.staffId,
          date: dateObj,
        },
      },
      update: {
        status: body.status,
        checkIn: body.checkIn || null,
        checkOut: body.checkOut || null,
        leaveType: body.leaveType || null,
        leaveReason: body.leaveReason || null,
        notes: body.notes || null,
        markedBy: vendorId,
        markedAt: new Date(),
      },
      create: {
        id: generateId(),
        staffId: body.staffId,
        date: dateObj,
        status: body.status,
        checkIn: body.checkIn || null,
        checkOut: body.checkOut || null,
        leaveType: body.leaveType || null,
        leaveReason: body.leaveReason || null,
        notes: body.notes || null,
        markedBy: vendorId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Attendance marked successfully',
      attendance,
    });
  } catch (error: any) {
    logger.error('Failed to mark attendance', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark attendance', details: error?.message },
      { status: 500 }
    );
  }
}
