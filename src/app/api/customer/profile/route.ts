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
        totalBookings: true,
        totalSpent: true,
        createdAt: true,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      customers: {
        ...customer,
        image: customer.avatar,
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

    // Find customer first - try by ID, then by phone, then by email
    let existingCustomer = await prisma.customers.findFirst({
      where: id
        ? { id }
        : {
            OR: [
              ...(phone ? [{ phone }] : []),
              ...(email ? [{ email }] : []),
            ],
          },
    });

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

    let resultCustomer;
    let isNew = false;

    if (existingCustomer) {
      // Update existing customer
      resultCustomer = await prisma.customers.update({
        where: { id: existingCustomer.id },
        data: customerData,
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
          isEmailVerified: true,
          isPhoneVerified: true,
          totalBookings: true,
          totalSpent: true,
        },
      });
    } else {
      // Create new customer - phone is required for new customers
      if (!phone) {
        return NextResponse.json(
          { error: 'Phone number is required to create a new profile' },
          { status: 400 }
        );
      }

      isNew = true;
      const customerId = await generateCustomerId();
      resultCustomer = await prisma.customers.create({
        data: {
          id: customerId,
          name: customerData.name || 'Customer',
          phone: phone,
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
          isEmailVerified: true,
          isPhoneVerified: true,
          totalBookings: true,
          totalSpent: true,
        },
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
      return NextResponse.json(
        { success: false, error: `This ${field || 'value'} is already in use` },
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
