// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vendorId = auth.vendorId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch ALL bookings in 2 batches of 4 (connection pool limit = 15, max 4 at a time)
    // Batch 1: bike, chauffeur, self-drive, bus
    const [bikeBookings, chauffeurBookings, selfDriveBookings, busBookings] = await Promise.all([
      prisma.bike_bookings.findMany({
        where: {
          OR: [
            { acceptedVendorId: vendorId },
            { assignedVendorId: vendorId },
          ],
          status: { in: ['COMPLETED', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'ACCEPTED'] },
        },
        select: { totalAmount: true, status: true, createdAt: true },
      }).catch(() => []),

      prisma.chauffeur_bookings.findMany({
        where: {
          OR: [
            { acceptedVendorId: vendorId },
            { assignedVendorId: vendorId },
          ],
          status: { in: ['COMPLETED', 'IN_PROGRESS', 'DRIVER_ASSIGNED', 'ACCEPTED'] },
        },
        select: { grandTotal: true, status: true, createdAt: true },
      }).catch(() => []),

      prisma.car_bookings.findMany({
        where: {
          OR: [
            { acceptedVendorId: vendorId },
            { assignedVendorId: vendorId },
          ],
          status: { in: ['COMPLETED', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'ACCEPTED'] },
        },
        select: { grandTotal: true, status: true, createdAt: true },
      }).catch(() => []),

      prisma.bus_bookings.findMany({
        where: {
          vendorId,
          status: { in: ['COMPLETED', 'IN_PROGRESS', 'CONFIRMED', 'VEHICLE_ASSIGNED', 'ADVANCE_PAID'] },
        },
        select: { totalAmount: true, status: true, createdAt: true },
      }).catch(() => []),
    ]);

    // Batch 2: luxury, packers, truck, equipment
    const [luxuryBookings, packersBookings, truckBookings, equipmentBookings] = await Promise.all([
      prisma.luxury_bookings.findMany({
        where: {
          OR: [
            { acceptedVendorId: vendorId },
            { assignedVendorId: vendorId },
          ],
          status: { in: ['COMPLETED', 'IN_PROGRESS', 'DRIVER_ASSIGNED', 'ACCEPTED', 'CONFIRMED', 'ADVANCE_PAID'] },
        },
        select: { grandTotal: true, status: true, createdAt: true },
      }).catch(() => []),

      prisma.packers_bookings.findMany({
        where: {
          vendorId,
          status: { in: ['COMPLETED', 'IN_TRANSIT', 'PACKING', 'LOADING', 'UNLOADING', 'UNPACKING', 'CONFIRMED', 'TEAM_ASSIGNED', 'ADVANCE_PAID'] },
        },
        select: { totalAmount: true, status: true, createdAt: true },
      }).catch(() => []),

      prisma.truck_bookings.findMany({
        where: {
          vendorId,
          status: { in: ['COMPLETED', 'IN_TRANSIT', 'LOADING', 'UNLOADING', 'CONFIRMED', 'VEHICLE_ASSIGNED', 'ADVANCE_PAID'] },
        },
        select: { totalAmount: true, status: true, createdAt: true },
      }).catch(() => []),

      prisma.equipment_bookings.findMany({
        where: {
          vendorId,
          status: { in: ['COMPLETED', 'IN_USE', 'DELIVERED', 'CONFIRMED', 'ADVANCE_PAID'] },
        },
        select: { totalAmount: true, status: true, createdAt: true },
      }).catch(() => []),
    ]);

    // Combine all bookings with service info (exactly like mobile app)
    const allBookings = [
      ...bikeBookings.map(b => ({ ...b, amount: b.totalAmount || 0, service: 'bike' })),
      ...chauffeurBookings.map(b => ({ ...b, amount: b.grandTotal || 0, service: 'chauffeur' })),
      ...selfDriveBookings.map(b => ({ ...b, amount: b.grandTotal || 0, service: 'self-drive' })),
      ...busBookings.map(b => ({ ...b, amount: b.totalAmount || 0, service: 'bus' })),
      ...luxuryBookings.map(b => ({ ...b, amount: b.grandTotal || 0, service: 'luxury' })),
      ...packersBookings.map(b => ({ ...b, amount: b.totalAmount || 0, service: 'packers' })),
      ...truckBookings.map(b => ({ ...b, amount: b.totalAmount || 0, service: 'truck' })),
      ...equipmentBookings.map(b => ({ ...b, amount: b.totalAmount || 0, service: 'equipment' })),
    ];

    // Filter for this month's bookings (by createdAt, like mobile app does)
    const thisMonthBookings = allBookings.filter(
      (b) => new Date(b.createdAt) >= startOfMonth
    );

    // Calculate this month's earnings
    const monthlyEarnings = thisMonthBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

    // Count completed bookings (all time, like mobile app)
    const completedBookings = allBookings.filter((b) => b.status === 'COMPLETED');
    const totalCompletedCount = completedBookings.length;

    // Service breakdown (this month only)
    const thisMonthByService = {
      bike: thisMonthBookings.filter(b => b.service === 'bike'),
      chauffeur: thisMonthBookings.filter(b => b.service === 'chauffeur'),
      selfDrive: thisMonthBookings.filter(b => b.service === 'self-drive'),
      bus: thisMonthBookings.filter(b => b.service === 'bus'),
      luxury: thisMonthBookings.filter(b => b.service === 'luxury'),
      packers: thisMonthBookings.filter(b => b.service === 'packers'),
      truck: thisMonthBookings.filter(b => b.service === 'truck'),
      equipment: thisMonthBookings.filter(b => b.service === 'equipment'),
    };

    const serviceBreakdown = [
      {
        service: 'Bike Rentals',
        icon: '🏍️',
        bookings: thisMonthByService.bike.length,
        revenue: thisMonthByService.bike.reduce((sum, b) => sum + b.amount, 0)
      },
      {
        service: 'Car Rentals',
        icon: '🚗',
        bookings: thisMonthByService.chauffeur.length,
        revenue: thisMonthByService.chauffeur.reduce((sum, b) => sum + b.amount, 0)
      },
      {
        service: 'Self-Drive',
        icon: '🔑',
        bookings: thisMonthByService.selfDrive.length,
        revenue: thisMonthByService.selfDrive.reduce((sum, b) => sum + b.amount, 0)
      },
      {
        service: 'Bus Rentals',
        icon: '🚌',
        bookings: thisMonthByService.bus.length,
        revenue: thisMonthByService.bus.reduce((sum, b) => sum + b.amount, 0)
      },
      {
        service: 'Luxury Rentals',
        icon: '💎',
        bookings: thisMonthByService.luxury.length,
        revenue: thisMonthByService.luxury.reduce((sum, b) => sum + b.amount, 0)
      },
      {
        service: 'Packers & Movers',
        icon: '📦',
        bookings: thisMonthByService.packers.length,
        revenue: thisMonthByService.packers.reduce((sum, b) => sum + b.amount, 0)
      },
      {
        service: 'Truck Transport',
        icon: '🚚',
        bookings: thisMonthByService.truck.length,
        revenue: thisMonthByService.truck.reduce((sum, b) => sum + b.amount, 0)
      },
      {
        service: 'Equipment Rental',
        icon: '⚙️',
        bookings: thisMonthByService.equipment.length,
        revenue: thisMonthByService.equipment.reduce((sum, b) => sum + b.amount, 0)
      },
    ].filter(s => s.bookings > 0 || s.revenue > 0);

    // Debug logs
    console.log('[Dashboard Stats] Total bookings fetched:', allBookings.length);
    console.log('[Dashboard Stats] Completed bookings (all time):', totalCompletedCount);
    console.log('[Dashboard Stats] This month bookings:', thisMonthBookings.length);
    console.log('[Dashboard Stats] This month earnings:', monthlyEarnings);
    console.log('[Dashboard Stats] Breakdown:');
    console.log('  - Bike: ' + thisMonthByService.bike.length + ' bookings');
    console.log('  - Chauffeur: ' + thisMonthByService.chauffeur.length + ' bookings');
    console.log('  - Self-Drive: ' + thisMonthByService.selfDrive.length + ' bookings');
    console.log('  - Bus: ' + thisMonthByService.bus.length + ' bookings');
    console.log('  - Luxury: ' + thisMonthByService.luxury.length + ' bookings');
    console.log('  - Packers: ' + thisMonthByService.packers.length + ' bookings');
    console.log('  - Truck: ' + thisMonthByService.truck.length + ' bookings');
    console.log('  - Equipment: ' + thisMonthByService.equipment.length + ' bookings');

    return NextResponse.json({
      success: true,
      stats: {
        monthlyEarnings,
        totalBookings: totalCompletedCount, // All time completed bookings (like mobile app)
        serviceBreakdown,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch vendor dashboard stats', error);
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats', details: error?.message },
      { status: 500 }
    );
  }
}
