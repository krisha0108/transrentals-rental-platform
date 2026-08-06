import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

const VALID_VEHICLE_TYPES = [
  'SEDAN',
  'SUV',
  'MUV',
  'HATCHBACK',
  'TEMPO_TRAVELLER',
  'MINI_BUS',
  'BUS',
  'LUXURY_CAR',
  'BIKE',
  'SCOOTER',
  'CAMPER_VAN',
  'OTHER',
];

const VALID_FUEL_TYPES = ['PETROL', 'DIESEL', 'CNG', 'LPG', 'EV', 'HYBRID', 'OTHER'];

export async function GET(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const vehicleType = searchParams.get('vehicleType');
    const isActive = searchParams.get('isActive');

    const where: any = { travelAgentId: auth.travelAgentId };
    if (vehicleType && VALID_VEHICLE_TYPES.includes(vehicleType)) where.vehicleType = vehicleType;
    if (isActive === 'true') where.isActive = true;
    if (isActive === 'false') where.isActive = false;
    if (search) {
      where.OR = [
        { vehicleName: { contains: search } },
        { brand: { contains: search } },
        { registrationNumber: { contains: search } },
        { baseLocation: { contains: search } },
      ];
    }

    const fleets = await (prisma as any).travel_agent_fleets.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // `isAvailable` on the fleet row is a MANUAL flag — the agent toggles it by
    // hand. Booking a vehicle from the Fleet Calendar writes a row to
    // travel_agent_fleet_bookings and never touches that flag, so a vehicle
    // booked for today still listed itself as "Available". Derive the live
    // state here so both the app and the web page read the same truth.
    //
    // CONFIRMED + TENTATIVE are the two states that actually hold a vehicle;
    // COMPLETED and CANCELLED do not. (The calendar's own overlap check uses
    // `status <> 'CANCELLED'` because it also has to protect against
    // double-booking a slot that is already logged as completed.)
    //
    // The window is "has not ended yet" (endDate >= now), NOT "covers now".
    // Restricting it to bookings running right this minute left a vehicle
    // booked for next week still reading "Available", which is not what the
    // agent means when they say they just booked it. `isBookedNow` still
    // distinguishes the two cases for any caller that needs it.
    //
    // Raw SQL to match the rest of this module — the fleet-bookings routes all
    // use $queryRawUnsafe rather than the Prisma delegate.
    const now = new Date();
    const liveBookings: any[] = await (prisma as any).$queryRawUnsafe(
      `SELECT id, fleetId, startDate, endDate, bookingType, status, customerName
         FROM travel_agent_fleet_bookings
        WHERE travelAgentId = ?
          AND status IN ('CONFIRMED', 'TENTATIVE')
          AND endDate >= ?
        ORDER BY startDate ASC`,
      auth.travelAgentId,
      now,
    );

    // Ordered by startDate, so the first hit per vehicle is the one in progress
    // if there is one, otherwise the soonest upcoming booking.
    const bookingByFleet = new Map<string, any>();
    for (const b of liveBookings) {
      if (!bookingByFleet.has(b.fleetId)) bookingByFleet.set(b.fleetId, b);
    }

    const fleetsWithBooking = fleets.map((f: any) => {
      const currentBooking = bookingByFleet.get(f.id) ?? null;
      return {
        ...f,
        currentBooking,
        // Drives the Booked/Available control in the app + web fleet list.
        isBooked: !!currentBooking,
        // Narrower: a booking is actually running at this moment.
        isBookedNow: !!currentBooking && new Date(currentBooking.startDate) <= now,
      };
    });

    const stats = {
      total: fleets.length,
      active: fleets.filter((f: any) => f.isActive).length,
      // "Free" = manually available AND not held by a calendar booking.
      available: fleetsWithBooking.filter((f: any) => f.isAvailable && !f.isBooked).length,
    };

    return NextResponse.json({ fleets: fleetsWithBooking, stats });
  } catch (error: any) {
    logger.error('List travel agent fleet error', error);
    return NextResponse.json(
      { error: 'Failed to fetch fleet', details: error?.message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      vehicleType,
      vehicleName,
      brand,
      model,
      registrationNumber,
      yearOfManufacture,
      color,
      fuelType,
      transmission,
      seatingCapacity,
      luggageCapacity,
      chauffeurIncluded,
      chauffeurName,
      chauffeurPhone,
      chauffeurLanguages,
      amenities,
      baseLocation,
      ratePerDay,
      ratePerKm,
      minimumBookingHours,
      description,
      coverImage,
      galleryImages,
      rcImage,
      insuranceImage,
      fitnessImage,
      permitImage,
      insuranceProvider,
      insuranceValidity,
      fitnessValidity,
      permitType,
    } = body;

    if (!vehicleName || !String(vehicleName).trim()) {
      return NextResponse.json({ error: 'Vehicle name is required' }, { status: 400 });
    }
    if (vehicleType && !VALID_VEHICLE_TYPES.includes(vehicleType)) {
      return NextResponse.json({ error: 'Invalid vehicleType' }, { status: 400 });
    }
    if (fuelType && !VALID_FUEL_TYPES.includes(fuelType)) {
      return NextResponse.json({ error: 'Invalid fuelType' }, { status: 400 });
    }

    // Block duplicate registration numbers per agent (DB unique constraint will also enforce)
    if (registrationNumber) {
      const exists = await (prisma as any).travel_agent_fleets.findFirst({
        where: {
          travelAgentId: auth.travelAgentId,
          registrationNumber: String(registrationNumber).trim().toUpperCase(),
        },
      });
      if (exists) {
        return NextResponse.json(
          { error: 'A vehicle with this registration number already exists' },
          { status: 400 },
        );
      }
    }

    const fleet = await (prisma as any).travel_agent_fleets.create({
      data: {
        travelAgentId: auth.travelAgentId,
        vehicleType: vehicleType || 'SEDAN',
        vehicleName: String(vehicleName).trim(),
        brand: brand || null,
        model: model || null,
        registrationNumber: registrationNumber
          ? String(registrationNumber).trim().toUpperCase()
          : null,
        yearOfManufacture: yearOfManufacture ? Number(yearOfManufacture) : null,
        color: color || null,
        fuelType: fuelType || null,
        transmission: transmission || null,
        seatingCapacity: seatingCapacity ? Number(seatingCapacity) : null,
        luggageCapacity: luggageCapacity ? Number(luggageCapacity) : null,
        chauffeurIncluded: chauffeurIncluded === false ? false : true,
        chauffeurName: chauffeurName || null,
        chauffeurPhone: chauffeurPhone || null,
        chauffeurLanguages: chauffeurLanguages || null,
        amenities: amenities || null,
        baseLocation: baseLocation || null,
        ratePerDay: ratePerDay ? Number(ratePerDay) : null,
        ratePerKm: ratePerKm ? Number(ratePerKm) : null,
        minimumBookingHours: minimumBookingHours ? Number(minimumBookingHours) : null,
        description: description || null,
        coverImage: coverImage || null,
        galleryImages: galleryImages || null,
        rcImage: rcImage || null,
        insuranceImage: insuranceImage || null,
        fitnessImage: fitnessImage || null,
        permitImage: permitImage || null,
        insuranceProvider: insuranceProvider || null,
        insuranceValidity: insuranceValidity ? new Date(insuranceValidity) : null,
        fitnessValidity: fitnessValidity ? new Date(fitnessValidity) : null,
        permitType: permitType || null,
        isActive: true,
        isAvailable: true,
      },
    });

    return NextResponse.json({ fleet }, { status: 201 });
  } catch (error: any) {
    logger.error('Create travel agent fleet error', error);
    return NextResponse.json(
      { error: 'Failed to add vehicle', details: error?.message },
      { status: 500 },
    );
  }
}
