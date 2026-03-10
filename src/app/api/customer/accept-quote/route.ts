// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';
export const dynamic = 'force-dynamic';

function generateBookingNumber(prefix: string): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}-${random}`;
}

function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceType, quoteRequestId, quoteId } = body;

    if (!serviceType || !quoteRequestId || !quoteId) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    let booking;
    let bookingNumber;

    switch (serviceType) {
      case 'truck':
        booking = await acceptTruckQuote(quoteRequestId, quoteId);
        bookingNumber = booking.bookingNumber;
        break;
      case 'packers':
        booking = await acceptPackersQuote(quoteRequestId, quoteId);
        bookingNumber = booking.bookingNumber;
        break;
      case 'equipment':
        booking = await acceptEquipmentQuote(quoteRequestId, quoteId);
        bookingNumber = booking.bookingNumber;
        break;
      case 'bus':
        booking = await acceptBusQuote(quoteRequestId, quoteId);
        bookingNumber = booking.bookingNumber;
        break;
      case 'bike':
        booking = await acceptBikeQuote(quoteRequestId, quoteId);
        bookingNumber = booking.bookingNumber;
        break;
      case 'self-drive':
        booking = await acceptSelfDriveQuote(quoteRequestId, quoteId);
        bookingNumber = booking.bookingNumber;
        break;
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid service type' },
          { status: 400 }
        );
    }

    // Non-blocking: notify the vendor whose quote was accepted
    const vendorId = booking.vendorId || booking.acceptedVendorId || booking.assignedVendorId;
    if (vendorId) {
      const serviceDisplayNames: Record<string, string> = {
        truck: 'Truck Rental', packers: 'Packers & Movers', equipment: 'Equipment Rental',
        bus: 'Bus Rental', bike: 'Bike Rental', 'self-drive': 'Self Drive',
      };
      sendVendorDirectNotification({
        vendorId,
        title: '🎉 Quote Accepted!',
        body: `Your quote has been accepted. Booking #${bookingNumber} created. Payment pending from customer.`,
        type: 'quote_accepted',
        serviceType,
        bookingId: booking.id,
        bookingNumber,
      }).catch((err: any) => console.error('[AcceptQuote] Vendor notification failed:', err));
    }

    return NextResponse.json({
      success: true,
      message: 'Quote accepted successfully! Your booking has been created.',
      bookingId: booking.id,
      bookingNumber,
    });
  } catch (error) {
    logger.error('Error accepting quote', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to accept quote' },
      { status: 500 }
    );
  }
}

