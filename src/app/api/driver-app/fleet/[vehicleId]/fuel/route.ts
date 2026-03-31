// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getDriverAppUser } from '@/lib/auth/driver-app-auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { vehicleId: string } }) {
  const driver = await getDriverAppUser(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  const isStaff = (driver as any).userType === 'vendor_staff';
  const where = isStaff
    ? { id: params.vehicleId, staffId: driver.id }
    : { id: params.vehicleId, driverId: driver.id };

  const vehicle = await prisma.driver_vehicles.findFirst({ where });
  if (!vehicle) return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });

  const logs = await prisma.driver_fuel_logs.findMany({
    where: { vehicleId: params.vehicleId },
    orderBy: { date: 'desc' },
  });
  return NextResponse.json({ success: true, logs });
}

export async function POST(request: NextRequest, { params }: { params: { vehicleId: string } }) {
  const driver = await getDriverAppUser(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  const isStaff = (driver as any).userType === 'vendor_staff';
  const where = isStaff
    ? { id: params.vehicleId, staffId: driver.id }
    : { id: params.vehicleId, driverId: driver.id };

  const vehicle = await prisma.driver_vehicles.findFirst({ where });
  if (!vehicle) return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });

  const { date, liters, pricePerLiter, totalAmount, odometer, fuelStation, fuelType, notes } = await request.json();

  if (!date || !liters || !totalAmount) {
    return NextResponse.json({ success: false, error: 'date, liters and totalAmount are required' }, { status: 400 });
  }

  const log = await prisma.driver_fuel_logs.create({
    data: {
      vehicleId: params.vehicleId,
      date: new Date(date),
      liters: parseFloat(liters),
      pricePerLiter: pricePerLiter ? parseFloat(pricePerLiter) : null,
      totalAmount: parseFloat(totalAmount),
      odometer: odometer ? parseInt(odometer) : null,
      fuelStation: fuelStation || null,
      fuelType: fuelType || null,
      notes: notes || null,
    },
  });

  // Update vehicle odometer if provided and higher
  if (odometer && parseInt(odometer) > (vehicle.currentOdometer || 0)) {
    await prisma.driver_vehicles.update({
      where: { id: params.vehicleId },
      data: { currentOdometer: parseInt(odometer) },
    });
  }

  return NextResponse.json({ success: true, log });
}
