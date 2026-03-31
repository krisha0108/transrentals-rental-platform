// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getDriverAppUser } from '@/lib/auth/driver-app-auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest, { params }: { params: { vehicleId: string; incidentId: string } }) {
  const driver = await getDriverAppUser(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  const isStaff = (driver as any).userType === 'vendor_staff';
  const vehicle = await prisma.driver_vehicles.findFirst({
    where: isStaff ? { id: params.vehicleId, staffId: driver.id } : { id: params.vehicleId, driverId: driver.id },
  });
  if (!vehicle) return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });

  await prisma.driver_incidents.deleteMany({ where: { id: params.incidentId, vehicleId: params.vehicleId } });
  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest, { params }: { params: { vehicleId: string; incidentId: string } }) {
  const driver = await getDriverAppUser(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  const isStaff = (driver as any).userType === 'vendor_staff';
  const vehicle = await prisma.driver_vehicles.findFirst({
    where: isStaff ? { id: params.vehicleId, staffId: driver.id } : { id: params.vehicleId, driverId: driver.id },
  });
  if (!vehicle) return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });

  try {
    const body = await request.json();
    const { date, type, description, severity, repairCost, repairStatus, notes } = body;

    const incident = await prisma.driver_incidents.update({
      where: { id: params.incidentId },
      data: {
        ...(date && { date: new Date(date) }),
        ...(type && { type }),
        ...(description !== undefined && { description: description || null }),
        ...(severity && { severity }),
        ...(repairCost !== undefined && { repairCost: repairCost ? parseFloat(repairCost) : null }),
        ...(repairStatus && { repairStatus }),
        ...(notes !== undefined && { notes: notes || null }),
      },
    });
    return NextResponse.json({ success: true, incident });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
