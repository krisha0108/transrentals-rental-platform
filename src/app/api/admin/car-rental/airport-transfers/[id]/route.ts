import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

export const dynamic = 'force-dynamic';

// GET - Get single airport transfer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transfer = await prisma.chauffeur_route_packages.findUnique({
      where: { id: params.id },
      include: {
        chauffeur_vehicle_categories: { select: { id: true, name: true, slug: true, seatingCapacity: true } },
        locations_chauffeur_route_packages_fromLocationIdTolocations: { select: { id: true, name: true, slug: true, type: true, code: true } },
        locations_chauffeur_route_packages_toLocationIdTolocations: { select: { id: true, name: true, slug: true, type: true, code: true } },
      },
    });

    if (!transfer) {
      return NextResponse.json(
        { success: false, error: 'Transfer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      transfer,
    });
  } catch (error: any) {
    console.error('Failed to fetch transfer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transfer' },
      { status: 500 }
    );
  }
}

// PUT - Update airport transfer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      estimatedKm,
      estimatedDuration,
      routeDescription,
      basePrice,
      returnMultiplier,
      tollsEstimate,
      statePermitCharge,
      nightSurcharge,
      airportSurcharge,
      isPopular,
      displayOrder,
      isActive,
      forcePackagePricing,
    } = body;

    // Check if transfer exists
    const existing = await prisma.chauffeur_route_packages.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Transfer not found' },
        { status: 404 }
      );
    }

    // Update transfer
    const transfer = await prisma.chauffeur_route_packages.update({
      where: { id: params.id },
      data: {
        ...(estimatedKm !== undefined && { estimatedKm }),
        ...(estimatedDuration !== undefined && { estimatedDuration }),
        ...(routeDescription !== undefined && { routeDescription }),
        ...(basePrice !== undefined && { basePrice }),
        ...(returnMultiplier !== undefined && { returnMultiplier }),
        ...(tollsEstimate !== undefined && { tollsEstimate }),
        ...(statePermitCharge !== undefined && { statePermitCharge }),
        ...(nightSurcharge !== undefined && { nightSurcharge }),
        ...(airportSurcharge !== undefined && { airportSurcharge }),
        ...(isPopular !== undefined && { isPopular }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(isActive !== undefined && { isActive }),
        ...(forcePackagePricing !== undefined && { forcePackagePricing }),
      },
      include: {
        chauffeur_vehicle_categories: { select: { id: true, name: true } },
        locations_chauffeur_route_packages_fromLocationIdTolocations: { select: { id: true, name: true, type: true } },
        locations_chauffeur_route_packages_toLocationIdTolocations: { select: { id: true, name: true, type: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Transfer updated successfully',
      transfer,
    });
  } catch (error: any) {
    console.error('Failed to update transfer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update transfer', details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete airport transfer
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if transfer exists
    const existing = await prisma.chauffeur_route_packages.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Transfer not found' },
        { status: 404 }
      );
    }

    await prisma.chauffeur_route_packages.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Transfer deleted successfully',
    });
  } catch (error: any) {
    console.error('Failed to delete transfer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete transfer', details: error?.message },
      { status: 500 }
    );
  }
}
