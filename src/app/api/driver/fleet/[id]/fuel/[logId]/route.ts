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

  await prisma.driver_fuel_logs.deleteMany({ where: { id: logId, vehicleId: id } });
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
  const { date, liters, pricePerLiter, totalAmount, odometer, fuelStation, fuelType, notes } = body;

  await prisma.driver_fuel_logs.updateMany({
    where: { id: logId, vehicleId: id },
    data: {
      ...(date && { date: new Date(date) }),
      ...(liters !== undefined && { liters: liters ? parseFloat(String(liters)) : null }),
      pricePerLiter: pricePerLiter ? parseFloat(String(pricePerLiter)) : null,
      ...(totalAmount !== undefined && { totalAmount: totalAmount ? parseFloat(String(totalAmount)) : null }),
      odometer: odometer ? parseInt(String(odometer)) : null,
      fuelStation: fuelStation || null,
      fuelType: fuelType || null,
      notes: notes || null,
    },
  });
  return NextResponse.json({ success: true });
}
