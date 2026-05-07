import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getDriver } from '@/lib/auth/driver-auth';
import { sendNotificationToCustomer } from '@/lib/services/push-notification-service';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';
import { creditBackrTokens } from '@/lib/utils/backr-tokens';
export const dynamic = 'force-dynamic';

// Generate 4-digit OTP
function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Generate 6-digit OTP (car rental)
function generateCarRentalOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

// GET - Get booking details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingNumber: string }> }
) {
  try {
    const driver = await getDriver(request);

    if (!driver) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { bookingNumber } = await params;

    // Fetch booking - Try Chauffeur first
    let booking: any = await prisma.chauffeur_bookings.findUnique({
      where: { bookingNumber },
      include: {
        locations: {
          select: { id: true, name: true },
        },
      },
    });

    let serviceType: 'car' | 'bus' | 'truck' | 'packers' | 'equipment' | 'luxury' = 'car';
    if (!booking) {
      // Try Bus Booking
      booking = await prisma.bus_bookings.findUnique({
        where: { bookingNumber },
      });
      if (booking) serviceType = 'bus';
    }

    if (!booking) {
      // Try Truck Booking
      booking = await (prisma as any).truck_bookings.findUnique({
        where: { bookingNumber },
        include: {
          truck_quote_requests: {
            select: {
              truckBodyType: true,
              tripDirection: true,
              estimatedVolume: true,
              estimatedWeight: true,
              goodsDescription: true,
              pickupPincode: true,
              dropPincode: true,
              hasPickupLift: true,
              hasDropLift: true,
              expectedDeliveryDate: true,
              expectedDeliveryTime: true,
              requiresLabour: true,
              labourCount: true,
              hasMultipleStops: true,
              multipleStopsDetails: true,
              receiverName: true,
              receiverPhone: true,
              requiresPOD: true,
              isFlexibleDate: true,
              requirements: true,
            },
          },
        },
      });
      if (booking) {
        serviceType = 'truck';
        const qr: any = (booking as any).truck_quote_requests || {};
        booking = {
          ...booking,
          truckBodyType: qr.truckBodyType,
          tripDirection: qr.tripDirection,
          estimatedVolume: qr.estimatedVolume,
          estimatedWeight: qr.estimatedWeight,
          goodsDescription: (booking as any).goodsDescription || qr.goodsDescription,
          pickupPincode: qr.pickupPincode,
          dropPincode: qr.dropPincode,
          hasPickupLift: qr.hasPickupLift,
          hasDropLift: qr.hasDropLift,
          expectedDeliveryDate: qr.expectedDeliveryDate,
          expectedDeliveryTime: qr.expectedDeliveryTime,
          requiresLabour: qr.requiresLabour,
          labourCount: (booking as any).labourCount ?? qr.labourCount,
          hasMultipleStops: qr.hasMultipleStops,
          multipleStopsDetails: qr.multipleStopsDetails,
          receiverName: qr.receiverName,
          receiverPhone: qr.receiverPhone,
          requiresPOD: qr.requiresPOD,
          isFlexibleDate: qr.isFlexibleDate,
          requirements: (booking as any).customerNotes || qr.requirements,
        } as any;
      }
    }

    if (!booking) {
      // Try Packers Booking
      booking = await prisma.packers_bookings.findUnique({
        where: { bookingNumber },
      });
      if (booking) serviceType = 'packers';
    }

    if (!booking) {
      // Try Equipment Booking
      booking = await prisma.equipment_bookings.findUnique({
        where: { bookingNumber },
      });
      if (booking) serviceType = 'equipment';
    }

    if (!booking) {
      // Try Luxury Booking
      booking = await prisma.luxury_bookings.findUnique({
        where: { bookingNumber },
      });
      if (booking) serviceType = 'luxury';
    }

    // Try B2B Trip (uses tripCode as bookingNumber)
    if (!booking) {
      const b2bTrip = await prisma.b2b_trips.findUnique({
        where: { tripCode: bookingNumber },
        include: {
          booking: {
            select: {
              bookingNumber: true, companyName: true, serviceType: true,
              tripType: true, customerName: true, customerPhone: true,
              customerEmail: true, vehicleCategory: true,
            }
          },
          vehicle: {
            select: {
              id: true, vehicleName: true, registrationNumber: true,
              seatingCapacity: true, fuelType: true, transmission: true,
              color: true, yearOfManufacture: true, images: true,
              brands: { select: { name: true } },
              vehicle_models: { select: { name: true, sideImage: true, brands: { select: { name: true } } } },
              chauffeur_vehicle_categories: { select: { name: true, image: true } },
            }
          },
          driver: {
            select: { id: true, name: true, phone: true, profilePhoto: true },
          },
        },
      });

      if (b2bTrip) {
        // Verify trip belongs to this driver
        const isDriverMatch = b2bTrip.driverStaffId === driver.id ||
          b2bTrip.driverPhone === driver.phone;
        if (!isDriverMatch || b2bTrip.vendorId !== driver.vendorId) {
          return NextResponse.json(
            { success: false, error: 'This trip is not assigned to you' },
            { status: 403 }
          );
        }

        const v = b2bTrip.vehicle;
        const vehicleImage = v?.vehicle_models?.sideImage || v?.chauffeur_vehicle_categories?.image || (v?.images && v.images.length > 0 ? v.images[0] : null);
        const brandName = v?.vehicle_models?.brands?.name || v?.brands?.name || '';
        const modelName = v?.vehicle_models?.name || '';

        return NextResponse.json({
          success: true,
          booking: {
            id: b2bTrip.id,
            bookingNumber: b2bTrip.tripCode,
            tripType: b2bTrip.booking?.tripType || 'ONE_WAY',
            carCategory: b2bTrip.booking?.vehicleCategory || 'car',
            carCategoryName: v?.vehicleName || `${brandName} ${modelName}`.trim() || b2bTrip.vehicleName || 'Vehicle',
            customerName: b2bTrip.booking?.companyName || b2bTrip.booking?.customerName || 'Corporate',
            customerPhone: b2bTrip.booking?.customerPhone || '',
            customerEmail: b2bTrip.booking?.customerEmail || '',
            pickupCity: b2bTrip.pickupLocation,
            dropCity: b2bTrip.dropLocation || '',
            pickupAddress: b2bTrip.pickupLocation,
            dropAddress: b2bTrip.dropLocation || '',
            pickupDate: b2bTrip.scheduledDate,
            pickupTime: b2bTrip.scheduledTime,
            grandTotal: 0,
            status: b2bTrip.status === 'PENDING' ? 'DRIVER_ASSIGNED' :
                    b2bTrip.status === 'DRIVER_ARRIVED' ? 'DRIVER_ASSIGNED' :
                    b2bTrip.status === 'STARTED' ? 'IN_PROGRESS' :
                    b2bTrip.status,
            b2bStatus: b2bTrip.status,
            paymentStatus: 'CORPORATE',
            otpSent: !!b2bTrip.otp,
            tripStartedAt: b2bTrip.startedAt,
            tripEndedAt: b2bTrip.completedAt,
            driverArrivedAt: b2bTrip.driverArrivedAt,
            vehicleNumber: b2bTrip.vehicleNumber || v?.registrationNumber || '',
            vehicleModel: v?.vehicleName || b2bTrip.vehicleName || '',
            vehicleImage,
            vehicleColor: v?.color,
            vehicleSeats: v?.seatingCapacity,
            vehicleFuel: v?.fuelType,
            vehicleTransmission: v?.transmission,
            vehicleBrand: brandName,
            createdAt: b2bTrip.createdAt,
            serviceType: 'b2b',
            b2bTripCode: b2bTrip.tripCode,
            b2bBookingNumber: b2bTrip.booking?.bookingNumber,
          },
        });
      }
    }

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify this booking is assigned to this driver/team leader/operator
    let driverPhoneField = 'driverPhone';
    if (serviceType === 'packers') driverPhoneField = 'teamLeaderPhone';
    if (serviceType === 'equipment') driverPhoneField = 'operatorPhone';

    let vendorIdMatch = booking.vendorId;
    if (serviceType === 'car') vendorIdMatch = booking.acceptedVendorId;
    if (serviceType === 'luxury') vendorIdMatch = booking.assignedVendorId || booking.acceptedVendorId;

    // Independent driver who self-accepted via acceptedDriverId
    const isSelfAccepted = serviceType === 'car' && booking.acceptedDriverId === driver.id;
    // BROADCASTED bookings are visible to all authenticated drivers (so they can view & accept)
    const isBroadcasted = serviceType === 'car' && booking.status === 'BROADCASTED' && !booking.acceptedDriverId;

    if (!isSelfAccepted && !isBroadcasted && (normalizePhone(booking[driverPhoneField]) !== normalizePhone(driver.phone) || vendorIdMatch !== driver.vendorId)) {
      return NextResponse.json(
        { success: false, error: 'This booking is not assigned to you' },
        { status: 403 }
      );
    }

    if (serviceType === 'truck') {
      return NextResponse.json({
        success: true,
        booking: {
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          tripType: booking.serviceType,
          carCategory: booking.vehicleCategory || 'truck',
          carCategoryName: booking.vehicleName || booking.vehicleCategory || 'Truck',
          customerName: booking.customerName,
          customerPhone: booking.customerPhone,
          customerEmail: booking.customerEmail,
          pickupCity: booking.pickupCity,
          dropCity: booking.dropCity,
          pickupAddress: booking.pickupAddress,
          dropAddress: booking.dropAddress,
          pickupDate: booking.pickupDate,
          pickupTime: booking.pickupTime,
          grandTotal: booking.totalAmount,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          otpSent: !!booking.loadingOtp,
          tripStartedAt: booking.loadingStartedAt,
          tripEndedAt: booking.completedAt,
          vehicleNumber: booking.vehicleNumber,
          createdAt: booking.createdAt,
          serviceType: 'truck',
          goodsType: booking.goodsType,
          loadingOtp: booking.loadingOtp,
          deliveryOtp: booking.deliveryOtp,
          loadingStartedAt: booking.loadingStartedAt,
          loadingEndedAt: booking.loadingEndedAt,
          transitStartedAt: booking.transitStartedAt,
          transitEndedAt: booking.transitEndedAt,
          unloadingStartedAt: booking.unloadingStartedAt,
          completedAt: booking.completedAt,
        },
      });
    }

    if (serviceType === 'bus') {
      return NextResponse.json({
        success: true,
        booking: {
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          tripType: booking.tripType,
          carCategory: booking.vehicleCategory || 'bus',
          carCategoryName: booking.vehicleName || booking.vehicleCategory || 'Bus',
          customerName: booking.customerName,
          customerPhone: booking.customerPhone,
          customerEmail: booking.customerEmail,
          pickupCity: booking.pickupCity,
          dropCity: booking.dropCity,
          pickupAddress: booking.pickupAddress,
          dropAddress: booking.dropAddress,
          pickupDate: booking.pickupDate,
          pickupTime: booking.pickupTime,
          returnDate: booking.returnDate,
          returnTime: booking.returnTime,
          grandTotal: booking.totalAmount,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          otpSent: !!booking.tripStartOtp,
          tripStartedAt: booking.tripStartedAt,
          tripEndedAt: booking.tripEndedAt,
          actualKmTravelled: booking.actualKmTravelled,
          vehicleNumber: booking.vehicleNumber,
          vehicleModel: booking.vehicleModel,
          createdAt: booking.createdAt,
          serviceType: 'bus'
        },
      });
    }

    if (serviceType === 'packers') {
      return NextResponse.json({
        success: true,
        booking: {
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          tripType: booking.serviceType,
          carCategory: booking.shiftingType,
          carCategoryName: booking.shiftingType,
          customerName: booking.customerName,
          customerPhone: booking.customerPhone,
          customerEmail: booking.customerEmail,
          pickupCity: booking.pickupCity,
          dropCity: booking.dropCity,
          pickupAddress: booking.pickupAddress,
          dropAddress: booking.dropAddress,
          pickupDate: booking.scheduledDate,
          pickupTime: booking.scheduledTime || '09:00',
          grandTotal: booking.totalAmount,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          tripStartedAt: booking.packingStartedAt,
          tripEndedAt: booking.completedAt,
          vehicleNumbers: booking.vehicleNumbers,
          teamSize: booking.teamSize,
          createdAt: booking.createdAt,
          serviceType: 'packers',
          // Packers specific fields - OTPs are NOT exposed, driver gets from customer
          packingOtpSent: !!booking.packingOtpSent,
          loadingOtpSent: !!booking.loadingOtpSent,
          deliveryOtpSent: !!booking.deliveryOtpSent,
          packingStartedAt: booking.packingStartedAt,
          packingEndedAt: booking.packingEndedAt,
          loadingStartedAt: booking.loadingStartedAt,
          loadingEndedAt: booking.loadingEndedAt,
          transitStartedAt: booking.transitStartedAt,
          transitEndedAt: booking.transitEndedAt,
          unloadingStartedAt: booking.unloadingStartedAt,
          unloadingEndedAt: booking.unloadingEndedAt,
          unpackingStartedAt: booking.unpackingStartedAt,
          completedAt: booking.completedAt,
          pickupFloor: booking.pickupFloor,
          dropFloor: booking.dropFloor,
        },
      });
    }

    if (serviceType === 'equipment') {
      return NextResponse.json({
        success: true,
        booking: {
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          tripType: booking.equipmentCategory,
          carCategory: booking.equipmentType,
          carCategoryName: booking.equipmentName || booking.equipmentType,
          customerName: booking.customerName,
          customerPhone: booking.customerPhone,
          customerEmail: booking.customerEmail,
          pickupCity: booking.deliveryCity,
          dropCity: booking.deliveryCity,
          pickupAddress: booking.deliveryAddress,
          dropAddress: booking.deliveryAddress,
          pickupDate: booking.startDate,
          pickupTime: '09:00',
          endDate: booking.endDate,
          rentalDays: booking.rentalDays,
          grandTotal: booking.totalAmount,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          otpSent: !!booking.deliveryOtp,
          tripStartedAt: booking.deliveredAt2,
          tripEndedAt: booking.completedAt,
          createdAt: booking.createdAt,
          serviceType: 'equipment',
          // Equipment specific fields
          equipmentModel: booking.equipmentModel,
          quantity: booking.quantity,
          deliveryOtp: booking.deliveryOtp,
          returnOtp: booking.returnOtp,
          deliveredAt: booking.deliveredAt2,
          inUseFrom: booking.inUseFrom,
          returnedAt: booking.returnedAt,
          completedAt: booking.completedAt,
        },
      });
    }

    if (serviceType === 'luxury') {
      const vehicleDisplayName = `${booking.vehicleBrand || ''} ${booking.vehicleModel || ''}`.trim() ||
        booking.carCategoryName ||
        booking.carCategory ||
        'Luxury Car';

      return NextResponse.json({
        success: true,
        booking: {
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          tripType: booking.tripType || 'luxury',
          carCategory: booking.carCategory,
          carCategoryName: vehicleDisplayName,
          customerName: booking.customerName,
          customerPhone: booking.customerPhone,
          customerEmail: booking.customerEmail,
          pickupCity: booking.pickupCity,
          dropCity: booking.dropCity,
          pickupAddress: booking.pickupAddress,
          dropAddress: booking.dropAddress,
          pickupDate: booking.pickupDate,
          pickupTime: booking.pickupTime,
          returnDate: booking.returnDate,
          returnTime: booking.returnTime,
          tripDays: booking.totalDays,
          totalHours: booking.totalHours,
          grandTotal: booking.grandTotal,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          // For luxury, OTP is generated by driver and shown to customer
          // Driver doesn't see OTP - they ask customer for it verbally
          otpSent: !!booking.tripStartOtp,
          tripStartedAt: booking.tripStartedAt,
          tripEndedAt: booking.tripEndedAt,
          vehicleNumber: booking.vehicleNumber,
          vehicleBrand: booking.vehicleBrand,
          vehicleModel: booking.vehicleModel,
          createdAt: booking.createdAt,
          serviceType: 'luxury',
        },
      });
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        tripType: booking.tripType,
        carCategory: booking.carCategory,
        carCategoryName: booking.carCategoryName,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        customerEmail: booking.customerEmail,
        pickupCity: booking.pickupCity,
        dropCity: booking.dropCity,
        pickupAddress: booking.pickupAddress,
        dropAddress: booking.dropAddress,
        intermediateStops: booking.intermediateStops ? (() => { try { return JSON.parse(booking.intermediateStops!); } catch { return []; } })() : [],
        pickupDate: booking.pickupDate,
        pickupTime: booking.pickupTime,
        returnDate: booking.returnDate,
        returnTime: booking.returnTime,
        localPackageHours: booking.localPackageHours,
        localPackageKm: booking.localPackageKm,
        baseFare: booking.baseFare,
        grandTotal: booking.grandTotal,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        // Note: OTP is NOT exposed to driver - driver must get it from customer
        otpSent: !!booking.tripStartOtp, // Only indicate if OTP was sent
        tripStartedAt: booking.tripStartedAt,
        tripEndedAt: booking.tripEndedAt,
        actualKmTravelled: booking.actualKmTravelled,
        actualHours: booking.actualHours,
        vehicleNumber: booking.vehicleNumber,
        vehicleModel: booking.vehicleModel,
        driverBatta: booking.driverBatta,
        nightCharges: booking.nightCharges,
        tollCharges: booking.tollCharges,
        location: booking.locations,
        createdAt: booking.createdAt,
      },
    });
  } catch (error: any) {
    logger.error('Get driver booking error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch booking', details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH - Driver actions (start trip with OTP, complete trip)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bookingNumber: string }> }
) {
  try {
    const driver = await getDriver(request);

    if (!driver) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { bookingNumber } = await params;
    const body = await request.json();
    const { action, otp, actualKm, actualHours, tollCharges, parkingCharges, vehicleId, vehicleNumber, vehicleModel } = body;

    // Fetch booking - Try Chauffeur
    let booking: any = await prisma.chauffeur_bookings.findUnique({
      where: { bookingNumber },
    });

    let serviceType: 'car' | 'bus' | 'truck' | 'packers' | 'equipment' | 'luxury' = 'car';
    if (!booking) {
      booking = await prisma.bus_bookings.findUnique({
        where: { bookingNumber },
      });
      if (booking) serviceType = 'bus';
    }

    if (!booking) {
      booking = await prisma.truck_bookings.findUnique({
        where: { bookingNumber },
      });
      if (booking) serviceType = 'truck';
    }

    if (!booking) {
      booking = await prisma.packers_bookings.findUnique({
        where: { bookingNumber },
      });
      if (booking) serviceType = 'packers';
    }

    if (!booking) {
      booking = await prisma.equipment_bookings.findUnique({
        where: { bookingNumber },
      });
      if (booking) serviceType = 'equipment';
    }

    if (!booking) {
      booking = await prisma.luxury_bookings.findUnique({
        where: { bookingNumber },
      });
      if (booking) serviceType = 'luxury';
    }

    // Try B2B Trip
    if (!booking) {
      const b2bTrip = await prisma.b2b_trips.findUnique({
        where: { tripCode: bookingNumber },
      });

      if (b2bTrip) {
        // Verify driver
        const isDriverMatch = b2bTrip.driverStaffId === driver.id || b2bTrip.driverPhone === driver.phone;
        if (!isDriverMatch || b2bTrip.vendorId !== driver.vendorId) {
          return NextResponse.json({ success: false, error: 'Not assigned to you' }, { status: 403 });
        }

        // B2B trip actions
        if (action === 'request_otp') {
          // For B2B, "request_otp" = driver arrives and OTP is generated
          if (b2bTrip.status !== 'PENDING') {
            return NextResponse.json({ success: false, error: `Cannot mark arrival. Trip is ${b2bTrip.status}` }, { status: 400 });
          }

          const newOtp = generateOTP();
          await prisma.b2b_trips.update({
            where: { tripCode: bookingNumber },
            data: { status: 'DRIVER_ARRIVED', driverArrivedAt: new Date(), otp: newOtp, otpGeneratedAt: new Date() },
          });

          return NextResponse.json({
            success: true,
            message: 'You have arrived! The customer has received the OTP. Ask them to share it with you to start the trip.',
          });
        }

        if (action === 'start_trip') {
          // B2B trip start is done by passenger entering OTP on trip page
          // But driver can also verify OTP
          if (b2bTrip.status !== 'DRIVER_ARRIVED') {
            return NextResponse.json({ success: false, error: `Cannot start trip. Status is ${b2bTrip.status}` }, { status: 400 });
          }

          if (otp !== b2bTrip.otp) {
            return NextResponse.json({ success: false, error: 'Invalid OTP' }, { status: 400 });
          }

          await prisma.b2b_trips.update({
            where: { tripCode: bookingNumber },
            data: { status: 'STARTED', startedAt: new Date() },
          });

          // Update booking status
          await prisma.b2b_bookings.update({
            where: { id: b2bTrip.bookingId },
            data: { status: 'IN_PROGRESS' },
          });

          return NextResponse.json({ success: true, message: 'Trip started successfully!' });
        }

        if (action === 'complete_trip') {
          if (b2bTrip.status !== 'STARTED') {
            return NextResponse.json({ success: false, error: `Cannot complete. Trip is ${b2bTrip.status}` }, { status: 400 });
          }

          await prisma.b2b_trips.update({
            where: { tripCode: bookingNumber },
            data: { status: 'COMPLETED', completedAt: new Date() },
          });

          // Check if all trips for this booking are completed
          const bookingTrips = await prisma.b2b_trips.findMany({
            where: { bookingId: b2bTrip.bookingId },
            select: { status: true },
          });
          const allDone = bookingTrips.every(t => ['COMPLETED', 'CANCELLED', 'VENDOR_CANCELLED'].includes(t.status));
          if (allDone) {
            await prisma.b2b_bookings.update({
              where: { id: b2bTrip.bookingId },
              data: { status: 'COMPLETED' },
            });
          }

          return NextResponse.json({ success: true, message: 'Trip completed successfully!' });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
      }
    }

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // ── Self-accepted chauffeur booking (both independent + vendor_staff) ──
    if (serviceType === 'car' && booking.acceptedDriverId === driver.id) {
      if (action === 'assign_vehicle') {
        if (!vehicleId && !vehicleNumber) {
          return NextResponse.json({ success: false, error: 'Vehicle is required' }, { status: 400 });
        }
        let finalVehicleNumber = vehicleNumber;
        let finalVehicleModel = vehicleModel;

        const isStaff = (driver as any).userType === 'vendor_staff';
        if (vehicleId) {
          const vehicle = await prisma.driver_vehicles.findFirst({
            where: isStaff ? { id: vehicleId, staffId: driver.id } : { id: vehicleId, driverId: driver.id },
          });
          if (!vehicle) {
            return NextResponse.json({ success: false, error: 'Vehicle not found in your fleet' }, { status: 404 });
          }
          finalVehicleNumber = vehicle.registrationNo || vehicleNumber;
          finalVehicleModel = `${vehicle.make} ${vehicle.model}`.trim();
        }

        const tripOtp = generateCarRentalOTP();
        await prisma.chauffeur_bookings.update({
          where: { bookingNumber },
          data: {
            vehicleNumber: finalVehicleNumber || null,
            vehicleModel: finalVehicleModel || null,
            status: 'DRIVER_ASSIGNED',
            driverAssignedAt: new Date(),
            tripStartOtp: tripOtp,
          },
        });
        return NextResponse.json({ success: true, message: 'Vehicle assigned! You can now send the OTP to start the trip.' });
      }

      if (action === 'request_otp') {
        if (booking.status !== 'DRIVER_ASSIGNED') {
          return NextResponse.json({ success: false, error: 'Assign a vehicle first before sending OTP' }, { status: 400 });
        }
        // OTP already generated at assign_vehicle
        return NextResponse.json({ success: true, message: 'OTP is ready. Ask the customer for the OTP shown in their booking.' });
      }

      if (action === 'start_trip') {
        if (booking.tripStartOtp !== otp) {
          return NextResponse.json({ success: false, error: 'Invalid OTP' }, { status: 400 });
        }
        await prisma.chauffeur_bookings.update({
          where: { bookingNumber },
          data: { status: 'IN_PROGRESS', tripStartedAt: new Date() },
        });
        return NextResponse.json({ success: true, message: 'Trip started!' });
      }

      if (action === 'complete_trip') {
        if (booking.status !== 'IN_PROGRESS') {
          return NextResponse.json({ success: false, error: 'Trip must be in progress to complete' }, { status: 400 });
        }
        await prisma.chauffeur_bookings.update({
          where: { bookingNumber },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            actualKmTravelled: actualKm ? parseFloat(actualKm) : null,
            actualHours: actualHours ? parseFloat(actualHours) : null,
            tollCharges: tollCharges ? parseFloat(tollCharges) : undefined,
          },
        });
        return NextResponse.json({ success: true, message: 'Trip completed!' });
      }

      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    // Verify this booking is assigned to this driver/team leader/operator
    let driverPhoneField = 'driverPhone';
    if (serviceType === 'packers') driverPhoneField = 'teamLeaderPhone';
    if (serviceType === 'equipment') driverPhoneField = 'operatorPhone';

    let vendorIdMatch = booking.vendorId;
    if (serviceType === 'car') vendorIdMatch = booking.acceptedVendorId;
    if (serviceType === 'luxury') vendorIdMatch = booking.assignedVendorId || booking.acceptedVendorId;

    // Independent driver who self-accepted via acceptedDriverId
    const isSelfAccepted = serviceType === 'car' && booking.acceptedDriverId === driver.id;

    if (!isSelfAccepted && (normalizePhone(booking[driverPhoneField]) !== normalizePhone(driver.phone) || vendorIdMatch !== driver.vendorId)) {
      return NextResponse.json(
        { success: false, error: 'This booking is not assigned to you' },
        { status: 403 }
      );
    }

    // assign_vehicle for vendor-staff accepted car bookings (driverPhone match)
    if (serviceType === 'car' && action === 'assign_vehicle') {
      if (!vehicleId && !vehicleNumber) {
        return NextResponse.json({ success: false, error: 'Vehicle is required' }, { status: 400 });
      }
      let finalVehicleNumber = vehicleNumber;
      let finalVehicleModel = vehicleModel;

      const isStaff2 = (driver as any).userType === 'vendor_staff';
      if (vehicleId) {
        const vehicle = await prisma.driver_vehicles.findFirst({
          where: isStaff2 ? { id: vehicleId, staffId: driver.id } : { id: vehicleId, driverId: driver.id },
        });
        if (vehicle) {
          finalVehicleNumber = vehicle.registrationNo || vehicleNumber;
          finalVehicleModel = `${vehicle.make} ${vehicle.model}`.trim();
        } else if (isStaff2) {
          const vendorVehicle = await prisma.vendor_fleets.findFirst({
            where: { id: vehicleId, vendorId: (driver as any).vendorId },
          });
          if (vendorVehicle) {
            finalVehicleNumber = vendorVehicle.registrationNumber || vehicleNumber;
            finalVehicleModel = vendorVehicle.vehicleName || vehicleModel;
          }
        }
      }

      const tripOtp = generateCarRentalOTP();
      // If status is ACCEPTED and no acceptedStaffId yet, this is an old self-accepted booking
      // retroactively set acceptedStaffId so vendor page correctly excludes it going forward
      const isStaff2retro = (driver as any).userType === 'vendor_staff';
      const isRetroSelfAccept = isStaff2retro && booking.status === 'ACCEPTED' && !(booking as any).acceptedStaffId;
      await prisma.chauffeur_bookings.update({
        where: { bookingNumber },
        data: {
          vehicleNumber: finalVehicleNumber || null,
          vehicleModel: finalVehicleModel || null,
          status: 'DRIVER_ASSIGNED',
          driverAssignedAt: new Date(),
          tripStartOtp: tripOtp,
          ...(isRetroSelfAccept ? { acceptedStaffId: driver.id } : {}),
        },
      });
      return NextResponse.json({ success: true, message: 'Vehicle assigned! You can now send the OTP to start the trip.' });
    }

    const isTruck = serviceType === 'truck';
    const isBus = serviceType === 'bus';
    const isPackers = serviceType === 'packers';
    const isEquipment = serviceType === 'equipment';
    const isLuxury = serviceType === 'luxury';

    // Get the correct Prisma model
    const getModel = () => {
      if (isTruck) return prisma.truck_bookings;
      if (isBus) return prisma.bus_bookings;
      if (isPackers) return prisma.packers_bookings;
      if (isEquipment) return prisma.equipment_bookings;
      if (isLuxury) return prisma.luxury_bookings;
      return prisma.chauffeur_bookings;
    };
    const Model = getModel();

    // Get initial status for each service type
    const getInitialStatus = () => {
      if (isTruck) return 'VEHICLE_ASSIGNED';
      if (isBus) return 'VEHICLE_ASSIGNED';
      if (isPackers) return 'TEAM_ASSIGNED';
      if (isEquipment) return 'CONFIRMED';
      if (isLuxury) return 'DRIVER_ASSIGNED';
      return 'DRIVER_ASSIGNED';
    };
    const initialStatus = getInitialStatus();

    // Handle actions
    if (action === 'request_otp') {
      // Get valid statuses for OTP request based on service type
      const getValidOtpStatuses = () => {
        if (isTruck) return [initialStatus, 'IN_TRANSIT'];
        if (isPackers) return [initialStatus, 'PACKING', 'IN_TRANSIT'];
        if (isEquipment) return [initialStatus, 'PICKUP_SCHEDULED'];
        // Car/luxury: also allow ACCEPTED (independent driver self-accepted)
        return [initialStatus, 'ACCEPTED'];
      };
      const validStatuses = getValidOtpStatuses();

      if (!validStatuses.includes(booking.status)) {
        return NextResponse.json(
          { success: false, error: `Cannot request OTP. Current status: ${booking.status}` },
          { status: 400 }
        );
      }

      // Generate new OTP
      const newOtp = generateOTP();

      // Determine which OTP field to update based on service type and status
      let otpField = 'tripStartOtp';
      let otpType = 'Trip Start';

      if (isTruck) {
        otpField = booking.status === 'IN_TRANSIT' ? 'deliveryOtp' : 'loadingOtp';
        otpType = booking.status === 'IN_TRANSIT' ? 'Delivery' : 'Loading';
      } else if (isPackers) {
        if (booking.status === initialStatus) {
          otpField = 'packingOtp';
          otpType = 'Packing';
        } else if (booking.status === 'PACKING') {
          otpField = 'loadingOtp';
          otpType = 'Loading';
        } else if (booking.status === 'IN_TRANSIT') {
          otpField = 'deliveryOtp';
          otpType = 'Delivery';
        }
      } else if (isEquipment) {
        if (booking.status === initialStatus) {
          otpField = 'deliveryOtp';
          otpType = 'Delivery';
        } else if (booking.status === 'PICKUP_SCHEDULED') {
          otpField = 'returnOtp';
          otpType = 'Return';
        }
      }

      // Build update data - OTP and optionally the OtpSent flag for packers
      const updateData: any = { [otpField]: newOtp };

      // For packers, also set the OTP sent flag so customer can see it
      if (isPackers) {
        if (booking.status === initialStatus) {
          updateData.packingOtpSent = true;
        } else if (booking.status === 'PACKING') {
          updateData.loadingOtpSent = true;
        } else if (booking.status === 'IN_TRANSIT') {
          updateData.deliveryOtpSent = true;
        }
      }

      // Save OTP to database
      await (Model as any).update({
        where: { bookingNumber },
        data: updateData,
      });

      // Send OTP notification to customer
      if (booking.customerId) {
        try {
          const notificationId = 'NOTIF_' + crypto.randomBytes(8).toString('hex');

          // Map service types to display names
          const serviceTypeMap: any = {
            car: 'chauffeur-service',
            bus: 'bus-rental',
            truck: 'truck-rental',
            packers: 'packers-and-movers',
            equipment: 'equipment-rental',
            luxury: 'luxury-car-rental',
          };

          const serviceTypeName = serviceTypeMap[serviceType] || serviceType;

          await prisma.notifications.create({
            data: {
              id: notificationId,
              customerId: booking.customerId,
              title: `🔑 ${otpType} OTP`,
              body: `Your OTP for ${otpType.toLowerCase()} is: ${newOtp}. Valid for verification.`,
              type: 'booking',
              serviceType: serviceTypeName,
              bookingId: booking.id,
              isRead: false,
            },
          });
          console.log(`✅ Driver ${otpType} OTP in-app notification created:`, notificationId);

          console.log(`📤 Sending ${otpType} OTP push notification to customer:`, booking.customerId);
          const pushResult = await sendNotificationToCustomer(
            booking.customerId,
            {
              title: `🔑 ${otpType} OTP`,
              body: `Your OTP for ${otpType.toLowerCase()} is: ${newOtp}. Valid for verification.`,
            },
            {
              type: 'otp',
              serviceType: serviceTypeName,
              bookingId: booking.id,
              otp: newOtp,
            }
          );

          if (pushResult.success) {
            console.log(`✅ ${otpType} OTP push notification sent successfully:`, pushResult.messageId);
          } else {
            console.error(`❌ ${otpType} OTP push notification failed:`, pushResult.error);
          }
        } catch (notificationError: any) {
          console.error(`❌ ${otpType} OTP notification error:`, notificationError);
          logger.error(`Failed to send ${otpType} OTP notification`, notificationError);
        }
      } else {
        console.log(`⚠️ [OTP] No customerId on booking ${bookingNumber}, skipping notification`);
      }

      console.log(`[OTP] Booking ${bookingNumber}: ${otpType} OTP ${newOtp} sent to customer ${booking.customerPhone}`);

      return NextResponse.json({
        success: true,
        message: `${otpType} OTP has been sent to customer's phone (${booking.customerPhone.slice(0, 2)}****${booking.customerPhone.slice(-4)}). Please ask the customer for the OTP.`,
      });
    }

    if (action === 'start_trip') {
      // Verify OTP
      if (!otp) {
        return NextResponse.json(
          { success: false, error: 'OTP is required to start' },
          { status: 400 }
        );
      }

      // Check if OTP was generated based on service type
      let otpField = 'tripStartOtp';
      if (isTruck) otpField = 'loadingOtp';
      if (isPackers) otpField = 'packingOtp';
      if (isEquipment) otpField = 'deliveryOtp';

      if (!booking[otpField]) {
        return NextResponse.json(
          { success: false, error: 'Please request OTP first.' },
          { status: 400 }
        );
      }

      if (booking[otpField] !== otp) {
        return NextResponse.json(
          { success: false, error: 'Invalid OTP. Please get the correct OTP from the customer.' },
          { status: 400 }
        );
      }

      if (booking.status !== initialStatus && booking.status !== 'ACCEPTED') {
        return NextResponse.json(
          { success: false, error: `Cannot start. Current status: ${booking.status}` },
          { status: 400 }
        );
      }

      // Determine new status and timestamp field based on service type
      let newStatus = 'IN_PROGRESS';
      const updateData: any = {};

      if (isTruck) {
        newStatus = 'LOADING';
        updateData.loadingStartedAt = new Date();
      } else if (isPackers) {
        newStatus = 'PACKING';
        updateData.packingStartedAt = new Date();
      } else if (isEquipment) {
        newStatus = 'DELIVERED';
        updateData.deliveredAt2 = new Date();
      } else {
        updateData.tripStartedAt = new Date();
      }

      updateData.status = newStatus;

      const updatedBooking = await (Model as any).update({
        where: { bookingNumber },
        data: updateData,
      });

      // Send trip started notification to customer
      try {
        const notificationId = 'NOTIF_' + crypto.randomBytes(8).toString('hex');

        // Map service types to display names
        const serviceTypeMap: any = {
          car: 'chauffeur-service',
          bus: 'bus-rental',
          truck: 'truck-rental',
          packers: 'packers-and-movers',
          equipment: 'equipment-rental',
          luxury: 'luxury-car-rental',
        };

        const serviceTypeName = serviceTypeMap[serviceType] || serviceType;

        // Determine notification title and body based on service type
        let notificationTitle = '🚗 Trip Started!';
        let notificationBody = 'Your trip has started! Enjoy your ride and stay safe! 🛣️';

        if (isTruck) {
          notificationTitle = '📦 Loading Started!';
          notificationBody = 'Loading of your goods has started! We will notify you when transit begins. 🚛';
        } else if (isPackers) {
          notificationTitle = '📦 Packing Started!';
          notificationBody = 'Packing of your belongings has started! We will keep you updated. 📦';
        } else if (isEquipment) {
          notificationTitle = '✅ Equipment Delivered!';
          notificationBody = 'Your equipment has been delivered successfully! 🎉';
        }

        await prisma.notifications.create({
          data: {
            id: notificationId,
            customerId: booking.customerId,
            title: notificationTitle,
            body: notificationBody,
            type: 'booking',
            serviceType: serviceTypeName,
            bookingId: booking.id,
            isRead: false,
          },
        });
        console.log('✅ Driver trip started in-app notification created:', notificationId);

        console.log('📤 Sending trip started push notification to customer:', booking.customerId);
        const pushResult = await sendNotificationToCustomer(
          booking.customerId,
          {
            title: notificationTitle,
            body: notificationBody,
          },
          {
            type: 'trip_started',
            serviceType: serviceTypeName,
            bookingId: booking.id,
            bookingNumber: updatedBooking.bookingNumber || '',
          }
        );

        if (pushResult.success) {
          console.log('✅ Trip started push notification sent successfully:', pushResult.messageId);
        } else {
          console.error('❌ Trip started push notification failed:', pushResult.error);
        }
      } catch (notificationError: any) {
        console.error('❌ Trip started notification error:', notificationError);
        logger.error('Failed to send trip started notification', notificationError);
      }

      // Notify vendor that driver has started the trip
      if (driver.vendorId) {
        const serviceTypeNames: any = {
          car: 'chauffeur-service', bus: 'bus-rental', truck: 'truck-rental',
          packers: 'packers-and-movers', equipment: 'equipment-rental', luxury: 'luxury-car-rental',
        };
        const startTitles: any = {
          truck: '📦 Loading Started!', packers: '📦 Packing Started!',
          equipment: '✅ Equipment Delivered!',
        };
        const startTitle = startTitles[serviceType] || '🚀 Trip Started!';
        sendVendorDirectNotification({
          vendorId: driver.vendorId,
          title: startTitle,
          body: `Your driver has started the trip for Booking #${updatedBooking.bookingNumber}.`,
          type: 'trip_started',
          serviceType: serviceTypeNames[serviceType] || serviceType,
          bookingId: booking.id,
          bookingNumber: updatedBooking.bookingNumber || '',
        }).catch((err: any) => console.error('[DriverTripStart] Vendor notify failed:', err));
      }

      // Determine success message
      let message = 'Trip started successfully!';
      if (isTruck) message = 'Loading started successfully!';
      if (isPackers) message = 'Packing started successfully!';
      if (isEquipment) message = 'Equipment delivered successfully!';

      return NextResponse.json({
        success: true,
        message,
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
        },
      });
    }

    // Truck-specific: Start Transit (after loading complete)
    if (action === 'start_transit' && isTruck) {
      if (booking.status !== 'LOADING') {
        return NextResponse.json(
          { success: false, error: `Cannot start transit. Current status: ${booking.status}` },
          { status: 400 }
        );
      }

      const updatedBooking = await (Model as any).update({
        where: { bookingNumber },
        data: {
          status: 'IN_TRANSIT',
          loadingEndedAt: new Date(),
          transitStartedAt: new Date(),
        },
      });

      // Notify customer: transit started
      try {
        const transitNotifId = 'NOTIF_' + crypto.randomBytes(8).toString('hex');
        const transitTitle = '🚛 Your Truck is On the Way!';
        const transitBody = `Loading is complete and your truck for booking #${updatedBooking.bookingNumber} is now in transit to the destination.`;

        await prisma.notifications.create({
          data: {
            id: transitNotifId,
            customerId: booking.customerId,
            title: transitTitle,
            body: transitBody,
            type: 'booking',
            serviceType: 'truck-rental',
            bookingId: booking.id,
            isRead: false,
          },
        });

        sendNotificationToCustomer(
          booking.customerId,
          { title: transitTitle, body: transitBody },
          {
            type: 'transit_started',
            serviceType: 'truck-rental',
            bookingId: booking.id,
            bookingNumber: updatedBooking.bookingNumber || '',
          }
        ).catch((err: any) => console.error('[TruckTransit] Customer push failed:', err));
      } catch (transitNotifErr: any) {
        console.error('[TruckTransit] Customer notification failed:', transitNotifErr);
      }

      return NextResponse.json({
        success: true,
        message: 'Loading complete! Transit started.',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
        },
      });
    }

    // Truck-specific: Start Unloading (verify delivery OTP)
    if (action === 'start_unloading' && isTruck) {
      if (!otp) {
        return NextResponse.json(
          { success: false, error: 'Delivery OTP is required' },
          { status: 400 }
        );
      }

      if (!booking.deliveryOtp) {
        return NextResponse.json(
          { success: false, error: 'Please request delivery OTP first.' },
          { status: 400 }
        );
      }

      if (booking.deliveryOtp !== otp) {
        return NextResponse.json(
          { success: false, error: 'Invalid OTP. Please get the correct OTP from the customer.' },
          { status: 400 }
        );
      }

      if (booking.status !== 'IN_TRANSIT') {
        return NextResponse.json(
          { success: false, error: `Cannot start unloading. Current status: ${booking.status}` },
          { status: 400 }
        );
      }

      const updatedBooking = await (Model as any).update({
        where: { bookingNumber },
        data: {
          status: 'UNLOADING',
          transitEndedAt: new Date(),
          unloadingStartedAt: new Date(),
        },
      });

      // Notify customer: unloading started
      try {
        const unloadNotifId = 'NOTIF_' + crypto.randomBytes(8).toString('hex');
        const unloadTitle = '📦 Unloading Started!';
        const unloadBody = `Your truck has arrived at the destination! Unloading for booking #${updatedBooking.bookingNumber} has started.`;

        await prisma.notifications.create({
          data: {
            id: unloadNotifId,
            customerId: booking.customerId,
            title: unloadTitle,
            body: unloadBody,
            type: 'booking',
            serviceType: 'truck-rental',
            bookingId: booking.id,
            isRead: false,
          },
        });

        sendNotificationToCustomer(
          booking.customerId,
          { title: unloadTitle, body: unloadBody },
          {
            type: 'unloading_started',
            serviceType: 'truck-rental',
            bookingId: booking.id,
            bookingNumber: updatedBooking.bookingNumber || '',
          }
        ).catch((err: any) => console.error('[TruckUnload] Customer push failed:', err));
      } catch (unloadNotifErr: any) {
        console.error('[TruckUnload] Customer notification failed:', unloadNotifErr);
      }

      return NextResponse.json({
        success: true,
        message: 'Arrived at destination! Unloading started.',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
        },
      });
    }

    // Truck-specific: Complete Delivery
    if (action === 'complete_delivery' && isTruck) {
      if (booking.status !== 'UNLOADING') {
        return NextResponse.json(
          { success: false, error: `Cannot complete delivery. Current status: ${booking.status}` },
          { status: 400 }
        );
      }

      const updatedBooking = await (Model as any).update({
        where: { bookingNumber },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Credit 10% Backr tokens
      creditBackrTokens({
        customerId: booking.customerId,
        bookingAmount: booking.totalAmount || 0,
        bookingId: booking.id,
        bookingNumber: updatedBooking.bookingNumber,
        serviceType: 'truck',
      });

      if (driver.vendorId) {
        sendVendorDirectNotification({
          vendorId: driver.vendorId,
          title: '✅ Delivery Completed!',
          body: `Your driver has completed the truck delivery for Booking #${updatedBooking.bookingNumber}.`,
          type: 'trip_completed',
          serviceType: 'truck-rental',
          bookingId: booking.id,
          bookingNumber: updatedBooking.bookingNumber || '',
        }).catch((err: any) => console.error('[DriverTruckComplete] Vendor notify failed:', err));
      }

      // Notify customer: delivery completed
      try {
        const completeNotifId = 'NOTIF_' + crypto.randomBytes(8).toString('hex');
        const completeTitle = '✅ Delivery Completed!';
        const completeBody = `Your truck delivery for booking #${updatedBooking.bookingNumber} has been completed successfully! Backr tokens have been credited to your account. 🎉`;

        await prisma.notifications.create({
          data: {
            id: completeNotifId,
            customerId: booking.customerId,
            title: completeTitle,
            body: completeBody,
            type: 'booking',
            serviceType: 'truck-rental',
            bookingId: booking.id,
            isRead: false,
          },
        });

        sendNotificationToCustomer(
          booking.customerId,
          { title: completeTitle, body: completeBody },
          {
            type: 'delivery_completed',
            serviceType: 'truck-rental',
            bookingId: booking.id,
            bookingNumber: updatedBooking.bookingNumber || '',
          }
        ).catch((err: any) => console.error('[TruckComplete] Customer push failed:', err));
      } catch (completeNotifErr: any) {
        console.error('[TruckComplete] Customer notification failed:', completeNotifErr);
      }

      return NextResponse.json({
        success: true,
        message: 'Delivery completed successfully!',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
        },
      });
    }

    // ================== PACKERS-SPECIFIC ACTIONS ==================

    // Packers: Start Loading (after packing complete, verify loading OTP)
    if (action === 'start_loading' && isPackers) {
      if (!otp) {
        return NextResponse.json(
          { success: false, error: 'Loading OTP is required' },
          { status: 400 }
        );
      }

      if (!booking.loadingOtp) {
        return NextResponse.json(
          { success: false, error: 'Please request loading OTP first.' },
          { status: 400 }
        );
      }

      if (booking.loadingOtp !== otp) {
        return NextResponse.json(
          { success: false, error: 'Invalid OTP. Please get the correct OTP from the customer.' },
          { status: 400 }
        );
      }

      if (booking.status !== 'PACKING') {
        return NextResponse.json(
          { success: false, error: `Cannot start loading. Current status: ${booking.status}` },
          { status: 400 }
        );
      }

      const updatedBooking = await (Model as any).update({
        where: { bookingNumber },
        data: {
          status: 'LOADING',
          packingEndedAt: new Date(),
          loadingStartedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Packing complete! Loading started.',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
        },
      });
    }

    // Packers: Start Transit (after loading complete)
    if (action === 'start_transit' && isPackers) {
      if (booking.status !== 'LOADING') {
        return NextResponse.json(
          { success: false, error: `Cannot start transit. Current status: ${booking.status}` },
          { status: 400 }
        );
      }

      const updatedBooking = await (Model as any).update({
        where: { bookingNumber },
        data: {
          status: 'IN_TRANSIT',
          loadingEndedAt: new Date(),
          transitStartedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Loading complete! Transit started.',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
        },
      });
    }

    // Packers: Start Unloading (verify delivery OTP)
    if (action === 'start_unloading' && isPackers) {
      if (!otp) {
        return NextResponse.json(
          { success: false, error: 'Delivery OTP is required' },
          { status: 400 }
        );
      }

      if (!booking.deliveryOtp) {
        return NextResponse.json(
          { success: false, error: 'Please request delivery OTP first.' },
          { status: 400 }
        );
      }

      if (booking.deliveryOtp !== otp) {
        return NextResponse.json(
          { success: false, error: 'Invalid OTP. Please get the correct OTP from the customer.' },
          { status: 400 }
        );
      }

      if (booking.status !== 'IN_TRANSIT') {
        return NextResponse.json(
          { success: false, error: `Cannot start unloading. Current status: ${booking.status}` },
          { status: 400 }
        );
      }

      const updatedBooking = await (Model as any).update({
        where: { bookingNumber },
        data: {
          status: 'UNLOADING',
          transitEndedAt: new Date(),
          unloadingStartedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Arrived at destination! Unloading started.',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
        },
      });
    }

    // Packers: Start Unpacking (after unloading complete)
    if (action === 'start_unpacking' && isPackers) {
      if (booking.status !== 'UNLOADING') {
        return NextResponse.json(
          { success: false, error: `Cannot start unpacking. Current status: ${booking.status}` },
          { status: 400 }
        );
      }

      const updatedBooking = await (Model as any).update({
        where: { bookingNumber },
        data: {
          status: 'UNPACKING',
          unloadingEndedAt: new Date(),
          unpackingStartedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Unloading complete! Unpacking started.',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
        },
      });
    }

    // Packers: Complete Job
    if (action === 'complete_job' && isPackers) {
      if (booking.status !== 'UNPACKING') {
        return NextResponse.json(
          { success: false, error: `Cannot complete job. Current status: ${booking.status}` },
          { status: 400 }
        );
      }

      const updatedBooking = await (Model as any).update({
        where: { bookingNumber },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Credit 10% Backr tokens
      creditBackrTokens({
        customerId: booking.customerId,
        bookingAmount: booking.totalAmount || 0,
        bookingId: booking.id,
        bookingNumber: updatedBooking.bookingNumber,
        serviceType: 'packers',
      });

      if (driver.vendorId) {
        sendVendorDirectNotification({
          vendorId: driver.vendorId,
          title: '✅ Moving Job Completed!',
          body: `Your team has completed the packers & movers job for Booking #${updatedBooking.bookingNumber}.`,
          type: 'trip_completed',
          serviceType: 'packers-and-movers',
          bookingId: booking.id,
          bookingNumber: updatedBooking.bookingNumber || '',
        }).catch((err: any) => console.error('[DriverPackersComplete] Vendor notify failed:', err));
      }

      return NextResponse.json({
        success: true,
        message: 'Moving job completed successfully!',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
        },
      });
    }

    // ================== EQUIPMENT-SPECIFIC ACTIONS ==================

    // Equipment: Start Use (after delivery)
    if (action === 'start_use' && isEquipment) {
      if (booking.status !== 'DELIVERED') {
        return NextResponse.json(
          { success: false, error: `Cannot start use. Current status: ${booking.status}` },
          { status: 400 }
        );
      }

      const updatedBooking = await (Model as any).update({
        where: { bookingNumber },
        data: {
          status: 'IN_USE',
          inUseFrom: new Date(),
        },
      });

      // Notify customer: equipment now in use
      if (booking.customerId) {
        try {
          const useNotifId = 'NOTIF_' + crypto.randomBytes(8).toString('hex');
          const useTitle = '⚙️ Equipment Rental Started!';
          const useBody = `Your equipment for booking #${updatedBooking.bookingNumber} is now in use. Enjoy your rental!`;

          await prisma.notifications.create({
            data: {
              id: useNotifId,
              customerId: booking.customerId,
              title: useTitle,
              body: useBody,
              type: 'booking',
              serviceType: 'equipment-rental',
              bookingId: booking.id,
              isRead: false,
            },
          });

          sendNotificationToCustomer(
            booking.customerId,
            { title: useTitle, body: useBody },
            {
              type: 'equipment_in_use',
              serviceType: 'equipment-rental',
              bookingId: booking.id,
              bookingNumber: updatedBooking.bookingNumber || '',
            }
          ).catch((err: any) => console.error('[EquipStartUse] Customer push failed:', err));
        } catch (useNotifErr: any) {
          console.error('[EquipStartUse] Customer notification failed:', useNotifErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Equipment is now in use.',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
        },
      });
    }

    // Equipment: Schedule Pickup
    if (action === 'schedule_pickup' && isEquipment) {
      if (booking.status !== 'IN_USE') {
        return NextResponse.json(
          { success: false, error: `Cannot schedule pickup. Current status: ${booking.status}` },
          { status: 400 }
        );
      }

      // Auto-generate return OTP when scheduling pickup
      const returnOtp = generateOTP();

      const updatedBooking = await (Model as any).update({
        where: { bookingNumber },
        data: {
          status: 'PICKUP_SCHEDULED',
          scheduledPickup: new Date(),
          returnOtp,
        },
      });

      // Notify customer: pickup scheduled + return OTP
      if (booking.customerId) {
        try {
          // Pickup scheduled notification
          const pickupNotifId = 'NOTIF_' + crypto.randomBytes(8).toString('hex');
          const pickupTitle = '📋 Equipment Pickup Scheduled!';
          const pickupBody = `Equipment pickup has been scheduled for booking #${updatedBooking.bookingNumber}. Our operator will arrive to collect the equipment.`;

          await prisma.notifications.create({
            data: {
              id: pickupNotifId,
              customerId: booking.customerId,
              title: pickupTitle,
              body: pickupBody,
              type: 'booking',
              serviceType: 'equipment-rental',
              bookingId: booking.id,
              isRead: false,
            },
          });

          sendNotificationToCustomer(
            booking.customerId,
            { title: pickupTitle, body: pickupBody },
            {
              type: 'pickup_scheduled',
              serviceType: 'equipment-rental',
              bookingId: booking.id,
              bookingNumber: updatedBooking.bookingNumber || '',
            }
          ).catch((err: any) => console.error('[EquipPickup] Customer push failed:', err));

          // Return OTP notification
          const otpNotifId = 'NOTIF_' + crypto.randomBytes(8).toString('hex');
          const otpTitle = '🔑 Return OTP';
          const otpBody = `Your OTP for equipment return is: ${returnOtp}. Share this with the operator at pickup.`;

          await prisma.notifications.create({
            data: {
              id: otpNotifId,
              customerId: booking.customerId,
              title: otpTitle,
              body: otpBody,
              type: 'booking',
              serviceType: 'equipment-rental',
              bookingId: booking.id,
              isRead: false,
            },
          });

          sendNotificationToCustomer(
            booking.customerId,
            { title: otpTitle, body: otpBody },
            {
              type: 'otp',
              serviceType: 'equipment-rental',
              bookingId: booking.id,
              otp: returnOtp,
            }
          ).catch((err: any) => console.error('[EquipPickup] Return OTP push failed:', err));
        } catch (pickupNotifErr: any) {
          console.error('[EquipPickup] Customer notification failed:', pickupNotifErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Pickup scheduled. Return OTP sent to customer.',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
        },
      });
    }

    // Equipment: Confirm Return (verify return OTP)
    if (action === 'confirm_return' && isEquipment) {
      if (!otp) {
        return NextResponse.json(
          { success: false, error: 'Return OTP is required' },
          { status: 400 }
        );
      }

      if (!booking.returnOtp) {
        return NextResponse.json(
          { success: false, error: 'Please request return OTP first.' },
          { status: 400 }
        );
      }

      if (booking.returnOtp !== otp) {
        return NextResponse.json(
          { success: false, error: 'Invalid OTP. Please get the correct OTP from the customer.' },
          { status: 400 }
        );
      }

      if (booking.status !== 'PICKUP_SCHEDULED') {
        return NextResponse.json(
          { success: false, error: `Cannot confirm return. Current status: ${booking.status}` },
          { status: 400 }
        );
      }

      const updatedBooking = await (Model as any).update({
        where: { bookingNumber },
        data: {
          status: 'RETURNED',
          returnedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Equipment returned successfully!',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
        },
      });
    }

    // Equipment: Complete Rental
    if (action === 'complete_rental' && isEquipment) {
      if (booking.status !== 'RETURNED') {
        return NextResponse.json(
          { success: false, error: `Cannot complete rental. Current status: ${booking.status}` },
          { status: 400 }
        );
      }

      const updatedBooking = await (Model as any).update({
        where: { bookingNumber },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Credit 10% Backr tokens
      creditBackrTokens({
        customerId: booking.customerId,
        bookingAmount: booking.totalAmount || 0,
        bookingId: booking.id,
        bookingNumber: updatedBooking.bookingNumber,
        serviceType: 'equipment',
      });

      if (driver.vendorId) {
        sendVendorDirectNotification({
          vendorId: driver.vendorId,
          title: '✅ Equipment Rental Completed!',
          body: `Your operator has completed the equipment rental for Booking #${updatedBooking.bookingNumber}.`,
          type: 'trip_completed',
          serviceType: 'equipment-rental',
          bookingId: booking.id,
          bookingNumber: updatedBooking.bookingNumber || '',
        }).catch((err: any) => console.error('[DriverEquipmentComplete] Vendor notify failed:', err));
      }

      // Notify customer: rental completed
      if (booking.customerId) {
        try {
          const completeNotifId = 'NOTIF_' + crypto.randomBytes(8).toString('hex');
          const completeTitle = '✅ Equipment Rental Completed!';
          const completeBody = `Your equipment rental for booking #${updatedBooking.bookingNumber} is complete! Backr tokens have been credited to your account. 🎉`;

          await prisma.notifications.create({
            data: {
              id: completeNotifId,
              customerId: booking.customerId,
              title: completeTitle,
              body: completeBody,
              type: 'booking',
              serviceType: 'equipment-rental',
              bookingId: booking.id,
              isRead: false,
            },
          });

          sendNotificationToCustomer(
            booking.customerId,
            { title: completeTitle, body: completeBody },
            {
              type: 'rental_completed',
              serviceType: 'equipment-rental',
              bookingId: booking.id,
              bookingNumber: updatedBooking.bookingNumber || '',
            }
          ).catch((err: any) => console.error('[EquipComplete] Customer push failed:', err));
        } catch (completeNotifErr: any) {
          console.error('[EquipComplete] Customer notification failed:', completeNotifErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Rental completed successfully!',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
        },
      });
    }

    // ================== LUXURY CAR-SPECIFIC ACTIONS ==================

    // Luxury: Generate Start OTP (driver generates, customer sees it)
    if (action === 'generate_start_otp' && isLuxury) {
      if (booking.status !== 'DRIVER_ASSIGNED') {
        return NextResponse.json(
          { success: false, error: `Driver must be assigned first. Current status: ${booking.status}` },
          { status: 400 }
        );
      }

      const tripStartOtp = generateOTP();

      const updatedBooking = await (Model as any).update({
        where: { bookingNumber },
        data: {
          tripStartOtp,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'OTP generated! Ask customer for this OTP to start the trip.',
        otp: updatedBooking.tripStartOtp,
      });
    }

    // Luxury: Start Trip (driver verifies OTP from customer)
    if (action === 'start_trip' && isLuxury) {
      if (!otp) {
        return NextResponse.json(
          { success: false, error: 'OTP is required to start trip' },
          { status: 400 }
        );
      }

      if (!booking.tripStartOtp) {
        return NextResponse.json(
          { success: false, error: 'Please generate OTP first.' },
          { status: 400 }
        );
      }

      if (booking.tripStartOtp !== otp) {
        return NextResponse.json(
          { success: false, error: 'Invalid OTP. Please ask customer for correct OTP.' },
          { status: 400 }
        );
      }

      if (booking.status !== 'DRIVER_ASSIGNED') {
        return NextResponse.json(
          { success: false, error: `Cannot start trip. Current status: ${booking.status}` },
          { status: 400 }
        );
      }

      const updatedBooking = await (Model as any).update({
        where: { bookingNumber },
        data: {
          status: 'IN_PROGRESS',
          tripStartedAt: new Date(),
        },
      });

      if (driver.vendorId) {
        sendVendorDirectNotification({
          vendorId: driver.vendorId,
          title: '🚀 Trip Started!',
          body: `Your driver has started the luxury car trip for Booking #${updatedBooking.bookingNumber}.`,
          type: 'trip_started',
          serviceType: 'luxury-car-rental',
          bookingId: booking.id,
          bookingNumber: updatedBooking.bookingNumber || '',
        }).catch((err: any) => console.error('[DriverLuxuryStart] Vendor notify failed:', err));
      }

      return NextResponse.json({
        success: true,
        message: 'Trip started successfully!',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
        },
      });
    }

    // Luxury: Complete Trip
    if (action === 'complete_trip' && isLuxury) {
      if (booking.status !== 'IN_PROGRESS') {
        return NextResponse.json(
          { success: false, error: `Trip must be in progress. Current status: ${booking.status}` },
          { status: 400 }
        );
      }

      const updatedBooking = await (Model as any).update({
        where: { bookingNumber },
        data: {
          status: 'COMPLETED',
          tripEndedAt: new Date(),
          completedAt: new Date(),
          paymentStatus: 'PAID',
        },
      });

      // Credit 10% Backr tokens
      creditBackrTokens({
        customerId: booking.customerId,
        bookingAmount: booking.grandTotal || 0,
        bookingId: booking.id,
        bookingNumber: updatedBooking.bookingNumber,
        serviceType: 'luxury',
      });

      if (driver.vendorId) {
        sendVendorDirectNotification({
          vendorId: driver.vendorId,
          title: '✅ Trip Completed!',
          body: `Your driver has completed the luxury car trip for Booking #${updatedBooking.bookingNumber}.`,
          type: 'trip_completed',
          serviceType: 'luxury-car-rental',
          bookingId: booking.id,
          bookingNumber: updatedBooking.bookingNumber || '',
        }).catch((err: any) => console.error('[DriverLuxuryComplete] Vendor notify failed:', err));
      }

      return NextResponse.json({
        success: true,
        message: 'Trip completed successfully!',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
        },
      });
    }

    if (action === 'complete_trip') {
      if (booking.status !== 'IN_PROGRESS') {
        return NextResponse.json(
          { success: false, error: `Cannot complete trip. Current status: ${booking.status}` },
          { status: 400 }
        );
      }

      // Complete trip
      const updateData: any = {
        status: 'COMPLETED',
        tripEndedAt: new Date(),
        actualKmTravelled: actualKm ? parseInt(actualKm) : null,
        completedAt: new Date(),
      };

      if (!isBus) {
        updateData.actualHours = actualHours ? parseFloat(actualHours) : null;
        updateData.actualTollCharges = tollCharges ? parseFloat(tollCharges) : null;
        updateData.actualParkingCharges = parkingCharges ? parseFloat(parkingCharges) : null;
      } else {
        updateData.tollCharges = tollCharges ? parseFloat(tollCharges) : 0;
        updateData.parkingCharges = parkingCharges ? parseFloat(parkingCharges) : 0;
      }

      const updatedBooking = await (Model as any).update({
        where: { bookingNumber },
        data: updateData,
      });

      // Send trip completion notification to customer
      try {
        const notificationId = 'NOTIF_' + crypto.randomBytes(8).toString('hex');

        // Map service types to display names
        const serviceTypeMap: any = {
          car: 'chauffeur-service',
          bus: 'bus-rental',
          truck: 'truck-rental',
          packers: 'packers-and-movers',
          equipment: 'equipment-rental',
          luxury: 'luxury-car-rental',
        };

        const serviceTypeName = serviceTypeMap[serviceType] || serviceType;

        await prisma.notifications.create({
          data: {
            id: notificationId,
            customerId: booking.customerId,
            title: '🎉 Trip Completed Successfully!',
            body: `Your trip is complete! Hope you enjoyed the ride! 🚗 Book again for your next journey! ✨`,
            type: 'booking',
            serviceType: serviceTypeName,
            bookingId: booking.id,
            isRead: false,
          },
        });
        console.log('✅ Driver trip completed in-app notification created:', notificationId);

        console.log('📤 Sending trip completed push notification to customer:', booking.customerId);
        const pushResult = await sendNotificationToCustomer(
          booking.customerId,
          {
            title: '🎉 Trip Completed Successfully!',
            body: `Your trip is complete! Hope you enjoyed the ride! 🚗 Book again for your next journey! ✨`,
          },
          {
            type: 'trip_completed',
            serviceType: serviceTypeName,
            bookingId: booking.id,
            bookingNumber: updatedBooking.bookingNumber || '',
          }
        );

        if (pushResult.success) {
          console.log('✅ Trip completed push notification sent successfully:', pushResult.messageId);
        } else {
          console.error('❌ Trip completed push notification failed:', pushResult.error);
        }
      } catch (notificationError: any) {
        console.error('❌ Trip completed notification error:', notificationError);
        logger.error('Failed to send trip completed notification', notificationError);
      }

      // Credit 10% Backr tokens
      creditBackrTokens({
        customerId: booking.customerId,
        bookingAmount: booking.grandTotal || booking.totalAmount || 0,
        bookingId: booking.id,
        bookingNumber: updatedBooking.bookingNumber,
        serviceType: serviceType,
      });

      // Notify vendor that driver has completed the trip
      if (driver.vendorId) {
        const serviceTypeNames: any = {
          car: 'chauffeur-service', bus: 'bus-rental', truck: 'truck-rental',
          packers: 'packers-and-movers', equipment: 'equipment-rental', luxury: 'luxury-car-rental',
        };
        sendVendorDirectNotification({
          vendorId: driver.vendorId,
          title: '✅ Trip Completed!',
          body: `Your driver has completed the trip for Booking #${updatedBooking.bookingNumber}.`,
          type: 'trip_completed',
          serviceType: serviceTypeNames[serviceType] || serviceType,
          bookingId: booking.id,
          bookingNumber: updatedBooking.bookingNumber || '',
        }).catch((err: any) => console.error('[DriverTripComplete] Vendor notify failed:', err));
      }

      return NextResponse.json({
        success: true,
        message: 'Trip completed successfully!',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
          tripEndedAt: updatedBooking.tripEndedAt,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    logger.error('Driver booking action error', error);
    return NextResponse.json(
      { success: false, error: 'Action failed', details: error?.message },
      { status: 500 }
    );
  }
}
