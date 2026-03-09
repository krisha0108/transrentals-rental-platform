import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Not authenticated' },
        { status: 401 }
      );
    }

    const fleet = await prisma.vendor_fleets.findMany({
      where: { vendorId: auth.vendorId },
      select: {
        id: true,
        vehicleName: true,
        registrationNumber: true,
        isActive: true,
        isAvailable: true,
        isVerified: true,
        totalTrips: true,
        avgRating: true,
        totalRatings: true,
        insuranceValidity: true,
        fitnessValidity: true,
        lastServiceDate: true,
        fuelType: true,
        createdAt: true,
        vehicle_models: {
          select: { name: true, brands: { select: { name: true } } },
        },
        brands: { select: { name: true } },
        chauffeur_vehicle_categories: { select: { name: true } },
        services: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
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
        isActive: v.isActive,
        isAvailable: v.isAvailable,
        isVerified: v.isVerified,
        totalTrips: v.totalTrips || 0,
        avgRating: v.avgRating || 0,
        totalRatings: v.totalRatings || 0,
        fuelType: v.fuelType,
        insuranceExpired: v.insuranceValidity ? new Date(v.insuranceValidity) < now : true,
        fitnessExpired: v.fitnessValidity ? new Date(v.fitnessValidity) < now : true,
        createdAt: v.createdAt,
      };
    });

    const summary = {
      totalVehicles: fleet.length,
      activeVehicles: fleet.filter((v) => v.isActive).length,
      availableVehicles: fleet.filter((v) => v.isAvailable && v.isActive).length,
      verifiedVehicles: fleet.filter((v) => v.isVerified).length,
      totalTrips: fleet.reduce((sum, v) => sum + (v.totalTrips || 0), 0),
      avgRating: fleet.length > 0
        ? Number((fleet.reduce((sum, v) => sum + (v.avgRating || 0), 0) / fleet.length).toFixed(1))
        : 0,
      expiredInsurance: fleet.filter(
        (v) => v.insuranceValidity && new Date(v.insuranceValidity) < now
      ).length,
      expiredFitness: fleet.filter(
        (v) => v.fitnessValidity && new Date(v.fitnessValidity) < now
      ).length,
    };

    // Service breakdown
    const serviceBreakdown: Record<string, number> = {};
    fleet.forEach((v) => {
      const name = v.services?.name || 'Other';
      serviceBreakdown[name] = (serviceBreakdown[name] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      vehicles,
      summary,
      serviceBreakdown,
    });
  } catch (error) {
    console.error('Fleet analytics API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
