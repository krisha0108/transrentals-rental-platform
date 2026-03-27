// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getDriver } from '@/lib/auth/driver-auth';
import { prisma } from '@/lib/db/prisma';
import { validateImage } from '@/lib/security/file-validation';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

// POST - upload vehicle photos or document photos
// FormData fields:
//   file       - the image file
//   type       - 'vehicle' | 'insurance' | 'rc' | 'fitness' | 'permit'
//   remove     - (optional) URL to remove (for vehicle photos array)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const driver = await getDriver(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  const { id } = await params;
  const isStaff = (driver as any).userType === 'vendor_staff';

  const vehicle = await prisma.driver_vehicles.findFirst({
    where: isStaff ? { id, staffId: driver.id } : { id, driverId: driver.id },
  });
  if (!vehicle) return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const type = (formData.get('type') as string) || 'vehicle';

  if (!file) return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });

  const validation = await validateImage(file);
  if (!validation.valid) return NextResponse.json({ success: false, error: validation.error }, { status: 400 });

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'driver-vehicles', id);
  await mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  await writeFile(path.join(uploadDir, validation.sanitizedName!), Buffer.from(bytes));
  const url = `/uploads/driver-vehicles/${id}/${validation.sanitizedName}`;

  const FIELD_MAP: Record<string, string> = {
    insurance: 'insuranceDocument',
    rc: 'rcDocument',
    fitness: 'fitnessDocument',
    permit: 'permitDocument',
  };

  if (FIELD_MAP[type]) {
    await prisma.driver_vehicles.update({
      where: { id },
      data: { [FIELD_MAP[type]]: url },
    });
    return NextResponse.json({ success: true, url });
  }

  // vehicle photos — append to JSON array
  const existing: string[] = vehicle.vehiclePhotos ? JSON.parse(vehicle.vehiclePhotos) : [];
  const updated = [...existing, url];
  await prisma.driver_vehicles.update({
    where: { id },
    data: { vehiclePhotos: JSON.stringify(updated) },
  });
  return NextResponse.json({ success: true, url, photos: updated });
}

// DELETE - remove a photo URL
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const driver = await getDriver(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  const { id } = await params;
  const isStaff = (driver as any).userType === 'vendor_staff';

  const vehicle = await prisma.driver_vehicles.findFirst({
    where: isStaff ? { id, staffId: driver.id } : { id, driverId: driver.id },
  });
  if (!vehicle) return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });

  const { url, type } = await request.json();

  const FIELD_MAP: Record<string, string> = {
    insurance: 'insuranceDocument',
    rc: 'rcDocument',
    fitness: 'fitnessDocument',
    permit: 'permitDocument',
  };

  if (type && FIELD_MAP[type]) {
    await prisma.driver_vehicles.update({ where: { id }, data: { [FIELD_MAP[type]]: null } });
    return NextResponse.json({ success: true });
  }

  const existing: string[] = vehicle.vehiclePhotos ? JSON.parse(vehicle.vehiclePhotos) : [];
  const updated = existing.filter(p => p !== url);
  await prisma.driver_vehicles.update({
    where: { id },
    data: { vehiclePhotos: JSON.stringify(updated) },
  });
  return NextResponse.json({ success: true, photos: updated });
}
