import { NextRequest, NextResponse } from 'next/server';
import { getDriverAppUser } from '@/lib/auth/driver-app-auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// Active statuses per booking type
const ACTIVE_STATUSES = {
  chauffeur: ['ACCEPTED', 'DRIVER_ASSIGNED', 'IN_PROGRESS'],
  bus: ['CONFIRMED', 'VEHICLE_ASSIGNED', 'IN_PROGRESS'],
  luxury: ['CONFIRMED', 'DRIVER_ASSIGNED', 'IN_PROGRESS'],
  truck: ['CONFIRMED', 'VEHICLE_ASSIGNED', 'LOADING', 'IN_TRANSIT', 'UNLOADING'],
  packers: ['CONFIRMED', 'TEAM_ASSIGNED', 'PACKING', 'LOADING', 'IN_TRANSIT', 'UNLOADING', 'UNPACKING'],
  equipment: ['CONFIRMED', 'DELIVERED', 'IN_USE', 'PICKUP_SCHEDULED'],
  b2b: ['PENDING', 'DRIVER_ARRIVED', 'STARTED'],
  direct: ['confirmed', 'assigned', 'vehicle_assigned', 'in_progress'],
};

function normalize(source: string, data: any): any {
  return { source, ...data };
}

export async function GET(request: NextRequest) {
  const driver = await getDriverAppUser(request);
  if (!driver) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter') || 'active'; // active | completed | all

  const isStaff = (driver as any).userType === 'vendor_staff';
  const staffPhone = (driver as any).phone;

  try {
    const bookings: any[] = [];

    // ── 1. CHAUFFEUR BOOKINGS ──────────────────────────────────────────────
    // vendor_staff: assigned by phone+vendorId (same as driver web portal)
    // independent driver: assigned by acceptedDriverId
    {
      const where: any = isStaff && staffPhone
        ? { driverPhone: staffPhone, acceptedVendorId: (driver as any).vendorId }
        : { acceptedDriverId: driver.id };
      if (filter === 'active') where.status = { in: ACTIVE_STATUSES.chauffeur };
      else if (filter === 'completed') where.status = 'COMPLETED';

      const rows = await prisma.chauffeur_bookings.findMany({
        where, orderBy: { pickupDate: 'asc' },
        select: {
          id: true, bookingNumber: true, tripType: true, carCategoryName: true,
          customerName: true, customerPhone: true, customerEmail: true,
          pickupCity: true, dropCity: true, pickupAddress: true, dropAddress: true,
          pickupDate: true, pickupTime: true, returnDate: true, returnTime: true,
          totalDays: true, totalHours: true,
          localPackageHours: true, localPackageKm: true,
          flightNumber: true, terminalNumber: true, airportName: true,
          estimatedDistance: true, driverBatta: true, grandTotal: true,
          paidAmount: true, remainingPayment: true,
          customerNotes: true,
          status: true, vehicleNumber: true, vehicleModel: true,
          tripStartOtp: true, tripStartedAt: true, completedAt: true,
          driverAssignedAt: true, acceptedAt: true,
          driverRating: true, driverReview: true, createdAt: true,
        },
      });

      rows.forEach(b => bookings.push(normalize('chauffeur', {
        id: b.id, bookingNumber: b.bookingNumber,
        serviceType: 'Chauffeur', serviceLabel: b.tripType,
        carCategoryName: b.carCategoryName,
        customerName: b.customerName, customerPhone: b.customerPhone, customerEmail: b.customerEmail,
        pickupCity: b.pickupCity, dropCity: b.dropCity,
        pickupAddress: b.pickupAddress, dropAddress: b.dropAddress,
        pickupDate: b.pickupDate, pickupTime: b.pickupTime,
        returnDate: b.returnDate, returnTime: b.returnTime,
        totalDays: b.totalDays, totalHours: b.totalHours,
        localPackageHours: b.localPackageHours, localPackageKm: b.localPackageKm,
        flightNumber: b.flightNumber, terminalNumber: b.terminalNumber, airportName: b.airportName,
        estimatedDistance: b.estimatedDistance,
        customerNotes: b.customerNotes,
        earnings: b.driverBatta, grandTotal: b.grandTotal,
        paidAmount: b.paidAmount, remainingPayment: b.remainingPayment,
        status: b.status,
        vehicleNumber: b.vehicleNumber, vehicleModel: b.vehicleModel,
        hasOtp: !!b.tripStartOtp, tripStartOtp: b.tripStartOtp,
        tripStartedAt: b.tripStartedAt, completedAt: b.completedAt,
        assignedAt: b.driverAssignedAt || b.acceptedAt,
        rating: b.driverRating, review: b.driverReview, createdAt: b.createdAt,
      })));
    }

    // ── For vendor_staff only: all assigned bookings from all service tables ──
    if (isStaff && staffPhone) {

      // ── 2. BUS BOOKINGS (phone-based) ─────────────────────────────────────
      {
        const where: any = { driverPhone: staffPhone, vendorId: (driver as any).vendorId };
        if (filter === 'active') where.status = { in: ACTIVE_STATUSES.bus };
        else if (filter === 'completed') where.status = 'COMPLETED';

        const rows = await prisma.bus_bookings.findMany({
          where, orderBy: { pickupDate: 'asc' },
          select: {
            id: true, bookingNumber: true, tripType: true, vehicleName: true,
            customerName: true, customerPhone: true,
            pickupCity: true, dropCity: true, pickupAddress: true, dropAddress: true,
            pickupDate: true, pickupTime: true, returnDate: true,
            totalAmount: true, status: true,
            vehicleNumber: true, vehicleModel: true, createdAt: true,
          },
        });

        rows.forEach(b => bookings.push(normalize('bus', {
          id: b.id, bookingNumber: b.bookingNumber,
          serviceType: 'Bus', serviceLabel: `${b.tripType} — ${b.vehicleName}`,
          carCategoryName: b.vehicleName,
          customerName: b.customerName, customerPhone: b.customerPhone,
          pickupCity: b.pickupCity, dropCity: b.dropCity,
          pickupAddress: b.pickupAddress, dropAddress: b.dropAddress,
          pickupDate: b.pickupDate, pickupTime: b.pickupTime, returnDate: b.returnDate,
          earnings: null, grandTotal: b.totalAmount,
          status: b.status,
          vehicleNumber: b.vehicleNumber, vehicleModel: b.vehicleModel,
          hasOtp: false, createdAt: b.createdAt,
        })));
      }

      // ── 3. LUXURY BOOKINGS (phone-based) ──────────────────────────────────
      {
        const where: any = {
          driverPhone: staffPhone,
          OR: [{ assignedVendorId: (driver as any).vendorId }, { acceptedVendorId: (driver as any).vendorId }],
        };
        if (filter === 'active') where.status = { in: ACTIVE_STATUSES.luxury };
        else if (filter === 'completed') where.status = 'COMPLETED';

        const rows = await prisma.luxury_bookings.findMany({
          where, orderBy: { pickupDate: 'asc' },
          select: {
            id: true, bookingNumber: true, tripType: true, carCategoryName: true,
            customerName: true, customerPhone: true, customerEmail: true,
            pickupCity: true, dropCity: true, pickupAddress: true, dropAddress: true,
            venueName: true,
            pickupDate: true, pickupTime: true, returnDate: true, returnTime: true,
            totalDays: true, totalHours: true,
            eventType: true, occasion: true,
            preferredBrands: true, preferredModels: true,
            needDecoration: true, decorationType: true,
            needChauffeur: true, chauffeurAttire: true,
            customerNotes: true,
            grandTotal: true, status: true,
            vehicleNumber: true, vehicleModel: true, vehicleBrand: true, vehicleColor: true,
            tripStartOtp: true, tripStartedAt: true, completedAt: true,
            acceptedAt: true, driverRating: true, createdAt: true,
          },
        });

        rows.forEach(b => bookings.push(normalize('luxury', {
          id: b.id, bookingNumber: b.bookingNumber,
          serviceType: 'Luxury', serviceLabel: b.tripType,
          carCategoryName: b.carCategoryName || 'Luxury Vehicle',
          customerName: b.customerName, customerPhone: b.customerPhone, customerEmail: b.customerEmail,
          pickupCity: b.pickupCity, dropCity: b.dropCity,
          pickupAddress: b.pickupAddress, dropAddress: b.dropAddress,
          venueName: b.venueName,
          pickupDate: b.pickupDate, pickupTime: b.pickupTime,
          returnDate: b.returnDate, returnTime: b.returnTime,
          totalDays: b.totalDays, totalHours: b.totalHours,
          eventType: b.eventType, occasion: b.occasion,
          preferredBrands: b.preferredBrands, preferredModels: b.preferredModels,
          needDecoration: b.needDecoration, decorationType: b.decorationType,
          needChauffeur: b.needChauffeur, chauffeurAttire: b.chauffeurAttire,
          customerNotes: b.customerNotes,
          earnings: null, grandTotal: b.grandTotal,
          status: b.status,
          vehicleNumber: b.vehicleNumber, vehicleModel: b.vehicleModel,
          vehicleBrand: b.vehicleBrand, vehicleColor: b.vehicleColor,
          hasOtp: !!b.tripStartOtp, tripStartOtp: b.tripStartOtp,
          tripStartedAt: b.tripStartedAt, completedAt: b.completedAt,
          assignedAt: b.acceptedAt,
          rating: b.driverRating, createdAt: b.createdAt,
        })));
      }

      // ── 4. TRUCK BOOKINGS (phone-based, same as driver web portal) ───────────
      {
        const where: any = { driverPhone: staffPhone, vendorId: (driver as any).vendorId };
        if (filter === 'active') where.status = { in: ACTIVE_STATUSES.truck };
        else if (filter === 'completed') where.status = 'COMPLETED';

        const rows = await prisma.truck_bookings.findMany({
          where, orderBy: { pickupDate: 'asc' },
          select: {
            id: true, bookingNumber: true, serviceType: true, vehicleName: true,
            customerName: true, customerPhone: true,
            pickupCity: true, dropCity: true, pickupAddress: true, dropAddress: true,
            pickupDate: true, pickupTime: true,
            totalAmount: true, status: true,
            vehicleNumber: true, createdAt: true,
          },
        });

        rows.forEach(b => bookings.push(normalize('truck', {
          id: b.id, bookingNumber: b.bookingNumber,
          serviceType: 'Truck', serviceLabel: `${b.serviceType} — ${b.vehicleName}`,
          carCategoryName: b.vehicleName,
          customerName: b.customerName, customerPhone: b.customerPhone,
          pickupCity: b.pickupCity, dropCity: b.dropCity,
          pickupAddress: b.pickupAddress, dropAddress: b.dropAddress,
          pickupDate: b.pickupDate, pickupTime: b.pickupTime,
          earnings: null, grandTotal: b.totalAmount,
          status: b.status,
          vehicleNumber: b.vehicleNumber,
          hasOtp: false, createdAt: b.createdAt,
        })));
      }

      // ── 5. PACKERS BOOKINGS (phone-based, scheduledDate as pickup) ────────
      {
        const where: any = { teamLeaderPhone: staffPhone };
        if (filter === 'active') where.status = { in: ACTIVE_STATUSES.packers };
        else if (filter === 'completed') where.status = 'COMPLETED';

        const rows = await prisma.packers_bookings.findMany({
          where, orderBy: { scheduledDate: 'asc' },
          select: {
            id: true, bookingNumber: true, serviceType: true,
            customerName: true, customerPhone: true,
            pickupCity: true, dropCity: true, pickupAddress: true, dropAddress: true,
            scheduledDate: true, scheduledTime: true,
            totalAmount: true, status: true, teamSize: true, createdAt: true,
          },
        });

        rows.forEach(b => bookings.push(normalize('packers', {
          id: b.id, bookingNumber: b.bookingNumber,
          serviceType: 'Packers & Movers', serviceLabel: b.serviceType,
          carCategoryName: `Team of ${b.teamSize || '?'}`,
          customerName: b.customerName, customerPhone: b.customerPhone,
          pickupCity: b.pickupCity, dropCity: b.dropCity,
          pickupAddress: b.pickupAddress, dropAddress: b.dropAddress,
          pickupDate: b.scheduledDate, pickupTime: b.scheduledTime,
          earnings: null, grandTotal: b.totalAmount,
          status: b.status,
          hasOtp: false, createdAt: b.createdAt,
        })));
      }

      // ── 6. EQUIPMENT BOOKINGS (phone-based, startDate as pickup) ──────────
      {
        const where: any = { operatorPhone: staffPhone };
        if (filter === 'active') where.status = { in: ACTIVE_STATUSES.equipment };
        else if (filter === 'completed') where.status = 'COMPLETED';

        const rows = await prisma.equipment_bookings.findMany({
          where, orderBy: { startDate: 'asc' },
          select: {
            id: true, bookingNumber: true, equipmentName: true, equipmentType: true,
            customerName: true, customerPhone: true,
            deliveryCity: true, deliveryAddress: true,
            startDate: true, endDate: true,
            totalAmount: true, operatorCharges: true, status: true, createdAt: true,
          },
        });

        rows.forEach(b => bookings.push(normalize('equipment', {
          id: b.id, bookingNumber: b.bookingNumber,
          serviceType: 'Equipment', serviceLabel: b.equipmentType,
          carCategoryName: b.equipmentName,
          customerName: b.customerName, customerPhone: b.customerPhone,
          pickupCity: b.deliveryCity, dropCity: null,
          pickupAddress: b.deliveryAddress, dropAddress: null,
          pickupDate: b.startDate, returnDate: b.endDate,
          earnings: b.operatorCharges || null, grandTotal: b.totalAmount,
          status: b.status,
          hasOtp: false, createdAt: b.createdAt,
        })));
      }

      // ── 7. B2B TRIPS (by driverStaffId OR driverPhone + vendorId) ─────────
      {
        const where: any = {
          vendorId: (driver as any).vendorId,
          OR: [{ driverStaffId: driver.id }, { driverPhone: staffPhone }],
        };
        if (filter === 'active') where.status = { in: ACTIVE_STATUSES.b2b };
        else if (filter === 'completed') where.status = 'COMPLETED';

        const rows = await prisma.b2b_trips.findMany({
          where, orderBy: { scheduledDate: 'asc' },
          include: {
            booking: { select: { id: true, bookingNumber: true, customerName: true, customerPhone: true } },
            vehicle: { select: { vehicleName: true, registrationNumber: true } },
          },
        });

        rows.forEach(b => bookings.push(normalize('b2b', {
          id: b.id, bookingNumber: b.tripCode,
          serviceType: 'B2B Trip', serviceLabel: 'Corporate Trip',
          carCategoryName: b.vehicleName || b.vehicle?.vehicleName || 'Vehicle',
          customerName: b.booking?.customerName || 'Corporate Client',
          customerPhone: b.booking?.customerPhone || '',
          pickupCity: b.pickupLocation, dropCity: b.dropLocation,
          pickupAddress: b.pickupLocation, dropAddress: b.dropLocation,
          pickupDate: b.scheduledDate, pickupTime: b.scheduledTime,
          earnings: null, grandTotal: null,
          status: b.status,
          vehicleNumber: b.vehicleNumber || b.vehicle?.registrationNumber,
          vehicleModel: b.vehicleName || b.vehicle?.vehicleName || null,
          hasOtp: !!b.otp, tripStartOtp: b.otp,
          tripStartedAt: b.startedAt, completedAt: b.completedAt,
          hasOtp: !!b.otp, createdAt: b.createdAt,
        })));
      }

      // ── 8. VENDOR DIRECT BOOKINGS (by assignedDriverId) ───────────────────
      {
        const where: any = { assignedDriverId: driver.id };
        if (filter === 'active') where.status = { in: ACTIVE_STATUSES.direct };
        else if (filter === 'completed') where.status = 'completed';

        const rows = await prisma.vendor_direct_bookings.findMany({
          where, orderBy: { pickupDate: 'asc' },
          select: {
            id: true, bookingNumber: true, serviceType: true,
            customerName: true, customerPhone: true,
            pickupLocation: true, dropLocation: true,
            pickupDate: true, returnDate: true,
            totalAmount: true, status: true, assignedAt: true, createdAt: true,
            assignedVehicle: { select: { registrationNumber: true, vehicleName: true } },
          },
        });

        rows.forEach(b => bookings.push(normalize('direct', {
          id: b.id, bookingNumber: b.bookingNumber,
          serviceType: 'Direct Booking', serviceLabel: b.serviceType,
          carCategoryName: b.serviceType,
          customerName: b.customerName, customerPhone: b.customerPhone,
          pickupCity: b.pickupLocation || '', dropCity: b.dropLocation || '',
          pickupAddress: b.pickupLocation, dropAddress: b.dropLocation,
          pickupDate: b.pickupDate, returnDate: b.returnDate,
          earnings: null, grandTotal: b.totalAmount,
          status: b.status,
          vehicleNumber: b.assignedVehicle?.registrationNumber,
          vehicleModel: b.assignedVehicle?.vehicleName || null,
          hasOtp: false, assignedAt: b.assignedAt, createdAt: b.createdAt,
        })));
      }
    }

    // Sort: active → createdAt desc (newest first), completed → completedAt desc
    bookings.sort((a, b) => {
      if (filter === 'completed') {
        const da = new Date(a.completedAt || a.createdAt).getTime();
        const db = new Date(b.completedAt || b.createdAt).getTime();
        return db - da;
      }
      // active / all → newest created first
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return db - da;
    });

    return NextResponse.json({ success: true, bookings, filter });
  } catch (error: any) {
    console.error('Driver bookings error:', error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
