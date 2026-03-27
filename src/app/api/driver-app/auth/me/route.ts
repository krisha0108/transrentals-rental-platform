import { NextRequest, NextResponse } from 'next/server';
import { getDriverAppUser } from '@/lib/auth/driver-app-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const driver = await getDriverAppUser(request);
  if (!driver) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const { password: _, ...driverData } = driver;

  return NextResponse.json({ success: true, driver: driverData });
}
