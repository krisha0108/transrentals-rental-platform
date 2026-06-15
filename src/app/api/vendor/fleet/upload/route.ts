// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';


import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

import logger from '@/lib/security/logger';
import { validateImage } from '@/lib/security/file-validation';
import { scanFile, isClamAVAvailable } from '@/lib/security/antivirus';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';

export const dynamic = 'force-dynamic';

// POST - Upload fleet vehicle images
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vendorId = auth.vendorId;

    // Block rejected/suspended/blocked vendors from write operations
    const guard = await vendorStatusGuard(vendorId);
    if (guard.blocked) return guard.response;

    // SECURITY: Check vendor status before allowing uploads
    const vendor = await prisma.vendors.findUnique({
      where: { id: vendorId },
      select: { status: true },
    });

    if (!vendor || vendor.status === 'BLOCKED' || vendor.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'Your account is not authorized to upload files' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const serviceSlug = (formData.get('serviceSlug') as string) || 'fleet';

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Limit number of files per request
    if (files.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 files allowed per upload' },
        { status: 400 }
      );
    }

    // SECURITY: Create vendor-isolated upload directory
    // Path: public/uploads/{service-slug}/fleet/{vendorId}
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', serviceSlug, 'fleet', vendorId);
    await mkdir(uploadDir, { recursive: true });

    const uploadedImages: string[] = [];
    const errors: string[] = [];

    // Check ClamAV availability once for all files
    const clamAvailable = await isClamAVAvailable();

    for (const file of files) {
      // SECURITY: Validate file using magic number verification
      const validationResult = await validateImage(file);

      if (!validationResult.valid) {
        errors.push(`${file.name}: ${validationResult.error}`);
        continue;
      }

      // SECURITY: Scan for malware if ClamAV is available
      if (clamAvailable) {
        const scanResult = await scanFile(file);
        if (scanResult.infected) {
          logger.logSecurityEvent('Malware detected in fleet image upload', 'critical', {
            vendorId,
            fileName: file.name,
            viruses: scanResult.viruses,
          });
          errors.push(`${file.name}: Security threat detected`);
          continue;
        }
      }

      // Use sanitized filename from validation
      const fileName = validationResult.sanitizedName!;
      const filePath = path.join(uploadDir, fileName);

      try {
        // Convert file to buffer and save
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // Generate vendor-isolated public URL
        const url = `/uploads/${serviceSlug}/fleet/${vendorId}/${fileName}`;
        uploadedImages.push(url);
      } catch (err) {
        errors.push(`${file.name}: Failed to save file.`);
      }
    }

    if (uploadedImages.length === 0) {
      return NextResponse.json(
        {
          error: 'No files were uploaded successfully.',
          details: errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      images: uploadedImages,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully uploaded ${uploadedImages.length} image(s)`,
    });
  } catch (error: any) {
    logger.error('Fleet upload error', error);
    return NextResponse.json(
      { error: 'Failed to upload files', details: error?.message },
      { status: 500 }
    );
  }
}
