// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { validateImage } from '@/lib/security/file-validation';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';

export const dynamic = 'force-dynamic';

// POST - Upload tour images
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) return NextResponse.json({ error: auth.error }, { status: 401 });


    // Block rejected/suspended/blocked vendors from write operations
    const _guard = await vendorStatusGuard(auth.vendorId!);
    if (_guard.blocked) return _guard.response;

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }
    if (files.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 files per upload' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'wander', auth.vendorId);
    await mkdir(uploadDir, { recursive: true });

    const uploaded: string[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const validation = await validateImage(file);
      if (!validation.valid) { errors.push(`${file.name}: ${validation.error}`); continue; }

      try {
        const bytes = await file.arrayBuffer();
        await writeFile(path.join(uploadDir, validation.sanitizedName!), Buffer.from(bytes));
        uploaded.push(`/uploads/wander/${auth.vendorId}/${validation.sanitizedName}`);
      } catch {
        errors.push(`${file.name}: Failed to save`);
      }
    }

    if (uploaded.length === 0) {
      return NextResponse.json({ error: 'No files uploaded', details: errors }, { status: 400 });
    }

    return NextResponse.json({ success: true, images: uploaded, errors: errors.length ? errors : undefined });
  } catch (error) {
    console.error('[Wander Upload]', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
