// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

export const dynamic = 'force-dynamic';

function generateBookingNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `DR${yy}${mm}${rand}`;
}

// GET — list all direct bookings for vendor
export async function GET(request: NextRequest) {
  const auth = await getVendorAuth(request);
  if (!auth.authenticated || !auth.vendorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'all';
  const source = searchParams.get('source') || 'all';
  const serviceType = searchParams.get('serviceType') || 'all';
  const search = searchParams.get('search') || '';

  const where: any = { vendorId: auth.vendorId };
  if (status !== 'all') where.status = status;
  if (source !== 'all') where.bookingSource = source;
  if (serviceType !== 'all') where.serviceType = serviceType;
  if (search) {
    where.OR = [
      { customerName: { contains: search } },
      { customerPhone: { contains: search } },
      { bookingNumber: { contains: search } },
    ];
  }

  const bookings = await prisma.vendor_direct_bookings.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ bookings });
}

// POST — vendor manually creates a direct booking
export async function POST(request: NextRequest) {
  const auth = await getVendorAuth(request);
  if (!auth.authenticated || !auth.vendorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    serviceType, vehicleType,
    customerName, customerPhone, customerEmail,
    pickupDate, returnDate, pickupLocation, dropLocation,
    notes, totalAmount, paymentStatus, paymentMode, paidAmount,
  } = body;

  if (!customerName || !customerPhone) {
    return NextResponse.json({ error: 'Customer name and phone are required' }, { status: 400 });
  }

  const booking = await prisma.vendor_direct_bookings.create({
    data: {
      bookingNumber: generateBookingNumber(),
      vendorId: auth.vendorId,
      bookingSource: 'manual',
      serviceType: serviceType || 'general',
      vehicleType: vehicleType || null,
      customerName,
      customerPhone,
      customerEmail: customerEmail || null,
      pickupDate: pickupDate ? new Date(pickupDate) : null,
      returnDate: returnDate ? new Date(returnDate) : null,
      pickupLocation: pickupLocation || null,
      dropLocation: dropLocation || null,
      notes: notes || null,
      status: 'confirmed',   // vendor manually adds = auto confirmed
      totalAmount: totalAmount ? parseFloat(totalAmount) : null,
      paymentStatus: paymentStatus || 'pending',
      paymentMode: paymentMode || null,
      paidAmount: paidAmount ? parseFloat(paidAmount) : 0,
    },
  });

  return NextResponse.json({ booking }, { status: 201 });
}
