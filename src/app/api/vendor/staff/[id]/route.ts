import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import bcrypt from 'bcryptjs';

import logger from '@/lib/security/logger';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';
export const dynamic = 'force-dynamic';

// GET - Get single staff details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const vendorId = auth.vendorId;

    const resolvedParams = 'then' in params ? await params : params;
    const { id } = resolvedParams;

    const staff = await prisma.vendor_staff.findFirst({
      where: {
        id,
        vendorId,
      },
      include: {
        staff_attendance: {
          orderBy: { date: 'desc' },
          take: 30, // Last 30 attendance records
        },
      },
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Calculate attendance summary for current month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);

    const monthAttendance = await prisma.staff_attendance.findMany({
      where: {
        staffId: id,
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    });

    const attendanceSummary = {
      present: monthAttendance.filter(a => a.status === 'PRESENT').length,
      absent: monthAttendance.filter(a => a.status === 'ABSENT').length,
      leave: monthAttendance.filter(a => a.status === 'LEAVE').length,
      halfDay: monthAttendance.filter(a => a.status === 'HALF_DAY').length,
      totalDays: monthEnd.getDate(),
      workingDays: monthEnd.getDate() - Math.floor(monthEnd.getDate() / 7) * 2, // Rough estimate
    };

    return NextResponse.json({
      success: true,
      staff: {
        ...staff,
        hasPassword: !!staff.password, // Flag to indicate if password is set (don't expose actual password)
        password: undefined, // Never expose password
        attendance: (staff as any).staff_attendance,
      },
      attendanceSummary,
    });
  } catch (error: any) {
    logger.error('Failed to fetch staff', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch staff', details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH - Update staff details
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
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
    const resolvedParams = 'then' in params ? await params : params;
    const { id } = resolvedParams;

    // Handle both JSON and FormData (for mobile app compatibility)
    let body: any = {};
    const contentType = request.headers.get('content-type') || '';

    try {
      if (contentType.includes('multipart/form-data')) {
        // Mobile app sends FormData
        const formData = await request.formData();

        // Convert FormData to plain object
        formData.forEach((value, key) => {
          // Skip file uploads for now
          if (typeof value === 'string') {
            body[key] = value;
          }
        });

        logger.info('[Staff Update] Received FormData from mobile app');
      } else {
        // Web sends JSON
        body = await request.json();
      }
    } catch (parseError) {
      logger.error('[Staff Update] Failed to parse request body', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      );
    }

    // Check staff exists and belongs to vendor
    const existingStaff = await prisma.vendor_staff.findFirst({
      where: { id, vendorId },
    });

    if (!existingStaff) {
      return NextResponse.json(
        { success: false, error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // If phone is being updated, check for duplicates
    if (body.phone && body.phone !== existingStaff.phone) {
      const duplicatePhone = await prisma.vendor_staff.findUnique({
        where: {
          vendorId_phone: {
            vendorId,
            phone: body.phone,
          },
        },
      });

      if (duplicatePhone) {
        return NextResponse.json(
          { success: false, error: 'Another staff member with this phone number already exists' },
          { status: 400 }
        );
      }
    }

    // Helper functions for parsing FormData values
    const parseValue = (value: any) => {
      if (value === '' || value === 'null' || value === 'undefined') return null;
      return value || null;
    };

    const parseSalary = (value: any): number => {
      if (!value || value === '' || value === '0') return 0;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    };

    const parseDate = (value: any): Date | null => {
      if (!value || value === '') return null;
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    };

    // Build update data
    const updateData: any = {};

    // Personal info
    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.email !== undefined) updateData.email = parseValue(body.email);
    if (body.address !== undefined) updateData.address = parseValue(body.address);
    if (body.city !== undefined) updateData.city = parseValue(body.city);
    if (body.state !== undefined) updateData.state = parseValue(body.state);
    if (body.pincode !== undefined) updateData.pincode = parseValue(body.pincode);
    if (body.dateOfBirth !== undefined) updateData.dateOfBirth = parseDate(body.dateOfBirth);
    if (body.joiningDate !== undefined) updateData.joiningDate = parseDate(body.joiningDate) || existingStaff.joiningDate;
    if (body.profilePhoto !== undefined) updateData.profilePhoto = parseValue(body.profilePhoto);

    // Role & Status
    if (body.role !== undefined) updateData.role = body.role;
    if (body.status !== undefined) updateData.status = body.status;

    // Documents
    if (body.aadharNumber !== undefined) updateData.aadharNumber = parseValue(body.aadharNumber);
    if (body.aadharDocument !== undefined) updateData.aadharDocument = parseValue(body.aadharDocument);
    if (body.panNumber !== undefined) updateData.panNumber = parseValue(body.panNumber);
    if (body.panDocument !== undefined) updateData.panDocument = parseValue(body.panDocument);

    // License
    if (body.licenseNumber !== undefined) updateData.licenseNumber = parseValue(body.licenseNumber);
    if (body.licenseType !== undefined) updateData.licenseType = parseValue(body.licenseType);
    if (body.licenseExpiry !== undefined) updateData.licenseExpiry = parseDate(body.licenseExpiry);
    if (body.licenseDocument !== undefined) updateData.licenseDocument = parseValue(body.licenseDocument);

    // Bank details
    if (body.bankName !== undefined) updateData.bankName = parseValue(body.bankName);
    if (body.accountNumber !== undefined) updateData.accountNumber = parseValue(body.accountNumber);
    if (body.ifscCode !== undefined) updateData.ifscCode = parseValue(body.ifscCode);
    if (body.accountHolderName !== undefined) updateData.accountHolderName = parseValue(body.accountHolderName);

    // Employment
    if (body.salary !== undefined) updateData.salary = parseSalary(body.salary);
    if (body.emergencyContact !== undefined) updateData.emergencyContact = parseValue(body.emergencyContact);
    if (body.emergencyPhone !== undefined) updateData.emergencyPhone = parseValue(body.emergencyPhone);

    // Password (for drivers)
    if (body.password && body.password.length >= 6) {
      const hashedPassword = await bcrypt.hash(body.password, 10);
      updateData.password = hashedPassword;
    }

    const staff = await prisma.vendor_staff.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Staff member updated successfully',
      staff: {
        ...staff,
        password: undefined, // Never expose password
      },
    });
  } catch (error: any) {
    logger.error('Failed to update staff', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update staff', details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete staff member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
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
    const resolvedParams = 'then' in params ? await params : params;
    const { id } = resolvedParams;

    // Check staff exists and belongs to vendor
    const existingStaff = await prisma.vendor_staff.findFirst({
      where: { id, vendorId },
    });

    if (!existingStaff) {
      return NextResponse.json(
        { success: false, error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Delete staff (attendance will be cascade deleted)
    await prisma.vendor_staff.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Staff member deleted successfully',
    });
  } catch (error: any) {
    logger.error('Failed to delete staff', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete staff', details: error?.message },
      { status: 500 }
    );
  }
}
