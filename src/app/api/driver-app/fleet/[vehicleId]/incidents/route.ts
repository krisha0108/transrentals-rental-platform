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

  const incidents = await prisma.driver_incidents.findMany({
    where: { vehicleId: params.vehicleId },
    orderBy: { date: 'desc' },
  });
  return NextResponse.json({ success: true, incidents });
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

  const { date, type, description, severity, repairCost, repairStatus, notes } = await request.json();

  if (!date || !type) {
    return NextResponse.json({ success: false, error: 'date and type are required' }, { status: 400 });
  }

  const incident = await prisma.driver_incidents.create({
    data: {
      vehicleId: params.vehicleId,
      date: new Date(date),
      type,
      description: description || null,
      severity: severity || 'MEDIUM',
      repairCost: repairCost ? parseFloat(repairCost) : null,
      repairStatus: repairStatus || 'PENDING',
      notes: notes || null,
    },
  });

  return NextResponse.json({ success: true, incident });
}
