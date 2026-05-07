import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import logger from '@/lib/security/logger';
import { generateCustomerId } from '@/lib/utils/id-generator';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET - Get customer profile from local trans_cms database
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const identifier = searchParams.get('identifier');

    if (!customerId && !identifier) {
      return NextResponse.json({ error: 'Customer ID or identifier required' }, { status: 400 });
    }

    const customer = await prisma.customers.findFirst({
      where: customerId
        ? { id: customerId }
        : {
            OR: [{ phone: identifier! }, { email: identifier! }],
          },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        drivingLicenseNumber: true,
        drivingLicenseExpiry: true,
        aadharNumber: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        isB2B: true,
        b2bStatus: true,
        companyName: true,
        totalBookings: true,
        totalSpent: true,
        createdAt: true,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Enrich with linkedTravelAgentId via raw SQL (column not in generated Prisma client yet)
    let linkedTravelAgentId: string | null = null;
    try {
      const rows: any[] = await (prisma as any).$queryRawUnsafe(
        `SELECT linkedTravelAgentId FROM customers WHERE id = ? LIMIT 1`,
        customer.id,
      );
      linkedTravelAgentId = rows[0]?.linkedTravelAgentId || null;
    } catch {
      /* column may not exist in older deployments */
    }

    return NextResponse.json({
      success: true,
      customers: {
        ...customer,
        image: customer.avatar,
        linkedTravelAgentId,
      },
    });
  } catch (error) {
    logger.error('Customer profile GET error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update or create customer profile in local database
 * If customer doesn't exist, creates a new one (upsert)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_id, customerId, identifier, ...updateData } = body;

    const id = customer_id || customerId;
    const phone = updateData.phone || identifier;
    const email = updateData.email;

    if (!id && !phone && !email) {
      return NextResponse.json(
        { error: 'Customer ID, phone, or email required' },
        { status: 400 }
      );
    }

    // Validate phone if provided
    if (updateData.phone !== undefined && updateData.phone !== '') {
      const digits = String(updateData.phone).replace(/\D/g, '');
      if (digits.length !== 10 || !/^[6-9]/.test(digits)) {
        return NextResponse.json(
          { success: false, error: 'Invalid phone number. Must be 10 digits starting with 6-9' },
          { status: 400 }
        );
      }
      updateData.phone = digits; // store clean digits only
    }

    // Build update/create object
    const customerData: any = {};
    if (updateData.name !== undefined) customerData.name = updateData.name;
    if (updateData.email !== undefined) customerData.email = updateData.email;
    if (updateData.phone !== undefined) customerData.phone = updateData.phone;
    if (updateData.avatar !== undefined) customerData.avatar = updateData.avatar;
    if (updateData.image !== undefined) customerData.avatar = updateData.image;
    if (updateData.dateOfBirth !== undefined)
      customerData.dateOfBirth = updateData.dateOfBirth ? new Date(updateData.dateOfBirth) : null;
    if (updateData.gender !== undefined) customerData.gender = updateData.gender;
    if (updateData.address !== undefined) customerData.address = updateData.address;
    if (updateData.city !== undefined) customerData.city = updateData.city;
    if (updateData.state !== undefined) customerData.state = updateData.state;
    if (updateData.pincode !== undefined) customerData.pincode = updateData.pincode;
    if (updateData.drivingLicenseNumber !== undefined)
      customerData.drivingLicenseNumber = updateData.drivingLicenseNumber;
    if (updateData.drivingLicenseExpiry !== undefined)
      customerData.drivingLicenseExpiry = updateData.drivingLicenseExpiry
        ? new Date(updateData.drivingLicenseExpiry)
        : null;
    if (updateData.aadharNumber !== undefined) customerData.aadharNumber = updateData.aadharNumber;

    const profileSelect = {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      dateOfBirth: true,
      gender: true,
      address: true,
      city: true,
      state: true,
      pincode: true,
      drivingLicenseNumber: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      totalBookings: true,
      totalSpent: true,
    };

    let resultCustomer;
    let isNew = false;

    if (id) {
      // Direct update by ID — no findFirst needed, saves 1 DB connection
      try {
        resultCustomer = await prisma.customers.update({
          where: { id },
          data: customerData,
          select: profileSelect,
        });
      } catch (updateError: any) {
        if (updateError.code !== 'P2025') throw updateError;
        // Record not found — create new
        if (!phone) {
          return NextResponse.json(
            { error: 'Phone number is required to create a new profile' },
            { status: 400 }
          );
        }
        isNew = true;
        const newCustomerId = await generateCustomerId();
        resultCustomer = await prisma.customers.create({
          data: {
            id: newCustomerId,
            name: customerData.name || 'Customer',
            phone,
            email: customerData.email || null,
            avatar: customerData.avatar || null,
            dateOfBirth: customerData.dateOfBirth || null,
            gender: customerData.gender || null,
            address: customerData.address || null,
            city: customerData.city || null,
            state: customerData.state || null,
            pincode: customerData.pincode || null,
            drivingLicenseNumber: customerData.drivingLicenseNumber || null,
            drivingLicenseExpiry: customerData.drivingLicenseExpiry || null,
            aadharNumber: customerData.aadharNumber || null,
            isPhoneVerified: true,
          },
          select: profileSelect,
        });
      }
    } else if (phone) {
      // Upsert by phone — single query instead of findFirst + update/create
      const newCustomerId = await generateCustomerId();
      resultCustomer = await (prisma.customers.upsert as any)({
        where: { phone },
        update: customerData,
        create: {
          id: newCustomerId,
          name: customerData.name || 'Customer',
          phone,
          email: customerData.email || null,
          avatar: customerData.avatar || null,
          dateOfBirth: customerData.dateOfBirth || null,
          gender: customerData.gender || null,
          address: customerData.address || null,
          city: customerData.city || null,
          state: customerData.state || null,
          pincode: customerData.pincode || null,
          drivingLicenseNumber: customerData.drivingLicenseNumber || null,
          drivingLicenseExpiry: customerData.drivingLicenseExpiry || null,
          aadharNumber: customerData.aadharNumber || null,
          isPhoneVerified: true,
        },
        select: profileSelect,
      });
    } else {
      // Only email provided — upsert by email
      const newCustomerId = await generateCustomerId();
      resultCustomer = await (prisma.customers.upsert as any)({
        where: { email },
        update: customerData,
        create: {
          id: newCustomerId,
          name: customerData.name || 'Customer',
          phone: email!, // fallback, phone field required
          email,
          avatar: customerData.avatar || null,
          isPhoneVerified: false,
        },
        select: profileSelect,
      });
    }

    return NextResponse.json({
      success: true,
      status: 'success',
      message: isNew ? 'Profile created successfully' : 'Profile updated successfully',
      customers: {
        ...resultCustomer,
        image: resultCustomer.avatar,
      },
    });
  } catch (error: any) {
    logger.error('Customer profile PUT error', error);

    // Handle unique constraint error
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      const fieldLabel = field === 'phone' ? 'mobile number' : field === 'email' ? 'email address' : field || 'value';
      return NextResponse.json(
        { success: false, error: `This ${fieldLabel} is already registered with another account` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

/**
 * POST - Handle various customer auth/profile actions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'update-profile') {
      // Delegate to PUT handler
      const putRequest = new NextRequest(request.url, {
        method: 'PUT',
        headers: request.headers,
        body: JSON.stringify(data),
      });
      return PUT(putRequest);
    }

    if (action === 'get-profile') {
      const url = new URL(request.url);
      if (data.customer_id) url.searchParams.set('customer_id', data.customer_id);
      if (data.identifier) url.searchParams.set('identifier', data.identifier);
      return GET(new NextRequest(url));
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    logger.error('Customer profile POST error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
