// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { generateCustomerId } from '@/lib/utils/id-generator';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, name, phone, email, travelDate, groupSize, pickupLocation, requirements, bookingFor, companyName } = body;

    if (!listingId) return NextResponse.json({ error: 'Tour listing is required' }, { status: 400 });
    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!phone?.trim()) return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    if (!travelDate) return NextResponse.json({ error: 'Travel date is required' }, { status: 400 });

    // Verify listing is active and not expired
    const listing = await (prisma as any).wander_listings.findFirst({
      where: { id: listingId, status: 'ACTIVE' },
    });
    if (!listing) return NextResponse.json({ error: 'Tour not found or unavailable' }, { status: 404 });

    if (listing.tourEndDate) {
      const endDate = new Date(listing.tourEndDate);
      endDate.setHours(23, 59, 59);
      if (endDate < new Date()) {
        return NextResponse.json({ error: 'This tour has ended and is no longer accepting quote requests' }, { status: 400 });
      }
    }

    // Find or create customer
    let customer = await prisma.customers.findFirst({
      where: {
        OR: [
          ...(email ? [{ email: email.toLowerCase() }] : []),
          { phone: phone.trim() },
        ],
      },
    });

    if (!customer) {
      const customerId = await generateCustomerId();
      customer = await prisma.customers.create({
        data: {
          id: customerId,
          name: name.trim(),
          phone: phone.trim(),
          email: email ? email.toLowerCase() : `${phone.trim()}@wander.local`,
          isActive: true,
        },
      });
    }

    // Generate requestId
    const count = await (prisma as any).wander_quote_requests.count();
    const requestId = `WND-REQ-${Date.now()}-${count + 1}`;

    const quoteRequest = await (prisma as any).wander_quote_requests.create({
      data: {
        requestId,
        wanderListingId: listingId,
        customerId: customer.id,
        travelDate: new Date(travelDate),
        groupSize: groupSize ? parseInt(groupSize) : 1,
        pickupLocation: pickupLocation?.trim() || null,
        requirements: requirements?.trim() || null,
        bookingFor: bookingFor === 'COMPANY' ? 'COMPANY' : 'PERSONAL',
        companyName: bookingFor === 'COMPANY' ? (companyName?.trim() || null) : null,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, requestId: quoteRequest.requestId }, { status: 201 });
  } catch (error) {
    console.error('[Public Wander Quote Request POST]', error);
    return NextResponse.json({ error: 'Failed to submit quote request' }, { status: 500 });
  }
}
