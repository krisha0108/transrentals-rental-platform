import { NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

/**
 * Reverse Geocoding API Route
 * Proxies requests to OpenStreetMap Nominatim to avoid CORS issues
 * Returns city and state for location detection
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json(
      { error: 'Missing lat or lon parameters' },
      { status: 400 }
    );
  }

  try {
    // Call Nominatim API from server (no CORS issues)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&zoom=10`,
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
    const address = data.address || {};

    // Extract city name - prioritize city, then district, then town
    const city =
      address.city ||
      address.state_district ||
      address.district ||
      address.town ||
      address.municipality ||
      address.county ||
      address.village ||
      '';

    // Extract state name
    const state = address.state || '';

    // Also get district for better matching
    const district = address.state_district || address.district || '';

    return NextResponse.json({
      success: true,
      city: city.trim(),
      state: state.trim(),
      district: district.trim(),
      fullAddress: data.display_name,
    });
  } catch (error) {
    logger.error('Reverse geocoding error', error);
    return NextResponse.json(
      { error: 'Failed to reverse geocode location' },
      { status: 500 }
    );
  }
}
