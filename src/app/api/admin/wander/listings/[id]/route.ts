// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const listing = await (prisma as any).wander_listings.findUnique({
      where: { id: params.id },
      include: {
        vendor: { select: { id: true, businessName: true } },
        category: { select: { id: true, name: true, icon: true } },
        mainLocation: { select: { id: true, name: true, type: true } },
        experience: { select: { id: true, title: true } },
      },
    });

    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(listing);
  } catch (error) {
    console.error('[Admin Wander Listing GET by id]', error);
    return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      categoryId, subCategoryId, experienceId, mainLocationId,
      title, shortDescription, description, duration,
      highlights, basePrice, priceType, priceTiers, minGroupSize, maxGroupSize,
      customPlaces, itinerary, vehicleOptions, inclusions, exclusions,
      images, pickupType, meetingPoint, guideLanguages, availableDays,
      advanceNoticeHours, cancellationPolicy, cancellationNotes,
      tourStartDate, tourEndDate,
      requireAdvancePayment, advancePaymentType, advancePaymentValue,
      publish,
    } = body;

    if (!categoryId) return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    if (!mainLocationId) return NextResponse.json({ error: 'Main location is required' }, { status: 400 });
    if (!title?.trim()) return NextResponse.json({ error: 'Tour title is required' }, { status: 400 });
    if (!duration?.trim()) return NextResponse.json({ error: 'Duration is required' }, { status: 400 });

    const data: any = {
      categoryId,
      subCategoryId: subCategoryId || null,
      experienceId: experienceId || null,
      mainLocationId,
      title: title.trim(),
      shortDescription: shortDescription?.trim() || null,
      description: description?.trim() || null,
      duration: duration.trim(),
      highlights: highlights ? JSON.stringify(highlights) : null,
      basePrice: basePrice ? parseFloat(basePrice) : null,
      priceType: priceType || 'ON_REQUEST',
      minGroupSize: minGroupSize ? parseInt(minGroupSize) : 1,
      maxGroupSize: maxGroupSize ? parseInt(maxGroupSize) : null,
      customPlaces: customPlaces ? JSON.stringify(customPlaces) : null,
      itinerary: itinerary ? JSON.stringify(itinerary) : null,
      priceTiers: priceTiers ? JSON.stringify(priceTiers) : null,
      vehicleOptions: vehicleOptions ? JSON.stringify(vehicleOptions) : null,
      inclusions: inclusions ? JSON.stringify(inclusions) : null,
      exclusions: exclusions ? JSON.stringify(exclusions) : null,
      images: images ? JSON.stringify(images) : null,
      pickupType: pickupType || null,
      meetingPoint: meetingPoint?.trim() || null,
      guideLanguages: guideLanguages ? JSON.stringify(guideLanguages) : null,
      availableDays: availableDays ? JSON.stringify(availableDays) : null,
      advanceNoticeHours: advanceNoticeHours ? parseInt(advanceNoticeHours) : 24,
      cancellationPolicy: cancellationPolicy || 'MODERATE',
      cancellationNotes: cancellationNotes?.trim() || null,
      tourStartDate: tourStartDate ? new Date(tourStartDate) : null,
      tourEndDate: tourEndDate ? new Date(tourEndDate) : null,
      requireAdvancePayment: requireAdvancePayment === true,
      advancePaymentType: requireAdvancePayment ? (advancePaymentType || null) : null,
      advancePaymentValue: requireAdvancePayment && advancePaymentValue ? parseFloat(advancePaymentValue) : null,
    };

    if (publish !== undefined) {
      data.status = publish ? 'ACTIVE' : 'DRAFT';
    }

    const listing = await (prisma as any).wander_listings.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(listing);
  } catch (error) {
    console.error('[Admin Wander Listing PUT]', error);
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
  }
}
