// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

export const dynamic = 'force-dynamic';

// GET - Single listing detail
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) return NextResponse.json({ error: auth.error }, { status: 401 });

    const listing = await (prisma as any).wander_listings.findFirst({
      where: { id: params.id, vendorId: auth.vendorId },
      include: {
        category: true,
        mainLocation: { select: { id: true, name: true, slug: true } },
        _count: { select: { quoteRequests: true } },
      },
    });

    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    return NextResponse.json(listing);
  } catch (error) {
    console.error('[Vendor Wander Listing GET]', error);
    return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 });
  }
}

// PUT - Update listing
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) return NextResponse.json({ error: auth.error }, { status: 401 });

    const existing = await (prisma as any).wander_listings.findFirst({
      where: { id: params.id, vendorId: auth.vendorId },
    });
    if (!existing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

    const body = await request.json();
    const data: any = {};

    const stringFields = ['title', 'shortDescription', 'description', 'duration', 'meetingPoint', 'pickupType', 'cancellationPolicy', 'cancellationNotes', 'priceType'];
    const jsonFields = ['highlights', 'customPlaces', 'itinerary', 'priceTiers', 'vehicleOptions', 'inclusions', 'exclusions', 'images', 'guideLanguages', 'availableDays'];
    const numFields = ['basePrice', 'minGroupSize', 'maxGroupSize', 'advanceNoticeHours'];

    stringFields.forEach((f) => { if (body[f] !== undefined) data[f] = body[f]?.trim() || null; });
    jsonFields.forEach((f) => { if (body[f] !== undefined) data[f] = body[f] ? JSON.stringify(body[f]) : null; });
    numFields.forEach((f) => { if (body[f] !== undefined) data[f] = body[f] ? parseFloat(body[f]) : null; });

    if (body.categoryId !== undefined) data.categoryId = body.categoryId;
    if (body.experienceId !== undefined) data.experienceId = body.experienceId || null;
    if (body.mainLocationId !== undefined) data.mainLocationId = body.mainLocationId;
    if (body.status !== undefined) data.status = body.status;
    if (body.requireAdvancePayment !== undefined) data.requireAdvancePayment = Boolean(body.requireAdvancePayment);
    if (body.advancePaymentType !== undefined) data.advancePaymentType = body.advancePaymentType || null;
    if (body.advancePaymentValue !== undefined) data.advancePaymentValue = body.advancePaymentValue != null ? parseFloat(body.advancePaymentValue) : null;
    if (body.createMode === 'QUICK' || body.createMode === 'DETAILED') data.createMode = body.createMode;

    const listing = await (prisma as any).wander_listings.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(listing);
  } catch (error) {
    console.error('[Vendor Wander Listing PUT]', error);
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
  }
}

// DELETE - Delete listing (only if no quote requests)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) return NextResponse.json({ error: auth.error }, { status: 401 });

    const existing = await (prisma as any).wander_listings.findFirst({
      where: { id: params.id, vendorId: auth.vendorId },
      include: { _count: { select: { quoteRequests: true } } },
    });
    if (!existing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

    if (existing._count.quoteRequests > 0) {
      // Soft delete — set INACTIVE
      await (prisma as any).wander_listings.update({
        where: { id: params.id },
        data: { status: 'INACTIVE' },
      });
      return NextResponse.json({ success: true, message: 'Listing deactivated (has existing quote requests)' });
    }

    await (prisma as any).wander_listings.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Vendor Wander Listing DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
  }
}
