import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

interface PricingRequest {
  fromLocationId?: string;
  toLocationId?: string;
  vehicleCategoryId: string;
  tripType: 'one_way' | 'round_trip' | 'local' | 'airport';
  packageId?: string; // For local trips
  startDate?: string;
  endDate?: string; // For round trip / multi-day
  pickupTime?: string;
}

interface PriceBreakdown {
  baseKmCharge: number;
  totalKm: number;
  perKmRate: number;
  driverAllowance: number;
  nightCharge: number;
  tollEstimate: number;
  statePermitCharge: number;
  gst: number;
  totalBeforeGst: number;
  grandTotal: number;
}

// GET - Calculate pricing for a trip
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromLocationId = searchParams.get('from');
    const toLocationId = searchParams.get('to');
    // Accept both camelCase (frontend) and snake_case (legacy)
    const vehicleCategoryId = searchParams.get('vehicleCategory') || searchParams.get('vehicle_category');
    const tripType = searchParams.get('tripType') as 'one_way' | 'round_trip' | 'local' | 'airport';
    const packageId = searchParams.get('packageId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const pickupTime = searchParams.get('pickupTime');

    if (!vehicleCategoryId) {
      return NextResponse.json(
        { success: false, error: 'Vehicle category is required' },
        { status: 400 }
      );
    }

    // Local package pricing
    if (tripType === 'local') {
      if (!packageId) {
        return NextResponse.json(
          { success: false, error: 'Package ID is required for local trips' },
          { status: 400 }
        );
      }

      const localPackage = await prisma.chauffeur_local_packages.findUnique({
        where: { id: packageId },
        include: {
          chauffeur_vehicle_categories: { select: { id: true, name: true } },
          locations: { select: { id: true, name: true } },
        },
      });

      if (!localPackage) {
        return NextResponse.json(
          { success: false, error: 'Local package not found' },
          { status: 404 }
        );
      }

      // Check if package is active
      if (localPackage.isActive === false) {
        return NextResponse.json(
          { success: false, error: 'This package is currently not available' },
          { status: 404 }
        );
      }

      // Check night charges
      let nightCharge = 0;
      if (localPackage.nightChargesApply && pickupTime && localPackage.nightChargeAmount) {
        const hour = parseInt(pickupTime.split(':')[0]);
        if (hour >= 22 || hour < 6) {
          nightCharge = localPackage.nightChargeAmount;
        }
      }

      const grandTotal = localPackage.basePrice + nightCharge;

      return NextResponse.json({
        success: true,
        tripType: 'local',
        package: localPackage,
        pricing: {
          packageName: localPackage.name,
          hours: localPackage.hours,
          kms: localPackage.kms,
          basePrice: localPackage.basePrice,
          nightCharge,
          extraKmCharge: localPackage.extraKmCharge,
          extraHourCharge: localPackage.extraHourCharge,
          totalBeforeGst: grandTotal,
          gst: 0,
          grandTotal,
        },
      });
    }

    // Airport transfer pricing
    if (tripType === 'airport') {
      if (!fromLocationId || !toLocationId) {
        return NextResponse.json(
          { success: false, error: 'Airport and city locations are required for airport transfers' },
          { status: 400 }
        );
      }

      // Look for airport transfer route package — exact direction first, then reverse
      const include = {
        chauffeur_vehicle_categories: { select: { id: true, name: true } },
        locations_chauffeur_route_packages_fromLocationIdTolocations: { select: { id: true, name: true, type: true, code: true } },
        locations_chauffeur_route_packages_toLocationIdTolocations: { select: { id: true, name: true, type: true, code: true } },
      } as const;

      let airportRoutePackage = await prisma.chauffeur_route_packages.findFirst({
        where: { vehicleCategoryId, fromLocationId, toLocationId, isActive: true },
        include,
      });

      if (!airportRoutePackage) {
        // Try reverse direction
        airportRoutePackage = await prisma.chauffeur_route_packages.findFirst({
          where: { vehicleCategoryId, fromLocationId: toLocationId, toLocationId: fromLocationId, isActive: true },
          include,
        });
      }

      if (!airportRoutePackage) {
        return NextResponse.json({
          success: false,
          tripType: 'airport',
          error: 'Airport transfer pricing not configured for this route',
          suggestion: 'Admin needs to add airport transfer pricing for this route.',
          pricing: { grandTotal: 0, totalBeforeGst: 0, gst: 0 },
        }, { status: 404 });
      }

      // Determine which direction we're going
      const isFromAirport = airportRoutePackage.fromLocationId === fromLocationId;
      const fromLoc = isFromAirport ? airportRoutePackage.locations_chauffeur_route_packages_fromLocationIdTolocations : airportRoutePackage.locations_chauffeur_route_packages_toLocationIdTolocations;
      const toLoc = isFromAirport ? airportRoutePackage.locations_chauffeur_route_packages_toLocationIdTolocations : airportRoutePackage.locations_chauffeur_route_packages_fromLocationIdTolocations;

      // Calculate base price
      let basePrice = airportRoutePackage.basePrice;

      // Add airport surcharge
      const airportSurcharge = airportRoutePackage.airportSurcharge || 0;

      // Check for night surcharge
      let nightSurcharge = 0;
      if (pickupTime && airportRoutePackage.nightSurcharge) {
        const hour = parseInt(pickupTime.split(':')[0]);
        if (hour >= 22 || hour < 6) {
          nightSurcharge = airportRoutePackage.nightSurcharge;
        }
      }

      // Calculate totals
      const totalBeforeGst = basePrice + airportSurcharge + nightSurcharge;
      const grandTotal = totalBeforeGst;

      return NextResponse.json({
        success: true,
        tripType: 'airport',
        pricingMethod: 'airport_transfer',
        route: {
          from: fromLoc,
          to: toLoc,
          estimatedKm: airportRoutePackage.estimatedKm,
          estimatedDuration: airportRoutePackage.estimatedDuration,
        },
        chauffeur_vehicle_categories: airportRoutePackage.vehicle_category,
        pricing: {
          basePrice,
          airportSurcharge,
          nightSurcharge,
          tollsEstimate: airportRoutePackage.tollsEstimate || 0,
          totalBeforeGst,
          gst: 0,
          grandTotal,
        },
        inclusions: {
          waitingTime: '45 mins included',
          meetAndGreet: true,
          luggageAssistance: true,
          tollsIncluded: false,
        },
        notes: [
          '45 minutes waiting time included at airport',
          'Flight tracking available',
          nightSurcharge > 0 ? `Night surcharge applied (10 PM - 6 AM): ₹${nightSurcharge}` : '',
          'Toll charges as per actuals',
        ].filter(Boolean),
      });
    }

    // Outstation pricing (one-way or round-trip)
    if (!fromLocationId || !toLocationId) {
      return NextResponse.json(
        { success: false, error: 'From and To locations are required for outstation trips' },
        { status: 400 }
      );
    }

    // STEP 0: Check if admin has forced package pricing for this route (overrides distance matrix)
    const forcedPackage = await prisma.chauffeur_route_packages.findFirst({
      where: {
        vehicleCategoryId,
        forcePackagePricing: true,
        isActive: true,
        OR: [
          { fromLocationId, toLocationId },
          { fromLocationId: toLocationId, toLocationId: fromLocationId },
        ],
      },
      include: {
        chauffeur_vehicle_categories: { select: { id: true, name: true } },
        locations_chauffeur_route_packages_fromLocationIdTolocations: { select: { id: true, name: true } },
        locations_chauffeur_route_packages_toLocationIdTolocations: { select: { id: true, name: true } },
      },
    });

    if (forcedPackage) {
      const isReverse = forcedPackage.fromLocationId === toLocationId;
      const basePrice = forcedPackage.basePrice;
      const roundTripPrice = tripType === 'round_trip'
        ? Math.round(basePrice * forcedPackage.returnMultiplier)
        : basePrice;

      return NextResponse.json({
        success: true,
        tripType,
        pricingMethod: 'forced_package',
        forcedByAdmin: true,
        routePackage: {
          ...forcedPackage,
          fromLocation: isReverse
            ? forcedPackage.locations_chauffeur_route_packages_toLocationIdTolocations
            : forcedPackage.locations_chauffeur_route_packages_fromLocationIdTolocations,
          toLocation: isReverse
            ? forcedPackage.locations_chauffeur_route_packages_fromLocationIdTolocations
            : forcedPackage.locations_chauffeur_route_packages_toLocationIdTolocations,
        },
        pricing: {
          estimatedKm: forcedPackage.estimatedKm,
          basePrice,
          roundTripMultiplier: tripType === 'round_trip' ? forcedPackage.returnMultiplier : 1,
          totalBeforeGst: roundTripPrice,
          gst: 0,
          grandTotal: roundTripPrice,
          tollsEstimate: forcedPackage.tollsEstimate || 0,
          statePermitCharge: forcedPackage.statePermitCharge || 0,
        },
        note: 'Distance matrix bypassed — admin has set fixed package pricing for this route.',
      });
    }

    // STEP 1: Check distance matrix + city pricing first (dynamic, date-based pricing)
    const distance = await prisma.city_distance_matrix.findFirst({
      where: {
        OR: [
          { fromLocationId, toLocationId },
          { fromLocationId: toLocationId, toLocationId: fromLocationId },
        ],
        isActive: true,
      },
      include: {
        locations_city_distance_matrix_fromLocationIdTolocations: { select: { id: true, name: true } },
        locations_city_distance_matrix_toLocationIdTolocations: { select: { id: true, name: true } },
      },
    });

    const cityPricing = distance
      ? await prisma.chauffeur_city_pricing.findFirst({
          where: {
            vehicleCategoryId,
            locationId: fromLocationId,
            isActive: true,
          },
          include: {
            chauffeur_vehicle_categories: { select: { id: true, name: true } },
            locations: { select: { id: true, name: true } },
          },
        })
      : null;

    // If both distance matrix AND city pricing exist — use dynamic pricing
    if (distance && cityPricing) {

    // Calculate pricing
    const oneWayKm = distance.distanceKm;
    const totalKm = tripType === 'round_trip' ? oneWayKm * 2 : oneWayKm;

    // Calculate number of days based on actual hours (ceil(hours/24))
    // e.g., 25 Mar 10PM → 28 Mar 10PM = 72hrs = 3 days
    // Night bookings (10PM+) naturally don't count as full first day
    let days = 1;
    if (startDate && endDate) {
      const timeStr = pickupTime || '10:00';
      const [h, m] = timeStr.split(':').map(Number);
      const start = new Date(startDate);
      start.setHours(h, m, 0, 0);
      const end = new Date(endDate);
      end.setHours(h, m, 0, 0);
      const totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      days = Math.max(1, Math.ceil(totalHours / 24));
    } else if (tripType === 'round_trip') {
      // Estimate days based on distance
      days = Math.max(1, Math.ceil(totalKm / cityPricing.minKmPerDay));
    }

    // Apply minimum km per day
    const minTotalKm = days * cityPricing.minKmPerDay;
    const chargeableKm = Math.max(totalKm, minTotalKm);

    // Base km charge
    const baseKmCharge = Math.round(chargeableKm * cityPricing.baseKmRate);

    // Driver allowance
    const driverAllowance = Math.round(days * cityPricing.driverDayAllowance);

    // Night charges (if applicable based on time)
    let nightCharge = 0;
    if (pickupTime && cityPricing.nightSurcharge) {
      const hour = parseInt(pickupTime.split(':')[0]);
      if (hour >= 22 || hour < 6) {
        nightCharge = cityPricing.nightSurcharge * days;
      }
    }

    // Toll estimate from distance matrix
    const tollEstimate = !cityPricing.tollsIncluded && distance.tollEstimate
      ? (tripType === 'round_trip' ? distance.tollEstimate * 2 : distance.tollEstimate)
      : 0;

    // State permit
    const statePermitCharge = !cityPricing.statePermitIncluded && distance.statePermit ? 500 : 0;

    // Calculate totals
    const totalBeforeGst = baseKmCharge + driverAllowance + nightCharge + tollEstimate + statePermitCharge;
    const grandTotal = totalBeforeGst;

    const breakdown: PriceBreakdown = {
      baseKmCharge,
      totalKm: chargeableKm,
      perKmRate: cityPricing.baseKmRate,
      driverAllowance,
      nightCharge,
      tollEstimate,
      statePermitCharge,
      gst: 0,
      totalBeforeGst,
      grandTotal,
    };

      return NextResponse.json({
        success: true,
        tripType,
        pricingMethod: 'distance_matrix',
        route: {
          from: distance.fromLocationId === fromLocationId ? distance.locations_city_distance_matrix_fromLocationIdTolocations : distance.locations_city_distance_matrix_toLocationIdTolocations,
          to: distance.fromLocationId === fromLocationId ? distance.locations_city_distance_matrix_toLocationIdTolocations : distance.locations_city_distance_matrix_fromLocationIdTolocations,
          oneWayDistance: oneWayKm,
          estimatedDuration: distance.durationText || `${Math.round(distance.durationMinutes || 0)} mins`,
          routeVia: distance.routeVia,
        },
        chauffeur_vehicle_categories: cityPricing.vehicle_category,
        calculation: {
          days,
          actualKm: totalKm,
          minKmPerDay: cityPricing.minKmPerDay,
          chargeableKm,
          perKmRate: cityPricing.baseKmRate,
        },
        pricing: breakdown,
        inclusions: {
          tollsIncluded: cityPricing.tollsIncluded,
          statePermitIncluded: cityPricing.statePermitIncluded,
          parkingIncluded: cityPricing.parkingIncluded,
        },
        notes: [
          `Minimum ${cityPricing.minKmPerDay} km/day applicable`,
          tripType === 'round_trip' ? 'Round trip calculation includes return journey' : 'One-way fare only',
          !cityPricing.tollsIncluded ? 'Toll charges as per actuals' : 'Tolls included',
          !cityPricing.parkingIncluded ? 'Parking charges extra' : 'Parking included',
        ],
      });
    }

    // STEP 2: Fallback — check route package (fixed pricing)
    const routePackage = await prisma.chauffeur_route_packages.findFirst({
      where: {
        vehicleCategoryId,
        OR: [
          { fromLocationId, toLocationId },
          { fromLocationId: toLocationId, toLocationId: fromLocationId },
        ],
        isActive: true,
      },
      include: {
        chauffeur_vehicle_categories: { select: { id: true, name: true } },
        locations_chauffeur_route_packages_fromLocationIdTolocations: { select: { id: true, name: true } },
        locations_chauffeur_route_packages_toLocationIdTolocations: { select: { id: true, name: true } },
      },
    });

    if (routePackage) {
      const isReverse = routePackage.fromLocationId === toLocationId;
      const basePrice = routePackage.basePrice;
      const roundTripPrice = tripType === 'round_trip'
        ? Math.round(basePrice * routePackage.returnMultiplier)
        : basePrice;

      return NextResponse.json({
        success: true,
        tripType,
        pricingMethod: 'route_package',
        routePackage: {
          ...routePackage,
          fromLocation: isReverse ? routePackage.locations_chauffeur_route_packages_toLocationIdTolocations : routePackage.locations_chauffeur_route_packages_fromLocationIdTolocations,
          toLocation: isReverse ? routePackage.locations_chauffeur_route_packages_fromLocationIdTolocations : routePackage.locations_chauffeur_route_packages_toLocationIdTolocations,
        },
        pricing: {
          estimatedKm: routePackage.estimatedKm,
          basePrice: routePackage.basePrice,
          roundTripMultiplier: tripType === 'round_trip' ? routePackage.returnMultiplier : 1,
          totalBeforeGst: roundTripPrice,
          gst: 0,
          grandTotal: roundTripPrice,
          tollsEstimate: routePackage.tollsEstimate || 0,
          statePermitCharge: routePackage.statePermitCharge || 0,
        },
      });
    }

    // STEP 3: Nothing configured — not available
    return NextResponse.json({
      success: false,
      error: 'Pricing not available for this route',
      suggestion: 'Admin needs to configure distance matrix + city pricing, or add a route package for this route.',
    }, { status: 404 });
  } catch (error: any) {
    logger.error('Failed to calculate pricing', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate pricing', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Calculate pricing (same as GET but for complex requests)
export async function POST(request: NextRequest) {
  try {
    const body: PricingRequest = await request.json();

    // Convert to URL params and call GET logic
    const url = new URL(request.url);
    if (body.fromLocationId) url.searchParams.set('from', body.fromLocationId);
    if (body.toLocationId) url.searchParams.set('to', body.toLocationId);
    url.searchParams.set('vehicle_category', body.vehicleCategoryId);
    url.searchParams.set('tripType', body.tripType);
    if (body.packageId) url.searchParams.set('packageId', body.packageId);
    if (body.startDate) url.searchParams.set('startDate', body.startDate);
    if (body.endDate) url.searchParams.set('endDate', body.endDate);
    if (body.pickupTime) url.searchParams.set('pickupTime', body.pickupTime);

    // Create a new request with the params
    const newRequest = new NextRequest(url);
    return GET(newRequest);
  } catch (error: any) {
    logger.error('Failed to calculate pricing', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate pricing', details: error?.message },
      { status: 500 }
    );
  }
}
