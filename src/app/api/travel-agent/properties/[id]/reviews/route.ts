import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// PUBLIC — no auth. Reviews for a published property, newest first. Mirrors
// /api/agent/[slug]'s own "blocked agent/unpublished property looks like it
// doesn't exist" rule rather than leaking review data for a listing nobody
// can otherwise see.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    const property = await prisma.travel_agent_properties.findUnique({
      where: { id },
      select: { id: true, isPublic: true, isActive: true, rating: true, totalRatings: true },
    });

    if (!property || !property.isPublic || !property.isActive) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const reviews = await prisma.travel_agent_property_reviews.findMany({
      where: { propertyId: id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, customerName: true, rating: true, comment: true, createdAt: true },
    });

    return NextResponse.json({
      rating: property.rating,
      totalRatings: property.totalRatings,
      reviews,
    });
  } catch (error: any) {
    logger.error('Public property reviews GET error', error);
    return NextResponse.json(
      { error: 'Failed to load reviews', details: error?.message },
      { status: 500 },
    );
  }
}
