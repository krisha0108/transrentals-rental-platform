// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getDriverAppUser } from '@/lib/auth/driver-app-auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest, { params }: { params: { vehicleId: string; logId: string } }) {
  const driver = await getDriverAppUser(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  const isStaff = (driver as any).userType === 'vendor_staff';
  const vehicle = await prisma.driver_vehicles.findFirst({
    where: isStaff ? { id: params.vehicleId, staffId: driver.id } : { id: params.vehicleId, driverId: driver.id },
  });
  if (!vehicle) return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });

  await prisma.driver_fuel_logs.deleteMany({ where: { id: params.logId, vehicleId: params.vehicleId } });
  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest, { params }: { params: { vehicleId: string; logId: string } }) {
  const driver = await getDriverAppUser(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  const isStaff = (driver as any).userType === 'vendor_staff';
  const vehicle = await prisma.driver_vehicles.findFirst({
    where: isStaff ? { id: params.vehicleId, staffId: driver.id } : { id: params.vehicleId, driverId: driver.id },
  });
  if (!vehicle) return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });

  try {
    const body = await request.json();
    const { date, liters, pricePerLiter, totalCost, odometer, fuelType, station, notes } = body;

    const log = await prisma.driver_fuel_logs.update({
      where: { id: params.logId },
      data: {
        ...(date && { date: new Date(date) }),
        ...(liters !== undefined && { liters: liters ? parseFloat(liters) : null }),
        ...(pricePerLiter !== undefined && { pricePerLiter: pricePerLiter ? parseFloat(pricePerLiter) : null }),
        ...(totalCost !== undefined && { totalCost: totalCost ? parseFloat(totalCost) : null }),
        ...(odometer !== undefined && { odometer: odometer ? parseInt(odometer) : null }),
        ...(fuelType !== undefined && { fuelType: fuelType || null }),
        ...(station !== undefined && { station: station || null }),
        ...(notes !== undefined && { notes: notes || null }),
      },
    });

    if (odometer) {
      await prisma.driver_vehicles.update({
        where: { id: params.vehicleId },
        data: { currentOdometer: parseInt(odometer) },
      });
    }

    return NextResponse.json({ success: true, log });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
