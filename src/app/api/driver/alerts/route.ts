import { NextRequest, NextResponse } from 'next/server';
import { getDriver } from '@/lib/auth/driver-auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const driver = await getDriver(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  const alerts: any[] = [];
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const licenseExpiry = (driver as any).licenseExpiry;
  if (licenseExpiry && new Date(licenseExpiry) <= in30Days) {
    const daysLeft = Math.ceil((new Date(licenseExpiry).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    alerts.push({
      type: 'DOCUMENT_EXPIRY',
      title: 'License Expiring Soon',
      message: `Your driving license expires in ${daysLeft <= 0 ? 'has expired' : `${daysLeft} day(s)`}`,
      urgent: daysLeft <= 7,
    });
  }

  const isStaff = (driver as any).userType === 'vendor_staff';
  const vehicles = await prisma.driver_vehicles.findMany({
    where: isStaff ? { staffId: driver.id, isActive: true } : { driverId: driver.id, isActive: true },
    select: {
      make: true, model: true, registrationNo: true,
      insuranceExpiry: true, rcExpiry: true, fitnessExpiry: true, permitExpiry: true,
    },
  });

  for (const v of vehicles) {
    const label = `${v.make} ${v.model}${v.registrationNo ? ` (${v.registrationNo})` : ''}`;
    const checks = [
      { field: v.insuranceExpiry, name: 'Insurance' },
      { field: v.rcExpiry, name: 'RC' },
      { field: v.fitnessExpiry, name: 'Fitness Certificate' },
      { field: v.permitExpiry, name: 'Permit' },
    ];
    for (const c of checks) {
      if (c.field && new Date(c.field) <= in30Days) {
        const daysLeft = Math.ceil((new Date(c.field).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        alerts.push({
          type: 'DOCUMENT_EXPIRY',
          title: `${c.name} Expiring Soon`,
          message: `${label} — ${c.name} ${daysLeft <= 0 ? 'has expired' : `expires in ${daysLeft} day(s)`}`,
          urgent: daysLeft <= 7,
        });
      }
    }
  }

  return NextResponse.json({ success: true, alerts });
}
