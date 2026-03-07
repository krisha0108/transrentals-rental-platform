// This route redirects to the b2b-quotes API for open bookings
// Keeping for backward compatibility
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Redirect to the b2b-quotes API with view=open
  const url = new URL('/api/vendor/b2b-quotes?view=open', request.url);
  const response = await fetch(url.toString(), {
    headers: request.headers,
  });
  const data = await response.json();
  return NextResponse.json(data);
}
