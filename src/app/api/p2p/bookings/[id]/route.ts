// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - Get single booking posting detail with vendor info and request count
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const posting = await prisma.p2p_booking_postings.findUnique({
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
      },
    });

    if (!posting) {
      return NextResponse.json({ error: 'Booking posting not found' }, { status: 404 });
    }

    // Get request count for this posting
    const requestCount = await prisma.p2p_requests.count({
      where: { bookingPostingId: id },
    });

    return NextResponse.json({ posting, requestCount });
  } catch (error) {
    logger.error('Error fetching booking posting detail', error);
    return NextResponse.json({ error: 'Failed to fetch booking posting' }, { status: 500 });
  }
}

// PUT - Update booking posting (only owner, only if ACTIVE)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check posting exists and belongs to the vendor
    const existing = await prisma.p2p_booking_postings.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Booking posting not found' }, { status: 404 });
    }

    if (existing.vendorId !== auth.vendorId) {
      return NextResponse.json({ error: 'You can only update your own postings' }, { status: 403 });
    }

    if (existing.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Only ACTIVE postings can be updated' }, { status: 400 });
    }

    const body = await request.json();

    const {
      serviceType,
      bookingType,
      vehicleRequired,
      vehicleCategory,
      fromCity,
      toCity,
      tripDate,
      tripTime,
      returnDate,
      passengers,
      goodsType,
      goodsDescription,
      estimatedWeight,
      needInsurance,
      needPackaging,
      needLabour,
      labourCount,
      customerBudget,
      partnerEarning,
      commission,
      urgency,
      reason,
      notes,
    } = body;

    const updateData: any = {};

    if (serviceType !== undefined) updateData.serviceType = serviceType;
    if (bookingType !== undefined) updateData.bookingType = bookingType;
    if (vehicleRequired !== undefined) updateData.vehicleRequired = vehicleRequired;
    if (vehicleCategory !== undefined) updateData.vehicleCategory = vehicleCategory;
    if (fromCity !== undefined) updateData.fromCity = fromCity;
    if (toCity !== undefined) updateData.toCity = toCity;
    if (tripDate !== undefined) {
      updateData.tripDate = new Date(tripDate);
      updateData.expiresAt = new Date(tripDate);
    }
    if (tripTime !== undefined) updateData.tripTime = tripTime;
    if (returnDate !== undefined) updateData.returnDate = returnDate ? new Date(returnDate) : null;
    if (passengers !== undefined) updateData.passengers = passengers ? parseInt(passengers) : null;
    if (goodsType !== undefined) updateData.goodsType = goodsType;
    if (goodsDescription !== undefined) updateData.goodsDescription = goodsDescription;
    if (estimatedWeight !== undefined) updateData.estimatedWeight = estimatedWeight;
    if (needInsurance !== undefined) updateData.needInsurance = needInsurance;
    if (needPackaging !== undefined) updateData.needPackaging = needPackaging;
    if (needLabour !== undefined) updateData.needLabour = needLabour;
    if (labourCount !== undefined) updateData.labourCount = labourCount ? parseInt(labourCount) : null;
    if (customerBudget !== undefined) updateData.customerBudget = parseFloat(customerBudget);
    if (partnerEarning !== undefined) updateData.partnerEarning = partnerEarning ? parseFloat(partnerEarning) : null;
    if (commission !== undefined) updateData.commission = commission ? parseFloat(commission) : null;
    if (urgency !== undefined) updateData.urgency = urgency;
    if (reason !== undefined) updateData.reason = reason;
    if (notes !== undefined) updateData.notes = notes;

    const posting = await prisma.p2p_booking_postings.update({
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

    return NextResponse.json({ posting });
  } catch (error) {
    logger.error('Error updating booking posting', error);
    return NextResponse.json({ error: 'Failed to update booking posting' }, { status: 500 });
  }
}

// DELETE - Cancel booking posting (only owner, set status CANCELLED, cancel PENDING requests)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check posting exists and belongs to the vendor
    const existing = await prisma.p2p_booking_postings.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Booking posting not found' }, { status: 404 });
    }

    if (existing.vendorId !== auth.vendorId) {
      return NextResponse.json({ error: 'You can only cancel your own postings' }, { status: 403 });
    }

    // Cancel the posting
    const posting = await prisma.p2p_booking_postings.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    // Cancel all PENDING requests for this posting
    await prisma.p2p_requests.updateMany({
      where: {
        bookingPostingId: id,
        status: 'PENDING',
      },
      data: {
        status: 'CANCELLED',
      },
    });

    return NextResponse.json({ posting, message: 'Booking posting cancelled successfully' });
  } catch (error) {
    logger.error('Error cancelling booking posting', error);
    return NextResponse.json({ error: 'Failed to cancel booking posting' }, { status: 500 });
  }
}
