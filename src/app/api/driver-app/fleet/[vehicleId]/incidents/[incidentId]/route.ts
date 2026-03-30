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