async function acceptTruckQuote(quoteRequestId: string, quoteId: string) {
  // Get the quote and request
  const quote = await prisma.truck_quotes.findUnique({
    where: { id: quoteId },
    include: { truck_quote_requests: true },
  });

  if (!quote) {
    throw new Error('Quote not found');
  }

  // Check if quote has expired
  if (quote.validTill && new Date(quote.validTill) < new Date()) {
    throw new Error('This quote has expired. Please request a new quote.');
  }

  const request = quote.truck_quote_requests;

  if (!request || quote.requestId !== quoteRequestId) {
    throw new Error('Quote does not belong to this request');
  }

  // Check if a booking already exists for this quote request
  const existingBooking = await prisma.truck_bookings.findFirst({
    where: { quoteRequestId: quoteRequestId },
  });

  if (existingBooking) {
    throw new Error('A booking already exists for this quote request');
  }

  const bookingNumber = generateBookingNumber('TB');

  // Use transaction to ensure consistency
  const result = await prisma.$transaction(async (tx) => {
    // Update quote status
    await tx.truck_quotes.update({
      where: { id: quoteId },
      data: { status: 'ACCEPTED' },
    });

    // Update other quotes to REJECTED
    await tx.truck_quotes.updateMany({
      where: {
        requestId: quoteRequestId,
        id: { not: quoteId },
        status: { in: ['SENT', 'VIEWED'] },
      },
      data: { status: 'REJECTED' },
    });

    // Update request status
    await tx.truck_quote_requests.update({
      where: { id: quoteRequestId },
      data: { status: 'QUOTE_ACCEPTED', acceptedQuoteId: quoteId },
    });

    // Create booking
    const booking = await tx.truck_bookings.create({
      data: {
        bookingNumber,
        quoteRequestId,
        acceptedQuoteId: quoteId,
        customerId: request.customerId,
        customerName: request.customerName,
        customerEmail: request.customerEmail,
        customerPhone: request.customerPhone,
        vendorId: quote.vendorId,
        serviceType: request.serviceType,
        vehicleCategory: quote.vehicleCategory || quote.vehicle_category || 'truck',
        vehicleName: quote.vehicleName,
        goodsType: request.goodsType,
        goodsDescription: request.goodsDescription,
        pickupCity: request.pickupCity,
        pickupAddress: request.pickupAddress,
        pickupFloor: request.pickupFloor,
        dropCity: request.dropCity,
        dropAddress: request.dropAddress,
        dropFloor: request.dropFloor,
        estimatedDistance: request.estimatedDistance,
        pickupDate: request.pickupDate,
        pickupTime: request.pickupTime,
        vehicleNumber: quote.vehicleNumber,
        driverName: quote.driverName,
        driverPhone: quote.driverPhone,
        labourCount: quote.labourIncluded ? quote.labourCount : null,
        baseAmount: quote.baseAmount,
        labourCharges: quote.labourCharges || 0,
        loadingCharges: quote.loadingCharges || 0,
        unloadingCharges: quote.unloadingCharges || 0,
        packagingCharges: quote.packagingCharges || 0,
        insuranceCharges: quote.insuranceCharges || 0,
        tollCharges: quote.tollEstimate || 0,
        gstAmount: quote.gstAmount || 0,
        totalAmount: quote.totalAmount,
        advanceAmount: Math.round(quote.totalAmount * 0.5),
        balanceAmount: Math.round(quote.totalAmount * 0.5),
        status: 'PENDING_PAYMENT',
        loadingOtp: generateOTP(),
        deliveryOtp: generateOTP(),
      },
    });

    return booking;
  });

  return result;
}

async function acceptPackersQuote(quoteRequestId: string, quoteId: string) {
  // Get the quote and request
  const quote = await prisma.packers_quotes.findUnique({
    where: { id: quoteId },
    include: { packers_quote_requests: true },
  });

  if (!quote) {
    throw new Error('Quote not found');
  }

  // Check if quote has expired
  if (quote.validTill && new Date(quote.validTill) < new Date()) {
    throw new Error('This quote has expired. Please request a new quote.');
  }

  const request = quote.packers_quote_requests;

  if (!request || quote.requestId !== quoteRequestId) {
    throw new Error('Quote does not belong to this request');
  }

  // Check if a booking already exists for this quote request
  const existingBooking = await prisma.packers_bookings.findFirst({
    where: { quoteRequestId: quoteRequestId },
  });

  if (existingBooking) {
    throw new Error('A booking already exists for this quote request');
  }

  const bookingNumber = generateBookingNumber('PB');

  // Use transaction to ensure consistency
  const result = await prisma.$transaction(async (tx) => {
    // Update quote status
    await tx.packers_quotes.update({
      where: { id: quoteId },
      data: { status: 'ACCEPTED' },
    });

    // Update other quotes to REJECTED
    await tx.packers_quotes.updateMany({
      where: {
        requestId: quoteRequestId,
        id: { not: quoteId },
        status: { in: ['SENT', 'VIEWED'] },
      },
      data: { status: 'REJECTED' },
    });

    // Update request status
    await tx.packers_quote_requests.update({
      where: { id: quoteRequestId },
      data: { status: 'QUOTE_ACCEPTED', acceptedQuoteId: quoteId },
    });

    // Create booking
    const booking = await tx.packers_bookings.create({
      data: {
        bookingNumber,
        quoteRequestId,
        acceptedQuoteId: quoteId,
        customerId: request.customerId,
        customerName: request.customerName,
        customerEmail: request.customerEmail,
        customerPhone: request.customerPhone,
        vendorId: quote.vendorId,
        serviceType: request.serviceType,
        shiftingType: request.shiftingType,
        pickupCity: request.pickupCity,
        pickupAddress: request.pickupAddress,
        pickupFloor: request.pickupFloor,
        dropCity: request.dropCity,
        dropAddress: request.dropAddress,
        dropFloor: request.dropFloor,
        scheduledDate: request.preferredDate,
        packingCharges: quote.packingCharges || 0,
        loadingCharges: quote.loadingCharges || 0,
        transportCharges: quote.transportCharges,
        unloadingCharges: quote.unloadingCharges || 0,
        unpackingCharges: quote.unpackingCharges || 0,
        storageCharges: quote.storageCharges || 0,
        insuranceCharges: quote.insuranceCharges || 0,
        materialCharges: quote.materialCharges || 0,
        gstAmount: quote.gstAmount || 0,
        totalAmount: quote.totalAmount,
        advanceAmount: Math.round(quote.totalAmount * 0.3),
        balanceAmount: Math.round(quote.totalAmount * 0.7),
        status: 'PENDING_PAYMENT',
        packingOtp: generateOTP(),
        loadingOtp: generateOTP(),
        deliveryOtp: generateOTP(),
      },
    });

    return booking;
  });

  return result;
}

