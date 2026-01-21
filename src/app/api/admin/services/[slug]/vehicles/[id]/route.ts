import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get single vehicle category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { id } = await params;

    const category = await prisma.chauffeur_vehicle_categories.findUnique({
      where: { id },
      include: {
        chauffeur_city_pricing: {
          include: { locations: { select: { id: true, name: true, slug: true } } },
        },
        chauffeur_local_packages: {
          include: { locations: { select: { id: true, name: true, slug: true } } },
        },
        chauffeur_route_packages: {
          include: {
            locations_chauffeur_route_packages_fromLocationIdTolocations: { select: { id: true, name: true, slug: true } },
            locations_chauffeur_route_packages_toLocationIdTolocations: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Vehicle category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      category,
    });
  } catch (error: any) {
    logger.error('Failed to fetch vehicle category', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vehicle category' },
      { status: 500 }
    );
  }
}

// PATCH - Update vehicle category
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug: serviceSlug, id } = await params;

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

    // Determine service type for field mapping
    const isBike = serviceSlug.includes('bike');
    const isBus = serviceSlug.includes('bus');

    // Check if category exists
    const existing = await prisma.chauffeur_vehicle_categories.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Vehicle category not found' },
        { status: 404 }
      );
    }

    // Check for duplicate slug/name if changing (within the same service)
    if (slug && slug !== existing.slug) {
      const duplicate = await prisma.chauffeur_vehicle_categories.findFirst({
        where: {
          serviceId: service.id,
          slug,
          id: { not: id },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: 'A category with this slug already exists in this service' },
          { status: 400 }
        );
      }
    }

    if (name && name !== existing.name) {
      const duplicate = await prisma.chauffeur_vehicle_categories.findFirst({
        where: {
          serviceId: service.id,
          name,
          id: { not: id },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: 'A category with this name already exists in this service' },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.chauffeur_vehicle_categories.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug: slug.toLowerCase().replace(/\s+/g, '-') }),
        ...(description !== undefined && { description }),
        ...(seatingCapacity !== undefined && { seatingCapacity }),
        // For bikes: mileage -> luggageCapacity
        ...(isBike && mileage !== undefined && { luggageCapacity: mileage }),
        ...(!isBike && luggageCapacity !== undefined && { luggageCapacity }),
        // For bikes: bikeType -> acType
        ...(isBike && bikeType !== undefined && { acType: bikeType }),
        ...(!isBike && acType !== undefined && { acType }),
        ...(fuelType !== undefined && { fuelType }),
        // Truck specific
        ...(loadCapacity !== undefined && { loadCapacity: loadCapacity ? parseFloat(loadCapacity) : null }),
        ...(bodyType !== undefined && { bodyType }),
        ...(wheels !== undefined && { wheels }),
        ...(lengthFt !== undefined && { lengthFt: lengthFt ? parseFloat(lengthFt) : null }),
        ...(widthFt !== undefined && { widthFt: widthFt ? parseFloat(widthFt) : null }),
        ...(heightFt !== undefined && { heightFt: heightFt ? parseFloat(heightFt) : null }),
        // Equipment specific OR Bike engineCC -> powerCapacity
        ...(isBike && engineCC !== undefined && { powerCapacity: engineCC }),
        ...(!isBike && powerCapacity !== undefined && { powerCapacity }),
        ...(equipmentFuelType !== undefined && { equipmentFuelType }),
        ...(operatorIncluded !== undefined && { operatorIncluded }),
        ...(dailyRate !== undefined && { dailyRate: dailyRate ? parseFloat(dailyRate) : null }),
        ...(weeklyRate !== undefined && { weeklyRate: weeklyRate ? parseFloat(weeklyRate) : null }),
        ...(monthlyRate !== undefined && { monthlyRate: monthlyRate ? parseFloat(monthlyRate) : null }),
        ...(securityDeposit !== undefined && { securityDeposit: securityDeposit ? parseFloat(securityDeposit) : null }),
        // For bikes: topSpeed -> specifications
        ...(isBike && topSpeed !== undefined && { specifications: topSpeed }),
        ...(!isBike && specifications !== undefined && { specifications }),
        // Bus specific fields
        ...(isBus && busType !== undefined && { busType }),
        ...(isBus && amenities !== undefined && { amenities }),
        ...(isBus && hasPushbackSeats !== undefined && { hasPushbackSeats }),
        ...(isBus && hasTV !== undefined && { hasTV }),
        ...(isBus && hasCharging !== undefined && { hasCharging }),
        ...(isBus && hasWifi !== undefined && { hasWifi }),
        ...(image !== undefined && { image }),
        ...(icon !== undefined && { icon }),
        ...(exampleVehicles !== undefined && { exampleVehicles: exampleVehicles ? JSON.stringify(exampleVehicles.split(',').map((v: string) => v.trim()).filter(Boolean)) : null }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(isActive !== undefined && { isActive }),
        ...(isPopular !== undefined && { isPopular }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Vehicle category updated successfully',
      category: updated,
    });
  } catch (error: any) {
    logger.error('Failed to update vehicle category', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update vehicle category', details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete vehicle category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.chauffeur_vehicle_categories.findUnique({
      where: { id },
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

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Vehicle category not found' },
        { status: 404 }
      );
    }

    // Check if there are related records
    const totalRelated =
      existing._count.chauffeur_city_pricing +
      existing._count.chauffeur_local_packages +
      existing._count.chauffeur_route_packages;

    if (totalRelated > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete: This category has ${totalRelated} related pricing/package records. Delete them first.`,
        },
        { status: 400 }
      );
    }

    await prisma.chauffeur_vehicle_categories.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Vehicle category deleted successfully',
    });
  } catch (error: any) {
    logger.error('Failed to delete vehicle category', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete vehicle category', details: error?.message },
      { status: 500 }
    );
  }
}
