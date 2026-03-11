// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get vendor earnings summary with service-wise breakdown
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    const { searchParams } = new URL(request.url);
    const serviceFilter = searchParams.get('service') || 'all';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // Get earnings from different booking types
    console.log('[Earnings API] Fetching bookings for vendorId:', vendorId);

    // Fetch each booking type with individual error handling
    let carBookings = [];
    let bikeBookings = [];
    let chauffeurBookings = [];
    let busBookings = [];
    let truckBookings = [];
    let packersBookings = [];
    let equipmentBookings = [];
    let luxuryBookings = [];

    try {
      carBookings = await prisma.car_bookings.findMany({
        where: {
          OR: [
            { acceptedVendorId: vendorId },
            { assignedVendorId: vendorId },
          ],
          status: { in: ['COMPLETED', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'ACCEPTED'] },
        },
        select: {
          id: true,
          bookingNumber: true,
          grandTotal: true,
          createdAt: true,
          status: true,
          customerName: true,
          pickupDate: true,
          totalDays: true,
          locations: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      console.log('[Earnings API] Car bookings fetched:', carBookings.length);
    } catch (error) {
      console.error('[Earnings API] Error fetching car bookings:', error);
    }

    try {
      bikeBookings = await prisma.bike_bookings.findMany({
        where: {
          OR: [
            { acceptedVendorId: vendorId },
            { assignedVendorId: vendorId },
          ],
          status: { in: ['COMPLETED', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'ACCEPTED'] },
        },
        select: {
          id: true,
          bookingNumber: true,
          totalAmount: true,
          createdAt: true,
          status: true,
          customerName: true,
          pickupDate: true,
          locations: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      console.log('[Earnings API] Bike bookings fetched:', bikeBookings.length);
    } catch (error) {
      console.error('[Earnings API] Error fetching bike bookings:', error);
    }

    try {
      chauffeurBookings = await prisma.chauffeur_bookings.findMany({
        where: {
          OR: [
            { acceptedVendorId: vendorId },
            { assignedVendorId: vendorId },
          ],
          status: { in: ['COMPLETED', 'IN_PROGRESS', 'DRIVER_ASSIGNED', 'ACCEPTED'] },
        },
        select: {
          id: true,
          bookingNumber: true,
          grandTotal: true,
          createdAt: true,
          status: true,
          customerName: true,
          pickupDate: true,
          pickupCity: true,
          dropCity: true,
          tripType: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      console.log('[Earnings API] Chauffeur bookings fetched:', chauffeurBookings.length);
    } catch (error) {
      console.error('[Earnings API] Error fetching chauffeur bookings:', error);
    }

    try {
      busBookings = await prisma.bus_bookings.findMany({
        where: {
          vendorId: vendorId,
          status: { in: ['COMPLETED', 'IN_PROGRESS', 'CONFIRMED', 'VEHICLE_ASSIGNED', 'ADVANCE_PAID'] },
        },
        select: {
          id: true,
          bookingNumber: true,
          totalAmount: true,
          createdAt: true,
          status: true,
          customerName: true,
          pickupDate: true,
          pickupCity: true,
          dropCity: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      console.log('[Earnings API] Bus bookings fetched:', busBookings.length);
    } catch (error) {
      console.error('[Earnings API] Error fetching bus bookings:', error);
    }

    try {
      truckBookings = await prisma.truck_bookings.findMany({
        where: {
          vendorId: vendorId,
          status: { in: ['COMPLETED', 'IN_TRANSIT', 'LOADING', 'UNLOADING', 'CONFIRMED', 'VEHICLE_ASSIGNED', 'ADVANCE_PAID'] },
        },
        select: {
          id: true,
          bookingNumber: true,
          totalAmount: true,
          createdAt: true,
          status: true,
          customerName: true,
          pickupDate: true,
          pickupCity: true,
          dropCity: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      console.log('[Earnings API] Truck bookings fetched:', truckBookings.length);
    } catch (error) {
      console.error('[Earnings API] Error fetching truck bookings:', error);
    }

    try {
      packersBookings = await prisma.packers_bookings.findMany({
        where: {
          vendorId: vendorId,
          status: { in: ['COMPLETED', 'IN_TRANSIT', 'PACKING', 'LOADING', 'UNLOADING', 'UNPACKING', 'CONFIRMED', 'TEAM_ASSIGNED', 'ADVANCE_PAID'] },
        },
        select: {
          id: true,
          bookingNumber: true,
          totalAmount: true,
          createdAt: true,
          status: true,
          customerName: true,
          scheduledDate: true,
          pickupCity: true,
          dropCity: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      console.log('[Earnings API] Packers bookings fetched:', packersBookings.length);
    } catch (error) {
      console.error('[Earnings API] Error fetching packers bookings:', error);
    }

    try {
      equipmentBookings = await prisma.equipment_bookings.findMany({
        where: {
          vendorId: vendorId,
          status: { in: ['COMPLETED', 'IN_USE', 'DELIVERED', 'CONFIRMED', 'ADVANCE_PAID'] },
        },
        select: {
          id: true,
          bookingNumber: true,
          totalAmount: true,
          createdAt: true,
          status: true,
          customerName: true,
          startDate: true,
          deliveryCity: true,
          equipmentCategory: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      console.log('[Earnings API] Equipment bookings fetched:', equipmentBookings.length);
    } catch (error) {
      console.error('[Earnings API] Error fetching equipment bookings:', error);
    }

    try {
      luxuryBookings = await prisma.luxury_bookings.findMany({
        where: {
          OR: [
            { acceptedVendorId: vendorId },
            { assignedVendorId: vendorId },
          ],
          status: { in: ['COMPLETED', 'IN_PROGRESS', 'DRIVER_ASSIGNED', 'ACCEPTED', 'CONFIRMED', 'ADVANCE_PAID'] },
        },
        select: {
          id: true,
          bookingNumber: true,
          grandTotal: true,
          createdAt: true,
          status: true,
          customerName: true,
          pickupDate: true,
          pickupCity: true,
          dropCity: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      console.log('[Earnings API] Luxury bookings fetched:', luxuryBookings.length);
    } catch (error) {
      console.error('[Earnings API] Error fetching luxury bookings:', error);
    }

    // Debug logs
    console.log('[Earnings API] Results:');
    console.log('  - Bike bookings:', bikeBookings.length);
    console.log('  - Car (Self-Drive) bookings:', carBookings.length);
    console.log('  - Car Rental (Chauffeur) bookings:', chauffeurBookings.length);
    console.log('  - Bus bookings:', busBookings.length);
    console.log('  - Truck bookings:', truckBookings.length);
    console.log('  - Packers bookings:', packersBookings.length);
    console.log('  - Equipment bookings:', equipmentBookings.length);
    console.log('  - Luxury bookings:', luxuryBookings.length);

    // Transform bookings with service info
    const transformedBookings = [
      ...carBookings.map(b => ({
        ...b,
        service: 'self-drive',
        serviceName: 'Self Drive',
        amount: b.grandTotal || 0,
        date: b.pickupDate || b.createdAt,
        location: b.locations?.name || 'N/A',
      })),
      ...bikeBookings.map(b => ({
        ...b,
        service: 'bike',
        serviceName: 'Bike Rental',
        amount: b.totalAmount || 0,
        date: b.pickupDate || b.createdAt,
        location: b.locations?.name || 'N/A',
      })),
      ...chauffeurBookings.map(b => ({
        ...b,
        service: 'car-rental',
        serviceName: 'Car Rental',
        amount: b.grandTotal || 0,
        date: b.pickupDate || b.createdAt,
        location: b.tripType === 'LOCAL' ? b.pickupCity : `${b.pickupCity || 'N/A'}${b.dropCity ? ` → ${b.dropCity}` : ''}`,
      })),
      ...busBookings.map(b => ({
        ...b,
        service: 'bus',
        serviceName: 'Bus Rental',
        amount: b.totalAmount || 0,
        date: b.pickupDate || b.createdAt,
        location: `${b.pickupCity || 'N/A'}${b.dropCity ? ` → ${b.dropCity}` : ''}`,
      })),
      ...truckBookings.map(b => ({
        ...b,
        service: 'truck',
        serviceName: 'Truck / Transporter',
        amount: b.totalAmount || 0,
        date: b.pickupDate || b.createdAt,
        location: `${b.pickupCity || 'N/A'}${b.dropCity ? ` → ${b.dropCity}` : ''}`,
      })),
      ...packersBookings.map(b => ({
        ...b,
        service: 'packers',
        serviceName: 'Packers & Movers',
        amount: b.totalAmount || 0,
        date: b.scheduledDate || b.createdAt,
        location: `${b.pickupCity || 'N/A'}${b.dropCity ? ` → ${b.dropCity}` : ''}`,
      })),
      ...equipmentBookings.map(b => ({
        ...b,
        service: 'equipment',
        serviceName: 'Equipment Rental',
        amount: b.totalAmount || 0,
        date: b.startDate || b.createdAt,
        location: b.deliveryCity || 'N/A',
      })),
      ...luxuryBookings.map(b => ({
        ...b,
        service: 'luxury',
        serviceName: 'Luxury Cars',
        amount: b.grandTotal || 0,
        date: b.pickupDate || b.createdAt,
        location: `${b.pickupCity || 'N/A'}${b.dropCity ? ` → ${b.dropCity}` : ''}`,
      })),
    ];

    // Filter by service if specified
    const filteredBookings = serviceFilter === 'all'
      ? transformedBookings
      : transformedBookings.filter(b => b.service === serviceFilter);

    // Calculate earnings
    const totalEarnings = filteredBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

    const todaysBookings = filteredBookings.filter(
      (b) => new Date(b.createdAt) >= today
    );
    const todaysEarnings = todaysBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

    const thisMonthBookings = filteredBookings.filter(
      (b) => new Date(b.createdAt) >= startOfMonth
    );
    const thisMonthEarnings = thisMonthBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

    const lastMonthBookings = filteredBookings.filter(
      (b) => {
        const d = new Date(b.createdAt);
        return d >= startOfLastMonth && d <= endOfLastMonth;
      }
    );
    const lastMonthEarnings = lastMonthBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

    const completedBookings = filteredBookings.filter((b) => b.status === 'COMPLETED').length;
    const activeBookings = filteredBookings.filter((b) => b.status !== 'COMPLETED').length;

    // Calculate growth percentage
    const growth = lastMonthEarnings > 0
      ? ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings * 100).toFixed(1)
      : thisMonthEarnings > 0 ? 100 : 0;

    // Service-wise breakdown
    const serviceBreakdown = [
      {
        service: 'bike',
        serviceName: 'Bike Rental',
        earnings: bikeBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
        bookings: bikeBookings.length,
        completed: bikeBookings.filter(b => b.status === 'COMPLETED').length,
      },
      {
        service: 'self-drive',
        serviceName: 'Self Drive',
        earnings: carBookings.reduce((sum, b) => sum + (b.grandTotal || 0), 0),
        bookings: carBookings.length,
        completed: carBookings.filter(b => b.status === 'COMPLETED').length,
      },
      {
        service: 'car-rental',
        serviceName: 'Car Rental',
        earnings: chauffeurBookings.reduce((sum, b) => sum + (b.grandTotal || 0), 0),
        bookings: chauffeurBookings.length,
        completed: chauffeurBookings.filter(b => b.status === 'COMPLETED').length,
      },
      {
        service: 'bus',
        serviceName: 'Bus Rental',
        earnings: busBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
        bookings: busBookings.length,
        completed: busBookings.filter(b => b.status === 'COMPLETED').length,
      },
      {
        service: 'truck',
        serviceName: 'Truck / Transporter',
        earnings: truckBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
        bookings: truckBookings.length,
        completed: truckBookings.filter(b => b.status === 'COMPLETED').length,
      },
      {
        service: 'packers',
        serviceName: 'Packers & Movers',
        earnings: packersBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
        bookings: packersBookings.length,
        completed: packersBookings.filter(b => b.status === 'COMPLETED').length,
      },
      {
        service: 'equipment',
        serviceName: 'Equipment Rental',
        earnings: equipmentBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
        bookings: equipmentBookings.length,
        completed: equipmentBookings.filter(b => b.status === 'COMPLETED').length,
      },
      {
        service: 'luxury',
        serviceName: 'Luxury Cars',
        earnings: luxuryBookings.reduce((sum, b) => sum + (b.grandTotal || 0), 0),
        bookings: luxuryBookings.length,
        completed: luxuryBookings.filter(b => b.status === 'COMPLETED').length,
      },
    ].filter(s => s.bookings > 0); // Only show services with bookings

    return NextResponse.json({
      success: true,
      earnings: {
        total: totalEarnings,
        today: todaysEarnings,
        thisMonth: thisMonthEarnings,
        lastMonth: lastMonthEarnings,
        growth: parseFloat(growth as string),
        pendingPayout: thisMonthEarnings * 0.85, // 85% after platform fee
      },
      bookings: {
        total: filteredBookings.length,
        completed: completedBookings,
        active: activeBookings,
        today: todaysBookings.length,
      },
      serviceBreakdown,
      bookingsList: filteredBookings.slice(0, 50), // Return top 50 bookings
    });
  } catch (error: any) {
    logger.error('Get vendor earnings error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch earnings', details: error?.message },
      { status: 500 }
    );
  }
}
