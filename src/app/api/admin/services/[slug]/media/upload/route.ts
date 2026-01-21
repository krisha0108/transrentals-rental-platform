import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Helper to generate a cuid-like unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

const getSettingKey = (slug: string) => `service_media_${slug}`;

// POST - Upload file(s) for a service
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;

    // Service doesn't need to exist in database - we use slug for organizing uploads
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const folder = (formData.get('folder') as string) || 'fleet';

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', slug, folder);
    await mkdir(uploadDir, { recursive: true });

    const uploadedMedia: any[] = [];

    for (const file of files) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        continue; // Skip non-image files
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        continue; // Skip files larger than 5MB
      }

      // Generate unique filename
      const timestamp = Date.now();
      const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
      const ext = path.extname(originalName) || '.jpg';
      const baseName = path.basename(originalName, ext);
      const fileName = `${baseName}-${timestamp}${ext}`;
      const filePath = path.join(uploadDir, fileName);

      // Convert file to buffer and save
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // Generate public URL
      const url = `/uploads/${slug}/${folder}/${fileName}`;

      // Create media entry
      const newMedia = {
        id: Math.random().toString(36).substr(2, 9),
        name: originalName,
        url,
        type: 'image' as const,
        size: file.size,
        folder,
        createdAt: new Date().toISOString(),
      };

      uploadedMedia.push(newMedia);
    }

    if (uploadedMedia.length === 0) {
      return NextResponse.json(
        { error: 'No valid files were uploaded. Only images (JPG, PNG, GIF, WebP, SVG) under 5MB are allowed.' },
        { status: 400 }
      );
    }

    // Update media gallery in Settings table
    const settingKey = getSettingKey(slug);
    const existing = await prisma.settings.findUnique({
      where: { key: settingKey },
    });

    const data = existing?.value ? JSON.parse(existing.value) : { media: [], folders: [] };

    // Add uploaded media to gallery
    data.media.push(...uploadedMedia);

    // Update folder count
    const folderIndex = data.folders.findIndex((f: any) => f.name === folder);
    if (folderIndex !== -1) {
      data.folders[folderIndex].itemCount += uploadedMedia.length;
    } else {
      // Create folder if it doesn't exist
      data.folders.push({
        id: Math.random().toString(36).substr(2, 9),
        name: folder,
        itemCount: uploadedMedia.length,
      });
    }

    await prisma.settings.upsert({
      where: { key: settingKey },
      create: { id: generateId(), key: settingKey, value: JSON.stringify(data) },
      update: { value: JSON.stringify(data) },
    });

    return NextResponse.json({
      success: true,
      uploaded: uploadedMedia,
      message: `Successfully uploaded ${uploadedMedia.length} file(s)`,
    });
  } catch (error: any) {
    logger.error('Upload error', error);
    return NextResponse.json(
      { error: 'Failed to upload files', details: error?.message },
      { status: 500 }
    );
  }
}