async function acceptEquipmentQuote(quoteRequestId: string, quoteId: string) {
  // Get the quote and request
  const quote = await prisma.equipment_quotes.findUnique({
    where: { id: quoteId },
    include: {
      equipment_quote_requests: true,
      vendors: { select: { businessName: true } },
    },
  });

  if (!quote) {
    throw new Error('Quote not found');
  }

  // Check if quote has expired
  if (quote.validTill && new Date(quote.validTill) < new Date()) {
    throw new Error('This quote has expired. Please request a new quote.');
  }

  const request = quote.equipment_quote_requests;

  if (!request || quote.requestId !== quoteRequestId) {
    throw new Error('Quote does not belong to this request');
  }

  // Check if a booking already exists for this quote request
  const existingBooking = await prisma.equipment_bookings.findFirst({
    where: { quoteRequestId: quoteRequestId },
  });

  if (existingBooking) {
    throw new Error('A booking already exists for this quote request');
  }

  const bookingNumber = generateBookingNumber('EB');

  // Calculate rental days and end date
  const rentalDays = request.rentalDays || 1;
  const startDate = request.startDate;
  const endDate = request.endDate || new Date(startDate.getTime() + rentalDays * 24 * 60 * 60 * 1000);

  // Use transaction to ensure consistency
  const result = await prisma.$transaction(async (tx) => {
    // Update quote status
    await tx.equipment_quotes.update({
      where: { id: quoteId },
      data: { status: 'ACCEPTED' },
    });

    // Update other quotes to REJECTED
    await tx.equipment_quotes.updateMany({
      where: {
        requestId: quoteRequestId,
        id: { not: quoteId },
        status: { in: ['SENT', 'VIEWED'] },
      },
      data: { status: 'REJECTED' },
    });

    // Update request status
    await tx.equipment_quote_requests.update({
      where: { id: quoteRequestId },
      data: { status: 'QUOTE_ACCEPTED', acceptedQuoteId: quoteId },
    });

    // Calculate base amount from quote
    const baseAmount = quote.baseAmount || quote.totalAmount - (quote.deliveryCharges || 0) - (quote.operatorCharges || 0) - (quote.gstAmount || 0);

    // Create booking
    const booking = await tx.equipment_bookings.create({
      data: {
        bookingNumber,
        quoteRequestId,
        acceptedQuoteId: quoteId,
        customerId: request.customerId,
        customerName: request.customerName,
        customerEmail: request.customerEmail,
        customerPhone: request.customerPhone,
        vendorId: quote.vendorId,
        equipmentCategory: request.equipmentCategory,
        equipmentType: request.equipmentType,
        equipmentName: quote.equipmentName || request.equipmentType,
        equipmentModel: quote.equipmentModel,
        quantity: request.quantity,
        deliveryCity: request.deliveryCity,
        deliveryAddress: request.deliveryAddress,
        startDate,
        endDate,
        rentalDays,
        baseAmount,
        deliveryCharges: quote.deliveryCharges || 0,
        operatorCharges: quote.operatorCharges || 0,
        pickupCharges: quote.pickupCharges || 0,
        securityDeposit: quote.securityDeposit || 0,
        gstAmount: quote.gstAmount || 0,
        totalAmount: quote.totalAmount,
        advanceAmount: Math.round(quote.totalAmount * 0.3) + (quote.securityDeposit || 0),
        balanceAmount: quote.totalAmount - Math.round(quote.totalAmount * 0.3),
        status: 'PENDING_PAYMENT',
        deliveryOtp: generateOTP(),
        returnOtp: generateOTP(),
      },
    });

    return booking;
  });

  return result;
}

