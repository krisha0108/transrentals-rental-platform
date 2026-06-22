// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
import { validateFile, ALLOWED_MIME_TYPES, FILE_SIZE_LIMITS } from '@/lib/security/file-validation';
import { scanFile, isClamAVAvailable } from '@/lib/security/antivirus';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

export const dynamic = 'force-dynamic';

// Helper to check vendor status
async function checkVendorStatus(vendorId: string): Promise<{ allowed: boolean; error?: string }> {
  const vendor = await prisma.vendors.findUnique({
    where: { id: vendorId },
    select: { status: true },
  });

  if (!vendor) {
    return { allowed: false, error: 'Vendor not found' };
  }

  if (vendor.status === 'BLOCKED' || vendor.status === 'SUSPENDED') {
    return { allowed: false, error: 'Your account is not authorized for this action' };
  }

  return { allowed: true };
}

// GET - Fetch vendor's media with pagination, search, and filtering
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vendorId = auth.vendorId;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '24');
    const search = searchParams.get('search') || '';
    const folder = searchParams.get('folder') || '';
    const type = searchParams.get('type') || ''; // image, video, document

    const skip = (page - 1) * limit;

    // Build where clause - only show vendor's own media
    const where: any = {
      vendorId: vendorId,
    };

    if (search) {
      where.OR = [
        { filename: { contains: search } },
        { originalName: { contains: search } },
        { alt: { contains: search } },
      ];
    }

    if (folder) {
      where.folder = folder;
    }

    if (type) {
      if (type === 'image') {
        where.mimeType = { startsWith: 'image/' };
      } else if (type === 'video') {
        where.mimeType = { startsWith: 'video/' };
      } else if (type === 'document') {
        where.mimeType = {
          in: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        };
      }
    }

    // Fetch media with pagination
    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.media.count({ where }),
    ]);

    // Get unique folders for filtering
    const folders = await prisma.media.findMany({
      where: { vendorId },
      select: { folder: true },
      distinct: ['folder'],
    });

    return NextResponse.json({
      success: true,
      media,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      folders: folders.map((f: { folder: string | null }) => f.folder).filter(Boolean),
    });
  } catch (error) {
    logger.error('Error fetching vendor media', error);
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}

// POST - Upload new media file(s)
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vendorId = auth.vendorId;

    // Block rejected/suspended/blocked vendors from write operations
    const guard = await vendorStatusGuard(vendorId);
    if (guard.blocked) return guard.response;

    // SECURITY: Check vendor status before allowing uploads
    const statusCheck = await checkVendorStatus(vendorId);
    if (!statusCheck.allowed) {
      return NextResponse.json({ error: statusCheck.error }, { status: 403 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'vendor-uploads';

    // Handle both single file and multiple files
    const filesToProcess = file ? [file] : files;

    if (!filesToProcess.length) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // SECURITY: Limit number of files per request
    if (filesToProcess.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 files allowed per upload' },
        { status: 400 }
      );
    }

    const uploadedMedia: any[] = [];
    const errors: string[] = [];

    // Check ClamAV availability once for all files
    const clamAvailable = await isClamAVAvailable();

    for (const fileItem of filesToProcess) {
      // SECURITY: Validate file using magic number verification
      const validationResult = await validateFile(fileItem, {
        allowedMimeTypes: ALLOWED_MIME_TYPES.all,
        maxSize: FILE_SIZE_LIMITS.default,
        requireMagicNumber: true,
      });

      if (!validationResult.valid) {
        errors.push(`${fileItem.name}: ${validationResult.error}`);
        continue;
      }

      // SECURITY: Scan for malware if ClamAV is available
      if (clamAvailable) {
        const scanResult = await scanFile(fileItem);
        if (scanResult.infected) {
          logger.logSecurityEvent('Malware detected in vendor media upload', 'critical', {
            vendorId,
            fileName: fileItem.name,
            viruses: scanResult.viruses,
          });
          errors.push(`${fileItem.name}: Security threat detected`);
          continue;
        }
      }

      try {
        // Use sanitized filename from validation
        const filename = validationResult.sanitizedName!;

        // Generate alt text from original filename
        const ext = path.extname(fileItem.name);
        const altText = path
          .basename(fileItem.name, ext)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 100);

        // Ensure upload directory exists - organized by vendor
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'vendors', vendorId, folder);
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
        }

        // Write file to disk
        const filePath = path.join(uploadDir, filename);
        const buffer = Buffer.from(await fileItem.arrayBuffer());
        await writeFile(filePath, buffer);

        // Create URL
        const url = `/uploads/vendors/${vendorId}/${folder}/${filename}`;

        // Save to database with vendorId
        const mediaRecord = await prisma.media.create({
          data: {
            id: generateId(),
            filename,
            originalName: fileItem.name,
            mimeType: fileItem.type,
            size: fileItem.size,
            url,
            folder,
            vendorId: vendorId,
            alt: altText,
          },
        });

        uploadedMedia.push(mediaRecord);
      } catch (fileError) {
        logger.error(`Error processing ${fileItem.name}`, fileError);
        errors.push(`${fileItem.name}: Upload failed`);
      }
    }

    return NextResponse.json({
      success: true,
      media: uploadedMedia,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    logger.error('Error uploading vendor media', error);
    return NextResponse.json(
      { error: 'Failed to upload media' },
      { status: 500 }
    );
  }
}

// DELETE - Delete media by ID
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vendorId = auth.vendorId;

    // Block rejected/suspended/blocked vendors from write operations
    const guard = await vendorStatusGuard(vendorId);
    if (guard.blocked) return guard.response;

    // SECURITY: Check vendor status before allowing deletion
    const statusCheck = await checkVendorStatus(vendorId);
    if (!statusCheck.allowed) {
      return NextResponse.json({ error: statusCheck.error }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Media ID is required' },
        { status: 400 }
      );
    }

    // Find the media record - ensure it belongs to this vendor
    const media = await prisma.media.findFirst({
      where: {
        id,
        vendorId: vendorId,
      },
    });

    if (!media) {
      return NextResponse.json(
        { error: 'Media not found or access denied' },
        { status: 404 }
      );
    }

    // Delete file from disk
    try {
      const filePath = path.join(process.cwd(), 'public', media.url);
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
    } catch (fileError) {
      logger.error('Error deleting file', fileError);
      // Continue even if file deletion fails
    }

    // Delete from database
    await prisma.media.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Media deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting vendor media', error);
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 }
    );
  }
}
