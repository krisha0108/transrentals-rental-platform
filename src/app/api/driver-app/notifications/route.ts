import { NextRequest, NextResponse } from 'next/server';
import { getDriverAppUser } from '@/lib/auth/driver-app-auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const driver = await getDriverAppUser(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  // Check document expiry alerts
  const alerts: any[] = [];
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (driver.licenseExpiry && driver.licenseExpiry <= in30Days) {
    const daysLeft = Math.ceil((driver.licenseExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    alerts.push({
      type: 'DOCUMENT_EXPIRY',
      title: 'License Expiring Soon',
      message: `Your driving license expires in ${daysLeft} day(s)`,
      urgent: daysLeft <= 7,
    });
  }

  // Check vehicle document expiry
  const vehicles = await prisma.driver_vehicles.findMany({
    where: { driverId: driver.id, isActive: true },
    select: {
      id: true, make: true, model: true, registrationNo: true,
      insuranceExpiry: true, rcExpiry: true, fitnessExpiry: true, permitExpiry: true,
    },
  });

  for (const v of vehicles) {
    const label = `${v.make} ${v.model} (${v.registrationNo || 'No Reg'})`;
    const checks = [
      { field: v.insuranceExpiry, name: 'Insurance' },
      { field: v.rcExpiry, name: 'RC' },
      { field: v.fitnessExpiry, name: 'Fitness Certificate' },
      { field: v.permitExpiry, name: 'Permit' },
    ];
    for (const c of checks) {
      if (c.field && c.field <= in30Days) {
        const daysLeft = Math.ceil((c.field.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        alerts.push({
          type: 'DOCUMENT_EXPIRY',
          title: `${c.name} Expiring Soon`,
          message: `${label} — ${c.name} expires in ${daysLeft} day(s)`,
          urgent: daysLeft <= 7,
        });
      }
    }
  }

  return NextResponse.json({ success: true, alerts });
}

// Update FCM token
export async function POST(request: NextRequest) {
  const driver = await getDriverAppUser(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  const { fcmToken } = await request.json();
  if (!fcmToken) return NextResponse.json({ success: false, error: 'fcmToken required' }, { status: 400 });

  await prisma.drivers.update({ where: { id: driver.id }, data: { fcmToken } });
  return NextResponse.json({ success: true });
}