async function acceptBusQuote(quoteRequestId: string, quoteId: string) {
  // Get the quote and request
  const quote = await prisma.bus_quotes.findUnique({
    where: { id: quoteId },
    include: {
      bus_quote_requests_bus_quotes_requestIdTobus_quote_requests: true,
      vendors: { select: { businessName: true } },
    },
  });

  if (!quote) {
    throw new Error('Quote not found');
  }

  // Check if quote has expired
  if (quote.validTill && new Date(quote.validTill) < new Date()) {
    throw new Error('This quote has expired. Please request a new quote.');
  }

  const request = quote.bus_quote_requests_bus_quotes_requestIdTobus_quote_requests;

  if (!request || quote.requestId !== quoteRequestId) {
    throw new Error('Quote does not belong to this request');
  }

  // Check if a booking already exists for this quote request
  const existingBooking = await prisma.bus_bookings.findFirst({
    where: { quoteRequestId: quoteRequestId },
  });

  if (existingBooking) {
    throw new Error('A booking already exists for this quote request');
  }

  const bookingNumber = generateBookingNumber('BB');

  // Calculate additional charges total
  const additionalCharges = (quote.driverAllowance || 0) +
    (quote.tollEstimate || 0) +
    (quote.parkingEstimate || 0) +
    (quote.nightHaltCharges || 0) +
    (quote.permitCharges || 0);

  // Use transaction to ensure consistency
  const result = await prisma.$transaction(async (tx) => {
    // Update quote status
    await tx.bus_quotes.update({
      where: { id: quoteId },
      data: { status: 'ACCEPTED', respondedAt: new Date() },
    });

    // Update other quotes to REJECTED
    await tx.bus_quotes.updateMany({
      where: {
        requestId: quoteRequestId,
        id: { not: quoteId },
        status: { in: ['SENT', 'VIEWED'] },
      },
      data: { status: 'REJECTED' },
    });

    // Update request status
    await tx.bus_quote_requests.update({
      where: { id: quoteRequestId },
      data: { status: 'QUOTE_ACCEPTED' },
    });

    // Create booking
    const booking = await tx.bus_bookings.create({
      data: {
        bookingNumber,
        quoteRequestId,
        acceptedQuoteId: quoteId,
        customerId: request.customerId,
        customerName: request.customerName,
        customerEmail: request.customerEmail,
        customerPhone: request.customerPhone,
        vendorId: quote.vendorId,
        tripType: request.tripType,
        vehicleCategory: quote.vehicleCategory || request.vehicleCategory,
        vehicleName: quote.vehicleName,
        passengers: request.passengers,
        pickupCity: request.pickupCity,
        pickupAddress: request.pickupAddress,
        dropCity: request.dropCity,
        dropAddress: request.dropAddress,
        routeDetails: request.routeDetails || null,
        pickupDate: request.pickupDate,
        pickupTime: request.pickupTime,
        returnDate: request.returnDate,
        returnTime: request.returnTime || null,
        tripDays: request.tripDays || 1,
        vehicleNumber: quote.vehicleNumber,
        vehicleModel: quote.vehicleModel,
        driverName: quote.driverName,
        driverPhone: quote.driverPhone,
        baseAmount: quote.baseAmount,
        additionalCharges,
        gstAmount: quote.gstAmount || 0,
        totalAmount: quote.totalAmount,
        advanceAmount: quote.advanceAmount || Math.round(quote.totalAmount * 0.3),
        balanceAmount: quote.totalAmount - (quote.advanceAmount || Math.round(quote.totalAmount * 0.3)),
        status: 'PENDING_PAYMENT',
        customerNotes: request.requirements || null,
        tripStartOtp: generateOTP(),
        tripEndOtp: generateOTP(),
      },
    });

    return booking;
  });

  return result;
}

