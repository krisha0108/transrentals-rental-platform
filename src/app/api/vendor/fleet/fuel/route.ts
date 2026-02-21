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

    const [fleet, records] = await Promise.all([
      prisma.vendor_fleets.findMany({
        where: { vendorId: auth.vendorId, isActive: true },
        select: {
          id: true,
          vehicleName: true,
          registrationNumber: true,
          fuelType: true,
          vehicle_models: {
            select: { name: true, brands: { select: { name: true } } },
          },
          brands: { select: { name: true } },
          chauffeur_vehicle_categories: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.fleet_fuel_records.findMany({
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
        orderBy: { fuelDate: 'desc' },
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
        fuelType: v.fuelType,
      };
    });

    const fuelRecords = records.map((r) => {
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
        fuelDate: r.fuelDate,
        fuelType: r.fuelType,
        quantity: r.quantity,
        pricePerUnit: r.pricePerUnit,
        totalCost: r.totalCost,
        odometerReading: r.odometerReading,
        fuelStation: r.fuelStation,
        paymentMode: r.paymentMode,
        notes: r.notes,
        createdAt: r.createdAt,
      };
    });

    const totalSpent = records.reduce((sum, r) => sum + r.totalCost, 0);
    const totalLiters = records.reduce((sum, r) => sum + r.quantity, 0);
    const avgPerLiter = totalLiters > 0 ? totalSpent / totalLiters : 0;

    return NextResponse.json({
      success: true,
      vehicles,
      fuelRecords,
      summary: {
        totalSpent,
        totalLiters,
        avgPerLiter: Number(avgPerLiter.toFixed(2)),
        recordsCount: records.length,
      },
    });
  } catch (error) {
    console.error('Fleet fuel API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch fuel data' },
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

    const { vendorFleetId, fuelDate, fuelType, quantity, pricePerUnit, totalCost, odometerReading, fuelStation, paymentMode, notes } = body;

    if (!vendorFleetId || !fuelDate || !quantity || !pricePerUnit) {
      return NextResponse.json(
        { success: false, error: 'Vehicle, date, quantity, and price per unit are required' },
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

    const qty = parseFloat(quantity);
    const ppu = parseFloat(pricePerUnit);
    const total = totalCost ? parseFloat(totalCost) : qty * ppu;

    const record = await prisma.fleet_fuel_records.create({
      data: {
        id: generateId(),
        vendorId: auth.vendorId,
        vendorFleetId,
        fuelDate: new Date(fuelDate),
        fuelType: fuelType || null,
        quantity: qty,
        pricePerUnit: ppu,
        totalCost: total,
        odometerReading: odometerReading ? parseInt(odometerReading) : null,
        fuelStation: fuelStation || null,
        paymentMode: paymentMode || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error('Fleet fuel POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create fuel record' },
      { status: 500 }
    );
  }
}
