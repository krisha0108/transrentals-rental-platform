// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

export const dynamic = 'force-dynamic';

// GET — returns available drivers + fleet vehicles for assignment
export async function GET(request: NextRequest) {
  const auth = await getVendorAuth(request);
  if (!auth.authenticated || !auth.vendorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get('date'); // optional: filter drivers by availability on this date

  // ── Drivers ────────────────────────────────────────────────────────────
  const drivers = await prisma.vendor_staff.findMany({
    where: {
      vendorId: auth.vendorId,
      role: 'DRIVER',
      status: { in: ['ACTIVE', 'ON_LEAVE'] },
    },
    select: {
      id: true, name: true, phone: true, profilePhoto: true,
      status: true, licenseNumber: true, licenseExpiry: true,
    },
    orderBy: [{ status: 'asc' }, { name: 'asc' }],
  });

  let driversResult = drivers.map(d => ({
    ...d,
    isAvailable: d.status === 'ACTIVE',
    licenseExpired: d.licenseExpiry ? new Date(d.licenseExpiry) < new Date() : false,
  }));

  // If a date is provided, check attendance
  if (dateStr) {
    const checkDate = new Date(dateStr);
    checkDate.setHours(0, 0, 0, 0);
    const attendance = await prisma.staff_attendance.findMany({
      where: { staffId: { in: drivers.map(d => d.id) }, date: checkDate },
    });
    const attMap = new Map(attendance.map(a => [a.staffId, a]));
    driversResult = drivers.map(d => {
      const att = attMap.get(d.id);
      return {
        ...d,
        isAvailable: d.status === 'ACTIVE' && (!att || att.status === 'PRESENT'),
        attendanceStatus: att?.status ?? null,
        licenseExpired: d.licenseExpiry ? new Date(d.licenseExpiry) < new Date() : false,
      };
    });
  }

  // ── Fleet vehicles ─────────────────────────────────────────────────────
  const vehicles = await prisma.vendor_fleets.findMany({
    where: { vendorId: auth.vendorId, isActive: true },
    select: {
      id: true,
      vehicleName: true,
      registrationNumber: true,
      color: true,
      fuelType: true,
      seatingCapacity: true,
      isAvailable: true,
      vehicle_models: { select: { name: true } },
      services: { select: { name: true, slug: true } },
    },
    orderBy: [{ isAvailable: 'desc' }, { vehicleName: 'asc' }],
  });

  const vehiclesResult = vehicles.map(v => ({
    id: v.id,
    displayName: v.vehicleName || v.vehicle_models?.name || 'Vehicle',
    registrationNumber: v.registrationNumber,
    color: v.color,
    fuelType: v.fuelType,
    seatingCapacity: v.seatingCapacity,
    isAvailable: v.isAvailable,
    serviceName: v.services?.name,
    serviceSlug: v.services?.slug,
  }));

  return NextResponse.json({
    drivers: driversResult,
    vehicles: vehiclesResult,
  });
}
