import { NextRequest, NextResponse } from 'next/server';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// Max 5 MB per image, only common image formats
// Note: Android often sends "image/jpg" (non-standard) instead of "image/jpeg"
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
const MAX_BYTES = 5 * 1024 * 1024;

// POST - Upload one or more images for tours/properties
// Accepts FormData with `file` (single) or `files` (multiple) + optional `folder`.
// Saves to public/uploads/travel-agents/{travelAgentId}/{folder}/...
export async function POST(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const travelAgentId = auth.travelAgentId;

    const formData = await request.formData();
    const single = formData.get('file') as File | null;
    const many = formData.getAll('files') as File[];
    const folderParam = (formData.get('folder') as string) || 'images';

    const filesToUpload = single ? [single] : many;
    if (!filesToUpload || filesToUpload.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Sanitize folder to a single path segment (prevent path traversal)
    const safeFolder = folderParam.replace(/[^a-z0-9-_]/gi, '').slice(0, 32) || 'images';

    const uploadDir = path.join(
      process.cwd(),
      'public',
      'uploads',
      'travel-agents',
      travelAgentId,
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

      const url = `/uploads/travel-agents/${travelAgentId}/${safeFolder}/${fileName}`;
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
    logger.error('Travel agent image upload error', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error?.message },
      { status: 500 },
    );
  }
}
