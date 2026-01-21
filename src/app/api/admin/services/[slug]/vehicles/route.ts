import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Helper to generate a cuid-like unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

// GET - List vehicle categories for a service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: serviceSlug } = await params;

    // Find the service by slug
    const service = await prisma.services.findUnique({
      where: { slug: serviceSlug },
      select: { id: true },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    // Filter categories by serviceId
    const categories = await prisma.chauffeur_vehicle_categories.findMany({
      where: {
        serviceId: service.id,
      },
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: {
            chauffeur_city_pricing: true,
            chauffeur_local_packages: true,
            chauffeur_route_packages: true,
          },
        },
      },
    });

    // Check if this is a bike or bus service
    const isBike = serviceSlug.includes('bike');
    const isBus = serviceSlug.includes('bus');

    return NextResponse.json({
      success: true,
      serviceSlug,
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        seatingCapacity: c.seatingCapacity,
        luggageCapacity: c.luggageCapacity,
        acType: c.acType,
        fuelType: c.fuelType,
        // Truck specific fields
        loadCapacity: c.loadCapacity,
        bodyType: c.bodyType,
        wheels: c.wheels,
        lengthFt: c.lengthFt,
        widthFt: c.widthFt,
        heightFt: c.heightFt,
        // Equipment specific fields
        powerCapacity: c.powerCapacity,
        equipmentFuelType: c.equipmentFuelType,
        operatorIncluded: c.operatorIncluded,
        dailyRate: c.dailyRate,
        weeklyRate: c.weeklyRate,
        monthlyRate: c.monthlyRate,
        securityDeposit: c.securityDeposit,
        specifications: c.specifications,
        // Bike specific fields (mapped from existing fields)
        engineCC: isBike ? c.powerCapacity : null,
        bikeType: isBike ? c.acType : null,
        mileage: isBike ? c.luggageCapacity : null,
        topSpeed: isBike ? c.specifications : null,
        // Bus specific fields
        busType: isBus ? (c as any).busType : null,
        amenities: isBus ? (c as any).amenities : null,
        hasPushbackSeats: isBus ? (c as any).hasPushbackSeats : null,
        hasTV: isBus ? (c as any).hasTV : null,
        hasCharging: isBus ? (c as any).hasCharging : null,
        hasWifi: isBus ? (c as any).hasWifi : null,
        image: c.image,
        icon: c.icon,
        exampleVehicles: c.exampleVehicles ? (() => { try { return JSON.parse(c.exampleVehicles).join(', '); } catch { return c.exampleVehicles; } })() : null,
        displayOrder: c.displayOrder,
        isActive: c.isActive,
        isPopular: c.isPopular,
        cityPricingCount: c._count.chauffeur_city_pricing,
        localPackagesCount: c._count.chauffeur_local_packages,
        routePackagesCount: c._count.chauffeur_route_packages,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    });
  } catch (error: any) {
    logger.error('Failed to fetch vehicle categories', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vehicle categories' },
      { status: 500 }
    );
  }
}

