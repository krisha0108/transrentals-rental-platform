// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getDriverAppUser } from '@/lib/auth/driver-app-auth';
import { prisma } from '@/lib/db/prisma';
import { validateImage } from '@/lib/security/file-validation';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const user = await getDriverAppUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const validation = await validateImage(file);
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const isStaff = user.userType === 'vendor_staff';
    const folder  = isStaff ? 'staff-profiles' : 'driver-profiles';
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder, user.id);
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    await writeFile(path.join(uploadDir, validation.sanitizedName!), Buffer.from(bytes));
    const url = `/uploads/${folder}/${user.id}/${validation.sanitizedName}`;

    if (isStaff) {
      await prisma.vendor_staff.update({
        where: { id: user.id },
        data: { profilePhoto: url },
      });
    } else {
      await prisma.drivers.update({
        where: { id: user.id },
        data: { profilePhoto: url },
      });
    }

    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    console.error('[profile/photo] error:', error?.message);
    return NextResponse.json({ success: false, error: error?.message || 'Upload failed' }, { status: 500 });
  }
}
