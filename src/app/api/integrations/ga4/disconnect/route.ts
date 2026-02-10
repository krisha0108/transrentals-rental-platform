import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { disconnectGA4 } from '@/lib/integrations/google-analytics-4';

export const dynamic = 'force-dynamic';

/**
 * Disconnect Google Analytics 4
 * POST /api/integrations/ga4/disconnect
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

    await disconnectGA4();

    console.log('✅ Google Analytics 4 disconnected successfully');

    return NextResponse.json({
      success: true,
      message: 'GA4 disconnected successfully',
    });
  } catch (error) {
    console.error('GA4 Disconnect Error:', error);
    return NextResponse.json({
      error: 'Failed to disconnect GA4',
    }, { status: 500 });
  }
}
