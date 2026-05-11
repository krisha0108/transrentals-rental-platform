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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const fleet = await (prisma as any).travel_agent_fleets.findUnique({
      where: { id: params.id },
    });
    if (!fleet || fleet.travelAgentId !== auth.travelAgentId) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    return NextResponse.json(fleet);
  } catch (error: any) {
    logger.error('Get fleet error', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicle', details: error?.message },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const existing = await (prisma as any).travel_agent_fleets.findUnique({
      where: { id: params.id },
    });
    if (!existing || existing.travelAgentId !== auth.travelAgentId) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    const body = await request.json();
    const updateData: any = {};

    const stringFields = [
      'vehicleName',
      'brand',
      'model',
      'color',
      'transmission',
      'chauffeurName',
      'chauffeurPhone',
      'chauffeurLanguages',
      'amenities',
      'baseLocation',
      'description',
      'coverImage',
      'galleryImages',
      'rcImage',
      'insuranceImage',
      'fitnessImage',
      'permitImage',
      'insuranceProvider',
      'permitType',
    ];
    for (const f of stringFields) {
      if (body[f] !== undefined) updateData[f] = body[f] || null;
    }

    const numericFields = [
      'yearOfManufacture',
      'seatingCapacity',
      'luggageCapacity',
      'ratePerDay',
      'ratePerKm',
      'minimumBookingHours',
    ];
    for (const f of numericFields) {
      if (body[f] !== undefined) updateData[f] = body[f] ? Number(body[f]) : null;
    }

    if (body.vehicleType !== undefined) {
      if (!VALID_VEHICLE_TYPES.includes(body.vehicleType)) {
        return NextResponse.json({ error: 'Invalid vehicleType' }, { status: 400 });
      }
      updateData.vehicleType = body.vehicleType;
    }
    if (body.fuelType !== undefined) {
      if (body.fuelType && !VALID_FUEL_TYPES.includes(body.fuelType)) {
        return NextResponse.json({ error: 'Invalid fuelType' }, { status: 400 });
      }
      updateData.fuelType = body.fuelType || null;
    }

    if (body.registrationNumber !== undefined) {
      const reg = body.registrationNumber
        ? String(body.registrationNumber).trim().toUpperCase()
        : null;
      // Block duplicates within the same agent
      if (reg && reg !== existing.registrationNumber) {
        const dup = await (prisma as any).travel_agent_fleets.findFirst({
          where: {
            travelAgentId: auth.travelAgentId,
            registrationNumber: reg,
            NOT: { id: params.id },
          },
        });
        if (dup) {
          return NextResponse.json(
            { error: 'A vehicle with this registration number already exists' },
            { status: 400 },
          );
        }
      }
      updateData.registrationNumber = reg;
    }

    if (body.isActive !== undefined) updateData.isActive = !!body.isActive;
    if (body.isAvailable !== undefined) updateData.isAvailable = !!body.isAvailable;
    if (body.chauffeurIncluded !== undefined)
      updateData.chauffeurIncluded = !!body.chauffeurIncluded;

    if (body.insuranceValidity !== undefined)
      updateData.insuranceValidity = body.insuranceValidity ? new Date(body.insuranceValidity) : null;
    if (body.fitnessValidity !== undefined)
      updateData.fitnessValidity = body.fitnessValidity ? new Date(body.fitnessValidity) : null;

    const updated = await (prisma as any).travel_agent_fleets.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ fleet: updated });
  } catch (error: any) {
    logger.error('Update fleet error', error);
    return NextResponse.json(
      { error: 'Failed to update vehicle', details: error?.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const existing = await (prisma as any).travel_agent_fleets.findUnique({
      where: { id: params.id },
    });
    if (!existing || existing.travelAgentId !== auth.travelAgentId) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    await (prisma as any).travel_agent_fleets.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Delete fleet error', error);
    return NextResponse.json(
      { error: 'Failed to delete vehicle', details: error?.message },
      { status: 500 },
    );
  }
}
