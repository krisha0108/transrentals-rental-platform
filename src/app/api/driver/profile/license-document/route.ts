// Store a driver's licence document.
//
// The sign-up design asks for the licence up front, but a file cannot be part
// of the registration JSON and the driver does not exist until that call has
// returned. So registration happens first and the form posts the file here
// straight afterwards with the token it just received — which is also why
// this route authenticates like any other profile route rather than trusting
// anything in the request body.
import { NextRequest, NextResponse } from 'next/server';
import { getDriver } from '@/lib/auth/driver-auth';
import { prisma } from '@/lib/db/prisma';
import { validateVendorDocument } from '@/lib/security/file-validation';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const driver = await getDriver(request);
  if (!driver) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  // vendor_staff rows have no licenceDocument column of their own; only an
  // independent driver can hold one.
  if ((driver as any).userType === 'vendor_staff') {
    return NextResponse.json(
      { success: false, error: 'Staff licences are managed by your vendor.' },
      { status: 403 },
    );
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
  }

  // Checks the magic number, not just the extension, so a renamed executable
  // cannot arrive claiming to be a PDF.
  const validation = await validateVendorDocument(file);
  if (!validation.valid) {
    return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'driver-licenses', driver.id);
  await mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  await writeFile(path.join(uploadDir, validation.sanitizedName!), Buffer.from(bytes));
  const url = `/uploads/driver-licenses/${driver.id}/${validation.sanitizedName}`;

  await prisma.drivers.update({ where: { id: driver.id }, data: { licenseDocument: url } });

  return NextResponse.json({ success: true, url });
}
