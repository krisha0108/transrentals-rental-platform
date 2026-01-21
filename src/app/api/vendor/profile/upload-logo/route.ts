// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

import logger from '@/lib/security/logger';
import { validateFile, ALLOWED_MIME_TYPES, FILE_SIZE_LIMITS } from '@/lib/security/file-validation';
export const dynamic = 'force-dynamic';

// POST - Upload vendor logo/profile image
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    const formData = await request.formData();
    const file = formData.get('logo') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      );
    }

    // SECURITY: Validate file using magic number verification
    const validationResult = await validateFile(file, {
      allowedMimeTypes: ALLOWED_MIME_TYPES.image,
      maxSize: FILE_SIZE_LIMITS.image,
      requireMagicNumber: true,
    });

    if (!validationResult.valid) {
      return NextResponse.json(
        { error: validationResult.error || 'Invalid file' },
        { status: 400 }
      );
    }

    // Use sanitized filename from validation
    const filename = validationResult.sanitizedName!;

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'vendors', vendorId, 'logos');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Write file to disk
    const filePath = path.join(uploadDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Create URL
    const logoUrl = `/uploads/vendors/${vendorId}/logos/${filename}`;

    // Update vendor logo in database
    const vendor = await prisma.vendors.update({
      where: { id: vendorId },
      data: { logo: logoUrl },
      select: {
        id: true,
        logo: true,
        businessName: true,
      },
    });

    logger.info('Vendor logo uploaded successfully', {
      vendorId,
      filename,
      logoUrl,
    });

    return NextResponse.json({
      success: true,
      logo: vendor.logo,
      message: 'Logo uploaded successfully',
    });
  } catch (error: any) {
    logger.error('Upload vendor logo error', error);
    return NextResponse.json(
      { error: 'Failed to upload logo', details: error?.message },
      { status: 500 }
    );
  }
}
