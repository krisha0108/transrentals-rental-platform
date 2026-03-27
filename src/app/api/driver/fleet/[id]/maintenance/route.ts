import { NextRequest, NextResponse } from 'next/server';
import { getDriver } from '@/lib/auth/driver-auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const driver = await getDriver(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  const { id } = await params;
  const isStaff = (driver as any).userType === 'vendor_staff';

  // Only personal vehicles — vendor fleet is read-only
  const vehicle = await prisma.driver_vehicles.findFirst({
    where: isStaff ? { id, staffId: driver.id } : { id, driverId: driver.id },
  });
  if (!vehicle) return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });

  try {
    const body = await request.json();
    const { type, description, cost, date, odometer, nextDueDate } = body;

    if (!type || !date) {
      return NextResponse.json({ success: false, error: 'Type and date are required' }, { status: 400 });
    }

    const log = await prisma.driver_maintenance_logs.create({
      data: {
        vehicleId: id,
        type,
        description: description || null,
        cost: cost ? parseFloat(cost) : 0,
        date: new Date(date),
        odometer: odometer ? parseInt(odometer) : null,
        nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
      },
    });

    // Update vehicle service dates if type is SERVICE
    if (type === 'SERVICE') {
      await prisma.driver_vehicles.update({
        where: { id },
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
