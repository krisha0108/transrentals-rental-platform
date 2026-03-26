import { NextRequest, NextResponse } from 'next/server';
import { getDriver } from '@/lib/auth/driver-auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const driver = await getDriver(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  const { id } = await params;
  const isStaff = (driver as any).userType === 'vendor_staff';

  if (isStaff) {
    // Try personal vehicle first
    const personal = await prisma.driver_vehicles.findFirst({
      where: { id, staffId: driver.id },
      include: { maintenance_logs: { orderBy: { date: 'desc' } } },
    });
    if (personal) return NextResponse.json({ success: true, vehicle: personal });

    // Fall back to vendor fleet
    const v = await prisma.vendor_fleets.findFirst({
      where: { id, vendorId: (driver as any).vendorId },
      select: {
        id: true, vehicleName: true, registrationNumber: true,
        fuelType: true, seatingCapacity: true, color: true,
        yearOfManufacture: true, isActive: true, isAvailable: true,
        insuranceValidity: true, fitnessValidity: true,
        lastServiceDate: true, createdAt: true,
      },
    });
    if (!v) return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });
    return NextResponse.json({
      success: true,
      vehicle: {
        id: v.id, make: v.vehicleName || 'Vehicle', model: '',
        registrationNo: v.registrationNumber, fuelType: v.fuelType,
        seatingCapacity: v.seatingCapacity, color: v.color, year: v.yearOfManufacture,
        isActive: v.isActive && v.isAvailable, insuranceExpiry: v.insuranceValidity,
        fitnessExpiry: v.fitnessValidity, lastServiceDate: v.lastServiceDate,
        isVendorVehicle: true, maintenance_logs: [],
      },
    });
  }

  const vehicle = await prisma.driver_vehicles.findFirst({
    where: { id, driverId: driver.id },
    include: { maintenance_logs: { orderBy: { date: 'desc' } } },
  });
  if (!vehicle) return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });
  return NextResponse.json({ success: true, vehicle });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const driver = await getDriver(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  const { id } = await params;
  const isStaff = (driver as any).userType === 'vendor_staff';

  const vehicle = await prisma.driver_vehicles.findFirst({
    where: isStaff ? { id, staffId: driver.id } : { id, driverId: driver.id },
  });
  if (!vehicle) return NextResponse.json({ success: false, error: 'Vehicle not found or cannot be edited' }, { status: 404 });

  const body = await request.json();
  const {
    make, model, year, color, category, seatingCapacity, fuelType, isActive,
    registrationNo, insuranceNumber, insuranceExpiry,
    rcNumber, rcExpiry, fitnessExpiry, permitExpiry,
    lastServiceDate, nextServiceDate, currentOdometer,
  } = body;

  const updated = await prisma.driver_vehicles.update({
    where: { id },
    data: {
      ...(isActive !== undefined && { isActive }),
      ...(make && { make }),
      ...(model && { model }),
      ...(year !== undefined && { year: year ? parseInt(year) : null }),
      ...(color !== undefined && { color }),
      ...(category !== undefined && { category }),
      ...(seatingCapacity !== undefined && { seatingCapacity: seatingCapacity ? parseInt(seatingCapacity) : null }),
      ...(fuelType !== undefined && { fuelType }),
      ...(registrationNo !== undefined && { registrationNo }),
      ...(insuranceNumber !== undefined && { insuranceNumber }),
      ...(insuranceExpiry !== undefined && { insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null }),
      ...(rcNumber !== undefined && { rcNumber }),
      ...(rcExpiry !== undefined && { rcExpiry: rcExpiry ? new Date(rcExpiry) : null }),
      ...(fitnessExpiry !== undefined && { fitnessExpiry: fitnessExpiry ? new Date(fitnessExpiry) : null }),
      ...(permitExpiry !== undefined && { permitExpiry: permitExpiry ? new Date(permitExpiry) : null }),
      ...(lastServiceDate !== undefined && { lastServiceDate: lastServiceDate ? new Date(lastServiceDate) : null }),
      ...(nextServiceDate !== undefined && { nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : null }),
      ...(currentOdometer !== undefined && { currentOdometer: currentOdometer ? parseInt(currentOdometer) : null }),
    },
  });
  return NextResponse.json({ success: true, vehicle: updated });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const driver = await getDriver(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  const { id } = await params;
  const isStaff = (driver as any).userType === 'vendor_staff';

  const vehicle = await prisma.driver_vehicles.findFirst({
    where: isStaff ? { id, staffId: driver.id } : { id, driverId: driver.id },
  });
  if (!vehicle) return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });

  await prisma.driver_vehicles.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
