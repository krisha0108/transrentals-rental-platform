import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import crypto from 'crypto';

// Allowed MIME types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// GET - Fetch all media with pagination, search, and filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '24');
    const search = searchParams.get('search') || '';
    const folder = searchParams.get('folder') || '';
    const type = searchParams.get('type') || ''; // image, video, document

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

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
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}

// POST - Upload new media file(s)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'uploads';

    // Handle both single file and multiple files
    const filesToProcess = file ? [file] : files;

    if (!filesToProcess.length) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const uploadedMedia: any[] = [];
    const errors: string[] = [];

    for (const fileItem of filesToProcess) {
      // Validate file type
      if (!ALLOWED_TYPES.includes(fileItem.type)) {
        errors.push(`${fileItem.name}: Invalid file type`);
        continue;
      }

      // Validate file size
      if (fileItem.size > MAX_FILE_SIZE) {
        errors.push(`${fileItem.name}: File too large (max 10MB)`);
        continue;
      }

      try {
        // Generate unique filename
        const timestamp = Date.now();
        const ext = path.extname(fileItem.name);
        const baseName = path
          .basename(fileItem.name, ext)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .substring(0, 50);
        const filename = `${baseName}-${timestamp}${ext}`;

        // Ensure upload directory exists
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
        }

        // Write file to disk
        const filePath = path.join(uploadDir, filename);
        const buffer = Buffer.from(await fileItem.arrayBuffer());
        await writeFile(filePath, buffer);

        // Get image dimensions if it's an image
        let width: number | null = null;
        let height: number | null = null;

        // Create URL
        const url = `/uploads/${folder}/${filename}`;

        // Save to database
        const mediaRecord = await prisma.media.create({
          data: {
            id: crypto.randomUUID(),
            filename,
            originalName: fileItem.name,
            mimeType: fileItem.type,
            size: fileItem.size,
            url,
            folder,
            width,
            height,
            alt: baseName.replace(/-/g, ' '),
          },
        });

        uploadedMedia.push(mediaRecord);
      } catch (fileError) {
        console.error(`Error processing ${fileItem.name}:`, fileError);
        errors.push(`${fileItem.name}: Upload failed`);
      }
    }

    return NextResponse.json({
      success: true,
      media: uploadedMedia,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error uploading media:', error);
    return NextResponse.json(
      { error: 'Failed to upload media' },
      { status: 500 }
    );
  }
}

// DELETE - Delete media by ID
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Media ID is required' },
        { status: 400 }
      );
    }

    // Find the media record
    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      return NextResponse.json(
        { error: 'Media not found' },
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
      console.error('Error deleting file:', fileError);
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
    console.error('Error deleting media:', error);
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 }
    );
  }
}
