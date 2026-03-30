import { NextRequest, NextResponse } from 'next/server';
import { getDriverAppUser } from '@/lib/auth/driver-app-auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { vehicleId: string } }) {
  const driver = await getDriverAppUser(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  const isStaff = (driver as any).userType === 'vendor_staff';

  if (isStaff) {
    // Try personal vehicle first
    const personal = await prisma.driver_vehicles.findFirst({
      where: { id: params.vehicleId, staffId: driver.id },
      include: {
        maintenance_logs: { orderBy: { date: 'desc' } },
        fuel_logs: { orderBy: { date: 'desc' }, take: 20 },
        incidents: { orderBy: { date: 'desc' } },
      },
    });
    if (personal) return NextResponse.json({ success: true, vehicle: personal });

    // Fall back to vendor fleet vehicle
    const v = await prisma.vendor_fleets.findFirst({
      where: { id: params.vehicleId, vendorId: (driver as any).vendorId },
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
        createdAt: v.createdAt, isVendorVehicle: true, maintenance_logs: [], fuel_logs: [], incidents: [],
      },
    });
  }

  const vehicle = await prisma.driver_vehicles.findFirst({
    where: { id: params.vehicleId, driverId: driver.id },
    include: { maintenance_logs: { orderBy: { date: 'desc' } } },
  });

  if (!vehicle) return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });
  return NextResponse.json({ success: true, vehicle });
}

export async function PATCH(request: NextRequest, { params }: { params: { vehicleId: string } }) {
  const driver = await getDriverAppUser(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  const isStaff = (driver as any).userType === 'vendor_staff';

  // For staff: only allow editing their own personal vehicles (not vendor fleet)
  const whereClause = isStaff ? { id: params.vehicleId, staffId: driver.id } : { id: params.vehicleId, driverId: driver.id };

  try {
    const vehicle = await prisma.driver_vehicles.findFirst({ where: whereClause });
    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: isStaff ? 'Vehicle not found or vendor fleet vehicles cannot be edited here' : 'Vehicle not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      make, model, year, color, category, seatingCapacity, fuelType, isActive,
      insuranceNumber, insuranceExpiry, insuranceDocument,
      rcNumber, rcExpiry, rcDocument,
      fitnessExpiry, fitnessDocument,
      permitExpiry, permitDocument,
      lastServiceDate, nextServiceDate, currentOdometer,
    } = body;

    const updated = await prisma.driver_vehicles.update({
      where: { id: params.vehicleId },
      data: {
        ...(make && { make }),
        ...(model && { model }),
        ...(year !== undefined && { year: year ? parseInt(year) : null }),
        ...(color !== undefined && { color }),
        ...(category !== undefined && { category }),
        ...(seatingCapacity !== undefined && { seatingCapacity: seatingCapacity ? parseInt(seatingCapacity) : null }),
        ...(fuelType !== undefined && { fuelType }),
        ...(isActive !== undefined && { isActive }),
        ...(insuranceNumber !== undefined && { insuranceNumber }),
        ...(insuranceExpiry !== undefined && { insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null }),
        ...(insuranceDocument !== undefined && { insuranceDocument }),
        ...(rcNumber !== undefined && { rcNumber }),
        ...(rcExpiry !== undefined && { rcExpiry: rcExpiry ? new Date(rcExpiry) : null }),
        ...(rcDocument !== undefined && { rcDocument }),
        ...(fitnessExpiry !== undefined && { fitnessExpiry: fitnessExpiry ? new Date(fitnessExpiry) : null }),
        ...(fitnessDocument !== undefined && { fitnessDocument }),
        ...(permitExpiry !== undefined && { permitExpiry: permitExpiry ? new Date(permitExpiry) : null }),
        ...(permitDocument !== undefined && { permitDocument }),
        ...(lastServiceDate !== undefined && { lastServiceDate: lastServiceDate ? new Date(lastServiceDate) : null }),
        ...(nextServiceDate !== undefined && { nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : null }),
        ...(currentOdometer !== undefined && { currentOdometer: currentOdometer ? parseInt(currentOdometer) : null }),
      },
    });

    return NextResponse.json({ success: true, vehicle: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { vehicleId: string } }) {
  const driver = await getDriverAppUser(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  const isStaff = (driver as any).userType === 'vendor_staff';
  const whereClause = isStaff ? { id: params.vehicleId, staffId: driver.id } : { id: params.vehicleId, driverId: driver.id };

  const vehicle = await prisma.driver_vehicles.findFirst({ where: whereClause });
  if (!vehicle) {
    return NextResponse.json(
      { success: false, error: isStaff ? 'Vehicle not found or vendor fleet vehicles cannot be deleted here' : 'Vehicle not found' },
      { status: 404 }
    );
  }

  await prisma.driver_vehicles.delete({ where: { id: params.vehicleId } });
  return NextResponse.json({ success: true });
}
