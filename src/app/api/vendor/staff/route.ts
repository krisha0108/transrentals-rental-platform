import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { sanitizeInput, isValidEmail, isValidPhone, sanitizePhone } from '@/lib/utils/sanitize';
import { smartRateLimit, getClientIdentifier } from '@/lib/utils/smart-rate-limit';
import { generateDid } from '@/lib/utils/generate-did';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';

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

    // Block rejected/suspended/blocked vendors from write operations
    const guard = await vendorStatusGuard(vendorId);
    if (guard.blocked) return guard.response;

    // ===== RATE LIMITING =====
    const clientId = getClientIdentifier(request);
    const isAuthenticated = true; // Vendor is authenticated

    const rateLimitCheck = await smartRateLimit(clientId, isAuthenticated, {});
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: rateLimitCheck.error,
          requiresCaptcha: rateLimitCheck.requiresCaptcha,
          type: 'rate_limit',
        },
        { status: 429 }
      );
    }

    // Handle both JSON and FormData (for mobile app compatibility)
    let body: any = {};
    const contentType = request.headers.get('content-type') || '';

    try {
      if (contentType.includes('multipart/form-data')) {
        // Mobile app sends FormData
        const formData = await request.formData();

        // Convert FormData to plain object
        formData.forEach((value, key) => {
          // For now, we skip file uploads (they need separate handling)
          // Files: profilePhoto, aadharDocument, panDocument, licenseDocument
          if (typeof value === 'string') {
            body[key] = value;
          }
        });

        logger.info('[Staff] Received FormData from mobile app');
      } else {
        // Web sends JSON
        body = await request.json();
      }
    } catch (parseError) {
      logger.error('[Staff] Failed to parse request body', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      );
    }

    // ===== INPUT SANITIZATION (XSS Protection) =====
    body.name = sanitizeInput(body.name);
    body.address = sanitizeInput(body.address);
    body.city = sanitizeInput(body.city);
    body.state = sanitizeInput(body.state);
    body.aadharNumber = sanitizeInput(body.aadharNumber);
    body.panNumber = sanitizeInput(body.panNumber);
    body.licenseNumber = sanitizeInput(body.licenseNumber);
    body.licenseType = sanitizeInput(body.licenseType);
    body.bankName = sanitizeInput(body.bankName);
    body.accountNumber = sanitizeInput(body.accountNumber);
    body.ifscCode = sanitizeInput(body.ifscCode);
    body.accountHolderName = sanitizeInput(body.accountHolderName);
    body.emergencyContact = sanitizeInput(body.emergencyContact);
    body.phone = sanitizePhone(body.phone);
    body.emergencyPhone = sanitizePhone(body.emergencyPhone);

    // Validate required fields
    if (!body.name || !body.phone) {
      return NextResponse.json(
        { success: false, error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    // ===== PHONE VALIDATION =====
    if (body.phone && !isValidPhone(body.phone)) {
      return NextResponse.json({ success: false, error: 'Invalid phone number. Must be 10 digits starting with 6-9' }, { status: 400 });
    }

    if (body.emergencyPhone && !isValidPhone(body.emergencyPhone)) {
      return NextResponse.json({ success: false, error: 'Invalid emergency phone number. Must be 10 digits starting with 6-9' }, { status: 400 });
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

      // ===== EMAIL VALIDATION =====
      if (body.email && !isValidEmail(body.email)) {
        return NextResponse.json({ success: false, error: 'Invalid email format' }, { status: 400 });
      }

      if (!body.password || body.password.length < 6) {
        return NextResponse.json(
          { success: false, error: 'Password is required for drivers (min 6 characters)' },
          { status: 400 }
        );
      }
    } else if (body.email) {
      // Validate email format even for non-drivers if provided
      if (!isValidEmail(body.email)) {
        return NextResponse.json({ success: false, error: 'Invalid email format' }, { status: 400 });
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

    // Helper to convert FormData string values to proper types
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

    // ===== DATE VALIDATION =====
    if (body.dateOfBirth) {
      const dob = parseDate(body.dateOfBirth);
      if (dob) {
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        if (age < 18 || age > 100) {
          return NextResponse.json({ success: false, error: 'Invalid date of birth. Staff must be between 18-100 years old.' }, { status: 400 });
        }
      }
    }

    if (body.licenseExpiry) {
      const expiry = parseDate(body.licenseExpiry);
      if (expiry) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (expiry < today) {
          return NextResponse.json({ success: false, error: 'License expiry date cannot be in the past' }, { status: 400 });
        }
      }
    }

    if (body.joiningDate) {
      const joining = parseDate(body.joiningDate);
      if (joining) {
        const futureLimit = new Date();
        futureLimit.setFullYear(futureLimit.getFullYear() + 1);
        if (joining > futureLimit) {
          return NextResponse.json({ success: false, error: 'Joining date cannot be more than 1 year in the future' }, { status: 400 });
        }
      }
    }

    // Generate DID for drivers
    const did = isDriver ? await generateDid() : null;

    // Create staff member
    const staff = await prisma.vendor_staff.create({
      data: {
        id: generateId(),
        vendorId,
        name: body.name,
        phone: body.phone,
        email: parseValue(body.email),
        password: hashedPassword, // Store hashed password
        did,
        address: parseValue(body.address),
        city: parseValue(body.city),
        state: parseValue(body.state),
        pincode: parseValue(body.pincode),
        dateOfBirth: parseDate(body.dateOfBirth),
        joiningDate: parseDate(body.joiningDate) || new Date(),
        profilePhoto: parseValue(body.profilePhoto),
        role: body.role || 'DRIVER',
        status: body.status || 'ACTIVE',
        aadharNumber: parseValue(body.aadharNumber),
        aadharDocument: parseValue(body.aadharDocument),
        panNumber: parseValue(body.panNumber),
        panDocument: parseValue(body.panDocument),
        licenseNumber: parseValue(body.licenseNumber),
        licenseType: parseValue(body.licenseType),
        licenseExpiry: parseDate(body.licenseExpiry),
        licenseDocument: parseValue(body.licenseDocument),
        bankName: parseValue(body.bankName),
        accountNumber: parseValue(body.accountNumber),
        ifscCode: parseValue(body.ifscCode),
        accountHolderName: parseValue(body.accountHolderName),
        salary: parseSalary(body.salary),
        emergencyContact: parseValue(body.emergencyContact),
        emergencyPhone: parseValue(body.emergencyPhone),
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
