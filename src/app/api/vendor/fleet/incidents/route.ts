import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import crypto from 'crypto';

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Not authenticated' },
        { status: 401 }
      );
    }

    const [fleet, incidents] = await Promise.all([
      prisma.vendor_fleets.findMany({
        where: { vendorId: auth.vendorId, isActive: true },
        select: {
          id: true,
          vehicleName: true,
          registrationNumber: true,
          vehicle_models: {
            select: { name: true, brands: { select: { name: true } } },
          },
          brands: { select: { name: true } },
          chauffeur_vehicle_categories: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.fleet_incidents.findMany({
        where: { vendorId: auth.vendorId },
        include: {
          vendor_fleets: {
            select: {
              vehicleName: true,
              registrationNumber: true,
              vehicle_models: { select: { name: true, brands: { select: { name: true } } } },
              brands: { select: { name: true } },
              chauffeur_vehicle_categories: { select: { name: true } },
            },
          },
        },
        orderBy: { incidentDate: 'desc' },
      }),
    ]);

    const vehicles = fleet.map((v) => {
      const vehicleName =
        v.vehicleName ||
        (v.vehicle_models
          ? `${v.vehicle_models.brands?.name || ''} ${v.vehicle_models.name}`.trim()
          : v.brands
            ? `${v.brands.name} ${v.chauffeur_vehicle_categories?.name || ''}`.trim()
            : 'Unknown Vehicle');
      return { id: v.id, vehicleName, registrationNumber: v.registrationNumber };
    });

    const incidentsList = incidents.map((i) => {
      const vf = i.vendor_fleets;
      const vehicleName =
        vf.vehicleName ||
        (vf.vehicle_models
          ? `${vf.vehicle_models.brands?.name || ''} ${vf.vehicle_models.name}`.trim()
          : vf.brands
            ? `${vf.brands.name} ${vf.chauffeur_vehicle_categories?.name || ''}`.trim()
            : 'Unknown Vehicle');
      return {
        id: i.id,
        vehicleId: i.vendorFleetId,
        vehicleName,
        registrationNumber: vf.registrationNumber,
        incidentDate: i.incidentDate,
        incidentType: i.incidentType,
        severity: i.severity,
        location: i.location,
        description: i.description,
        estimatedCost: i.estimatedCost,
        insuranceClaimed: i.insuranceClaimed,
        status: i.status,
        resolution: i.resolution,
        resolvedAt: i.resolvedAt,
        notes: i.notes,
        createdAt: i.createdAt,
      };
    });

    const openCount = incidents.filter((i) => i.status === 'OPEN').length;
    const resolvedCount = incidents.filter((i) => i.status === 'RESOLVED').length;
    const totalCost = incidents.reduce((sum, i) => sum + (i.estimatedCost || 0), 0);

    return NextResponse.json({
      success: true,
      vehicles,
      incidents: incidentsList,
      summary: { total: incidents.length, open: openCount, resolved: resolvedCount, totalCost },
    });
  } catch (error) {
    console.error('Fleet incidents API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch incidents data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Not authenticated' },
        { status: 401 }
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { vendorFleetId, incidentDate, incidentType, severity, location, description, estimatedCost, notes } = body;

    if (!vendorFleetId || !incidentDate || !incidentType || !description) {
      return NextResponse.json(
        { success: false, error: 'Vehicle, date, type, and description are required' },
        { status: 400 }
      );
    }

    const vehicle = await prisma.vendor_fleets.findFirst({
      where: { id: vendorFleetId, vendorId: auth.vendorId },
    });
    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    const incident = await prisma.fleet_incidents.create({
      data: {
        id: generateId(),
        vendorId: auth.vendorId,
        vendorFleetId,
        incidentDate: new Date(incidentDate),
        incidentType,
        severity: severity || 'MINOR',
        location: location || null,
        description,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
        notes: notes || null,
        status: 'OPEN',
      },
    });

    return NextResponse.json({ success: true, incident });
  } catch (error) {
    console.error('Fleet incidents POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create incident' },
      { status: 500 }
    );
  }
}