// POST - Create new vehicle category for a service
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: serviceSlug } = await params;

    // Find the service by slug
    const service = await prisma.services.findUnique({
      where: { slug: serviceSlug },
      select: { id: true, name: true },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      slug,
      description,
      seatingCapacity,
      luggageCapacity,
      acType,
      fuelType,
      // Truck specific
      loadCapacity,
      bodyType,
      wheels,
      lengthFt,
      widthFt,
      heightFt,
      // Equipment specific
      powerCapacity,
      equipmentFuelType,
      operatorIncluded,
      dailyRate,
      weeklyRate,
      monthlyRate,
      securityDeposit,
      specifications,
      // Bike specific (mapped to existing fields)
      engineCC,
      bikeType,
      mileage,
      topSpeed,
      // Bus specific
      busType,
      amenities,
      hasPushbackSeats,
      hasTV,
      hasCharging,
      hasWifi,
      image,
      icon,
      exampleVehicles,
      displayOrder,
      isActive,
      isPopular,
    } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Check for duplicate slug or name within this service
    const existing = await prisma.chauffeur_vehicle_categories.findFirst({
      where: {
        serviceId: service.id,
        OR: [{ slug }, { name }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Vehicle category with this name or slug already exists in this service' },
        { status: 400 }
      );
    }

    // Determine service type
    const isTruckOrPackers = serviceSlug.includes('truck') || serviceSlug.includes('packer') || serviceSlug.includes('mover') || serviceSlug.includes('transporter');
    const isEquipment = serviceSlug.includes('equipment');
    const isBike = serviceSlug.includes('bike');
    const isBus = serviceSlug.includes('bus');

    // For bikes, map bike fields to existing schema fields:
    // engineCC -> powerCapacity, bikeType -> acType, mileage -> luggageCapacity, topSpeed -> specifications
    const category = await prisma.chauffeur_vehicle_categories.create({
      data: {
        id: generateId(),
        name,
        slug: slug.toLowerCase().replace(/\s+/g, '-'),
        description: description || null,
        seatingCapacity: (isTruckOrPackers || isEquipment || isBike) ? 0 : (seatingCapacity || 4),
        // For bikes: mileage stored in luggageCapacity, otherwise normal luggageCapacity
        luggageCapacity: isBike ? (mileage || null) : (luggageCapacity || null),
        // For bikes: bikeType stored in acType, otherwise normal acType
        acType: isBike ? (bikeType || null) : (acType || null),
        fuelType: fuelType || null,
        // Truck specific
        loadCapacity: loadCapacity && !isNaN(parseFloat(loadCapacity)) ? parseFloat(loadCapacity) : null,
        bodyType: bodyType || null,
        wheels: wheels || null,
        lengthFt: lengthFt && !isNaN(parseFloat(lengthFt)) ? parseFloat(lengthFt) : null,
        widthFt: widthFt && !isNaN(parseFloat(widthFt)) ? parseFloat(widthFt) : null,
        heightFt: heightFt && !isNaN(parseFloat(heightFt)) ? parseFloat(heightFt) : null,
        // Equipment specific OR Bike engineCC
        powerCapacity: isBike ? (engineCC || null) : (powerCapacity || null),
        equipmentFuelType: equipmentFuelType || null,
        operatorIncluded: operatorIncluded || false,
        dailyRate: dailyRate && !isNaN(parseFloat(dailyRate)) ? parseFloat(dailyRate) : null,
        weeklyRate: weeklyRate && !isNaN(parseFloat(weeklyRate)) ? parseFloat(weeklyRate) : null,
        monthlyRate: monthlyRate && !isNaN(parseFloat(monthlyRate)) ? parseFloat(monthlyRate) : null,
        securityDeposit: securityDeposit && !isNaN(parseFloat(securityDeposit)) ? parseFloat(securityDeposit) : null,
        // For bikes: topSpeed stored in specifications, otherwise normal specifications
        specifications: isBike ? (topSpeed || null) : (specifications || null),
        // Bus specific fields
        busType: isBus ? (busType || null) : null,
        amenities: isBus ? (amenities || null) : null,
        hasPushbackSeats: isBus ? (hasPushbackSeats || false) : false,
        hasTV: isBus ? (hasTV || false) : false,
        hasCharging: isBus ? (hasCharging || false) : false,
        hasWifi: isBus ? (hasWifi || false) : false,
        image: image || null,
        icon: icon || null,
        exampleVehicles: exampleVehicles ? JSON.stringify(exampleVehicles.split(',').map((v: string) => v.trim()).filter(Boolean)) : null,
        displayOrder: displayOrder || 0,
        isActive: isActive !== false,
        isPopular: isPopular || false,
        serviceId: service.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Vehicle category created successfully',
      category,
      serviceSlug,
    });
  } catch (error: any) {
    logger.error('Failed to create vehicle category', error);
    console.error('Error code:', error?.code);
    console.error('Error meta:', error?.meta);

    // Handle specific Prisma errors
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A category with this slug or name already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create vehicle category', details: error?.message },
      { status: 500 }
    );
  }
}
