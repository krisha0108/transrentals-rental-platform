// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - Get single vehicle posting detail
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    const posting = await prisma.p2p_vehicle_postings.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            city: true,
            rating: true,
            totalRatings: true,
            logo: true,
          },
        },
        p2p_requests: {
          select: { id: true },
        },
      },
    });

    if (!posting) {
      return NextResponse.json(
        { success: false, error: 'Vehicle posting not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      posting: {
        ...posting,
        requestCount: posting.p2p_requests.length,
        p2p_requests: undefined,
      },
    });
  } catch (error: any) {
    logger.error('P2P vehicle posting detail error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vehicle posting' },
      { status: 500 }
    );
  }
}

// PUT - Update vehicle posting
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Check posting exists and belongs to this vendor
    const existing = await prisma.p2p_vehicle_postings.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Vehicle posting not found' },
        { status: 404 }
      );
    }

    if (existing.vendorId !== auth.vendorId) {
      return NextResponse.json(
        { success: false, error: 'You can only update your own postings' },
        { status: 403 }
      );
    }

    if (existing.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Only ACTIVE postings can be updated' },
        { status: 400 }
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

    const {
      serviceType,
      vehicleId,
      vehicleCategory,
      vehicleName,
      vehicleNumber,
      capacity,
      bodyType,
      fromCity,
      toCity,
      departureDate,
      departureTime,
      arrivalDate,
      arrivalTime,
      priceFullLoad,
      pricePartLoad,
      acceptsPartLoad,
      availableSpace,
      driverIncluded,
      driverName,
      driverPhone,
      fuelIncluded,
      labourAvailable,
      labourCount,
      goodsAccepted,
      totalSeats,
      availableSeats,
      busType,
      isAC,
      notes,
    } = body;

    // Build update data - only include fields that are provided
    const updateData: any = {};

    if (serviceType !== undefined) updateData.serviceType = serviceType;
    if (vehicleId !== undefined) updateData.vehicleId = vehicleId || null;
    if (vehicleCategory !== undefined) updateData.vehicleCategory = vehicleCategory || null;
    if (vehicleName !== undefined) updateData.vehicleName = vehicleName;
    if (vehicleNumber !== undefined) updateData.vehicleNumber = vehicleNumber || null;
    if (capacity !== undefined) updateData.capacity = capacity || null;
    if (bodyType !== undefined) updateData.bodyType = bodyType || null;
    if (fromCity !== undefined) updateData.fromCity = fromCity;
    if (toCity !== undefined) updateData.toCity = toCity;
    if (departureDate !== undefined) {
      const parsedDate = new Date(departureDate);
      updateData.departureDate = parsedDate;
      updateData.expiresAt = parsedDate; // Update expiry to match new departure
    }
    if (departureTime !== undefined) updateData.departureTime = departureTime || null;
    if (arrivalDate !== undefined) updateData.arrivalDate = arrivalDate ? new Date(arrivalDate) : null;
    if (arrivalTime !== undefined) updateData.arrivalTime = arrivalTime || null;
    if (priceFullLoad !== undefined) updateData.priceFullLoad = priceFullLoad ? parseFloat(priceFullLoad) : null;
    if (pricePartLoad !== undefined) updateData.pricePartLoad = pricePartLoad ? parseFloat(pricePartLoad) : null;
    if (acceptsPartLoad !== undefined) updateData.acceptsPartLoad = acceptsPartLoad === true || acceptsPartLoad === 'true';
    if (availableSpace !== undefined) updateData.availableSpace = availableSpace || null;
    if (driverIncluded !== undefined) updateData.driverIncluded = driverIncluded !== false && driverIncluded !== 'false';
    if (driverName !== undefined) updateData.driverName = driverName || null;
    if (driverPhone !== undefined) updateData.driverPhone = driverPhone || null;
    if (fuelIncluded !== undefined) updateData.fuelIncluded = fuelIncluded === true || fuelIncluded === 'true';
    if (labourAvailable !== undefined) updateData.labourAvailable = labourAvailable === true || labourAvailable === 'true';
    if (labourCount !== undefined) updateData.labourCount = labourCount ? parseInt(labourCount) : null;
    if (goodsAccepted !== undefined) updateData.goodsAccepted = goodsAccepted || null;
    if (totalSeats !== undefined) updateData.totalSeats = totalSeats ? parseInt(totalSeats) : null;
    if (availableSeats !== undefined) updateData.availableSeats = availableSeats ? parseInt(availableSeats) : null;
    if (busType !== undefined) updateData.busType = busType || null;
    if (isAC !== undefined) updateData.isAC = isAC != null ? (isAC === true || isAC === 'true') : null;
    if (notes !== undefined) updateData.notes = notes || null;

    const updated = await prisma.p2p_vehicle_postings.update({
      where: { id },
      data: updateData,
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            city: true,
            rating: true,
            totalRatings: true,
            logo: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      posting: updated,
      message: 'Vehicle posting updated successfully',
    });
  } catch (error: any) {
    logger.error('P2P vehicle posting update error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update vehicle posting' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel vehicle posting (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Check posting exists and belongs to this vendor
    const existing = await prisma.p2p_vehicle_postings.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Vehicle posting not found' },
        { status: 404 }
      );
    }

    if (existing.vendorId !== auth.vendorId) {
      return NextResponse.json(
        { success: false, error: 'You can only cancel your own postings' },
        { status: 403 }
      );
    }

    // Cancel the posting and any PENDING requests on it
    await prisma.$transaction([
      prisma.p2p_vehicle_postings.update({
        where: { id },
        data: { status: 'CANCELLED' },
      }),
      prisma.p2p_requests.updateMany({
        where: {
          vehiclePostingId: id,
          status: 'PENDING',
        },
        data: { status: 'CANCELLED' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Vehicle posting cancelled successfully',
    });
  } catch (error: any) {
    logger.error('P2P vehicle posting cancel error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel vehicle posting' },
      { status: 500 }
    );
  }
}
