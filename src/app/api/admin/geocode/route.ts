import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

/**
 * Forward Geocoding API Route
 * Converts location name to latitude/longitude using OpenStreetMap Nominatim
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const country = searchParams.get('country') || 'India'; // Default to India

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required (min 2 characters)' },
        { status: 400 }
      );
    }

    // Build search query - append country for better results
    const searchQuery = `${query}, ${country}`;

    // Call Nominatim API for forward geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&addressdetails=1&limit=1`,
      {
        headers: {
          'User-Agent': 'TransRentals/1.0 (https://transrentals.in)',
          'Accept-Language': 'en',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Location not found',
        latitude: null,
        longitude: null,
      });
    }

    const result = data[0];

    return NextResponse.json({
      success: true,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      displayName: result.display_name,
      type: result.type,
      address: result.address || {},
    });
  } catch (error) {
    logger.error('Forward geocoding error', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to geocode location',
        latitude: null,
        longitude: null,
      },
      { status: 500 }
    );
  }
}