async function acceptBikeQuote(quoteRequestId: string, quoteId: string) {
  // Get the quote and request
  const quote = await prisma.bike_quotes.findUnique({
    where: { id: quoteId },
    include: {
      bike_quote_requests_bike_quotes_requestIdTobike_quote_requests: true,
      vendors: { select: { businessName: true } },
    },
  });

  if (!quote) {
    throw new Error('Quote not found');
  }

  // Check if quote has expired
  if (quote.validTill && new Date(quote.validTill) < new Date()) {
    throw new Error('This quote has expired. Please request a new quote.');
  }

  const request = quote.bike_quote_requests_bike_quotes_requestIdTobike_quote_requests;

  if (!request || quote.requestId !== quoteRequestId) {
    throw new Error('Quote does not belong to this request');
  }

  // Check if a booking already exists for this quote request
  const existingBooking = await prisma.bike_bookings.findFirst({
    where: { quoteRequestId: quoteRequestId },
  });

  if (existingBooking) {
    throw new Error('A booking already exists for this quote request');
  }

  const bookingNumber = generateBookingNumber('BK');

  // Use transaction to ensure consistency
  const result = await prisma.$transaction(async (tx) => {
    // Update quote status
    await tx.bike_quotes.update({
      where: { id: quoteId },
      data: { status: 'ACCEPTED' },
    });

    // Update other quotes to REJECTED
    await tx.bike_quotes.updateMany({
      where: {
        requestId: quoteRequestId,
        id: { not: quoteId },
        status: { in: ['SENT', 'VIEWED'] },
      },
      data: { status: 'REJECTED' },
    });

    // Update request status
    await tx.bike_quote_requests.update({
      where: { id: quoteRequestId },
      data: { status: 'QUOTE_ACCEPTED', acceptedQuoteId: quoteId },
    });

    // Calculate advance amount
    const advanceAmount = quote.advanceAmount || Math.round(quote.grandTotal * quote.advancePercent / 100);

    // Create booking
    const booking = await tx.bike_bookings.create({
      data: {
        bookingNumber,
        quoteRequestId,
        acceptedQuoteId: quoteId,
        customerId: request.customerId,
        customerName: request.customerName,
        customerEmail: request.customerEmail,
        customerPhone: request.customerPhone,
        locationId: request.locationId,
        locationName: request.locationName,
        requestedVehicleId: request.vehicle_modelsId,
        requestedVehicleName: request.vehicle_modelsName || quote.vehicleName,
        requestedBrand: request.vehicleBrand || quote.vehicleBrand,
        requestedCategory: request.vehicleCategoryName || quote.vehicle_category,
        requestedModelId: quote.vehicle_modelsId,
        // Vendor info
        assignedVendorId: quote.vendorId,
        acceptedVendorId: quote.vendorId,
        acceptedVehicleId: quote.vendorFleetId,
        acceptedVehicleName: quote.vehicleName,
        acceptedAt: new Date(),
        // Dates
        pickupDate: request.pickupDate,
        pickupTime: request.pickupTime,
        dropDate: request.dropDate,
        dropTime: request.dropTime,
        totalDays: request.totalDays,
        // Pricing
        dailyRate: quote.dailyRate,
        totalAmount: quote.totalAmount,
        gstAmount: quote.gstAmount || 0,
        securityDeposit: quote.securityDeposit,
        grandTotal: quote.grandTotal,
        advanceAmount,
        advancePercentage: quote.advancePercent,
        // Helmets & extras
        helmetsRequired: quote.helmetsIncluded || 1,
        customerNotes: request.customerNotes,
        vendorNotes: quote.vendorMessage,
        // OTPs
        tripStartOtp: generateOTP(),
        tripEndOtp: generateOTP(),
        status: 'PENDING_PAYMENT',
      },
    });

    return booking;
  });

  return result;
}

