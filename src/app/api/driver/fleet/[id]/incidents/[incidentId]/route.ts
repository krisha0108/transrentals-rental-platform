import { NextRequest, NextResponse } from 'next/server';
import { getDriver } from '@/lib/auth/driver-auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; incidentId: string }> }
) {
  const driver = await getDriver(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  const { id, incidentId } = await params;
  const isStaff = (driver as any).userType === 'vendor_staff';

  const vehicle = await prisma.driver_vehicles.findFirst({
    where: isStaff ? { id, staffId: driver.id } : { id, driverId: driver.id },
  });
  if (!vehicle) return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });

  await prisma.driver_incidents.deleteMany({ where: { id: incidentId, vehicleId: id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; incidentId: string }> }
) {
  const driver = await getDriver(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  const { id, incidentId } = await params;
  const isStaff = (driver as any).userType === 'vendor_staff';

  const vehicle = await prisma.driver_vehicles.findFirst({
    where: isStaff ? { id, staffId: driver.id } : { id, driverId: driver.id },
  });
  if (!vehicle) return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });

  const body = await request.json();
  const { date, type, description, severity, repairCost, repairStatus, notes } = body;

  await prisma.driver_incidents.updateMany({
    where: { id: incidentId, vehicleId: id },
    data: {
      ...(date && { date: new Date(date) }),
      ...(type && { type }),
      description: description || null,
      ...(severity && { severity }),
      repairCost: repairCost ? parseFloat(String(repairCost)) : null,
      ...(repairStatus && { repairStatus }),
      notes: notes || null,
    },
  });
  return NextResponse.json({ success: true });
}
