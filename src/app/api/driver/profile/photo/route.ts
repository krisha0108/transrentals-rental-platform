// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getDriver } from '@/lib/auth/driver-auth';
import { prisma } from '@/lib/db/prisma';
import { validateImage } from '@/lib/security/file-validation';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const driver = await getDriver(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  const isStaff = (driver as any).userType === 'vendor_staff';

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });

  const validation = await validateImage(file);
  if (!validation.valid) return NextResponse.json({ success: false, error: validation.error }, { status: 400 });

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'driver-profiles', driver.id);
  await mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  await writeFile(path.join(uploadDir, validation.sanitizedName!), Buffer.from(bytes));
  const url = `/uploads/driver-profiles/${driver.id}/${validation.sanitizedName}`;

  if (isStaff) {
    await prisma.vendor_staff.update({ where: { id: driver.id }, data: { profilePhoto: url } });
  } else {
    await prisma.drivers.update({ where: { id: driver.id }, data: { profilePhoto: url } });
  }

  return NextResponse.json({ success: true, url });
}
