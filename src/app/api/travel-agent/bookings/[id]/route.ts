import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

const VALID_STATUS = [
  'DRAFT',
  'PENDING_CUSTOMER',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const booking = await prisma.travel_agent_bookings.findUnique({ where: { id } });
    if (!booking || booking.travelAgentId !== auth.travelAgentId) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json(booking);
  } catch (error: any) {
    logger.error('Get booking error', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking', details: error?.message },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.travel_agent_bookings.findUnique({ where: { id } });
    if (!existing || existing.travelAgentId !== auth.travelAgentId) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      pickupLocation,
      dropLocation,
      travelDate,
      returnDate,
      checkInDate,
      checkOutDate,
      passengers,
      rooms,
      totalAmount,
      paidAmount,
      paymentStatus,
      notes,
      status,
      referenceTitle,
      referenceId,
    } = body;

    const updateData: any = {};
    if (customerName !== undefined) updateData.customerName = customerName;
    if (customerPhone !== undefined) updateData.customerPhone = customerPhone;
    if (customerEmail !== undefined) updateData.customerEmail = customerEmail || null;
    if (pickupLocation !== undefined) updateData.pickupLocation = pickupLocation || null;
    if (dropLocation !== undefined) updateData.dropLocation = dropLocation || null;
    if (travelDate !== undefined)
      updateData.travelDate = travelDate ? new Date(travelDate) : null;
    if (returnDate !== undefined)
      updateData.returnDate = returnDate ? new Date(returnDate) : null;
    if (checkInDate !== undefined)
      updateData.checkInDate = checkInDate ? new Date(checkInDate) : null;
    if (checkOutDate !== undefined)
      updateData.checkOutDate = checkOutDate ? new Date(checkOutDate) : null;
    if (passengers !== undefined) updateData.passengers = Number(passengers) || 1;
    if (rooms !== undefined) updateData.rooms = Number(rooms) || 1;
    if (totalAmount !== undefined) updateData.totalAmount = totalAmount ? Number(totalAmount) : 0;
    if (paidAmount !== undefined) updateData.paidAmount = paidAmount ? Number(paidAmount) : 0;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (notes !== undefined) updateData.notes = notes || null;
    if (referenceTitle !== undefined) updateData.referenceTitle = referenceTitle || null;
    if (referenceId !== undefined) updateData.referenceId = referenceId || null;
    if (status !== undefined && VALID_STATUS.includes(status)) updateData.status = status;

    const updated = await prisma.travel_agent_bookings.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ booking: updated });
  } catch (error: any) {
    logger.error('Update booking error', error);
    return NextResponse.json(
      { error: 'Failed to update booking', details: error?.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.travel_agent_bookings.findUnique({ where: { id } });
    if (!existing || existing.travelAgentId !== auth.travelAgentId) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    await prisma.travel_agent_bookings.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Delete booking error', error);
    return NextResponse.json(
      { error: 'Failed to delete booking', details: error?.message },
      { status: 500 },
    );
  }
}
