import { NextRequest, NextResponse } from 'next/server';
import { getDriverAppUser } from '@/lib/auth/driver-app-auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const driver = await getDriverAppUser(request);
  if (!driver) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();
    // vehicleId = from fleet, OR manual vehicleNumber + vehicleModel
    const { vehicleId, vehicleNumber, vehicleModel } = body;

    if (!vehicleNumber && !vehicleId) {
      return NextResponse.json(
        { success: false, error: 'Vehicle number or fleet vehicle required' },
        { status: 400 }
      );
    }

    const isStaff = (driver as any).userType === 'vendor_staff';

    const booking = await prisma.chauffeur_bookings.findUnique({
      where: { id: params.id },
      select: { id: true, acceptedDriverId: true, acceptedVendorId: true, status: true },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    // Auth: independent driver checks acceptedDriverId, vendor_staff checks acceptedVendorId
    const isAuthorized = isStaff
      ? booking.acceptedVendorId === (driver as any).vendorId
      : booking.acceptedDriverId === driver.id;

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
    }

    if (!['ACCEPTED', 'DRIVER_ASSIGNED'].includes(booking.status)) {
      return NextResponse.json({ success: false, error: 'Booking not in correct state' }, { status: 409 });
    }

    let finalVehicleNumber = vehicleNumber;
    let finalVehicleModel = vehicleModel;

    // If vehicleId provided, get from driver's personal fleet only
    if (vehicleId) {
      const where = isStaff
        ? { id: vehicleId, staffId: driver.id }
        : { id: vehicleId, driverId: driver.id };

      const vehicle = await prisma.driver_vehicles.findFirst({ where });
      if (!vehicle) {
        return NextResponse.json({ success: false, error: 'Vehicle not found in your fleet' }, { status: 404 });
      }
      finalVehicleNumber = vehicle.registrationNo || vehicleNumber;
      finalVehicleModel = `${vehicle.make} ${vehicle.model}`.trim();
    }

    // Generate trip OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const updated = await prisma.chauffeur_bookings.update({
      where: { id: params.id },
      data: {
        vehicleNumber: finalVehicleNumber,
        vehicleModel: finalVehicleModel,
        status: 'DRIVER_ASSIGNED',
        driverAssignedAt: new Date(),
        tripStartOtp: otp,
      },
    });

    // TODO: Send OTP notification to customer here

    return NextResponse.json({ success: true, booking: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
