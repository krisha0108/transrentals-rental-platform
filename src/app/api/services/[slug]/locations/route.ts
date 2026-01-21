import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Public endpoint to get/search locations enabled for a specific service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    // Handle both Promise and direct params (Next.js 14.2+ compatibility)
    const resolvedParams = 'then' in params ? await params : params;
    const { slug } = resolvedParams;

    // Get search query parameter
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Find the service by slug
    const service = await prisma.services.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found', locations: [] },
        { status: 404 }
      );
    }

    // Build where clause for location search
    const locationWhereClause: any = {
      isActive: true,
    };

    // Add search filter if query provided
    if (query && query.length >= 2) {
      locationWhereClause.OR = [
        { name: { contains: query } },
        { slug: { contains: query.toLowerCase().replace(/\s+/g, '-') } },
        { code: { contains: query } },
      ];
    }

    // Get enabled locations for this service from service_locations table
    // Filter out orphaned references by checking location exists and is active
    const service_locations = await prisma.service_locations.findMany({
      where: {
        serviceId: service.id,
        isActive: true,
        locations: locationWhereClause,
      },
      include: {
        locations: {
          select: {
            id: true,
            name: true,
            slug: true,
            code: true,
            type: true,
            image: true,
            latitude: true,
            longitude: true,
            isActive: true,
            locations: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      take: limit,
    });

    // Filter only active locations and transform the response
    // Note: Also filter out null locations (orphaned references from deleted locations)
    const locations = service_locations
      .filter((sl) => sl.locations && sl.locations.isActive)
      .map((sl) => ({
        id: sl.locations.id,
        name: sl.locations.name,
        slug: sl.locations.slug,
        code: sl.locations.code,
        type: sl.locations.type,
        image: sl.locations.image,
        latitude: sl.locations.latitude,
        longitude: sl.locations.longitude,
        state: sl.locations.locations?.name || null,
        displayName: sl.locations.type === 'AIRPORT' ? `${sl.locations.code} - ${sl.locations.name}` : sl.locations.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      success: true,
      service: {
        id: service.id,
        name: service.name,
        slug: service.slug,
      },
      locations,
      total: locations.length,
    });
  } catch (error: any) {
    logger.error('Service locations error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch locations', details: error?.message },
      { status: 500 }
    );
  }
}
