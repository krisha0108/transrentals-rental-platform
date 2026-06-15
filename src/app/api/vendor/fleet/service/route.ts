import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import crypto from 'crypto';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';

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

    const [fleet, records] = await Promise.all([
      prisma.vendor_fleets.findMany({
        where: { vendorId: auth.vendorId, isActive: true },
        select: {
          id: true,
          vehicleName: true,
          registrationNumber: true,
          lastServiceDate: true,
          fitnessValidity: true,
          vehicle_models: {
            select: { name: true, brands: { select: { name: true } } },
          },
          brands: { select: { name: true } },
          chauffeur_vehicle_categories: { select: { name: true } },
          services: { select: { name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.fleet_maintenance_records.findMany({
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
        orderBy: { serviceDate: 'desc' },
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
      return {
        id: v.id,
        vehicleName,
        registrationNumber: v.registrationNumber,
        service: v.services?.name,
        lastServiceDate: v.lastServiceDate,
        fitnessValidity: v.fitnessValidity,
      };
    });

    const maintenanceRecords = records.map((r) => {
      const vf = r.vendor_fleets;
      const vehicleName =
        vf.vehicleName ||
        (vf.vehicle_models
          ? `${vf.vehicle_models.brands?.name || ''} ${vf.vehicle_models.name}`.trim()
          : vf.brands
            ? `${vf.brands.name} ${vf.chauffeur_vehicle_categories?.name || ''}`.trim()
            : 'Unknown Vehicle');
      return {
        id: r.id,
        vehicleId: r.vendorFleetId,
        vehicleName,
        registrationNumber: vf.registrationNumber,
        serviceType: r.serviceType,
        description: r.description,
        serviceDate: r.serviceDate,
        odometerReading: r.odometerReading,
        cost: r.cost,
        serviceProvider: r.serviceProvider,
        notes: r.notes,
        createdAt: r.createdAt,
      };
    });

    const totalSpent = records.reduce((sum, r) => sum + r.cost, 0);

    return NextResponse.json({
      success: true,
      vehicles,
      maintenanceRecords,
      summary: {
        totalVehicles: vehicles.length,
        totalRecords: records.length,
        totalSpent,
      },
    });
  } catch (error) {
    console.error('Fleet service API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch service data' },
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

    // Block rejected/suspended/blocked vendors from write operations
    const _guard = await vendorStatusGuard(auth.vendorId!);
    if (_guard.blocked) return _guard.response;

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { vendorFleetId, serviceType, description, serviceDate, odometerReading, cost, serviceProvider, notes } = body;

    if (!vendorFleetId || !serviceType || !serviceDate || cost === undefined) {
      return NextResponse.json(
        { success: false, error: 'Vehicle, service type, date, and cost are required' },
        { status: 400 }
      );
    }

    // Verify vehicle belongs to vendor
    const vehicle = await prisma.vendor_fleets.findFirst({
      where: { id: vendorFleetId, vendorId: auth.vendorId },
    });
    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    const record = await prisma.fleet_maintenance_records.create({
      data: {
        id: generateId(),
        vendorId: auth.vendorId,
        vendorFleetId,
        serviceType,
        description: description || null,
        serviceDate: new Date(serviceDate),
        odometerReading: odometerReading ? parseInt(odometerReading) : null,
        cost: parseFloat(cost),
        serviceProvider: serviceProvider || null,
        notes: notes || null,
      },
    });

    // Update lastServiceDate on the vehicle
    await prisma.vendor_fleets.update({
      where: { id: vendorFleetId },
      data: { lastServiceDate: new Date(serviceDate) },
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error('Fleet service POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create service record' },
      { status: 500 }
    );
  }
}
