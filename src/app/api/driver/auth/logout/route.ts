import { NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// POST - Driver logout
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Clear the driver token cookie
    response.cookies.set('driver-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    });

    return response;
  } catch (error: any) {
    logger.error('Driver logout error', error);
    return NextResponse.json(
      { success: false, error: 'Logout failed', details: error?.message },
      { status: 500 }
    );
  }
}
