import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// POST - Upload file
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const files = formData.getAll('files') as File[];
    const folderParam = (formData.get('folder') as string) || '';

    // Support both 'file' and 'files' field names
    const filesToUpload = file ? [file] : files;

    if (!filesToUpload || filesToUpload.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // FIXED: Handle folder path to avoid /uploads/uploads/ issue
    // If no folder specified or folder is "uploads", put directly in /uploads/
    // Otherwise put in /uploads/{folder}/
    let folder = '';
    let uploadDir = '';

    if (!folderParam || folderParam === 'uploads') {
      // No subfolder - directly in public/uploads/
      folder = '';
      uploadDir = path.join(process.cwd(), 'public', 'uploads');
    } else {
      // With subfolder - public/uploads/{folder}/
      folder = folderParam;
      uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
    }

    // Create upload directory if it doesn't exist
    await mkdir(uploadDir, { recursive: true });

    const uploadedFiles: { url: string; name: string }[] = [];

    for (const uploadFile of filesToUpload) {
      if (!uploadFile || typeof uploadFile === 'string') continue;

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(uploadFile.type)) {
        continue;
      }

      // Validate file size (max 5MB)
      if (uploadFile.size > 5 * 1024 * 1024) {
        continue;
      }

      // Generate unique filename
      const timestamp = Date.now();
      const originalName = uploadFile.name.replace(/[^a-zA-Z0-9.-]/g, '-');
      const ext = path.extname(originalName) || '.jpg';
      const baseName = path.basename(originalName, ext);
      const fileName = `${baseName}-${timestamp}${ext}`;
      const filePath = path.join(uploadDir, fileName);

      // Convert file to buffer and save
      const bytes = await uploadFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // Generate public URL
      // FIXED: Avoid /uploads/uploads/ - if folder is empty, URL is /uploads/file.png
      const url = folder ? `/uploads/${folder}/${fileName}` : `/uploads/${fileName}`;

      // Save to Media table for gallery access
      try {
        await prisma.media.create({
          data: {
            filename: fileName,
            originalName: uploadFile.name,
            mimeType: uploadFile.type,
            size: uploadFile.size,
            url,
            folder: folder || 'default', // Use 'default' if no folder specified
            alt: baseName.replace(/-/g, ' '),
          },
        });
      } catch (dbError) {
        // Log but don't fail - file is still uploaded
        logger.error('Failed to save to media table', dbError);
      }

      uploadedFiles.push({ url, name: originalName });
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        { error: 'No valid files were uploaded. Only images (JPG, PNG, GIF, WebP, SVG) under 5MB are allowed.' },
        { status: 400 }
      );
    }

    // Return in format compatible with both old and new implementations
    return NextResponse.json({
      success: true,
      url: uploadedFiles[0].url, // For backward compatibility
      uploaded: uploadedFiles,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
    });
  } catch (error: any) {
    logger.error('Upload error', error);
    return NextResponse.json(
      { error: 'Failed to upload files', details: error?.message },
      { status: 500 }
    );
  }
}
