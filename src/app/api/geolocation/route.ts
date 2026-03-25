import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/reverse';

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get('lat');
  const lon = request.nextUrl.searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json(
      { error: 'Latitude and longitude are required' },
      { status: 400 }
    );
  }

  const url = `${NOMINATIM_BASE_URL}?format=json&lat=${encodeURIComponent(
    lat
  )}&lon=${encodeURIComponent(lon)}&zoom=10&addressdetails=1`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TransRentals.com - location lookup',
        'Accept-Language': 'en',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Reverse geocoding failed', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected reverse geocoding error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
