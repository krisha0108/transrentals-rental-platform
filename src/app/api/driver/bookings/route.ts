import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getDriver } from '@/lib/auth/driver-auth';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Helper to normalize phone for comparison (get last 10 digits)
function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}


// GET - Get driver's assigned bookings
export async function GET(request: NextRequest) {
  try {
    const driver = await getDriver(request);

    if (!driver) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    // ── Independent driver: only chauffeur bookings via acceptedDriverId ───
    if ((driver as any).userType === 'independent') {
      const { searchParams } = new URL(request.url);
      const filter = searchParams.get('filter') || 'active';

      const where: any = { acceptedDriverId: driver.id };
      if (filter === 'active') where.status = { in: ['ACCEPTED', 'DRIVER_ASSIGNED', 'IN_PROGRESS', 'STARTED'] };
      else if (filter === 'completed') where.status = 'COMPLETED';

      const rows = await prisma.chauffeur_bookings.findMany({
        where, orderBy: { pickupDate: 'asc' },
        select: {
          id: true, bookingNumber: true, tripType: true, carCategoryName: true,
          customerName: true, customerPhone: true,
          pickupCity: true, dropCity: true, pickupAddress: true, dropAddress: true,
          pickupDate: true, pickupTime: true, returnDate: true,
          grandTotal: true, driverBatta: true, status: true,
          vehicleNumber: true, vehicleModel: true,
          tripStartOtp: true, tripStartedAt: true, completedAt: true,
          driverRating: true, createdAt: true,
        },
      });

      const bookings = rows.map(b => ({ ...b, serviceType: 'car' }));

      const allRows = await prisma.chauffeur_bookings.findMany({
        where: { acceptedDriverId: driver.id },
        select: { status: true, driverBatta: true },
      });
      const stats = {
        total: allRows.length,
        active: allRows.filter(b => ['ACCEPTED', 'DRIVER_ASSIGNED', 'IN_PROGRESS', 'STARTED'].includes(b.status)).length,
        completed: allRows.filter(b => b.status === 'COMPLETED').length,
        totalEarnings: allRows.filter(b => b.status === 'COMPLETED').reduce((s, b) => s + (b.driverBatta || 0), 0),
      };

      return NextResponse.json({ success: true, bookings, stats, serviceType: 'car' });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const filter = searchParams.get('filter') || 'active'; // active, completed, all
    const serviceType = searchParams.get('serviceType') || 'all'; // car, bus, truck, all

    // Helper functions to build status filters
    const getCarStatusFilter = (filterType: string) => {
      if (filterType === 'active') {
        return { in: ['ACCEPTED', 'DRIVER_ASSIGNED', 'IN_PROGRESS'] };
      } else if (filterType === 'completed') {
        return 'COMPLETED';
      }
      return undefined;
    };

    const getBusStatusFilter = (filterType: string) => {
      if (filterType === 'active') {
        return { in: ['VEHICLE_ASSIGNED', 'IN_PROGRESS'] };
      } else if (filterType === 'completed') {
        return 'COMPLETED';
      }
      return undefined;
    };

    const getTruckStatusFilter = (filterType: string) => {
      if (filterType === 'active') {
        return { in: ['VEHICLE_ASSIGNED', 'LOADING', 'IN_TRANSIT', 'UNLOADING'] };
      } else if (filterType === 'completed') {
        return 'COMPLETED';
      }
      return undefined;
    };

    const getPackersStatusFilter = (filterType: string) => {
      if (filterType === 'active') {
        return { in: ['TEAM_ASSIGNED', 'PACKING', 'LOADING', 'IN_TRANSIT', 'UNLOADING', 'UNPACKING'] };
      } else if (filterType === 'completed') {
        return 'COMPLETED';
      }
      return undefined;
    };

    const getEquipmentStatusFilter = (filterType: string) => {
      if (filterType === 'active') {
        return { in: ['CONFIRMED', 'DELIVERED', 'IN_USE', 'PICKUP_SCHEDULED'] };
      } else if (filterType === 'completed') {
        return { in: ['RETURNED', 'COMPLETED'] };
      }
      return undefined;
    };

    const getLuxuryStatusFilter = (filterType: string) => {
      if (filterType === 'active') {
        return { in: ['DRIVER_ASSIGNED', 'IN_PROGRESS'] };
      } else if (filterType === 'completed') {
        return 'COMPLETED';
      }
      return undefined;
    };

    // Helper function to build date filter for today
    const getTodayFilter = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return { gte: today, lt: tomorrow };
    };

    let carBookings: any[] = [];
    let busBookings: any[] = [];
    let truckBookings: any[] = [];
    let packersBookings: any[] = [];
    let equipmentBookings: any[] = [];
    let luxuryBookings: any[] = [];
    let b2bBookings: any[] = [];
    let carStats = { total: 0, active: 0, completed: 0, totalEarnings: 0 };
    let busStats = { total: 0, active: 0, completed: 0, totalEarnings: 0 };
    let truckStats = { total: 0, active: 0, completed: 0, totalEarnings: 0 };
    let packersStats = { total: 0, active: 0, completed: 0, totalEarnings: 0 };
    let equipmentStats = { total: 0, active: 0, completed: 0, totalEarnings: 0 };
    let luxuryStats = { total: 0, active: 0, completed: 0, totalEarnings: 0 };
    let b2bStats = { total: 0, active: 0, completed: 0, totalEarnings: 0 };

    // Fetch car bookings if needed
    if (serviceType === 'car' || serviceType === 'all') {
      const statusFilter = getCarStatusFilter(filter);
      const todayFilter = filter === 'today' ? getTodayFilter() : undefined;
      const forcedStatus = status && status !== 'all' ? status : undefined;

      const vendorCondition: any = {
        driverPhone: driver.phone,
        acceptedVendorId: driver.vendorId,
        ...(forcedStatus ? { status: forcedStatus } : statusFilter ? { status: statusFilter } : {}),
        ...(todayFilter ? { pickupDate: todayFilter } : {}),
      };
      const selfAcceptedCondition: any = {
        acceptedDriverId: driver.id,
        ...(forcedStatus ? { status: forcedStatus } : statusFilter ? { status: statusFilter } : {}),
        ...(todayFilter ? { pickupDate: todayFilter } : {}),
      };

      carBookings = await prisma.chauffeur_bookings.findMany({
        where: { OR: [vendorCondition, selfAcceptedCondition] },
        orderBy: [{ pickupDate: 'asc' }, { pickupTime: 'asc' }],
        select: {
          id: true,
          bookingNumber: true,
          tripType: true,
          carCategory: true,
          carCategoryName: true,
          customerName: true,
          customerPhone: true,
          pickupCity: true,
          dropCity: true,
          pickupAddress: true,
          dropAddress: true,
          pickupDate: true,
          pickupTime: true,
          returnDate: true,
          returnTime: true,
          localPackageHours: true,
          localPackageKm: true,
          grandTotal: true,
          status: true,
          tripStartOtp: true,
          tripStartedAt: true,
          tripEndedAt: true,
          vehicleNumber: true,
          vehicleModel: true,
          driverBatta: true,
          createdAt: true,
          locations: { select: { id: true, name: true } },
        },
      });

      // Add serviceType and transform OTP to boolean
      carBookings = carBookings.map(b => ({
        ...b,
        serviceType: 'car',
        otpSent: !!b.tripStartOtp,
        tripStartOtp: undefined
      }));

      // Car stats
      const allCarBookings = await prisma.chauffeur_bookings.findMany({
        where: { OR: [{ driverPhone: driver.phone, acceptedVendorId: driver.vendorId }, { acceptedDriverId: driver.id }] },
        select: { status: true, driverBatta: true },
      });

      carStats = {
        total: allCarBookings.length,
        active: allCarBookings.filter(b => ['ACCEPTED', 'DRIVER_ASSIGNED', 'IN_PROGRESS'].includes(b.status)).length,
        completed: allCarBookings.filter(b => b.status === 'COMPLETED').length,
        totalEarnings: allCarBookings.filter(b => b.status === 'COMPLETED').reduce((sum, b) => sum + (b.driverBatta || 0), 0),
      };
    }

    // Fetch bus bookings if needed
    if (serviceType === 'bus' || serviceType === 'all') {
      const busWhereConditions: any = {
        driverPhone: driver.phone,
        vendorId: driver.vendorId,
      };

      const busStatusFilter = getBusStatusFilter(filter);
      if (busStatusFilter) {
        busWhereConditions.status = busStatusFilter;
      }
      if (filter === 'today') {
        busWhereConditions.pickupDate = getTodayFilter();
      }
      if (status && status !== 'all') {
        busWhereConditions.status = status;
      }

      busBookings = await prisma.bus_bookings.findMany({
        where: busWhereConditions,
        orderBy: [{ pickupDate: 'asc' }, { pickupTime: 'asc' }],
      });

      // Transform bus bookings to match car booking structure
      busBookings = busBookings.map(b => ({
        ...b,
        serviceType: 'bus',
        carCategoryName: b.vehicleName || b.vehicleCategory || 'Bus',
        grandTotal: b.totalAmount,
        driverBatta: 0, // Bus doesn't have driverBatta field currently
        otpSent: !!b.tripStartOtp,
        tripStartOtp: undefined
      }));

      // Bus stats
      const allBusBookings = await prisma.bus_bookings.findMany({
        where: { driverPhone: driver.phone, vendorId: driver.vendorId },
        select: { status: true, totalAmount: true },
      });

      busStats = {
        total: allBusBookings.length,
        active: allBusBookings.filter(b => ['VEHICLE_ASSIGNED', 'IN_PROGRESS'].includes(b.status)).length,
        completed: allBusBookings.filter(b => b.status === 'COMPLETED').length,
        totalEarnings: 0, // No driverBatta for bus currently
      };
    }

    // Fetch truck bookings if needed
    if (serviceType === 'truck' || serviceType === 'all') {
      const truckWhereConditions: any = {
        driverPhone: driver.phone,
        vendorId: driver.vendorId,
      };

      console.log('Driver truck query:', { phone: driver.phone, vendorId: driver.vendorId, filter });

      const truckStatusFilter = getTruckStatusFilter(filter);
      if (truckStatusFilter) {
        truckWhereConditions.status = truckStatusFilter;
      }
      if (filter === 'today') {
        truckWhereConditions.pickupDate = getTodayFilter();
      }
      if (status && status !== 'all') {
        truckWhereConditions.status = status;
      }

      console.log('Truck where conditions:', truckWhereConditions);
      truckBookings = await prisma.truck_bookings.findMany({
        where: truckWhereConditions,
        orderBy: [{ pickupDate: 'asc' }, { pickupTime: 'asc' }],
      });

      console.log('Truck bookings found:', truckBookings.length);

      // Transform truck bookings to match car booking structure
      truckBookings = truckBookings.map(b => ({
        ...b,
        serviceType: 'truck',
        carCategoryName: b.vehicleName || b.vehicleCategory || 'Truck',
        grandTotal: b.totalAmount,
        tripType: b.serviceType,
        driverBatta: 0,
        otpSent: !!b.loadingOtp,
        tripStartOtp: b.loadingOtp,
        tripStartedAt: b.loadingStartedAt,
        tripEndedAt: b.completedAt,
      }));

      // Truck stats
      const allTruckBookings = await prisma.truck_bookings.findMany({
        where: { driverPhone: driver.phone, vendorId: driver.vendorId },
        select: { status: true, totalAmount: true },
      });

      truckStats = {
        total: allTruckBookings.length,
        active: allTruckBookings.filter(b => ['VEHICLE_ASSIGNED', 'LOADING', 'IN_TRANSIT', 'UNLOADING'].includes(b.status)).length,
        completed: allTruckBookings.filter(b => b.status === 'COMPLETED').length,
        totalEarnings: 0,
      };
    }

    // Fetch packers bookings if needed (team leader acts as driver)
    if (serviceType === 'packers' || serviceType === 'all') {
      const packersWhereConditions: any = {
        teamLeaderPhone: driver.phone,
        vendorId: driver.vendorId,
      };

      const packersStatusFilter = getPackersStatusFilter(filter);
      if (packersStatusFilter) {
        packersWhereConditions.status = packersStatusFilter;
      }
      if (filter === 'today') {
        packersWhereConditions.scheduledDate = getTodayFilter();
      }
      if (status && status !== 'all') {
        packersWhereConditions.status = status;
      }

      packersBookings = await prisma.packers_bookings.findMany({
        where: packersWhereConditions,
        orderBy: [{ scheduledDate: 'asc' }, { scheduledTime: 'asc' }],
        select: {
          id: true,
          bookingNumber: true,
          serviceType: true,
          shiftingType: true,
          customerName: true,
          customerPhone: true,
          pickupCity: true,
          pickupAddress: true,
          dropCity: true,
          dropAddress: true,
          scheduledDate: true,
          scheduledTime: true,
          teamSize: true,
          vehicleNumbers: true,
          totalAmount: true,
          status: true,
          packingOtp: true,
          loadingOtp: true,
          deliveryOtp: true,
          packingStartedAt: true,
          completedAt: true,
          createdAt: true,
        },
      });

      // Transform packers bookings to match common structure
      packersBookings = packersBookings.map(b => ({
        ...b,
        serviceType: 'packers',
        carCategoryName: b.shiftingType,
        grandTotal: b.totalAmount,
        tripType: b.serviceType,
        pickupDate: b.scheduledDate,
        pickupTime: b.scheduledTime || '09:00',
        driverBatta: 0,
        otpSent: !!b.packingOtp,
        tripStartedAt: b.packingStartedAt,
        tripEndedAt: b.completedAt,
      }));

      // Packers stats
      const allPackersBookings = await prisma.packers_bookings.findMany({
        where: { teamLeaderPhone: driver.phone, vendorId: driver.vendorId },
        select: { status: true, totalAmount: true },
      });

      packersStats = {
        total: allPackersBookings.length,
        active: allPackersBookings.filter(b => ['TEAM_ASSIGNED', 'PACKING', 'LOADING', 'IN_TRANSIT', 'UNLOADING', 'UNPACKING'].includes(b.status)).length,
        completed: allPackersBookings.filter(b => b.status === 'COMPLETED').length,
        totalEarnings: 0,
      };
    }

    // Fetch equipment bookings if needed (operator acts as driver)
    if (serviceType === 'equipment' || serviceType === 'all') {
      // Normalize driver phone for matching
      const driverPhoneNormalized = normalizePhone(driver.phone);

      const equipmentWhereConditions: any = {
        vendorId: driver.vendorId,
        operatorPhone: { not: null }, // Fetch all with operator, filter by phone in JS
      };

      const equipmentStatusFilter = getEquipmentStatusFilter(filter);
      if (equipmentStatusFilter) {
        equipmentWhereConditions.status = equipmentStatusFilter;
      }
      if (filter === 'today') {
        equipmentWhereConditions.startDate = getTodayFilter();
      }
      if (status && status !== 'all') {
        equipmentWhereConditions.status = status;
      }

      // Debug: Log query conditions
      console.log('[Driver Equipment Debug]', {
        driverPhone: driver.phone,
        driverVendorId: driver.vendorId,
        filter,
        equipmentWhereConditions,
      });

      const allVendorEquipmentBookings = await prisma.equipment_bookings.findMany({
        where: equipmentWhereConditions,
        orderBy: [{ startDate: 'asc' }],
        select: {
          id: true,
          bookingNumber: true,
          equipmentCategory: true,
          equipmentType: true,
          equipmentName: true,
          equipmentModel: true,
          quantity: true,
          customerName: true,
          customerPhone: true,
          deliveryCity: true,
          deliveryAddress: true,
          startDate: true,
          endDate: true,
          rentalDays: true,
          totalAmount: true,
          status: true,
          deliveryOtp: true,
          returnOtp: true,
          deliveredAt2: true,
          returnedAt: true,
          completedAt: true,
          createdAt: true,
          operatorPhone: true,
          operatorName: true,
        },
      });

      // Debug: Show all vendor bookings with operators
      console.log('[Driver Equipment Debug] All vendor bookings:',
        allVendorEquipmentBookings.map(b => ({
          bookingNumber: b.bookingNumber,
          operatorPhone: b.operatorPhone,
          opPhoneNorm: normalizePhone(b.operatorPhone),
          driverPhoneNorm: driverPhoneNormalized,
          status: b.status,
        }))
      );

      // Filter by normalized phone match
      equipmentBookings = allVendorEquipmentBookings.filter(booking => {
        const bookingPhoneNormalized = normalizePhone(booking.operatorPhone);
        return bookingPhoneNormalized === driverPhoneNormalized;
      });

      console.log('[Driver Equipment Debug] Matched bookings count:', equipmentBookings.length);

      // Transform equipment bookings to match common structure
      equipmentBookings = equipmentBookings.map(b => ({
        ...b,
        serviceType: 'equipment',
        carCategoryName: b.equipmentName || b.equipmentType,
        grandTotal: b.totalAmount,
        tripType: b.equipmentCategory,
        pickupCity: b.deliveryCity,
        pickupAddress: b.deliveryAddress,
        dropCity: b.deliveryCity,
        pickupDate: b.startDate,
        pickupTime: '09:00',
        driverBatta: 0,
        otpSent: !!b.deliveryOtp,
        tripStartedAt: b.deliveredAt2,
        tripEndedAt: b.completedAt,
      }));

      // Equipment stats - use normalized phone matching
      const allVendorBookingsForStats = await prisma.equipment_bookings.findMany({
        where: { vendorId: driver.vendorId, operatorPhone: { not: null } },
        select: { status: true, totalAmount: true, operatorPhone: true },
      });
      const allEquipmentBookings = allVendorBookingsForStats.filter(b =>
        normalizePhone(b.operatorPhone) === driverPhoneNormalized
      );

      equipmentStats = {
        total: allEquipmentBookings.length,
        active: allEquipmentBookings.filter(b => ['CONFIRMED', 'DELIVERED', 'IN_USE', 'PICKUP_SCHEDULED'].includes(b.status)).length,
        completed: allEquipmentBookings.filter(b => ['RETURNED', 'COMPLETED'].includes(b.status)).length,
        totalEarnings: 0,
      };
    }

    // Fetch luxury car bookings if needed
    if (serviceType === 'luxury' || serviceType === 'all') {
      const luxuryWhereConditions: any = {
        driverPhone: driver.phone,
        OR: [
          { assignedVendorId: driver.vendorId },
          { acceptedVendorId: driver.vendorId },
        ],
      };

      const luxuryStatusFilter = getLuxuryStatusFilter(filter);
      if (luxuryStatusFilter) {
        luxuryWhereConditions.status = luxuryStatusFilter;
      }
      if (filter === 'today') {
        luxuryWhereConditions.pickupDate = getTodayFilter();
      }
      if (status && status !== 'all') {
        luxuryWhereConditions.status = status;
      }

      console.log('Driver luxury query:', { phone: driver.phone, vendorId: driver.vendorId, filter });

      luxuryBookings = await prisma.luxury_bookings.findMany({
        where: luxuryWhereConditions,
        orderBy: [{ pickupDate: 'asc' }, { pickupTime: 'asc' }],
      });

      console.log('Luxury bookings found:', luxuryBookings.length);

      // Transform luxury bookings to match common structure
      luxuryBookings = luxuryBookings.map(b => ({
        ...b,
        serviceType: 'luxury',
        tripDays: b.totalDays,
        vehicleName: `${b.vehicleBrand || ''} ${b.vehicleModel || ''}`.trim() || b.carCategoryName || 'Luxury Car',
        carCategoryName: b.carCategoryName || `${b.vehicleBrand || ''} ${b.vehicleModel || ''}`.trim() || b.carCategory || 'Luxury Car',
        driverBatta: 0,
        otpSent: !!b.tripStartOtp,
        tripStartOtp: undefined, // Hide OTP from response (driver generates it)
      }));

      // Luxury stats
      const allLuxuryBookings = await prisma.luxury_bookings.findMany({
        where: {
          driverPhone: driver.phone,
          OR: [
            { assignedVendorId: driver.vendorId },
            { acceptedVendorId: driver.vendorId },
          ],
        },
        select: { status: true, grandTotal: true },
      });

      luxuryStats = {
        total: allLuxuryBookings.length,
        active: allLuxuryBookings.filter(b => ['DRIVER_ASSIGNED', 'IN_PROGRESS'].includes(b.status)).length,
        completed: allLuxuryBookings.filter(b => b.status === 'COMPLETED').length,
        totalEarnings: 0,
      };
    }

    // Fetch B2B trips if needed
    if (serviceType === 'b2b' || serviceType === 'all') {
      const driverPhoneNormalized = normalizePhone(driver.phone);

      const b2bWhereConditions: any = {
        vendorId: driver.vendorId,
        OR: [
          { driverStaffId: driver.id },
          { driverPhone: driver.phone },
        ],
      };

      if (filter === 'active') {
        b2bWhereConditions.status = { in: ['PENDING', 'DRIVER_ARRIVED'] };
      } else if (filter === 'completed') {
        b2bWhereConditions.status = 'COMPLETED';
      }
      if (status && status !== 'all') {
        b2bWhereConditions.status = status;
      }

      b2bBookings = await prisma.b2b_trips.findMany({
        where: b2bWhereConditions,
        orderBy: [{ scheduledDate: 'asc' }, { scheduledTime: 'asc' }],
        include: {
          booking: {
            select: {
              bookingNumber: true, companyName: true, serviceType: true,
              tripType: true, customerName: true, customerPhone: true,
            }
          }
        },
      });

      // Transform B2B trips to match common booking structure
      b2bBookings = b2bBookings.map(t => ({
        ...t,
        id: t.id,
        bookingNumber: t.tripCode,
        serviceType: 'b2b',
        carCategoryName: `B2B ${t.booking?.serviceType || 'Car'} Rental`.replace(/^\w/, (c: string) => c.toUpperCase()),
        tripType: t.booking?.tripType || 'ONE_WAY',
        customerName: t.booking?.companyName || t.booking?.customerName || 'Corporate',
        customerPhone: t.booking?.customerPhone || '',
        pickupCity: t.pickupLocation,
        pickupAddress: t.pickupLocation,
        dropCity: t.dropLocation || '',
        pickupDate: t.scheduledDate,
        pickupTime: t.scheduledTime,
        grandTotal: 0,
        driverBatta: 0,
        otpSent: !!t.otp,
        tripStartOtp: undefined,
        tripStartedAt: t.startedAt,
        tripEndedAt: t.completedAt,
        status: t.status === 'PENDING' ? 'DRIVER_ASSIGNED' :
                t.status === 'DRIVER_ARRIVED' ? 'DRIVER_ASSIGNED' :
                t.status === 'STARTED' ? 'IN_PROGRESS' :
                t.status,
        b2bStatus: t.status, // keep original B2B status
        b2bTripCode: t.tripCode,
        b2bBookingNumber: t.booking?.bookingNumber,
      }));

      // B2B stats
      const allB2bTrips = await prisma.b2b_trips.findMany({
        where: {
          vendorId: driver.vendorId,
          OR: [
            { driverStaffId: driver.id },
            { driverPhone: driver.phone },
          ],
        },
        select: { status: true },
      });

      b2bStats = {
        total: allB2bTrips.length,
        active: allB2bTrips.filter(t => ['PENDING', 'DRIVER_ARRIVED', 'STARTED'].includes(t.status)).length,
        completed: allB2bTrips.filter(t => t.status === 'COMPLETED').length,
        totalEarnings: 0,
      };
    }

    // ── Vendor Direct Bookings (assignedDriverId) ─────────────────────────
    let directBookings: any[] = [];
    let directStats = { total: 0, active: 0, completed: 0, totalEarnings: 0 };
    {
      const directWhere: any = { assignedDriverId: driver.id };
      if (filter === 'active') directWhere.status = { in: ['confirmed', 'assigned', 'vehicle_assigned', 'in_progress'] };
      else if (filter === 'completed') directWhere.status = 'completed';

      const rows = await prisma.vendor_direct_bookings.findMany({
        where: directWhere,
        orderBy: { pickupDate: 'asc' },
        select: {
          id: true, bookingNumber: true, serviceType: true,
          customerName: true, customerPhone: true,
          pickupLocation: true, dropLocation: true,
          pickupDate: true, returnDate: true,
          totalAmount: true, status: true, assignedAt: true, createdAt: true,
          assignedVehicle: { select: { registrationNumber: true, vehicleName: true } },
        },
      });

      directBookings = rows.map(b => ({
        id: b.id, bookingNumber: b.bookingNumber,
        serviceType: 'direct', carCategoryName: b.serviceType,
        customerName: b.customerName, customerPhone: b.customerPhone,
        pickupCity: b.pickupLocation || '', dropCity: b.dropLocation || '',
        pickupAddress: b.pickupLocation, dropAddress: b.dropLocation,
        pickupDate: b.pickupDate, returnDate: b.returnDate,
        grandTotal: b.totalAmount, driverBatta: null, status: b.status,
        vehicleNumber: b.assignedVehicle?.registrationNumber,
        createdAt: b.createdAt,
      }));

      const allDirect = await prisma.vendor_direct_bookings.findMany({
        where: { assignedDriverId: driver.id },
        select: { status: true },
      });
      directStats = {
        total: allDirect.length,
        active: allDirect.filter(b => ['confirmed', 'assigned', 'vehicle_assigned', 'in_progress'].includes(b.status)).length,
        completed: allDirect.filter(b => b.status === 'completed').length,
        totalEarnings: 0,
      };
    }

    // Combine bookings based on service type
    let bookings: any[] = [];
    if (serviceType === 'car') {
      bookings = carBookings;
    } else if (serviceType === 'bus') {
      bookings = busBookings;
    } else if (serviceType === 'truck') {
      bookings = truckBookings;
    } else if (serviceType === 'packers') {
      bookings = packersBookings;
    } else if (serviceType === 'equipment') {
      bookings = equipmentBookings;
    } else if (serviceType === 'luxury') {
      bookings = luxuryBookings;
    } else if (serviceType === 'b2b') {
      bookings = b2bBookings;
    } else {
      bookings = [...carBookings, ...busBookings, ...truckBookings, ...packersBookings, ...equipmentBookings, ...luxuryBookings, ...b2bBookings, ...directBookings].sort((a, b) => {
        const dateA = new Date(a.pickupDate).getTime();
        const dateB = new Date(b.pickupDate).getTime();
        return dateA - dateB;
      });
    }

    // Combined stats
    const stats = {
      total: carStats.total + busStats.total + truckStats.total + packersStats.total + equipmentStats.total + luxuryStats.total + b2bStats.total + directStats.total,
      active: carStats.active + busStats.active + truckStats.active + packersStats.active + equipmentStats.active + luxuryStats.active + b2bStats.active + directStats.active,
      completed: carStats.completed + busStats.completed + truckStats.completed + packersStats.completed + equipmentStats.completed + luxuryStats.completed + b2bStats.completed + directStats.completed,
      totalEarnings: carStats.totalEarnings + busStats.totalEarnings + truckStats.totalEarnings + packersStats.totalEarnings + equipmentStats.totalEarnings + luxuryStats.totalEarnings + b2bStats.totalEarnings,
      carCount: carStats.total,
      busCount: busStats.total,
      truckCount: truckStats.total,
      packersCount: packersStats.total,
      equipmentCount: equipmentStats.total,
      luxuryCount: luxuryStats.total,
      b2bCount: b2bStats.total,
    };

    return NextResponse.json({
      success: true,
      bookings,
      stats,
      serviceType,
    });
  } catch (error: any) {
    logger.error('Get driver bookings error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bookings', details: error?.message },
      { status: 500 }
    );
  }
}
