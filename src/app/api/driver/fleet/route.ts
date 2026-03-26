import { NextRequest, NextResponse } from 'next/server';
import { getDriver } from '@/lib/auth/driver-auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const driver = await getDriver(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  const isStaff = (driver as any).userType === 'vendor_staff';

  if (isStaff) {
    const personal = await prisma.driver_vehicles.findMany({
      where: { staffId: driver.id },
      orderBy: { createdAt: 'desc' },
    });

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

    return NextResponse.json({ success: true, vehicles: [...personal, ...vendorVehicles] });
  }

  // Independent driver
  const vehicles = await prisma.driver_vehicles.findMany({
    where: { driverId: driver.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ success: true, vehicles });
}

export async function POST(request: NextRequest) {
  const driver = await getDriver(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  const isStaff = (driver as any).userType === 'vendor_staff';

  try {
    const body = await request.json();
    const {
      make, model, year, registrationNo, color, category,
      seatingCapacity, fuelType,
      insuranceExpiry, rcExpiry, fitnessExpiry, permitExpiry,
      lastServiceDate, nextServiceDate,
    } = body;

    if (!make || !model) {
      return NextResponse.json({ success: false, error: 'Make and model are required' }, { status: 400 });
    }

    if (registrationNo) {
      const exists = await prisma.driver_vehicles.findFirst({
        where: { registrationNo: registrationNo.trim() },
      });
      if (exists) {
        return NextResponse.json({ success: false, error: 'Vehicle with this registration already exists' }, { status: 409 });
      }
    }

    const vehicle = await prisma.driver_vehicles.create({
      data: {
        ...(isStaff ? { staffId: driver.id } : { driverId: driver.id }),
        make: make.trim(),
        model: model.trim(),
        year: year ? parseInt(year) : null,
        registrationNo: registrationNo?.trim() || null,
        color: color || null,
        category: category || null,
        seatingCapacity: seatingCapacity ? parseInt(seatingCapacity) : null,
        fuelType: fuelType || null,
        insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
        rcExpiry: rcExpiry ? new Date(rcExpiry) : null,
        fitnessExpiry: fitnessExpiry ? new Date(fitnessExpiry) : null,
        permitExpiry: permitExpiry ? new Date(permitExpiry) : null,
        lastServiceDate: lastServiceDate ? new Date(lastServiceDate) : null,
        nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : null,
      },
    });

    return NextResponse.json({ success: true, vehicle });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
