import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { syncGA4Data, isGA4Connected } from '@/lib/integrations/google-analytics-4';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max execution time

/**
 * Sync Google Analytics 4 data to database
 * POST /api/integrations/ga4/sync
 *
 * Body:
 * {
 *   "propertyId": "123456789",
 *   "days": 30
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userRole = (session.user as any)?.role;
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check if GA4 is connected
    const isConnected = await isGA4Connected();
    if (!isConnected) {
      return NextResponse.json({
        error: 'Google Analytics 4 not connected',
        details: 'Please connect GA4 first from the integrations page',
      }, { status: 400 });
    }

    const body = await request.json();
    const { propertyId, days = 7 } = body;

    if (!propertyId) {
      return NextResponse.json({
        error: 'Property ID is required',
      }, { status: 400 });
    }

    // Validate days parameter
    if (days < 1 || days > 365) {
      return NextResponse.json({
        error: 'Days must be between 1 and 365',
      }, { status: 400 });
    }

    console.log(`🔄 Starting GA4 data sync for property ${propertyId}...`);

    const result = await syncGA4Data(propertyId, days);

    console.log('✅ GA4 data sync completed successfully');

    return NextResponse.json({
      success: true,
      message: 'GA4 data synced successfully',
      propertyId,
      days,
      result,
    });
  } catch (error) {
    console.error('GA4 Sync Error:', error);
    return NextResponse.json({
      error: 'Failed to sync GA4 data',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
