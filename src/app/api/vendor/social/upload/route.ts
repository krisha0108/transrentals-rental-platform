import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// Max 5 MB per image, only common image formats
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 5 * 1024 * 1024;

// POST - Upload one or more images for vendor social posts.
// Accepts FormData with `file` (single) or `files` (multiple) + optional `folder`.
// Saves to public/uploads/vendors/{vendorId}/{folder}/...
// Mirrors /api/travel-agent/upload so the vendor + TA social flows behave identically.
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    const formData = await request.formData();
    const single = formData.get('file') as File | null;
    const many = formData.getAll('files') as File[];
    const folderParam = (formData.get('folder') as string) || 'social';

    const filesToUpload = single ? [single] : many;
    if (!filesToUpload || filesToUpload.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Sanitize folder to a single path segment (prevent path traversal)
    const safeFolder = folderParam.replace(/[^a-z0-9-_]/gi, '').slice(0, 32) || 'social';

    const uploadDir = path.join(
      process.cwd(),
      'public',
      'uploads',
      'vendors',
      vendorId,
      safeFolder,
    );
    await mkdir(uploadDir, { recursive: true });

    const uploaded: { url: string; name: string }[] = [];
    const errors: string[] = [];

    for (const f of filesToUpload) {
      if (!f || typeof f === 'string') continue;

      if (!ALLOWED_TYPES.includes(f.type)) {
        errors.push(`${f.name}: unsupported type (${f.type})`);
        continue;
      }
      if (f.size > MAX_BYTES) {
        errors.push(`${f.name}: too large (max 5 MB)`);
        continue;
      }

      const timestamp = Date.now();
      const safeName = f.name.replace(/[^a-zA-Z0-9.-]/g, '-');
      const ext = path.extname(safeName) || '.jpg';
      const base = path.basename(safeName, ext).slice(0, 40);
      const fileName = `${base}-${timestamp}${ext}`;
      const filePath = path.join(uploadDir, fileName);

      const bytes = await f.arrayBuffer();
      await writeFile(filePath, Buffer.from(bytes));

      const url = `/uploads/vendors/${vendorId}/${safeFolder}/${fileName}`;
      uploaded.push({ url, name: f.name });
    }

    if (uploaded.length === 0) {
      return NextResponse.json(
        { error: 'No valid files uploaded', details: errors.join('; ') },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      url: uploaded[0].url,
      uploaded,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    logger.error('Vendor social image upload error', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error?.message },
      { status: 500 },
    );
  }
}
