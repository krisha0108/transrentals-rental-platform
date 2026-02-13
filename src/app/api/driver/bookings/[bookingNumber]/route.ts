import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getDriver } from '@/lib/auth/driver-auth';
import { sendNotificationToCustomer } from '@/lib/services/push-notification-service';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Generate 4-digit OTP
function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
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
      booking = await prisma.truck_bookings.findUnique({
        where: { bookingNumber },
      });
      if (booking) serviceType = 'truck';
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

    if (booking[driverPhoneField] !== driver.phone || vendorIdMatch !== driver.vendorId) {
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
    const { action, otp, actualKm, actualHours, tollCharges, parkingCharges } = body;

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

    if (booking[driverPhoneField] !== driver.phone || vendorIdMatch !== driver.vendorId) {
      return NextResponse.json(
        { success: false, error: 'This booking is not assigned to you' },
        { status: 403 }
      );
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
        return [initialStatus];
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

      if (booking.status !== initialStatus) {
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

      const updatedBooking = await (Model as any).update({
        where: { bookingNumber },
        data: {
          status: 'PICKUP_SCHEDULED',
          scheduledPickup: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Pickup scheduled.',
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
