// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';



export const dynamic = 'force-dynamic';

// GET - Fetch all bookings for vendor calendar
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const vendorId = auth.vendorId;
    const { searchParams } = new URL(request.url);

    // Get date range (default: current month, but extend to cover more)
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0, 23, 59, 59);

    console.log('Calendar API - VendorId:', vendorId);
    console.log('Calendar API - Date Range:', startDate, 'to', endDate);

    // Fetch bookings from all services
    const [
      carBookings,
      chauffeurBookings,
      busBookings,
      truckBookings,
      bikeBookings,
      luxuryBookings,
      packersBookings,
      equipmentBookings,
    ] = await Promise.all([
      // Car Bookings (Self-Drive)
      prisma.car_bookings.findMany({
        where: {
          OR: [
            { assignedVendorId: vendorId },
            { acceptedVendorId: vendorId },
          ],
          pickupDate: { gte: startDate, lte: endDate },
        },
        select: {
          id: true,
          bookingNumber: true,
          customerName: true,
          customerPhone: true,
          requestedVehicleName: true,
          assignedVehicleName: true,
          pickupDate: true,
          pickupTime: true,
          dropDate: true,
          dropTime: true,
          pickupAddress: true,
          dropAddress: true,
          locationName: true,
          status: true,
          grandTotal: true,
          paidAmount: true,
          paymentStatus: true,
        },
      }),

      // Chauffeur Bookings (Car Rental with Driver)
      prisma.chauffeur_bookings.findMany({
        where: {
          OR: [
            { assignedVendorId: vendorId },
            { acceptedVendorId: vendorId },
          ],
          pickupDate: { gte: startDate, lte: endDate },
        },
        select: {
          id: true,
          bookingNumber: true,
          customerName: true,
          customerPhone: true,
          carCategoryName: true,
          vehicle_models: true,
          pickupDate: true,
          pickupTime: true,
          returnDate: true,
          returnTime: true,
          pickupCity: true,
          pickupAddress: true,
          dropCity: true,
          dropAddress: true,
          tripType: true,
          status: true,
          grandTotal: true,
          paidAmount: true,
          paymentStatus: true,
          driverName: true,
          driverPhone: true,
          locationName: true,
        },
      }),

      // Bus Bookings
      prisma.bus_bookings.findMany({
        where: {
          vendorId: vendorId,
          pickupDate: { gte: startDate, lte: endDate },
        },
        select: {
          id: true,
          bookingNumber: true,
          customerName: true,
          customerPhone: true,
          vehicleName: true,
          vehicleNumber: true,
          vehicle_models: true,
          pickupDate: true,
          pickupTime: true,
          returnDate: true,
          returnTime: true,
          pickupCity: true,
          pickupAddress: true,
          dropCity: true,
          dropAddress: true,
          tripType: true,
          status: true,
          totalAmount: true,
          advancePaid: true,
          paymentStatus: true,
          driverName: true,
          driverPhone: true,
          passengers: true,
        },
      }),

      // Truck Bookings
      prisma.truck_bookings.findMany({
        where: {
          vendorId: vendorId,
          pickupDate: { gte: startDate, lte: endDate },
        },
        select: {
          id: true,
          bookingNumber: true,
          customerName: true,
          customerPhone: true,
          vehicleName: true,
          vehicleNumber: true,
          pickupDate: true,
          pickupTime: true,
          pickupCity: true,
          pickupAddress: true,
          dropCity: true,
          dropAddress: true,
          status: true,
          totalAmount: true,
          advancePaid: true,
          paymentStatus: true,
        },
      }),

      // Bike Bookings
      prisma.bike_bookings.findMany({
        where: {
          OR: [
            { assignedVendorId: vendorId },
            { acceptedVendorId: vendorId },
          ],
          pickupDate: { gte: startDate, lte: endDate },
        },
        select: {
          id: true,
          bookingNumber: true,
          customerName: true,
          customerPhone: true,
          requestedVehicleName: true,
          acceptedVehicleName: true,
          pickupDate: true,
          pickupTime: true,
          dropDate: true,
          dropTime: true,
          locationName: true,
          status: true,
          grandTotal: true,
          paidAmount: true,
          paymentStatus: true,
        },
      }),

      // Luxury Bookings
      prisma.luxury_bookings.findMany({
        where: {
          OR: [
            { assignedVendorId: vendorId },
            { acceptedVendorId: vendorId },
          ],
          pickupDate: { gte: startDate, lte: endDate },
        },
        select: {
          id: true,
          bookingNumber: true,
          customerName: true,
          customerPhone: true,
          vehicle_models: true,
          carCategoryName: true,
          pickupDate: true,
          pickupTime: true,
          pickupCity: true,
          pickupAddress: true,
          dropCity: true,
          dropAddress: true,
          tripType: true,
          status: true,
          grandTotal: true,
          paymentStatus: true,
        },
      }),

      // Packers Bookings
      prisma.packers_bookings.findMany({
        where: {
          vendorId: vendorId,
          scheduledDate: { gte: startDate, lte: endDate },
        },
        select: {
          id: true,
          bookingNumber: true,
          customerName: true,
          customerPhone: true,
          scheduledDate: true,
          scheduledTime: true,
          pickupCity: true,
          pickupAddress: true,
          dropCity: true,
          dropAddress: true,
          status: true,
          totalAmount: true,
          advancePaid: true,
          paymentStatus: true,
        },
      }),

      // Equipment Bookings
      prisma.equipment_bookings.findMany({
        where: {
          vendorId: vendorId,
          startDate: { gte: startDate, lte: endDate },
        },
        select: {
          id: true,
          bookingNumber: true,
          customerName: true,
          customerPhone: true,
          equipmentName: true,
          startDate: true,
          endDate: true,
          deliveryAddress: true,
          status: true,
          totalAmount: true,
          advancePaid: true,
          paymentStatus: true,
        },
      }),
    ]);

    console.log('Chauffeur bookings found:', chauffeurBookings.length);
    if (chauffeurBookings.length > 0) {
      console.log('First chauffeur booking:', JSON.stringify(chauffeurBookings[0], null, 2));
    }

    // Normalize all bookings to unified format
    const allBookings = [
      ...carBookings.map(b => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        service: 'Self-Drive',
        serviceType: 'car',
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        vehicle: b.assignedVehicleName || b.requestedVehicleName,
        driver: null,
        driverPhone: null,
        pickupDate: b.pickupDate,
        pickupTime: b.pickupTime,
        dropDate: b.dropDate,
        dropTime: b.dropTime,
        pickup: b.pickupAddress || b.locationName,
        drop: b.dropAddress || b.locationName,
        status: b.status.toLowerCase().replace(/_/g, '_'),
        amount: b.grandTotal,
        paidAmount: b.paidAmount,
        paymentStatus: b.paymentStatus,
      })),

      ...chauffeurBookings.map(b => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        service: `Car Rental - ${b.tripType || 'Local'}`,
        serviceType: 'chauffeur',
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        vehicle: b.vehicle_models || b.carCategoryName,
        driver: b.driverName,
        driverPhone: b.driverPhone,
        pickupDate: b.pickupDate,
        pickupTime: b.pickupTime,
        dropDate: b.returnDate,
        dropTime: b.returnTime,
        pickup: b.pickupAddress || b.pickupCity || b.locationName,
        drop: b.dropAddress || b.dropCity || b.locationName,
        status: b.status.toLowerCase().replace(/_/g, '_'),
        amount: b.grandTotal,
        paidAmount: b.paidAmount,
        paymentStatus: b.paymentStatus,
      })),

      ...busBookings.map(b => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        service: `Bus - ${b.tripType}`,
        serviceType: 'bus',
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        vehicle: b.vehicle_models || b.vehicleName,
        vehicleNumber: b.vehicleNumber,
        driver: b.driverName,
        driverPhone: b.driverPhone,
        pickupDate: b.pickupDate,
        pickupTime: b.pickupTime,
        dropDate: b.returnDate,
        dropTime: b.returnTime,
        pickup: b.pickupAddress || b.pickupCity,
        drop: b.dropAddress || b.dropCity,
        passengers: b.passengers,
        status: b.status.toLowerCase().replace(/_/g, '_'),
        amount: b.totalAmount,
        paidAmount: b.advancePaid,
        paymentStatus: b.paymentStatus,
      })),

      ...truckBookings.map(b => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        service: 'Truck Rental',
        serviceType: 'truck',
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        vehicle: b.vehicleName,
        vehicleNumber: b.vehicleNumber,
        driver: null,
        driverPhone: null,
        pickupDate: b.pickupDate,
        pickupTime: b.pickupTime,
        dropDate: null,
        dropTime: null,
        pickup: b.pickupAddress || b.pickupCity,
        drop: b.dropAddress || b.dropCity,
        status: b.status.toLowerCase().replace(/_/g, '_'),
        amount: b.totalAmount,
        paidAmount: b.advancePaid,
        paymentStatus: b.paymentStatus,
      })),

      ...bikeBookings.map(b => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        service: 'Bike Rental',
        serviceType: 'bike',
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        vehicle: b.acceptedVehicleName || b.requestedVehicleName,
        driver: null,
        driverPhone: null,
        pickupDate: b.pickupDate,
        pickupTime: b.pickupTime,
        dropDate: b.dropDate,
        dropTime: b.dropTime,
        pickup: b.locationName,
        drop: b.locationName,
        status: b.status.toLowerCase().replace(/_/g, '_'),
        amount: b.grandTotal,
        paidAmount: b.paidAmount,
        paymentStatus: b.paymentStatus,
      })),

      ...luxuryBookings.map(b => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        service: `Luxury - ${b.tripType}`,
        serviceType: 'luxury',
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        vehicle: b.vehicle_models || b.carCategoryName,
        driver: null,
        driverPhone: null,
        pickupDate: b.pickupDate,
        pickupTime: b.pickupTime,
        dropDate: null,
        dropTime: null,
        pickup: b.pickupAddress || b.pickupCity,
        drop: b.dropAddress || b.dropCity,
        status: b.status.toLowerCase().replace(/_/g, '_'),
        amount: b.grandTotal,
        paidAmount: 0,
        paymentStatus: b.paymentStatus,
      })),

      ...packersBookings.map(b => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        service: 'Packers & Movers',
        serviceType: 'packers',
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        vehicle: 'Packers Team',
        driver: null,
        driverPhone: null,
        pickupDate: b.scheduledDate,
        pickupTime: b.scheduledTime || '09:00',
        dropDate: null,
        dropTime: null,
        pickup: b.pickupAddress || b.pickupCity,
        drop: b.dropAddress || b.dropCity,
        status: b.status.toLowerCase().replace(/_/g, '_'),
        amount: b.totalAmount,
        paidAmount: b.advancePaid,
        paymentStatus: b.paymentStatus,
      })),

      ...equipmentBookings.map(b => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        service: 'Equipment Rental',
        serviceType: 'equipment',
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        vehicle: b.equipmentName,
        driver: null,
        driverPhone: null,
        pickupDate: b.startDate,
        pickupTime: '09:00',
        dropDate: b.endDate,
        dropTime: '18:00',
        pickup: b.deliveryAddress,
        drop: b.deliveryAddress,
        status: b.status.toLowerCase().replace(/_/g, '_'),
        amount: b.totalAmount,
        paidAmount: b.advancePaid,
        paymentStatus: b.paymentStatus,
      })),
    ];

    console.log('Total bookings found:', allBookings.length);

    // Get fleet and staff for filters
    const [fleet, staff] = await Promise.all([
      prisma.vendor_fleets.findMany({
        where: { vendorId, isActive: true },
        select: { id: true, vehicleName: true, registrationNumber: true },
      }),
      prisma.vendor_staff.findMany({
        where: { vendorId, role: 'DRIVER', status: 'ACTIVE' },
        select: { id: true, name: true, phone: true },
      }),
    ]);

    // Calculate stats for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayBookings = allBookings.filter(b => {
      const bookingDate = new Date(b.pickupDate);
      bookingDate.setHours(0, 0, 0, 0);
      return bookingDate.getTime() === today.getTime();
    });

    const stats = {
      total: todayBookings.length,
      confirmed: todayBookings.filter(b => ['confirmed', 'assigned', 'driver_assigned'].includes(b.status)).length,
      inProgress: todayBookings.filter(b => ['in_progress', 'ongoing', 'started', 'picked_up'].includes(b.status)).length,
      completed: todayBookings.filter(b => ['completed', 'delivered'].includes(b.status)).length,
      pending: todayBookings.filter(b => ['pending', 'pending_payment', 'pending_assignment'].includes(b.status)).length,
      revenue: todayBookings
        .filter(b => !['cancelled', 'rejected'].includes(b.status))
        .reduce((sum, b) => sum + (b.amount || 0), 0),
    };

    return NextResponse.json({
      success: true,
      bookings: allBookings,
      stats,
      filters: {
        vehicles: fleet,
        drivers: staff,
      },
    });
  } catch (error) {
    console.error('Error fetching calendar bookings:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch bookings' }, { status: 500 });
  }
}
