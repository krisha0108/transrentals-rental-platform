import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { isGA4Connected, listGA4Properties } from '@/lib/integrations/google-analytics-4';

export const dynamic = 'force-dynamic';

/**
 * Get Google Analytics 4 connection status
 * GET /api/integrations/ga4/status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isConnected = await isGA4Connected();

    if (!isConnected) {
      return NextResponse.json({
        connected: false,
        properties: [],
      });
    }

    // Fetch available properties
    try {
      const properties = await listGA4Properties();

      return NextResponse.json({
        connected: true,
        properties: properties.map((prop: any) => ({
          name: prop.name,
          displayName: prop.displayName,
          propertyId: prop.name?.split('/').pop() || '',
          industryCategory: prop.industryCategory,
          timeZone: prop.timeZone,
        })),
      });
    } catch (error) {
      console.error('Failed to fetch GA4 properties:', error);
      return NextResponse.json({
        connected: true,
        properties: [],
        error: 'Failed to fetch properties',
      });
    }
  } catch (error) {
    console.error('GA4 Status Error:', error);
    return NextResponse.json({
      error: 'Failed to check GA4 status',
    }, { status: 500 });
  }
}
