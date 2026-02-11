import { NextRequest, NextResponse } from 'next/server';
import { disconnectGSC } from '@/lib/integrations/google-search-console';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export const dynamic = 'force-dynamic';

/**
 * Disconnect Google Search Console integration
 * POST /api/integrations/gsc/disconnect
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const userRole = (session?.user as any)?.role;

    if (!session || (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await disconnectGSC();

    console.log('✅ Google Search Console disconnected');

    return NextResponse.json({
      success: true,
      message: 'Google Search Console disconnected successfully',
    });
  } catch (error) {
    console.error('GSC Disconnect Error:', error);
    return NextResponse.json({
      error: 'Failed to disconnect GSC',
    }, { status: 500 });
  }
}