async function acceptSelfDriveQuote(quoteRequestId: string, quoteId: string) {
  // Get the quote and request
  const quote = await prisma.self_drive_quotes.findUnique({
    where: { id: quoteId },
    include: {
      self_drive_quote_requests_self_drive_quotes_requestIdToself_drive_quote_requests: true,
      vendors: { select: { businessName: true } },
    },
  });

  if (!quote) {
    throw new Error('Quote not found');
  }

  // Check if quote has expired
  if (quote.validTill && new Date(quote.validTill) < new Date()) {
    throw new Error('This quote has expired. Please request a new quote.');
  }

  const request = quote.self_drive_quote_requests_self_drive_quotes_requestIdToself_drive_quote_requests;

  if (!request || quote.requestId !== quoteRequestId) {
    throw new Error('Quote does not belong to this request');
  }

  // Check if a booking already exists for this quote request
  const existingBooking = await prisma.car_bookings.findFirst({
    where: { quoteRequestId: quoteRequestId },
  });

  if (existingBooking) {
    throw new Error('A booking already exists for this quote request');
  }

  const bookingNumber = generateBookingNumber('SD');

  // Use transaction to ensure consistency
  const result = await prisma.$transaction(async (tx) => {
    // Update quote status
    await tx.self_drive_quotes.update({
      where: { id: quoteId },
      data: { status: 'ACCEPTED' },
    });

    // Update other quotes to REJECTED
    await tx.self_drive_quotes.updateMany({
      where: {
        requestId: quoteRequestId,
        id: { not: quoteId },
        status: { in: ['SENT', 'VIEWED'] },
      },
      data: { status: 'REJECTED' },
    });

    // Update request status
    await tx.self_drive_quote_requests.update({
      where: { id: quoteRequestId },
      data: { status: 'QUOTE_ACCEPTED', acceptedQuoteId: quoteId },
    });

    // Calculate balance amount using vendor's advance percentage
    const advanceAmount = quote.advanceAmount || Math.round(quote.grandTotal * quote.advancePercent / 100);
    const balanceAmount = quote.grandTotal - advanceAmount;

    // Create booking (using CarBooking for self-drive)
    const booking = await tx.car_bookings.create({
      data: {
        bookingNumber,
        acceptedQuoteId: quoteId,
        quoteRequestId: quoteRequestId,
        customerId: request.customerId,
        customerName: request.customerName,
        customerEmail: request.customerEmail,
        customerPhone: request.customerPhone,
        locationId: request.locationId,
        locationName: request.locationName,
        // Requested vehicle details (from quote request)
        requestedVehicleId: request.vehicle_modelsId,
        requestedVehicleName: request.vehicle_modelsName || quote.vehicleName,
        requestedBrand: request.vehicleBrand || quote.vehicleBrand,
        requestedCategory: request.vehicleCategoryName || quote.vehicle_category,
        requestedTransmission: request.transmission || quote.transmission,
        requestedFuelType: request.fuelType || quote.fuelType,
        requestedSeats: request.minSeats || quote.seats,
        // Vendor assignment
        assignedVendorId: quote.vendorId,
        acceptedVendorId: quote.vendorId,
        assignedVehicleId: quote.vendorFleetId,
        assignedVehicleName: quote.vehicleName,
        acceptedAt: new Date(),
        // Addresses
        pickupAddress: request.pickupAddress,
        dropAddress: request.dropAddress,
        isDeliveryRequested: request.isDeliveryRequested || false,
        // Dates
        pickupDate: request.pickupDate,
        pickupTime: request.pickupTime,
        dropDate: request.dropDate,
        dropTime: request.dropTime,
        totalDays: request.totalDays,
        // Pricing
        dailyRate: quote.dailyRate,
        baseAmount: quote.baseAmount,
        gstAmount: quote.gstAmount || 0,
        platformFee: quote.platformFee || 0,
        securityDeposit: quote.securityDeposit,
        grandTotal: quote.grandTotal,
        advanceAmount,
        advancePercentage: quote.advancePercent,
        kmLimitPerDay: quote.kmLimitPerDay || 200,
        extraKmRate: quote.extraKmRate || 10,
        // OTPs
        tripStartOtp: generateOTP(),
        // Notes
        customerNotes: request.customerNotes,
        vendorNotes: quote.vendorMessage,
        // Status
        status: 'PENDING_PAYMENT',
      },
    });

    return booking;
  });

  return result;
}
