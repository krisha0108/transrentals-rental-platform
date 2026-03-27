import { NextRequest, NextResponse } from 'next/server';
import { getDriverAppUser } from '@/lib/auth/driver-app-auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

function normalize(source: string, data: any): any {
  return { source, ...data };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const driver = await getDriverAppUser(request);
  if (!driver) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source') || 'chauffeur';
  const id = params.id;

  try {
    let booking: any = null;

    if (source === 'chauffeur') {
      const b = await prisma.chauffeur_bookings.findUnique({
        where: { id },
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
      if (b) booking = normalize('chauffeur', {
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
        estimatedDistance: b.estimatedDistance, customerNotes: b.customerNotes,
        earnings: b.driverBatta, grandTotal: b.grandTotal,
        paidAmount: b.paidAmount, remainingPayment: b.remainingPayment,
        status: b.status,
        vehicleNumber: b.vehicleNumber, vehicleModel: b.vehicleModel,
        hasOtp: !!b.tripStartOtp, tripStartOtp: b.tripStartOtp,
        tripStartedAt: b.tripStartedAt, completedAt: b.completedAt,
        assignedAt: b.driverAssignedAt || b.acceptedAt,
        rating: b.driverRating, review: b.driverReview, createdAt: b.createdAt,
      });
    } else if (source === 'bus') {
      const b = await prisma.bus_bookings.findUnique({
        where: { id },
        select: {
          id: true, bookingNumber: true, tripType: true, vehicleName: true,
          customerName: true, customerPhone: true,
          pickupCity: true, dropCity: true, pickupAddress: true, dropAddress: true,
          pickupDate: true, pickupTime: true, returnDate: true,
          totalAmount: true, status: true,
          vehicleNumber: true, vehicleModel: true,
          tripStartOtp: true, tripStartedAt: true, createdAt: true,
        },
      });
      if (b) booking = normalize('bus', {
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
        hasOtp: !!b.tripStartOtp, tripStartOtp: b.tripStartOtp,
        tripStartedAt: b.tripStartedAt, createdAt: b.createdAt,
      });
    } else if (source === 'luxury') {
      const b = await prisma.luxury_bookings.findUnique({
        where: { id },
        select: {
          id: true, bookingNumber: true, tripType: true, carCategoryName: true,
          customerName: true, customerPhone: true, customerEmail: true,
          pickupCity: true, dropCity: true, pickupAddress: true, dropAddress: true,
          venueName: true, pickupDate: true, pickupTime: true, returnDate: true, returnTime: true,
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
      if (b) booking = normalize('luxury', {
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
        assignedAt: b.acceptedAt, rating: b.driverRating, createdAt: b.createdAt,
      });
    } else if (source === 'truck') {
      const b = await prisma.truck_bookings.findUnique({
        where: { id },
        select: {
          id: true, bookingNumber: true, serviceType: true, vehicleName: true,
          customerName: true, customerPhone: true,
          pickupCity: true, dropCity: true, pickupAddress: true, dropAddress: true,
          pickupDate: true, pickupTime: true,
          totalAmount: true, status: true, vehicleNumber: true, createdAt: true,
        },
      });
      if (b) booking = normalize('truck', {
        id: b.id, bookingNumber: b.bookingNumber,
        serviceType: 'Truck', serviceLabel: `${b.serviceType} — ${b.vehicleName}`,
        carCategoryName: b.vehicleName,
        customerName: b.customerName, customerPhone: b.customerPhone,
        pickupCity: b.pickupCity, dropCity: b.dropCity,
        pickupAddress: b.pickupAddress, dropAddress: b.dropAddress,
        pickupDate: b.pickupDate, pickupTime: b.pickupTime,
        earnings: null, grandTotal: b.totalAmount,
        status: b.status, vehicleNumber: b.vehicleNumber,
        hasOtp: false, createdAt: b.createdAt,
      });
    } else if (source === 'packers') {
      const b = await prisma.packers_bookings.findUnique({
        where: { id },
        select: {
          id: true, bookingNumber: true, serviceType: true,
          customerName: true, customerPhone: true,
          pickupCity: true, dropCity: true, pickupAddress: true, dropAddress: true,
          scheduledDate: true, scheduledTime: true,
          totalAmount: true, status: true, teamSize: true, createdAt: true,
        },
      });
      if (b) booking = normalize('packers', {
        id: b.id, bookingNumber: b.bookingNumber,
        serviceType: 'Packers & Movers', serviceLabel: b.serviceType,
        carCategoryName: `Team of ${b.teamSize || '?'}`,
        customerName: b.customerName, customerPhone: b.customerPhone,
        pickupCity: b.pickupCity, dropCity: b.dropCity,
        pickupAddress: b.pickupAddress, dropAddress: b.dropAddress,
        pickupDate: b.scheduledDate, pickupTime: b.scheduledTime,
        earnings: null, grandTotal: b.totalAmount,
        status: b.status, hasOtp: false, createdAt: b.createdAt,
      });
    } else if (source === 'equipment') {
      const b = await prisma.equipment_bookings.findUnique({
        where: { id },
        select: {
          id: true, bookingNumber: true, equipmentName: true, equipmentType: true,
          customerName: true, customerPhone: true,
          deliveryCity: true, deliveryAddress: true,
          startDate: true, endDate: true,
          totalAmount: true, operatorCharges: true, status: true, createdAt: true,
        },
      });
      if (b) booking = normalize('equipment', {
        id: b.id, bookingNumber: b.bookingNumber,
        serviceType: 'Equipment', serviceLabel: b.equipmentType,
        carCategoryName: b.equipmentName,
        customerName: b.customerName, customerPhone: b.customerPhone,
        pickupCity: b.deliveryCity, dropCity: null,
        pickupAddress: b.deliveryAddress, dropAddress: null,
        pickupDate: b.startDate, returnDate: b.endDate,
        earnings: b.operatorCharges || null, grandTotal: b.totalAmount,
        status: b.status, hasOtp: false, createdAt: b.createdAt,
      });
    } else if (source === 'b2b') {
      const b = await prisma.b2b_trips.findUnique({
        where: { id },
        include: {
          booking: { select: { bookingNumber: true, customerName: true, customerPhone: true, serviceType: true, companyName: true } },
          vehicle: { select: { vehicleName: true, registrationNumber: true } },
        },
      });
      if (b) booking = normalize('b2b', {
        id: b.id, bookingNumber: b.tripCode,
        serviceType: b.booking?.serviceType
          ? (b.booking.serviceType === 'self-drive' ? 'B2B Self Drive' : `B2B ${b.booking.serviceType.charAt(0).toUpperCase() + b.booking.serviceType.slice(1)}`)
          : 'B2B',
        serviceLabel: b.booking?.serviceType
          ? (b.booking.serviceType === 'self-drive' ? 'Self Drive' : b.booking.serviceType.charAt(0).toUpperCase() + b.booking.serviceType.slice(1))
          : 'Corporate',
        carCategoryName: b.vehicleName || b.vehicle?.vehicleName || 'Vehicle',
        customerName: b.booking?.companyName || b.booking?.customerName || 'Corporate Client',
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
        createdAt: b.createdAt,
      });
    } else if (source === 'direct') {
      const b = await prisma.vendor_direct_bookings.findUnique({
        where: { id },
        select: {
          id: true, bookingNumber: true, serviceType: true,
          customerName: true, customerPhone: true,
          pickupLocation: true, dropLocation: true,
          pickupDate: true, returnDate: true,
          totalAmount: true, status: true, assignedAt: true, createdAt: true,
          assignedVehicle: { select: { registrationNumber: true, vehicleName: true } },
        },
      });
      if (b) booking = normalize('direct', {
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
      });
    }

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    console.error('[booking GET]', error?.message);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
