import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// Public, read-only endpoint for shared P2P postings.
// No vendor auth required — used by the public share page.
const vendorSelect = {
  select: {
    id: true,
    businessName: true,
    city: true,
    logo: true,
    phone: true,
    rating: true,
    totalRatings: true,
  },
};

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Invalid posting' }, { status: 400 });
  }

  try {
    // A shared id can be either a vehicle posting or a booking posting.
    const vehicle = await prisma.p2p_vehicle_postings.findUnique({
      where: { id },
      include: { vendor: vendorSelect },
    });
    if (vehicle) {
      return NextResponse.json({ type: 'vehicle', posting: vehicle });
    }

    const booking = await prisma.p2p_booking_postings.findUnique({
      where: { id },
      include: { vendor: vendorSelect },
    });
    if (booking) {
      return NextResponse.json({ type: 'booking', posting: booking });
    }

    return NextResponse.json({ error: 'Posting not found' }, { status: 404 });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load posting' }, { status: 500 });
  }
}
