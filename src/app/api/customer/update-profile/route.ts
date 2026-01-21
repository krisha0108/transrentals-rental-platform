import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * POST - Update customer profile with image upload support
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const customerId = formData.get('customer_id') as string;
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const password = formData.get('password') as string;
    const imageFile = formData.get('image') as File | null;

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Find existing customer
    const existingCustomer = await prisma.customers.findUnique({
      where: { id: customerId },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;

    // Handle password if provided
    if (password && password.trim() !== '') {
      // Hash password using bcrypt
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // Handle image upload if provided
    if (imageFile && typeof imageFile !== 'string') {
      try {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!allowedTypes.includes(imageFile.type)) {
          return NextResponse.json(
            { success: false, error: 'Invalid image type. Only JPG, PNG, and WebP are allowed.' },
            { status: 400 }
          );
        }

        // Validate file size (max 5MB)
        if (imageFile.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { success: false, error: 'Image size must be less than 5MB' },
            { status: 400 }
          );
        }

        // Create upload directory
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profile_images');
        await mkdir(uploadDir, { recursive: true });

        // Generate unique filename
        const timestamp = Date.now();
        const ext = path.extname(imageFile.name) || '.jpg';
        const fileName = `customer-${customerId}-${timestamp}${ext}`;
        const filePath = path.join(uploadDir, fileName);

        // Convert file to buffer and save
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // Update avatar field with just the filename
        updateData.avatar = fileName;
      } catch (uploadError) {
        logger.error('Image upload error', uploadError);
        return NextResponse.json(
          { success: false, error: 'Failed to upload image' },
          { status: 500 }
        );
      }
    }

    // Update customer in database
    const updatedCustomer = await prisma.customers.update({
      where: { id: customerId },
      data: updateData,
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
        password: true,
      },
    });

    // Return response
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      customers: {
        ...updatedCustomer,
        image: updatedCustomer.avatar,
        password: undefined, // Don't send password back
      },
      has_password: !!updatedCustomer.password,
    });
  } catch (error: any) {
    logger.error('Customer profile update error', error);

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
