import { NextRequest, NextResponse } from 'next/server';
import { getDriverAppUser } from '@/lib/auth/driver-app-auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { vehicleId: string } }) {
  const driver = await getDriverAppUser(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  const vehicle = await prisma.driver_vehicles.findFirst({
    where: { id: params.vehicleId, driverId: driver.id },
  });
  if (!vehicle) return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });

  const logs = await prisma.driver_maintenance_logs.findMany({
    where: { vehicleId: params.vehicleId },
    orderBy: { date: 'desc' },
  });

  return NextResponse.json({ success: true, logs });
}

export async function POST(request: NextRequest, { params }: { params: { vehicleId: string } }) {
  const driver = await getDriverAppUser(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  const vehicle = await prisma.driver_vehicles.findFirst({
    where: { id: params.vehicleId, driverId: driver.id },
  });
  if (!vehicle) return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });

  try {
    const body = await request.json();
    const { type, description, cost, date, odometer, nextDueDate, document } = body;

    if (!type || !date) {
      return NextResponse.json({ success: false, error: 'Type and date are required' }, { status: 400 });
    }

    const log = await prisma.driver_maintenance_logs.create({
      data: {
        vehicleId: params.vehicleId,
        type,
        description: description || null,
        cost: cost ? parseFloat(cost) : 0,
        date: new Date(date),
        odometer: odometer ? parseInt(odometer) : null,
        nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
        document: document || null,
      },
    });

    // Update vehicle last service date if type is service
    if (type === 'SERVICE') {
      await prisma.driver_vehicles.update({
        where: { id: params.vehicleId },
        data: {
          lastServiceDate: new Date(date),
          ...(nextDueDate && { nextServiceDate: new Date(nextDueDate) }),
          ...(odometer && { currentOdometer: parseInt(odometer) }),
        },
      });
    }

    return NextResponse.json({ success: true, log });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
