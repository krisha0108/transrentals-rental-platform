import { NextRequest, NextResponse } from 'next/server';
import { getDriver } from '@/lib/auth/driver-auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  const driver = await getDriver(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  const { id, logId } = await params;
  const isStaff = (driver as any).userType === 'vendor_staff';

  const vehicle = await prisma.driver_vehicles.findFirst({
    where: isStaff ? { id, staffId: driver.id } : { id, driverId: driver.id },
  });
  if (!vehicle) return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });

  await prisma.driver_maintenance_logs.deleteMany({ where: { id: logId, vehicleId: id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  const driver = await getDriver(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  const { id, logId } = await params;
  const isStaff = (driver as any).userType === 'vendor_staff';

  const vehicle = await prisma.driver_vehicles.findFirst({
    where: isStaff ? { id, staffId: driver.id } : { id, driverId: driver.id },
  });
  if (!vehicle) return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });

  const body = await request.json();
  const { type, description, cost, date, odometer, nextDueDate } = body;

  await prisma.driver_maintenance_logs.updateMany({
    where: { id: logId, vehicleId: id },
    data: {
      ...(type && { type }),
      description: description || null,
      ...(cost !== undefined && { cost: cost ? parseFloat(String(cost)) : null }),
      ...(date && { date: new Date(date) }),
      ...(odometer !== undefined && { odometer: odometer ? parseInt(String(odometer)) : null }),
      nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
    },
  });
  return NextResponse.json({ success: true });
}
