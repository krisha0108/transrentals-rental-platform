import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import bcrypt from 'bcryptjs';

import logger from '@/lib/security/logger';
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
    const resolvedParams = 'then' in params ? await params : params;
    const { id } = resolvedParams;
    const body = await request.json();

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

    // Build update data
    const updateData: any = {};

    // Personal info
    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.email !== undefined) updateData.email = body.email || null;
    if (body.address !== undefined) updateData.address = body.address || null;
    if (body.city !== undefined) updateData.city = body.city || null;
    if (body.state !== undefined) updateData.state = body.state || null;
    if (body.pincode !== undefined) updateData.pincode = body.pincode || null;
    if (body.dateOfBirth !== undefined) updateData.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
    if (body.joiningDate !== undefined) updateData.joiningDate = body.joiningDate ? new Date(body.joiningDate) : existingStaff.joiningDate;
    if (body.profilePhoto !== undefined) updateData.profilePhoto = body.profilePhoto || null;

    // Role & Status
    if (body.role !== undefined) updateData.role = body.role;
    if (body.status !== undefined) updateData.status = body.status;

    // Documents
    if (body.aadharNumber !== undefined) updateData.aadharNumber = body.aadharNumber || null;
    if (body.aadharDocument !== undefined) updateData.aadharDocument = body.aadharDocument || null;
    if (body.panNumber !== undefined) updateData.panNumber = body.panNumber || null;
    if (body.panDocument !== undefined) updateData.panDocument = body.panDocument || null;

    // License
    if (body.licenseNumber !== undefined) updateData.licenseNumber = body.licenseNumber || null;
    if (body.licenseType !== undefined) updateData.licenseType = body.licenseType || null;
    if (body.licenseExpiry !== undefined) updateData.licenseExpiry = body.licenseExpiry ? new Date(body.licenseExpiry) : null;
    if (body.licenseDocument !== undefined) updateData.licenseDocument = body.licenseDocument || null;

    // Bank details
    if (body.bankName !== undefined) updateData.bankName = body.bankName || null;
    if (body.accountNumber !== undefined) updateData.accountNumber = body.accountNumber || null;
    if (body.ifscCode !== undefined) updateData.ifscCode = body.ifscCode || null;
    if (body.accountHolderName !== undefined) updateData.accountHolderName = body.accountHolderName || null;

    // Employment
    if (body.salary !== undefined) updateData.salary = body.salary || 0;
    if (body.emergencyContact !== undefined) updateData.emergencyContact = body.emergencyContact || null;
    if (body.emergencyPhone !== undefined) updateData.emergencyPhone = body.emergencyPhone || null;

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
