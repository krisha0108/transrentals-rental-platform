import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

import logger from '@/lib/security/logger';

// Helper to generate a cuid-like unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}
export const dynamic = 'force-dynamic';

// GET - List all staff for vendor with filters
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

    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build where conditions
    const whereConditions: any = {
      vendorId,
    };

    if (role && role !== 'all') {
      whereConditions.role = role;
    }

    if (status && status !== 'all') {
      whereConditions.status = status;
    }

    if (search) {
      whereConditions.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    // Fetch staff
    const staff = await prisma.vendor_staff.findMany({
      where: whereConditions,
      orderBy: [
        { status: 'asc' }, // Active first
        { name: 'asc' },
      ],
      include: {
        staff_attendance: {
          where: {
            date: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
            },
          },
        },
      },
    });

    // Calculate stats
    const allStaff = await prisma.vendor_staff.findMany({
      where: { vendorId },
      select: { role: true, status: true, salary: true },
    });

    const stats = {
      total: allStaff.length,
      active: allStaff.filter(s => s.status === 'ACTIVE').length,
      onLeave: allStaff.filter(s => s.status === 'ON_LEAVE').length,
      drivers: allStaff.filter(s => s.role === 'DRIVER').length,
      helpers: allStaff.filter(s => s.role === 'HELPER').length,
      totalSalary: allStaff.reduce((sum, s) => sum + (s.salary || 0), 0),
    };

    // Format staff with attendance summary (exclude password from response)
    const staffWithSummary = staff.map(s => {
      const thisMonthAttendance = (s as any).staff_attendance || [];
      const { password, staff_attendance, ...staffWithoutPassword } = s as any;
      return {
        ...staffWithoutPassword,
        attendanceSummary: {
          present: thisMonthAttendance.filter((a: any) => a.status === 'PRESENT').length,
          absent: thisMonthAttendance.filter((a: any) => a.status === 'ABSENT').length,
          leave: thisMonthAttendance.filter((a: any) => a.status === 'LEAVE').length,
          halfDay: thisMonthAttendance.filter((a: any) => a.status === 'HALF_DAY').length,
        },
      };
    });

    return NextResponse.json({
      success: true,
      staff: staffWithSummary,
      stats,
    });
  } catch (error: any) {
    logger.error('Failed to fetch staff', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch staff', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Create new staff member
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

    // Validate required fields
    if (!body.name || !body.phone) {
      return NextResponse.json(
        { success: false, error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    // For drivers, email and password are required for app login
    const isDriver = body.role === 'DRIVER';
    if (isDriver) {
      if (!body.email) {
        return NextResponse.json(
          { success: false, error: 'Email is required for drivers (needed for app login)' },
          { status: 400 }
        );
      }
      if (!body.password || body.password.length < 6) {
        return NextResponse.json(
          { success: false, error: 'Password is required for drivers (min 6 characters)' },
          { status: 400 }
        );
      }
    }

    // Check if phone already exists for this vendor
    const existingStaff = await prisma.vendor_staff.findUnique({
      where: {
        vendorId_phone: {
          vendorId,
          phone: body.phone,
        },
      },
    });

    if (existingStaff) {
      return NextResponse.json(
        { success: false, error: 'Staff member with this phone number already exists' },
        { status: 400 }
      );
    }

    // Check if email already exists (for driver login)
    if (body.email) {
      const existingEmail = await prisma.vendor_staff.findUnique({
        where: { email: body.email },
      });
      if (existingEmail) {
        return NextResponse.json(
          { success: false, error: 'A driver with this email already exists' },
          { status: 400 }
        );
      }
    }

    // Hash password if provided
    let hashedPassword = null;
    if (body.password) {
      hashedPassword = await bcrypt.hash(body.password, 10);
    }

    // Create staff member
    const staff = await prisma.vendor_staff.create({
      data: {
        id: generateId(),
        vendorId,
        name: body.name,
        phone: body.phone,
        email: body.email || null,
        password: hashedPassword, // Store hashed password
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        pincode: body.pincode || null,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        joiningDate: body.joiningDate ? new Date(body.joiningDate) : new Date(),
        profilePhoto: body.profilePhoto || null,
        role: body.role || 'DRIVER',
        status: body.status || 'ACTIVE',
        aadharNumber: body.aadharNumber || null,
        aadharDocument: body.aadharDocument || null,
        panNumber: body.panNumber || null,
        panDocument: body.panDocument || null,
        licenseNumber: body.licenseNumber || null,
        licenseType: body.licenseType || null,
        licenseExpiry: body.licenseExpiry ? new Date(body.licenseExpiry) : null,
        licenseDocument: body.licenseDocument || null,
        bankName: body.bankName || null,
        accountNumber: body.accountNumber || null,
        ifscCode: body.ifscCode || null,
        accountHolderName: body.accountHolderName || null,
        salary: body.salary || 0,
        emergencyContact: body.emergencyContact || null,
        emergencyPhone: body.emergencyPhone || null,
      },
    });

    // Exclude password from response
    const { password: _, ...staffWithoutPassword } = staff;

    return NextResponse.json({
      success: true,
      message: 'Staff member added successfully',
      staff: staffWithoutPassword,
    });
  } catch (error: any) {
    logger.error('Failed to create staff', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create staff', details: error?.message },
      { status: 500 }
    );
  }
}
