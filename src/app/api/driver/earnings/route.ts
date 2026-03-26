import { NextRequest, NextResponse } from 'next/server';
import { getDriver } from '@/lib/auth/driver-auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const driver = await getDriver(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'all';

  const isStaff = (driver as any).userType === 'vendor_staff';
  const staffPhone = (driver as any).phone;

  function makeDateFilter(field: string) {
    const now = new Date();
    if (period === 'today') {
      const start = new Date(now); start.setHours(0, 0, 0, 0);
      const end = new Date(now); end.setHours(23, 59, 59, 999);
      return { [field]: { gte: start, lte: end } };
    }
    if (period === 'week') {
      const start = new Date(now); start.setDate(now.getDate() - 7);
      return { [field]: { gte: start } };
    }
    if (period === 'month') {
      const start = new Date(now); start.setDate(1); start.setHours(0, 0, 0, 0);
      return { [field]: { gte: start } };
    }
    return {};
  }

  try {
    // ── 1. Chauffeur bookings ──────────────────────────────────────────────
    // vendor_staff: phone+vendorId OR self-accepted (acceptedDriverId)
    // independent: acceptedDriverId only
    const chauffeurCompletedWhere: any = isStaff && staffPhone
      ? {
          OR: [
            { driverPhone: staffPhone, acceptedVendorId: (driver as any).vendorId },
            { acceptedDriverId: driver.id },
          ],
          status: 'COMPLETED',
          ...makeDateFilter('completedAt'),
        }
      : { acceptedDriverId: driver.id, status: 'COMPLETED', ...makeDateFilter('completedAt') };

    const chauffeurCountWhere: any = isStaff && staffPhone
      ? { OR: [{ driverPhone: staffPhone, acceptedVendorId: (driver as any).vendorId }, { acceptedDriverId: driver.id }] }
      : { acceptedDriverId: driver.id };

    const chauffeurRows = await prisma.chauffeur_bookings.findMany({
      where: chauffeurCompletedWhere,
      select: {
        id: true, bookingNumber: true, tripType: true, carCategoryName: true,
        customerName: true, pickupCity: true, dropCity: true,
        pickupDate: true, driverBatta: true, grandTotal: true,
        completedAt: true, driverRating: true, acceptedDriverId: true,
      },
      orderBy: { completedAt: 'desc' },
    });

    let history: any[] = chauffeurRows.map(b => {
      // Self-accepted = driver pressed Accept themselves; vendor-assigned = vendor set driverPhone
      const isVendorAssigned = isStaff ? (b.acceptedDriverId !== driver.id) : false;
      const earnings = isVendorAssigned ? 0 : (b.driverBatta || b.grandTotal || 0);
      return {
        ...b, serviceType: 'Chauffeur',
        earnings,
        isVendorAssigned,
        rating: b.driverRating,
      };
    });

    let totalTripsAll = await prisma.chauffeur_bookings.count({ where: chauffeurCountWhere });
    let completedTripsAll = await prisma.chauffeur_bookings.count({ where: { ...chauffeurCountWhere, status: 'COMPLETED' } });
    let activeTripsAll = await prisma.chauffeur_bookings.count({
      where: { ...chauffeurCountWhere, status: { in: ['ACCEPTED', 'DRIVER_ASSIGNED', 'IN_PROGRESS'] } },
    });

    // ── 2. Staff-only: all other service tables ────────────────────────────
    if (isStaff && staffPhone) {
      const df = makeDateFilter('updatedAt');
      const vendorId = (driver as any).vendorId;

      // Bus
      const busBase = { driverPhone: staffPhone, vendorId };
      const busRows = await prisma.bus_bookings.findMany({
        where: { ...busBase, status: 'COMPLETED', ...df },
        select: { id: true, bookingNumber: true, tripType: true, customerName: true, pickupCity: true, dropCity: true, pickupDate: true, totalAmount: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      });
      history = [...history, ...busRows.map(b => ({ ...b, serviceType: 'Bus', earnings: 0, isVendorAssigned: true, grandTotal: b.totalAmount, completedAt: b.updatedAt }))];
      totalTripsAll += await prisma.bus_bookings.count({ where: busBase });
      completedTripsAll += await prisma.bus_bookings.count({ where: { ...busBase, status: 'COMPLETED' } });
      activeTripsAll += await prisma.bus_bookings.count({ where: { ...busBase, status: { in: ['CONFIRMED', 'VEHICLE_ASSIGNED', 'IN_PROGRESS'] } } });

      // Luxury
      const luxuryBase: any = { driverPhone: staffPhone, OR: [{ assignedVendorId: vendorId }, { acceptedVendorId: vendorId }] };
      const luxuryRows = await prisma.luxury_bookings.findMany({
        where: { ...luxuryBase, status: 'COMPLETED', ...df },
        select: { id: true, bookingNumber: true, tripType: true, customerName: true, pickupCity: true, dropCity: true, pickupDate: true, grandTotal: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      });
      history = [...history, ...luxuryRows.map(b => ({ ...b, serviceType: 'Luxury', earnings: 0, isVendorAssigned: true, completedAt: b.updatedAt }))];
      totalTripsAll += await prisma.luxury_bookings.count({ where: luxuryBase });
      completedTripsAll += await prisma.luxury_bookings.count({ where: { ...luxuryBase, status: 'COMPLETED' } });
      activeTripsAll += await prisma.luxury_bookings.count({ where: { ...luxuryBase, status: { in: ['CONFIRMED', 'DRIVER_ASSIGNED', 'IN_PROGRESS'] } } });

      // Truck
      const truckBase = { driverPhone: staffPhone, vendorId };
      const truckRows = await prisma.truck_bookings.findMany({
        where: { ...truckBase, status: 'COMPLETED', ...df },
        select: { id: true, bookingNumber: true, serviceType: true, customerName: true, pickupCity: true, dropCity: true, pickupDate: true, totalAmount: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      });
      history = [...history, ...truckRows.map(b => ({ ...b, serviceType: 'Truck', earnings: 0, isVendorAssigned: true, grandTotal: b.totalAmount, completedAt: b.updatedAt }))];
      totalTripsAll += await prisma.truck_bookings.count({ where: truckBase });
      completedTripsAll += await prisma.truck_bookings.count({ where: { ...truckBase, status: 'COMPLETED' } });
      activeTripsAll += await prisma.truck_bookings.count({ where: { ...truckBase, status: { in: ['CONFIRMED', 'VEHICLE_ASSIGNED', 'LOADING', 'IN_TRANSIT', 'UNLOADING'] } } });

      // Packers
      const packersRows = await prisma.packers_bookings.findMany({
        where: { teamLeaderPhone: staffPhone, status: 'COMPLETED', ...df },
        select: { id: true, bookingNumber: true, serviceType: true, customerName: true, pickupCity: true, dropCity: true, scheduledDate: true, totalAmount: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      });
      history = [...history, ...packersRows.map(b => ({ ...b, serviceType: 'Packers & Movers', earnings: 0, isVendorAssigned: true, grandTotal: b.totalAmount, pickupDate: b.scheduledDate, completedAt: b.updatedAt }))];
      totalTripsAll += await prisma.packers_bookings.count({ where: { teamLeaderPhone: staffPhone } });
      completedTripsAll += await prisma.packers_bookings.count({ where: { teamLeaderPhone: staffPhone, status: 'COMPLETED' } });
      activeTripsAll += await prisma.packers_bookings.count({ where: { teamLeaderPhone: staffPhone, status: { in: ['CONFIRMED', 'TEAM_ASSIGNED', 'PACKING', 'LOADING', 'IN_TRANSIT', 'UNLOADING', 'UNPACKING'] } } });

      // Equipment
      const equipRows = await prisma.equipment_bookings.findMany({
        where: { operatorPhone: staffPhone, status: 'COMPLETED', ...df },
        select: { id: true, bookingNumber: true, equipmentName: true, customerName: true, deliveryCity: true, startDate: true, totalAmount: true, operatorCharges: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      });
      history = [...history, ...equipRows.map(b => ({ ...b, serviceType: 'Equipment', earnings: b.operatorCharges || 0, isVendorAssigned: true, grandTotal: b.totalAmount, pickupCity: b.deliveryCity, pickupDate: b.startDate, completedAt: b.updatedAt }))];
      totalTripsAll += await prisma.equipment_bookings.count({ where: { operatorPhone: staffPhone } });
      completedTripsAll += await prisma.equipment_bookings.count({ where: { operatorPhone: staffPhone, status: 'COMPLETED' } });
      activeTripsAll += await prisma.equipment_bookings.count({ where: { operatorPhone: staffPhone, status: { in: ['CONFIRMED', 'DELIVERED', 'IN_USE', 'PICKUP_SCHEDULED'] } } });

      // B2B trips
      const b2bBase: any = { vendorId, OR: [{ driverStaffId: driver.id }, { driverPhone: staffPhone }] };
      const b2bRows = await prisma.b2b_trips.findMany({
        where: { ...b2bBase, status: 'COMPLETED', ...makeDateFilter('completedAt') },
        select: { id: true, tripCode: true, vehicleName: true, pickupLocation: true, scheduledDate: true, completedAt: true, updatedAt: true },
        orderBy: { completedAt: 'desc' },
      });
      history = [...history, ...b2bRows.map(b => ({ ...b, bookingNumber: b.tripCode, serviceType: 'B2B Trip', customerName: 'Corporate Client', pickupCity: b.pickupLocation, carCategoryName: b.vehicleName, earnings: 0, isVendorAssigned: true, pickupDate: b.scheduledDate, completedAt: b.completedAt || b.updatedAt }))];
      totalTripsAll += await prisma.b2b_trips.count({ where: b2bBase });
      completedTripsAll += await prisma.b2b_trips.count({ where: { ...b2bBase, status: 'COMPLETED' } });
      activeTripsAll += await prisma.b2b_trips.count({ where: { ...b2bBase, status: { in: ['PENDING', 'DRIVER_ARRIVED', 'STARTED'] } } });

      // Direct bookings
      const directRows = await prisma.vendor_direct_bookings.findMany({
        where: { assignedDriverId: driver.id, status: 'completed', ...df },
        select: { id: true, bookingNumber: true, serviceType: true, customerName: true, pickupLocation: true, pickupDate: true, totalAmount: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      });
      history = [...history, ...directRows.map(b => ({ ...b, serviceType: 'Direct Booking', earnings: 0, isVendorAssigned: true, grandTotal: b.totalAmount, pickupCity: b.pickupLocation, completedAt: b.updatedAt }))];
      totalTripsAll += await prisma.vendor_direct_bookings.count({ where: { assignedDriverId: driver.id } });
      completedTripsAll += await prisma.vendor_direct_bookings.count({ where: { assignedDriverId: driver.id, status: 'completed' } });
      activeTripsAll += await prisma.vendor_direct_bookings.count({ where: { assignedDriverId: driver.id, status: { in: ['confirmed', 'assigned', 'in_progress', 'vehicle_assigned'] } } });
    }

    // Sort history by completedAt desc
    history.sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());

    const totalEarnings = history.reduce((sum, t) => sum + (t.earnings || 0), 0);

    return NextResponse.json({
      success: true,
      earnings: { total: totalEarnings, trips: history.length },
      stats: { totalTrips: totalTripsAll, completedTrips: completedTripsAll, activeTrips: activeTripsAll },
      history,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
