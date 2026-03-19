// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// GET - Public trip data for shareable trip link (no auth required)
export async function GET(request: NextRequest, { params }: { params: { tripCode: string } }) {
  try {
    const { tripCode } = params;

    const trip = await prisma.b2b_trips.findUnique({
      where: { tripCode },
      select: {
        tripCode: true,
        status: true,
        vendorId: true,
        bookingId: true,
        vehicleName: true,
        vehicleNumber: true,
        driverName: true,
        driverPhone: true,
        pickupLocation: true,
        dropLocation: true,
        scheduledDate: true,
        scheduledTime: true,
        driverArrivedAt: true,
        otp: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        booking: {
          select: {
            bookingNumber: true,
            companyName: true,
            serviceType: true,
            tripType: true,
          }
        },
        vehicle: {
          select: {
            id: true, vehicleName: true, registrationNumber: true,
            seatingCapacity: true, fuelType: true, transmission: true,
            color: true, yearOfManufacture: true, images: true,
            brands: { select: { name: true } },
            vehicle_models: { select: { name: true, sideImage: true, brands: { select: { name: true } } } },
            chauffeur_vehicle_categories: { select: { name: true, image: true } },
          }
        },
        driver: {
          select: {
            id: true, name: true, phone: true, profilePhoto: true,
          }
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Don't expose OTP in public endpoint
    return NextResponse.json({
      status: 'success',
      trip: {
        ...trip,
        showOtp: trip.status === 'DRIVER_ARRIVED', // passenger sees OTP to share with driver
        otp: trip.status === 'DRIVER_ARRIVED' ? trip.otp : undefined, // only show OTP when driver has arrived
      },
    });
  } catch (error: any) {
    console.error('Trip public GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch trip data' }, { status: 500 });
  }
}

// PATCH - Reassign vehicle/driver on a trip (manager/vendor action)
export async function PATCH(request: NextRequest, { params }: { params: { tripCode: string } }) {
  try {
    const { tripCode } = params;
    const body = await request.json();
    const { vendorFleetId, driverStaffId, vehicleName, vehicleNumber, driverName, driverPhone } = body;

    const trip = await prisma.b2b_trips.findUnique({ where: { tripCode } });
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    if (['STARTED', 'COMPLETED'].includes(trip.status)) {
      return NextResponse.json({ error: 'Cannot reassign after trip has started' }, { status: 400 });
    }

    const updateData: any = {};
    if (vendorFleetId) updateData.vendorFleetId = vendorFleetId;
    if (driverStaffId) updateData.driverStaffId = driverStaffId;
    if (vehicleName) updateData.vehicleName = vehicleName;
    if (vehicleNumber) updateData.vehicleNumber = vehicleNumber;
    if (driverName) updateData.driverName = driverName;
    if (driverPhone) updateData.driverPhone = driverPhone;

    await prisma.b2b_trips.update({
      where: { tripCode },
      data: updateData,
    });

    return NextResponse.json({
      status: 'success',
      message: 'Trip reassigned successfully',
    });
  } catch (error: any) {
    console.error('Trip PATCH error:', error);
    return NextResponse.json({ error: 'Failed to reassign trip' }, { status: 500 });
  }
}
