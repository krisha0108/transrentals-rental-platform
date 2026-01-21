// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Fetch payroll data for a month/year (calculated from attendance)
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

    // Get date range for the month
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    const daysInMonth = endDate.getDate();

    // Fetch all staff for this vendor
    const staff = await prisma.vendor_staff.findMany({
      where: { vendorId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        status: true,
        salary: true,
        bankName: true,
        accountNumber: true,
        ifscCode: true,
        accountHolderName: true,
        profilePhoto: true,
      },
      orderBy: { name: 'asc' },
    });

    // Fetch attendance records for all staff in the month
    const attendance = await prisma.staff_attendance.findMany({
      where: {
        staffId: { in: staff.map(s => s.id) },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Build attendance summary per staff
    const attendanceByStaff: Record<string, any[]> = {};
    attendance.forEach(a => {
      if (!attendanceByStaff[a.staffId]) {
        attendanceByStaff[a.staffId] = [];
      }
      attendanceByStaff[a.staffId].push(a);
    });

    // Calculate payroll for each staff member
    const payroll = staff.map(s => {
      const staffAttendance = attendanceByStaff[s.id] || [];
      const presentDays = staffAttendance.filter(a => a.status === 'PRESENT').length;
      const absentDays = staffAttendance.filter(a => a.status === 'ABSENT').length;
      const leaveDays = staffAttendance.filter(a => a.status === 'LEAVE').length;
      const halfDays = staffAttendance.filter(a => a.status === 'HALF_DAY').length;

      // Calculate effective working days (half days count as 0.5)
      const effectiveDays = presentDays + (halfDays * 0.5);

      // Calculate salary based on effective days
      const baseSalary = s.salary || 0;
      const perDaySalary = baseSalary / daysInMonth;
      const grossSalary = Math.round(perDaySalary * effectiveDays);
      const deductions = 0; // Can be extended for PF, ESI, etc.
      const netSalary = grossSalary - deductions;

      return {
        staffId: s.id,
        staff: s,
        month,
        year,
        workingDays: daysInMonth,
        presentDays,
        absentDays,
        leaveDays,
        halfDays,
        effectiveDays,
        baseSalary,
        perDaySalary: Math.round(perDaySalary),
        grossSalary,
        deductions,
        netSalary,
        paymentStatus: 'PENDING', // Default status
      };
    });

    // Summary
    const summary = {
      totalStaff: staff.length,
      totalBaseSalary: staff.reduce((sum, s) => sum + (s.salary || 0), 0),
      totalNetSalary: payroll.reduce((sum, p) => sum + p.netSalary, 0),
      month,
      year,
      daysInMonth,
    };

    return NextResponse.json({
      success: true,
      payroll,
      summary,
      month,
      year,
    });
  } catch (error: any) {
    logger.error('Error fetching staff payroll:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payroll', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Mark payment (for now just returns success - can be extended to store in DB)
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
    const body = await request.json();
    const { staffId, month, year, netSalary, paymentMethod, transactionId, remarks } = body;

    if (!staffId || month === undefined || year === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: staffId, month, year' },
        { status: 400 }
      );
    }

    // Verify staff belongs to vendor
    const staff = await prisma.vendor_staff.findFirst({
      where: { id: staffId, vendorId },
      select: { id: true, name: true, phone: true, role: true },
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Staff not found' },
        { status: 404 }
      );
    }

    // For now, just return success
    // TODO: Create a staff_payments table to persist payment records
    return NextResponse.json({
      success: true,
      message: `Payment marked as paid for ${staff.name}`,
      payment: {
        staffId,
        staffName: staff.name,
        month,
        year,
        netSalary,
        paymentMethod: paymentMethod || 'BANK_TRANSFER',
        transactionId,
        remarks,
        paymentStatus: 'PAID',
        paymentDate: new Date(),
        paidBy: vendorId,
      },
    });
  } catch (error: any) {
    logger.error('Error marking payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark payment', details: error?.message },
      { status: 500 }
    );
  }
}
