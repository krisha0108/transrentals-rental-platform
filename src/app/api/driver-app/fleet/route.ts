import { NextRequest, NextResponse } from 'next/server';
import { getDriverAppUser } from '@/lib/auth/driver-app-auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const driver = await getDriverAppUser(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  const isStaff = (driver as any).userType === 'vendor_staff';
  const { searchParams } = new URL(request.url);
  const personalOnly = searchParams.get('personal') === 'true';

  if (isStaff) {
    // 1. Personal vehicles added by this staff member
    const personal = await prisma.driver_vehicles.findMany({
      where: { staffId: driver.id },
      orderBy: { createdAt: 'desc' },
    });

    // If personal=true, return only personal vehicles (used in assign-vehicle flow)
    if (personalOnly) {
      return NextResponse.json({ success: true, vehicles: personal });
    }

    // 2. Vendor's fleet vehicles
    const fleets = await prisma.vendor_fleets.findMany({
      where: { vendorId: (driver as any).vendorId, isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, vehicleName: true, registrationNumber: true,
        fuelType: true, seatingCapacity: true, color: true,
        yearOfManufacture: true, isActive: true, isAvailable: true,
        insuranceValidity: true, fitnessValidity: true,
        lastServiceDate: true, createdAt: true,
      },
    });

    // Map vendor_fleets to driver_vehicles shape
    const vendorVehicles = fleets.map(v => ({
      id: v.id,
      make: v.vehicleName || 'Vehicle',
      model: '',
      registrationNo: v.registrationNumber,
      fuelType: v.fuelType,
      seatingCapacity: v.seatingCapacity,
      color: v.color,
      year: v.yearOfManufacture,
      isActive: v.isActive && v.isAvailable,
      insuranceExpiry: v.insuranceValidity,
      fitnessExpiry: v.fitnessValidity,
      lastServiceDate: v.lastServiceDate,
      createdAt: v.createdAt,
      isVendorVehicle: true,
    }));

    // Combine: personal first, then vendor fleet
    const vehicles = [...personal, ...vendorVehicles];
    return NextResponse.json({ success: true, vehicles });
  }

  // Independent driver: only their own vehicles
  const vehicles = await prisma.driver_vehicles.findMany({
    where: { driverId: driver.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ success: true, vehicles });
}

export async function POST(request: NextRequest) {
  const driver = await getDriverAppUser(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  const isStaff = (driver as any).userType === 'vendor_staff';

  try {
    const body = await request.json();
    const {
      make, model, year, registrationNo, color, category,
      seatingCapacity, fuelType,
      insuranceNumber, insuranceExpiry, insuranceDocument,
      rcNumber, rcExpiry, rcDocument,
      fitnessExpiry, fitnessDocument,
      permitExpiry, permitDocument,
      lastServiceDate, nextServiceDate, currentOdometer,
    } = body;

    if (!make || !model) {
      return NextResponse.json({ success: false, error: 'Make and model are required' }, { status: 400 });
    }

    if (registrationNo) {
      const exists = await prisma.driver_vehicles.findFirst({
        where: { registrationNo: registrationNo.trim() },
      });
      if (exists) {
        return NextResponse.json({ success: false, error: 'Vehicle with this registration number already exists' }, { status: 409 });
      }
    }

    const vehicle = await prisma.driver_vehicles.create({
      data: {
        // vendor_staff uses staffId, independent driver uses driverId
        ...(isStaff ? { staffId: driver.id } : { driverId: driver.id }),
        make: make.trim(),
        model: model.trim(),
        year: year ? parseInt(year) : null,
        registrationNo: registrationNo?.trim() || null,
        color: color || null,
        category: category || null,
        seatingCapacity: seatingCapacity ? parseInt(seatingCapacity) : null,
        fuelType: fuelType || null,
        insuranceNumber: insuranceNumber || null,
        insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
        insuranceDocument: insuranceDocument || null,
        rcNumber: rcNumber || null,
        rcExpiry: rcExpiry ? new Date(rcExpiry) : null,
        rcDocument: rcDocument || null,
        fitnessExpiry: fitnessExpiry ? new Date(fitnessExpiry) : null,
        fitnessDocument: fitnessDocument || null,
        permitExpiry: permitExpiry ? new Date(permitExpiry) : null,
        permitDocument: permitDocument || null,
        lastServiceDate: lastServiceDate ? new Date(lastServiceDate) : null,
        nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : null,
        currentOdometer: currentOdometer ? parseInt(currentOdometer) : null,
      },
    });

    return NextResponse.json({ success: true, vehicle });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
