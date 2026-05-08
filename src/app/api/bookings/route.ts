import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { generateCustomerId } from '@/lib/utils/id-generator';
import {
  checkRateLimit,
  RATE_LIMITS,
  logger,
} from '@/lib/security';
import { sendQuoteRequestNotificationToVendors } from '@/lib/utils/vendor-notification-sender';

export const dynamic = 'force-dynamic';

/**
 * Unified Booking API Endpoint - ALL LOCAL (No Laravel CRM)
 *
 * Routes different booking types to appropriate handlers:
 * - Quote-based: Truck, Packers, Equipment, Bus → Create QuoteRequest (local DB)
 * - Broadcast/Bid: Luxury → Create broadcasted booking (local DB)
 * - Direct: Bike, Car, Self-Drive → Create booking (local DB)
 */

// Helper functions
function generateRequestNumber(prefix: string): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}-${random}`;
}

function generateBookingNumber(prefix: string): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}-${random}`;
}

function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Travel-agent PERSONAL tagging — looks up the linkedTravelAgentId for the
// given customer and (if set) writes travelAgentId + bookingMode='PERSONAL'
// onto a freshly-created booking/quote row. ALSO swaps customerPhone for
// the agent's real phone if the row currently holds a `ta-<id>` placeholder.
// Uses raw SQL so it survives Prisma client cache lag with the new columns.
// Non-fatal: failures are logged but never block the booking.
async function tagTaPersonalBooking(
  tableName: string,
  rowId: string,
  customerId: string,
): Promise<void> {
  try {
    const linkRows: any[] = await (prisma as any).$queryRawUnsafe(
      `SELECT linkedTravelAgentId FROM customers WHERE id = ? LIMIT 1`,
      customerId,
    );
    const agentId = linkRows[0]?.linkedTravelAgentId || null;
    if (!agentId) return;
    await (prisma as any).$executeRawUnsafe(
      `UPDATE \`${tableName}\` SET travelAgentId = ?, bookingMode = ? WHERE id = ?`,
      agentId,
      'PERSONAL',
      rowId,
    );
    // Patch the stored customerPhone if it's a `ta-` placeholder — replace
    // with the agent's real phone so reports/dashboards show a usable number.
    try {
      const ag: any = await (prisma as any).travel_agents.findUnique({
        where: { id: agentId },
        select: { phone: true },
      });
      if (ag?.phone) {
        await (prisma as any).$executeRawUnsafe(
          `UPDATE \`${tableName}\` SET customerPhone = ? WHERE id = ? AND customerPhone LIKE 'ta-%'`,
          ag.phone,
          rowId,
        );
      }
    } catch { /* non-fatal */ }
  } catch (e) {
    console.error(`[tagTaPersonalBooking:${tableName}] failed`, e);
  }
}

// Get or create customer in local DB
async function getOrCreateCustomer(customerInfo: { name: string; email: string; phone: string; password?: string }) {
  let customer = await prisma.customers.findFirst({
    where: {
      OR: [
        { email: customerInfo.email },
        { phone: customerInfo.phone },
      ],
    },
  });

  let isNewCustomer = false;
  let customerExists = false;
  let hasPassword = false;

  if (!customer) {
    isNewCustomer = true;
    // Hash password if provided (for new registration during booking)
    let hashedPassword = null;
    if (customerInfo.password) {
      const bcrypt = require('bcryptjs');
      hashedPassword = await bcrypt.hash(customerInfo.password, 10);
    }

    const customerId = await generateCustomerId();
    customer = await prisma.customers.create({
      data: {
        id: customerId,
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone,
        password: hashedPassword,
      },
    });
  } else {
    customerExists = true;
    hasPassword = !!customer.password;
  }

  return { customer, isNewCustomer, customerExists, hasPassword };
}

// Find location by name or create reference
async function findLocation(cityName: string) {
  if (!cityName) return null;

  const location = await prisma.locations.findFirst({
    where: {
      OR: [
        { name: { contains: cityName } },
        { slug: cityName.toLowerCase().replace(/\s+/g, '-') },
      ],
      isActive: true,
    },
  });

  return location;
}

// ============= BIKE BOOKING HANDLER =============

async function handleBikeBooking(customerInfo: { name: string; email: string; phone: string; password?: string }, bookingData: Record<string, unknown>, isB2B: boolean = false) {
  const { customer } = await getOrCreateCustomer(customerInfo);
  const location = await findLocation(bookingData.location_name as string || bookingData.location_slug as string);

  const bookingNumber = generateBookingNumber('BK');

  // Parse dates
  const pickupDate = bookingData.journey_datetime ? new Date(bookingData.journey_datetime as string) : new Date();
  const returnDate = bookingData.return_datetime ? new Date(bookingData.return_datetime as string) : new Date(pickupDate.getTime() + 24 * 60 * 60 * 1000);

  // Calculate total days
  const totalDays = Math.max(1, Math.ceil((returnDate.getTime() - pickupDate.getTime()) / (24 * 60 * 60 * 1000)));

  // Map bike duration to days
  const durationMap: Record<string, number> = {
    '1': 1,   // Daily
    '2': 7,   // Weekly
    '3': 30,  // Monthly
  };
  const rentalDays = durationMap[bookingData.bike_duration as string] || (bookingData.duration_days as number) || totalDays;

  // Map bike type
  const bikeTypeMap: Record<string, string> = {
    '1': 'Regular',
    '2': 'Scooter',
    '3': 'Royal Enfield',
    '4': 'Sports',
    '5': 'KTM',
    '6': 'Premium',
  };

  // Get vehicle name - prioritize bike_name, then fleet, then bike_type mapping
  const vehicleName = (bookingData.bike_name as string) ||
    (bookingData.fleet as string) ||
    bikeTypeMap[bookingData.bike_type as string] ||
    'Any Bike';

  // Get vehicle category
  const vehicle_category = (bookingData.bike_category as string) ||
    bikeTypeMap[bookingData.bike_type as string] ||
    'Regular';

  // Get pricing - from bookingData or lookup from vehicle
  let dailyRate = parseFloat(bookingData.daily_rate as string) || 0;
  let vehicleModelId: string | null = (bookingData.model_id as string) || null;
  let vehicleBrand: string | null = (bookingData.bike_brand as string) || null;
  let assignedVendorId: string | null = (bookingData.vendor_id as string) || null;
  let vendorFleetId: string | null = (bookingData.vendor_fleet_id as string) || null;
  let notifiedVendorIds: string[] = [];
  const broadcastToAll = bookingData.broadcast_to_all === true || bookingData.broadcast_to_all === 'true';

  // If model_id is provided directly, use it; otherwise try to find by slug
  if (vehicleModelId && location) {
    // Direct lookup by model ID
    const vehicle_model = await prisma.vehicle_models.findUnique({
      where: { id: vehicleModelId },
      include: { brands: { select: { name: true } } },
    });

    if (vehicle_model) {
      vehicleBrand = vehicleBrand || vehicle_model.brands?.name || null;

      // If a specific vendor/fleet was selected, verify it exists and use its pricing
      if (vendorFleetId && !broadcastToAll) {
        const vendor_fleet = await prisma.vendor_fleets.findUnique({
          where: { id: vendorFleetId },
          include: {
            fleet_pricing: { take: 1 },
          },
        });
        if (vendor_fleet) {
          assignedVendorId = vendor_fleet.vendorId;
          if (vendor_fleet.fleet_pricing[0] && !dailyRate) {
            dailyRate = vendor_fleet.fleet_pricing[0].perDayRate || vendor_fleet.fleet_pricing[0].basePrice || dailyRate;
          }
        }
      } else {
        // Find ALL vendors with this vehicle model at this location (broadcast)
        const vendorFleets = await prisma.vendor_fleets.findMany({
          where: {
            vehicleModelId: vehicle_model.id,
            isActive: true,
            isAvailable: true,
            vendor_fleet_locations: {
              some: {
                locationId: location.id,
              },
            },
          },
          include: {
            fleet_pricing: { take: 1, orderBy: { basePrice: 'asc' } },
          },
        });

        if (vendorFleets.length > 0) {
          notifiedVendorIds = vendorFleets.map((f: any) => f.vendorId);

          // Get the lowest price if not already set
          if (!dailyRate) {
            const lowestPriceFleet = vendorFleets.find((f: any) => f.fleet_pricing.length > 0);
            if (lowestPriceFleet && lowestPriceFleet.fleet_pricing[0]) {
              dailyRate = lowestPriceFleet.fleet_pricing[0].perDayRate || lowestPriceFleet.fleet_pricing[0].basePrice || 0;
            }
          }
        }
      }
    }
  } else if (bookingData.bike_slug && location) {
    // Fallback: Find by slug if model_id not provided
    const vehicle_model = await prisma.vehicle_models.findFirst({
      where: {
        slug: bookingData.bike_slug as string,
        isActive: true,
      },
      include: {
        brand: { select: { name: true } },
      },
    });

    if (vehicle_model) {
      vehicleModelId = vehicle_model.id;
      vehicleBrand = vehicle_model.brands?.name || null;

      // Find vendors with this vehicle model at this location
      const vendorFleets = await prisma.vendor_fleets.findMany({
        where: {
          vehicleModelId: vehicle_model.id,
          isActive: true,
          isAvailable: true,
          vendor_fleet_locations: {
            some: {
              locationId: location.id,
            },
          },
        },
        include: {
          fleet_pricing: {
            take: 1,
            orderBy: { basePrice: 'asc' },
          },
        },
      });

      if (vendorFleets.length > 0) {
        notifiedVendorIds = vendorFleets.map((f: any) => f.vendorId);

        // Get the lowest price from available vendors
        if (!dailyRate) {
          const lowestPriceFleet = vendorFleets.find((f: any) => f.fleet_pricing.length > 0);
          if (lowestPriceFleet && lowestPriceFleet.fleet_pricing[0]) {
            dailyRate = lowestPriceFleet.fleet_pricing[0].perDayRate || lowestPriceFleet.fleet_pricing[0].basePrice || 0;
          }
        }
      }
    }
  }

  // Calculate amounts
  let totalAmount = dailyRate * rentalDays;
  let gstAmount = Math.round(totalAmount * 0.18);
  const securityDeposit = parseFloat(bookingData.security_deposit as string) || 500;
  let platformFee = 0;
  let advancePercentage = 30; // Default

  // Check for client-provided payment breakdown (overrides defaults)
  const paymentBreakdown = bookingData.payment_breakdown as any;

  if (paymentBreakdown) {
    totalAmount = parseFloat(paymentBreakdown.base_total) || totalAmount;
    gstAmount = parseFloat(paymentBreakdown.gst_amount) || gstAmount;
    platformFee = parseFloat(paymentBreakdown.platform_fee) || 0;
    advancePercentage = parseFloat(paymentBreakdown.advance_percentage) || 30;
  }

  const grandTotal = totalAmount + gstAmount + platformFee;

  // Determine if this is a broadcast booking or direct assignment
  // Direct assignment: specific vendor selected and not broadcast_to_all
  // Broadcast: no specific vendor OR broadcast_to_all flag is true OR multiple vendors available
  const isDirectAssignment = assignedVendorId && !broadcastToAll;
  const isBroadcast = !isDirectAssignment;

  // Calculate advance amount
  const advanceAmount = paymentBreakdown?.advance_amount
    ? parseFloat(paymentBreakdown.advance_amount)
    : Math.round(grandTotal * (advancePercentage / 100));

  // IMPORTANT: Always start with PENDING_PAYMENT status
  // Flow: PENDING_PAYMENT → PAYMENT_SUBMITTED → PAYMENT_VERIFIED → BROADCASTED/PENDING_VENDOR → ACCEPTED
  const booking: any = await (prisma as any).bike_bookings.create({
    data: {
      bookingNumber,
      customerId: customer.id,
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      customerPhone: customerInfo.phone,
      locationId: location?.id || 'default_loc',
      locationName: (bookingData.location_name as string) || location?.name || 'Not specified',
      requestedVehicleName: vehicleName,
      requestedBrand: vehicleBrand,
      requestedCategory: vehicle_category,
      requestedModelId: vehicleModelId,
      requestedVehicleId: vendorFleetId,  // The specific fleet vehicle if selected
      // Don't assign vendor yet - only after payment is verified
      assignedVendorId: null,
      // Store vendor info for later broadcast/assignment after payment - STRINGIFY FOR JSON COLUMN
      notifiedVendorIds: notifiedVendorIds.length > 0
        ? JSON.stringify(notifiedVendorIds)
        : (assignedVendorId ? JSON.stringify([assignedVendorId]) : undefined),
      pickupDate,
      pickupTime: pickupDate.toTimeString().slice(0, 5),
      dropDate: returnDate,
      dropTime: returnDate.toTimeString().slice(0, 5),
      totalDays: rentalDays,
      // B2B customers skip payment - go directly to BROADCASTED
      status: isB2B ? 'BROADCASTED' : 'PENDING_PAYMENT',
      paymentStatus: isB2B ? 'PAID' : 'PENDING',
      broadcastedAt: isB2B ? new Date() : null,
      responseDeadline: isB2B ? new Date(Date.now() + 4 * 60 * 60 * 1000) : null,
      dailyRate,
      totalAmount,
      gstAmount,
      securityDeposit,
      grandTotal,
      platformFee,
      advanceAmount,
      advancePercentage,
      customerNotes: bookingData.other_info as string || null,
    },
  });

  await tagTaPersonalBooking('bike_bookings', booking.id, customer.id);

  // Message guides customer to payment step (or confirms for B2B)
  const message = isB2B
    ? `Your B2B booking has been created! Vendors have been notified. No payment required now — post-trip billing.`
    : `Your booking has been created! Please pay ₹${advanceAmount} advance to confirm. Once payment is verified, ${isBroadcast ? 'vendors will be notified' : 'the vendor will be notified'}.`;

  return {
    success: true,
    message,
    booking_id: booking.id,
    booking_number: booking.bookingNumber,
    customer_id: customer.id,
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    },
    redirect_to: `/customer/bike-bookings/${booking.bookingNumber}`,
    payment_info: isB2B ? null : {
      advance_amount: advanceAmount,
      total_amount: grandTotal,
      advance_percentage: 30,
      status: 'PENDING_PAYMENT',
    },
  };
}

// ============= CAR BOOKING HANDLER =============

async function handleCarBooking(customerInfo: { name: string; email: string; phone: string; password?: string }, bookingData: Record<string, unknown>) {
  const { customer } = await getOrCreateCustomer(customerInfo);
  const pickupLocation = await findLocation(bookingData.location_name as string);

  const bookingNumber = generateBookingNumber('CR');

  // Parse dates
  const pickupDate = bookingData.journey_datetime ? new Date(bookingData.journey_datetime as string) : new Date();
  const returnDate = bookingData.return_datetime ? new Date(bookingData.return_datetime as string) : null;

  // Map trip type
  const tripTypeMap: Record<string, string> = {
    '1': 'oneway',
    '2': 'airport',
    '3': 'roundtrip',
  };

  // Map car type
  const carTypeMap: Record<string, string> = {
    '1': 'Hatchback',
    '2': 'Sedan',
    '3': 'MUV',
    '4': 'SUV',
    '5': 'Luxury',
  };

  // Calculate total days
  const totalDays = returnDate
    ? Math.max(1, Math.ceil((returnDate.getTime() - pickupDate.getTime()) / (24 * 60 * 60 * 1000)))
    : 1;

  const booking: any = await (prisma as any).car_bookings.create({
    data: {
      bookingNumber,
      customerId: customer.id,
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      customerPhone: customerInfo.phone,
      locationId: pickupLocation?.id || 'default_loc',
      locationName: (bookingData.location_name as string) || 'Not specified',
      requestedVehicleName: (bookingData.fleet as string) || carTypeMap[bookingData.car_type as string] || 'Any Car',
      requestedCategory: carTypeMap[bookingData.car_type as string] || 'Sedan',
      pickupDate,
      pickupTime: pickupDate.toTimeString().slice(0, 5),
      dropDate: returnDate || pickupDate,
      dropTime: returnDate ? returnDate.toTimeString().slice(0, 5) : pickupDate.toTimeString().slice(0, 5),
      totalDays,
      pickupAddress: (bookingData.location_name as string) || null,
      dropAddress: (bookingData.destination as string) || null,
      status: 'PENDING_VENDOR',
      dailyRate: 0,
      baseAmount: 0,
      gstAmount: 0,
      securityDeposit: 0,
      grandTotal: 0,
      customerNotes: bookingData.other_info as string || null,
    },
  });

  await tagTaPersonalBooking('car_bookings', booking.id, customer.id);

  return {
    success: true,
    message: 'Your car rental booking has been submitted! We will confirm shortly.',
    booking_id: booking.id,
    booking_number: booking.bookingNumber,
    customer_id: customer.id,
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    },
    redirect_to: `/customer/car-bookings/${booking.bookingNumber}`,
  };
}

// ============= SELF-DRIVE BOOKING HANDLER =============

async function handleSelfDriveBooking(customerInfo: { name: string; email: string; phone: string; password?: string }, bookingData: Record<string, unknown>, isB2B: boolean = false) {
  const { customer, isNewCustomer } = await getOrCreateCustomer(customerInfo);
  const location = await findLocation(bookingData.location_name as string || bookingData.location_slug as string);

  const bookingNumber = generateBookingNumber('SD');

  // Parse dates
  const pickupDate = bookingData.journey_datetime ? new Date(bookingData.journey_datetime as string) : new Date();
  const returnDate = bookingData.return_datetime ? new Date(bookingData.return_datetime as string) : new Date(pickupDate.getTime() + 24 * 60 * 60 * 1000);

  // Calculate total days
  const totalDays = Math.max(1, Math.ceil((returnDate.getTime() - pickupDate.getTime()) / (24 * 60 * 60 * 1000)));

  // Map car type
  const carTypeMap: Record<string, string> = {
    '1': 'Hatchback',
    '2': 'Sedan',
    '3': 'SUV',
    '4': 'Luxury',
  };

  // Map transmission
  const transmissionMap: Record<string, string> = {
    '1': 'Manual',
    '2': 'Automatic',
  };

  // Map fuel type
  const fuelTypeMap: Record<string, string> = {
    '1': 'Petrol',
    '2': 'Diesel',
    '3': 'CNG',
    '4': 'Electric',
  };

  // Get pricing from booking data
  let dailyRate = parseFloat(bookingData.daily_rate as string) || 0;
  let vehicleModelId: string | null = (bookingData.model_id as string) || null;
  let vehicleBrand: string | null = (bookingData.brand_name as string) || null;
  let assignedVendorId: string | null = (bookingData.vendor_id as string) || null;
  let vendorFleetId: string | null = (bookingData.vendor_fleet_id as string) || null;
  let notifiedVendorIds: string[] = [];
  const broadcastToAll = bookingData.broadcast_to_all === true || bookingData.broadcast_to_all === 'true';

  // If a specific vendor/fleet was selected, use it
  if (vendorFleetId && !broadcastToAll && location) {
    const vendor_fleet = await prisma.vendor_fleets.findUnique({
      where: { id: vendorFleetId },
      include: {
        fleet_pricing: {
          where: { priceType: 'PER_DAY' },
          take: 1,
        },
        vehicle_models: {
          include: { brands: { select: { name: true } } },
        },
      },
    });

    if (vendor_fleet) {
      assignedVendorId = vendor_fleet.vendorId;
      notifiedVendorIds = [vendor_fleet.vendorId];
      vehicleModelId = vehicleModelId || vendor_fleet.vehicle_modelsId;
      vehicleBrand = vehicleBrand || vendor_fleet.vehicle_models?.brands?.name || null;

      if (vendor_fleet.fleet_pricing[0] && !dailyRate) {
        dailyRate = vendor_fleet.fleet_pricing[0].perDayRate || vendor_fleet.fleet_pricing[0].basePrice || dailyRate;
      }
    }
  } else if (vehicleModelId && location && !broadcastToAll) {
    // Find all vendors with this vehicle at this location
    const vendorFleets = await prisma.vendor_fleets.findMany({
      where: {
        vehicleModelId,
        isActive: true,
        isAvailable: true,
        vendor_fleet_locations: {
          some: { locationId: location.id },
        },
      },
      include: {
        fleet_pricing: {
          where: { priceType: 'PER_DAY' },
          take: 1,
          orderBy: { basePrice: 'asc' },
        },
      },
    });

    if (vendorFleets.length > 0) {
      notifiedVendorIds = vendorFleets.map((f: any) => f.vendorId);

      if (!dailyRate) {
        const lowestPriceFleet = vendorFleets.find((f: any) => f.fleet_pricing.length > 0);
        if (lowestPriceFleet && lowestPriceFleet.fleet_pricing[0]) {
          dailyRate = lowestPriceFleet.fleet_pricing[0].perDayRate || lowestPriceFleet.fleet_pricing[0].basePrice || 0;
        }
      }
    }
  }

  // Calculate amounts
  // Calculate amounts
  let baseAmount = dailyRate * totalDays;
  let gstAmount = Math.round(baseAmount * 0.18);
  const securityDeposit = parseFloat(bookingData.deposit_amount as string) || 5000;
  let platformFee = 99;
  let advancePercentage = 30; // Default

  // Check for client-provided payment breakdown (overrides defaults)
  const paymentBreakdown = bookingData.payment_breakdown as any;

  if (paymentBreakdown) {
    baseAmount = parseFloat(paymentBreakdown.base_total) || baseAmount;
    gstAmount = parseFloat(paymentBreakdown.gst_amount) || gstAmount;
    platformFee = parseFloat(paymentBreakdown.platform_fee) || platformFee;
    advancePercentage = parseFloat(paymentBreakdown.advance_percentage) || 30;
  }

  const grandTotal = baseAmount + gstAmount + platformFee;
  const kmLimitPerDay = parseInt(bookingData.km_limit_per_day as string) || 200;
  const extraKmRate = parseFloat(bookingData.extra_km_charge as string) || 10;

  // Determine vendor assignment info
  const isDirectAssignment = assignedVendorId && !broadcastToAll;
  const vendorAssignmentInfo = isDirectAssignment
    ? [assignedVendorId!]
    : notifiedVendorIds;

  const booking: any = await (prisma as any).car_bookings.create({
    data: {
      bookingNumber,
      customerId: customer.id,
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      customerPhone: customerInfo.phone,
      locationId: location?.id || 'default',
      locationName: (bookingData.location_name as string) || location?.name || 'Not specified',
      requestedVehicleId: vendorFleetId,
      requestedVehicleName: (bookingData.car_name as string) || carTypeMap[bookingData.car_type as string] || 'Any Car',
      requestedBrand: vehicleBrand,
      requestedCategory: (bookingData.car_category as string) || carTypeMap[bookingData.car_type as string] || 'Sedan',
      requestedTransmission: transmissionMap[bookingData.transmission as string] || null,
      requestedFuelType: fuelTypeMap[bookingData.fuel_type as string] || null,
      pickupDate,
      pickupTime: pickupDate.toTimeString().slice(0, 5),
      dropDate: returnDate,
      dropTime: returnDate.toTimeString().slice(0, 5),
      totalDays,
      pickupAddress: (bookingData.location_name as string) || null,
      // Vendor assignment (will be activated after payment verification)
      assignedVendorId: null, // Will be set after payment verification
      // Store vendor info for later broadcast/assignment after payment - STRINGIFY FOR JSON COLUMN
      notifiedVendorIds: vendorAssignmentInfo.length > 0 ? JSON.stringify(vendorAssignmentInfo) : undefined,
      // B2B customers skip payment
      status: isB2B ? 'PENDING_VENDOR' : 'PENDING_PAYMENT',
      // Pricing
      dailyRate,
      baseAmount,
      gstAmount,
      platformFee,
      advancePercentage,
      securityDeposit,
      grandTotal,
      kmLimitPerDay,
      extraKmRate,
      // Other info
      licenseNumber: (bookingData.license_number as string) || null,
      customerNotes: (bookingData.other_info as string) || null,
      version: 0,
    },
  });

  await tagTaPersonalBooking('car_bookings', booking.id, customer.id);

  return {
    success: true,
    message: isB2B
      ? 'Your B2B self-drive booking has been created! Vendor will be notified. No payment required — post-trip billing.'
      : isNewCustomer
        ? 'Your account has been created and booking submitted! Please complete the advance payment to confirm.'
        : 'Your self-drive car booking has been created! Please complete the advance payment to confirm your booking.',
    booking_id: booking.id,
    booking_number: booking.bookingNumber,
    customer_id: customer.id,
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    },
    redirect_to: `/customer/car-bookings/${booking.bookingNumber}`,
  };
}

// ============= QUOTE-BASED HANDLERS =============

async function handleTruckQuoteRequest(customerInfo: { name: string; email: string; phone: string; password?: string }, bookingData: Record<string, unknown>) {
  const { customer } = await getOrCreateCustomer(customerInfo);
  const pickupLocation = await findLocation(bookingData.location_name as string);

  const requestNumber = generateRequestNumber('TQR');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  const quotesOpenTill = new Date();
  quotesOpenTill.setHours(quotesOpenTill.getHours() + 48);

  const pickupDateTime = bookingData.journey_datetime ? new Date(bookingData.journey_datetime as string) : new Date();

  const truckType = (bookingData.truck_type as string) || (bookingData.truckType as string) || 'truck-14ft';
  const truckTypeName = (bookingData.truck_type_name as string) || (bookingData.truckTypeName as string) || 'Truck 14ft';
  const goodsType = (bookingData.personal_good_type as string) || (bookingData.commercial_good_type as string) || (bookingData.goodsType as string) || 'household';
  const goodsTypeName = (bookingData.personal_good_type_name as string) || (bookingData.commercial_good_type_name as string) || (bookingData.goodsTypeName as string) || 'Household Items';
  const weightVal = (bookingData.weight_val as string) || (bookingData.weightVal as string);
  const weightUnitName = (bookingData.weight_unit_name as string) || (bookingData.weightUnitName as string) || 'KG';
  const materialDetails = (bookingData.material_details as string) || null;

  const requirements = (bookingData.other_info as string) ||
    `Truck: ${truckTypeName}, Goods: ${goodsTypeName}, Weight: ${weightVal || 'N/A'} ${weightUnitName}`;

  // Helper: parse expected delivery (string from chat → DateTime|null)
  const parseExpectedDelivery = (val: unknown): Date | null => {
    if (!val) return null;
    const s = String(val).trim();
    if (!s) return null;
    const m = s.match(/^(\d+)\s*(day|days|week|weeks)$/i);
    if (m) {
      const n = parseInt(m[1], 10);
      const unitDays = /week/i.test(m[2]) ? 7 : 1;
      return new Date(Date.now() + n * unitDays * 24 * 60 * 60 * 1000);
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };

  // Validate truck body type enum (fall back to null if not recognised)
  const validBodyTypes = ['OPEN', 'CLOSED_BODY', 'CONTAINER', 'TRAILER', 'LCV', 'REFRIGERATED', 'FLATBED', 'OTHER'];
  const rawBodyType = (bookingData.truck_body_type as string) || null;
  const truckBodyType = rawBodyType && validBodyTypes.includes(rawBodyType) ? rawBodyType : null;

  const validTripDirections = ['ONE_WAY', 'ROUND_TRIP'];
  const rawTripDirection = (bookingData.trip_direction as string) || 'ONE_WAY';
  const tripDirection = validTripDirections.includes(rawTripDirection) ? rawTripDirection : 'ONE_WAY';

  // goodsDescription combines goodsTypeName and material details when provided
  const goodsDescription = materialDetails
    ? `${goodsTypeName} – ${materialDetails}`
    : goodsTypeName;

  const quoteRequest = await (prisma as any).truck_quote_requests.create({
    data: {
      requestNumber,
      customerId: customer.id,
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      customerPhone: customerInfo.phone,
      serviceType: bookingData.truck_mode === '1' || bookingData.truckMode === '1' ? 'local-shifting' : 'commercial',
      vehicleCategory: truckType,
      vehicleCategoryName: truckTypeName,
      goodsType: goodsType,
      goodsDescription: goodsDescription,
      estimatedWeight: weightVal ? parseFloat(weightVal) : null,
      estimatedVolume: (bookingData.truck_estimated_volume as string) || null,
      requiresLabour: bookingData.requires_labour === true,
      labourCount: bookingData.truck_labour_count != null
        ? parseInt(bookingData.truck_labour_count as string)
        : null,
      pickupCity: (bookingData.location_name as string) || (bookingData.pickupLocation as string) || 'Not specified',
      pickupAddress: (bookingData.pickup_full_address as string) || (bookingData.location_name as string) || (bookingData.pickupLocation as string) || null,
      pickupPincode: (bookingData.truck_pickup_pincode as string) || null,
      pickupFloor: bookingData.truck_pickup_floor != null
        ? parseInt(bookingData.truck_pickup_floor as string)
        : null,
      hasPickupLift: bookingData.has_truck_pickup_lift === true,
      dropCity: (bookingData.destination as string) || 'Not specified',
      dropAddress: (bookingData.destination_full_address as string) || (bookingData.destination as string) || null,
      dropPincode: (bookingData.truck_drop_pincode as string) || null,
      dropFloor: bookingData.truck_drop_floor != null
        ? parseInt(bookingData.truck_drop_floor as string)
        : null,
      hasDropLift: bookingData.has_truck_drop_lift === true,
      pickupDate: pickupDateTime,
      pickupTime: pickupDateTime.toTimeString().slice(0, 5),
      expectedDeliveryDate: parseExpectedDelivery(bookingData.truck_expected_delivery_date),
      expectedDeliveryTime: (bookingData.truck_expected_delivery_time as string) || null,
      truckBodyType: truckBodyType,
      tripDirection: tripDirection,
      hasMultipleStops: bookingData.truck_has_multiple_stops === true,
      multipleStopsDetails: (bookingData.truck_multiple_stops_details as string) || null,
      receiverName: (bookingData.truck_receiver_name as string) || null,
      receiverPhone: (bookingData.truck_receiver_phone as string) || null,
      requiresPOD: bookingData.truck_requires_pod === true,
      isFlexibleDate: bookingData.is_flexible_date === true,
      needInsurance: bookingData.need_insurance === true,
      needPackaging: bookingData.need_packaging === true,
      budgetMin: bookingData.budget_min != null
        ? parseFloat(bookingData.budget_min as string)
        : null,
      budgetMax: bookingData.budget_max != null
        ? parseFloat(bookingData.budget_max as string)
        : null,
      requirements: requirements,
      locationId: pickupLocation?.id || 'default_loc',
      status: 'PENDING',
      expiresAt,
      quotesOpenTill,
    },
  });

  await tagTaPersonalBooking('truck_quote_requests', quoteRequest.id, customer.id);

  sendQuoteRequestNotificationToVendors({
    requestId: quoteRequest.id,
    requestNumber: quoteRequest.requestNumber,
    locationId: pickupLocation?.id || (bookingData.location_name as string),
    locationName: pickupLocation?.name || (bookingData.location_name as string),
    customerName: customerInfo.name,
    serviceType: 'truck',
    serviceDisplayName: 'Truck Rental',
  }).catch((err: any) => console.error('[Notification] Truck failed:', err));

  return {
    success: true,
    message: 'Your truck rental request has been submitted! Vendors will send quotes within 24-48 hours.',
    request_id: quoteRequest.id,
    request_number: quoteRequest.requestNumber,
    booking_id: quoteRequest.id,
    customer_id: customer.id,
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    },
    redirect_to: `/customer/truck-quotes?request=${quoteRequest.requestNumber}`,
  };
}

async function handlePackersQuoteRequest(customerInfo: { name: string; email: string; phone: string; password?: string }, bookingData: Record<string, unknown>) {
  const { customer } = await getOrCreateCustomer(customerInfo);
  const pickupLocation = await findLocation(bookingData.location_name as string);

  const requestNumber = generateRequestNumber('PQR');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  const quotesOpenTill = new Date();
  quotesOpenTill.setHours(quotesOpenTill.getHours() + 48);

  // Helper: best-effort parse of expected delivery (string from chat → DateTime|null)
  const parseExpectedDelivery = (val: unknown): Date | null => {
    if (!val) return null;
    const s = String(val).trim();
    if (!s) return null;
    // Match "N day(s)", "N week(s)" relative spec
    const m = s.match(/^(\d+)\s*(day|days|week|weeks)$/i);
    if (m) {
      const n = parseInt(m[1], 10);
      const unitDays = /week/i.test(m[2]) ? 7 : 1;
      return new Date(Date.now() + n * unitDays * 24 * 60 * 60 * 1000);
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };

  const quoteRequest = await (prisma as any).packers_quote_requests.create({
    data: {
      requestNumber,
      customerId: customer.id,
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      customerPhone: customerInfo.phone,
      serviceType: 'full-service',
      shiftingType: (bookingData.shifting_type as string) || 'Home',
      shiftingScope: (bookingData.shifting_scope as string) || 'LOCAL',
      propertySize: (bookingData.home_shifting as string) || (bookingData.office_shifting as string) || (bookingData.vehicle_shifting as string) || null,
      pickupCity: bookingData.location_name as string,
      pickupAddress: (bookingData.pickup_full_address as string) || (bookingData.location_name as string),
      pickupPincode: (bookingData.pickup_pincode as string) || null,
      pickupFloor: bookingData.pickup_floor != null ? parseInt(bookingData.pickup_floor as string) : null,
      hasPickupLift: bookingData.has_pickup_lift === true,
      dropCity: bookingData.destination as string,
      dropAddress: (bookingData.destination_full_address as string) || (bookingData.destination as string),
      dropPincode: (bookingData.drop_pincode as string) || null,
      dropFloor: bookingData.drop_floor != null ? parseInt(bookingData.drop_floor as string) : null,
      hasDropLift: bookingData.has_drop_lift === true,
      preferredDate: bookingData.journey_datetime ? new Date(bookingData.journey_datetime as string) : new Date(),
      expectedDeliveryDate: parseExpectedDelivery(bookingData.expected_delivery_date),
      expectedDeliveryTime: (bookingData.expected_delivery_time as string) || null,
      inventoryList: (bookingData.inventory_list as string) || null,
      estimatedWeight: bookingData.estimated_weight != null ? parseFloat(bookingData.estimated_weight as string) : null,
      hasHeavyItems: bookingData.has_heavy_items === true,
      heavyItemsDesc: (bookingData.heavy_items_desc as string) || null,
      hasFragileItems: bookingData.has_fragile_items === true,
      fragileItemsDesc: (bookingData.fragile_items_desc as string) || null,
      boxesCount: bookingData.boxes_count != null ? parseInt(bookingData.boxes_count as string) : null,
      bagsCount: bookingData.bags_count != null ? parseInt(bookingData.bags_count as string) : null,
      needPacking: bookingData.need_packing !== false,
      needLoading: bookingData.need_loading !== false,
      needUnloading: bookingData.need_unloading !== false,
      needUnpacking: bookingData.need_unpacking === true,
      labourCount: bookingData.labour_count != null ? parseInt(bookingData.labour_count as string) : null,
      vehicleType: (bookingData.vehicle_type_req as string) || 'DEDICATED',
      partLoadAccepted: bookingData.part_load_accepted === true,
      needInsurance: bookingData.need_insurance === true,
      insuranceValue: bookingData.insurance_value != null ? parseFloat(bookingData.insurance_value as string) : null,
      requiresPOD: bookingData.requires_pod === true,
      receiverName: (bookingData.receiver_name as string) || null,
      receiverPhone: (bookingData.receiver_phone as string) || null,
      hasMultipleStops: bookingData.has_multiple_stops === true,
      multipleStopsDetails: (bookingData.multiple_stops_details as string) || null,
      requirements: (bookingData.other_info as string) || null,
      locationId: pickupLocation?.id || null,
      status: 'PENDING',
      expiresAt,
      quotesOpenTill,
    },
  });

  await tagTaPersonalBooking('packers_quote_requests', quoteRequest.id, customer.id);

  sendQuoteRequestNotificationToVendors({
    requestId: quoteRequest.id,
    requestNumber: quoteRequest.requestNumber,
    locationId: pickupLocation?.id || (bookingData.location_name as string),
    locationName: pickupLocation?.name || (bookingData.location_name as string),
    customerName: customerInfo.name,
    serviceType: 'packers',
    serviceDisplayName: 'Packers & Movers',
  }).catch((err: any) => console.error('[Notification] Packers failed:', err));

  return {
    success: true,
    message: 'Your packers & movers request has been submitted! Vendors will send quotes within 24-48 hours.',
    request_id: quoteRequest.id,
    request_number: quoteRequest.requestNumber,
    booking_id: quoteRequest.id,
    customer_id: customer.id,
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    },
    redirect_to: `/customer/packers-quotes?request=${quoteRequest.requestNumber}`,
  };
}

async function handleEquipmentQuoteRequest(customerInfo: { name: string; email: string; phone: string; password?: string }, bookingData: Record<string, unknown>) {
  const { customer } = await getOrCreateCustomer(customerInfo);
  const location = await findLocation(bookingData.location_name as string);

  const requestNumber = generateRequestNumber('EQR');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  const quotesOpenTill = new Date();
  quotesOpenTill.setHours(quotesOpenTill.getHours() + 48);

  // Map job_duration to actual days and duration type
  const durationMap: Record<string, { days: number; type: string }> = {
    '1': { days: 5, type: 'daily' },
    '2': { days: 15, type: 'weekly' },
    '3': { days: 30, type: 'monthly' },
    '4': { days: 60, type: 'monthly' },
  };

  const durationInfo = durationMap[bookingData.job_duration as string] || { days: 7, type: 'daily' };
  const startDate = bookingData.journey_datetime ? new Date(bookingData.journey_datetime as string) : new Date();
  const endDate = new Date(startDate.getTime() + durationInfo.days * 24 * 60 * 60 * 1000);

  const quoteRequest: any = await (prisma as any).equipment_quote_requests.create({
    data: {
      requestNumber,
      customerId: customer.id,
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      customerPhone: customerInfo.phone,
      equipmentCategory: 'construction',
      equipmentType: (bookingData.machine_type as string) || 'general',
      quantity: parseInt(bookingData.no_of_equipments as string) || 1,
      rentalDuration: durationInfo.type,
      rentalDays: durationInfo.days,
      deliveryCity: (bookingData.location_name as string) || 'Not specified',
      deliveryAddress: (bookingData.pickup_full_address as string) || (bookingData.location_name as string) || 'Not specified',
      startDate,
      endDate,
      needOperator: true,
      requirements: (bookingData.other_info as string) || null,
      locationId: location?.id || null,
      status: 'PENDING',
      expiresAt,
      quotesOpenTill,
    },
  });

  await tagTaPersonalBooking('equipment_quote_requests', quoteRequest.id, customer.id);

  sendQuoteRequestNotificationToVendors({
    requestId: quoteRequest.id,
    requestNumber: quoteRequest.requestNumber,
    locationId: location?.id || (bookingData.location_name as string),
    locationName: location?.name || (bookingData.location_name as string),
    customerName: customerInfo.name,
    serviceType: 'equipment',
    serviceDisplayName: 'Equipment Rental',
  }).catch((err: any) => console.error('[Notification] Equipment failed:', err));

  return {
    success: true,
    message: 'Your equipment rental request has been submitted! Vendors will send quotes within 24-48 hours.',
    request_id: quoteRequest.id,
    request_number: quoteRequest.requestNumber,
    booking_id: quoteRequest.id,
    customer_id: customer.id,
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    },
    redirect_to: `/customer/equipment-quotes?request=${quoteRequest.requestNumber}`,
  };
}

async function handleBusQuoteRequest(customerInfo: { name: string; email: string; phone: string; password?: string }, bookingData: Record<string, unknown>) {
  const { customer } = await getOrCreateCustomer(customerInfo);
  const pickupLocation = await findLocation(bookingData.location_name as string);

  const requestNumber = generateRequestNumber('BQR');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  const quotesOpenTill = new Date();
  quotesOpenTill.setHours(quotesOpenTill.getHours() + 48);

  const pickupDateTime = bookingData.journey_datetime ? new Date(bookingData.journey_datetime as string) : new Date();

  const quoteRequest = await prisma.bus_quote_requests.create({
    data: {
      requestNumber,
      customerId: customer.id,
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      customerPhone: customerInfo.phone,
      tripType: bookingData.location_type === '1' ? 'outstation' : 'local',
      vehicleCategory: 'bus',
      vehicleCategoryName: 'Bus',
      passengers: parseInt(bookingData.total_passangers as string) || 20,
      pickupCity: bookingData.location_name as string,
      pickupAddress: (bookingData.pickup_full_address as string) || (bookingData.location_name as string),
      dropCity: (bookingData.destination as string) || null,
      dropAddress: (bookingData.destination_full_address as string) || (bookingData.destination as string) || null,
      pickupDate: pickupDateTime,
      pickupTime: pickupDateTime.toTimeString().slice(0, 5),
      returnDate: bookingData.return_datetime ? new Date(bookingData.return_datetime as string) : null,
      requirements: (bookingData.other_info as string) || null,
      locationId: pickupLocation?.id || null,
      status: 'PENDING',
      expiresAt,
      quotesOpenTill,
    },
  });

  await tagTaPersonalBooking('bus_quote_requests', quoteRequest.id, customer.id);

  sendQuoteRequestNotificationToVendors({
    requestId: quoteRequest.id,
    requestNumber: quoteRequest.requestNumber,
    locationId: pickupLocation?.id || (bookingData.location_name as string),
    locationName: pickupLocation?.name || (bookingData.location_name as string),
    customerName: customerInfo.name,
    serviceType: 'bus',
    serviceDisplayName: 'Bus Rental',
  }).catch((err: any) => console.error('[Notification] Bus failed:', err));

  return {
    success: true,
    message: 'Your bus rental request has been submitted! Vendors will send quotes within 24-48 hours.',
    request_id: quoteRequest.id,
    request_number: quoteRequest.requestNumber,
    booking_id: quoteRequest.id,
    customer_id: customer.id,
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    },
    redirect_to: `/customer/bus-quotes/${quoteRequest.id}`,
  };
}

// ============= LUXURY QUOTE REQUEST HANDLER =============

async function handleLuxuryQuoteRequest(customerInfo: { name: string; email: string; phone: string; password?: string }, bookingData: Record<string, unknown>) {
  const { customer } = await getOrCreateCustomer(customerInfo);
  const location = await findLocation(bookingData.location_name as string);

  // Map subService to vehicle category
  const vehicleCategoryMap: Record<string, string> = {
    'luxury-sedan': 'luxury_sedan',
    'luxury-suv': 'luxury_suv',
    'premium-sedan': 'luxury_sedan',
    'sports-car': 'sports',
    'supercar': 'sports',
    'performance': 'sports',
    'luxury-sports': 'sports',
    'vintage': 'vintage',
    'guest-transport': 'luxury_suv',
  };

  // Map luxury_type to occasion
  const occasionMap: Record<string, string> = {
    '1': 'wedding',
    '2': 'personal',
    '3': 'corporate',
  };

  // Map package to trip type
  const tripTypeMap: Record<string, string> = {
    '1': 'local',
    '2': 'local',
    '3': 'outstation',
    '4': 'airport',
  };

  const vehicleCategory = vehicleCategoryMap[bookingData.subService as string] || 'luxury_sedan';
  const occasion = occasionMap[bookingData.luxury_type as string] || 'personal';
  const tripType = tripTypeMap[bookingData.package as string] || 'local';

  const pickupDate = bookingData.journey_datetime ? new Date(bookingData.journey_datetime as string) : new Date();
  const returnDate = bookingData.return_datetime ? new Date(bookingData.return_datetime as string) : null;

  let tripDays = 1;
  if (returnDate) {
    const diff = returnDate.getTime() - pickupDate.getTime();
    tripDays = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  const requestNumber = generateRequestNumber('LQR');

  const quoteRequest = await prisma.luxury_quote_requests.create({
    data: {
      requestNumber,
      customerId: customer.id,
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      customerPhone: customerInfo.phone,
      tripType,
      occasion,
      vehicleCategory,
      vehicleCategoryName: vehicleCategory,
      passengers: parseInt(bookingData.passengers as string) || 4,
      specificModel: null,
      pickupCity: bookingData.location_name as string,
      dropCity: (bookingData.destination as string) || null,
      pickupDate,
      pickupTime: pickupDate.toTimeString().slice(0, 5),
      returnDate,
      returnTime: returnDate ? returnDate.toTimeString().slice(0, 5) : null,
      tripDays,
      needChauffeur: true,
      needDecoration: occasion === 'wedding',
      requirements: (bookingData.other_info as string) || null,
      locationId: location?.id || null,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      quotesOpenTill: new Date(Date.now() + 48 * 60 * 60 * 1000),
    },
  });

  await tagTaPersonalBooking('luxury_quote_requests', quoteRequest.id, customer.id);

  sendQuoteRequestNotificationToVendors({
    requestId: quoteRequest.id,
    requestNumber: quoteRequest.requestNumber,
    locationId: location?.id || (bookingData.location_name as string),
    locationName: location?.name || (bookingData.location_name as string),
    customerName: customerInfo.name,
    serviceType: 'luxury',
    serviceDisplayName: 'Luxury Car',
  }).catch((err: any) => console.error('[Notification] Failed:', err));

  return {
    success: true,
    message: 'Your luxury car request has been submitted! Vendors will send quotes within 24-48 hours.',
    request_id: quoteRequest.id,
    request_number: quoteRequest.requestNumber,
    customer: {
      id: customer.id,
      name: customerInfo.name,
      email: customerInfo.email,
      phone: customerInfo.phone,
    },
    redirect_to: `/customer/luxury-quotes/${quoteRequest.id}`,
  };
}

// ============= BROADCAST/BID HANDLER =============

async function handleLuxuryBooking(customerInfo: { name: string; email: string; phone: string; password?: string }, bookingData: Record<string, unknown>, isLoggedIn?: boolean) {
  const { customer, isNewCustomer, customerExists, hasPassword } = await getOrCreateCustomer(customerInfo);
  const location = await findLocation(bookingData.location_name as string);

  const bookingNumber = generateBookingNumber('LB');
  const broadcastExpiresAt = new Date();
  broadcastExpiresAt.setHours(broadcastExpiresAt.getHours() + 4);

  // Map luxury_type to category
  const categoryMap: Record<string, string> = {
    '1': 'wedding',
    '2': 'personal',
    '3': 'corporate',
  };

  // Map package to trip type
  const tripTypeMap: Record<string, string> = {
    '1': 'local',
    '3': 'outstation',
    '4': 'airport',
  };

  const booking: any = await (prisma as any).luxury_bookings.create({
    data: {
      bookingNumber,
      customerId: customer.id,
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      customerPhone: customerInfo.phone,
      tripType: tripTypeMap[bookingData.package as string] || 'local',
      carCategory: categoryMap[bookingData.luxury_type as string] || 'luxury-sedan',
      pickupCity: bookingData.location_name as string,
      pickupAddress: bookingData.location_name as string,
      dropCity: bookingData.destination as string,
      dropAddress: bookingData.destination as string,
      pickupDate: bookingData.journey_datetime ? new Date(bookingData.journey_datetime as string) : new Date(),
      pickupTime: bookingData.journey_datetime ? new Date(bookingData.journey_datetime as string).toTimeString().slice(0, 5) : '10:00',
      returnDate: bookingData.return_datetime ? new Date(bookingData.return_datetime as string) : null,
      returnTime: bookingData.return_datetime ? new Date(bookingData.return_datetime as string).toTimeString().slice(0, 5) : null,
      needDecoration: false,
      needChauffeur: true,
      customerNotes: (bookingData.other_info as string) || null,
      locationId: location?.id || 'default_loc',
      baseFare: 0,
      grandTotal: 0,
      status: 'PENDING_VENDOR',
      broadcastedAt: new Date(),
      responseDeadline: broadcastExpiresAt,
      tripStartOtp: generateOTP(),
      tripEndOtp: generateOTP(),
    },
  });

  await tagTaPersonalBooking('luxury_bookings', booking.id, customer.id);

  return {
    success: true,
    message: 'Your luxury car booking has been broadcasted to vendors! You will receive bids shortly.',
    booking_id: booking.id,
    booking_number: booking.bookingNumber,
    customer_id: customer.id,
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    },
    // Customer status for post-booking password flow
    isNewCustomer: isLoggedIn ? false : isNewCustomer,
    customerExists: isLoggedIn ? true : customerExists,
    hasPassword: isLoggedIn ? true : hasPassword,
    redirect_to: `/customer/luxury-bookings/${booking.bookingNumber}`,
  };
}

// ============= TRAILER BOOKING HANDLER =============

async function handleTrailerBooking(customerInfo: { name: string; email: string; phone: string }, bookingData: Record<string, unknown>) {
  // Trailer uses truck quote request system
  return handleTruckQuoteRequest(customerInfo, {
    ...bookingData,
    truck_mode: '1',
    truck_type: 'trailer',
    other_info: `Trailer Booking: ${bookingData.other_info || ''}`,
  });
}

// ============= BIKE QUOTE REQUEST HANDLER =============
// BROWSE_FIRST: Customer requests quotes from vendors; vendor sends quote; customer accepts and pays

async function handleBikeQuoteRequest(customerInfo: { name: string; email: string; phone: string }, bookingData: Record<string, unknown>) {
  const { customer } = await getOrCreateCustomer(customerInfo);
  const location = await findLocation(bookingData.location_name as string || bookingData.location_slug as string);

  // Parse dates
  const pickupDate = bookingData.journey_datetime ? new Date(bookingData.journey_datetime as string) : new Date();
  const returnDate = bookingData.return_datetime ? new Date(bookingData.return_datetime as string) : new Date(pickupDate.getTime() + 24 * 60 * 60 * 1000);

  const totalDays = Math.max(1, Math.ceil((returnDate.getTime() - pickupDate.getTime()) / (24 * 60 * 60 * 1000)));

  // Map bike type to category name
  const bikeTypeMap: Record<string, string> = {
    '1': 'Regular', '2': 'Scooter', '3': 'Royal Enfield',
    '4': 'Sports', '5': 'KTM', '6': 'Premium',
  };
  const vehicleCategory = bikeTypeMap[bookingData.bike_type as string] || 'Regular';
  // Use vehicle_model_name (e.g. "KTM", "Royal Enfield") from model-specific pages first,
  // then fall back to fleet vehicle name, then service name
  const vehicleModelName = (bookingData.vehicle_model_name as string) || (bookingData.fleet as string) || (bookingData.service_name as string) || null;

  const requestNumber = generateRequestNumber('BKQ');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  const quotesOpenTill = new Date();
  quotesOpenTill.setHours(quotesOpenTill.getHours() + 48);

  const quoteRequest: any = await (prisma as any).bike_quote_requests.create({
    data: {
      requestNumber,
      customerId: customer.id,
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      customerPhone: customerInfo.phone,
      vehicleModelName: vehicleModelName,
      vehicleCategory: null,      // null = visible to all vendors (category-agnostic request)
      vehicleCategoryName: vehicleCategory, // human-readable for display only
      locationId: location?.id || 'default_loc',
      locationName: (bookingData.location_name as string) || location?.name || 'Not specified',
      pickupAddress: (bookingData.pickup_full_address as string) || null,
      pickupDate,
      pickupTime: pickupDate.toTimeString().slice(0, 5),
      dropDate: returnDate,
      dropTime: returnDate.toTimeString().slice(0, 5),
      totalDays,
      helmetsRequired: 1,
      customerNotes: (bookingData.other_info as string) || null,
      status: 'PENDING',
      expiresAt,
      quotesOpenTill,
    },
  });

  await tagTaPersonalBooking('bike_quote_requests', quoteRequest.id, customer.id);

  sendQuoteRequestNotificationToVendors({
    requestId: quoteRequest.id,
    requestNumber: quoteRequest.requestNumber,
    locationId: location?.id || (bookingData.location_name as string),
    locationName: location?.name || (bookingData.location_name as string),
    customerName: customerInfo.name,
    serviceType: 'bike',
    serviceDisplayName: 'Bike Rental',
  }).catch((err: any) => console.error('[Notification] Failed:', err));

  return {
    success: true,
    message: 'Quote request submitted. Vendors will respond within 24-48 hours.',
    request_id: quoteRequest.id,
    request_number: quoteRequest.requestNumber,
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    },
    redirect_to: `/customer/bike-quotes/${quoteRequest.id}`,
  };
}

// ============= SELF-DRIVE QUOTE REQUEST HANDLER =============
// BROWSE_FIRST: Customer requests self-drive quotes from vendors

async function handleSelfDriveQuoteRequest(customerInfo: { name: string; email: string; phone: string }, bookingData: Record<string, unknown>) {
  const { customer } = await getOrCreateCustomer(customerInfo);
  const location = await findLocation(bookingData.location_name as string || bookingData.location_slug as string);

  // Parse dates
  const pickupDate = bookingData.journey_datetime ? new Date(bookingData.journey_datetime as string) : new Date();
  const returnDate = bookingData.return_datetime ? new Date(bookingData.return_datetime as string) : new Date(pickupDate.getTime() + 24 * 60 * 60 * 1000);

  const totalDays = Math.max(1, Math.ceil((returnDate.getTime() - pickupDate.getTime()) / (24 * 60 * 60 * 1000)));

  // Map car type
  const carTypeMap: Record<string, string> = {
    '1': 'Hatchback', '2': 'Sedan', '3': 'MUV', '4': 'SUV',
  };
  // Map transmission
  const transmissionMap: Record<string, string> = {
    '1': 'AUTOMATIC', '2': 'MANUAL',
  };
  // Map fuel type
  const fuelTypeMap: Record<string, string> = {
    '1': 'Diesel', '2': 'Petrol', '3': 'Electric', '4': 'CNG',
  };

  const vehicleType = carTypeMap[bookingData.car_type as string] || null;
  const transmission = transmissionMap[bookingData.transmission as string] || null;
  const fuelType = fuelTypeMap[bookingData.fuel_type as string] || null;
  const isDeliveryRequested = bookingData.doorstep_delivery === '1' || bookingData.doorstep_delivery === 1;

  // For vehicle-specific pages, use vehicle_model_name (e.g. "Seltos", "Creta") first,
  // then fall back to fleet vehicle name, then service name
  const vehicleModelName = (bookingData.vehicle_model_name as string) || (bookingData.fleet as string) || (bookingData.service_name as string) || null;
  const customerNotes = (bookingData.other_info as string) || null;

  const requestNumber = generateRequestNumber('SDQ');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  const quotesOpenTill = new Date();
  quotesOpenTill.setHours(quotesOpenTill.getHours() + 48);

  const quoteRequest: any = await (prisma as any).self_drive_quote_requests.create({
    data: {
      requestNumber,
      customerId: customer.id,
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      customerPhone: customerInfo.phone,
      vehicleModelName: vehicleModelName,
      vehicleCategory: vehicleType,
      vehicleCategoryName: vehicleType,
      vehicleType: vehicleType,
      transmission: transmission,
      fuelType: fuelType,
      locationId: location?.id || 'default_loc',
      locationName: (bookingData.location_name as string) || location?.name || 'Not specified',
      pickupDate,
      pickupTime: pickupDate.toTimeString().slice(0, 5),
      dropDate: returnDate,
      dropTime: returnDate.toTimeString().slice(0, 5),
      totalDays,
      isDeliveryRequested,
      customerNotes: customerNotes,
      status: 'PENDING',
      expiresAt,
      quotesOpenTill,
    },
  });

  await tagTaPersonalBooking('self_drive_quote_requests', quoteRequest.id, customer.id);

  sendQuoteRequestNotificationToVendors({
    requestId: quoteRequest.id,
    requestNumber: quoteRequest.requestNumber,
    locationId: location?.id || (bookingData.location_name as string),
    locationName: location?.name || (bookingData.location_name as string),
    customerName: customerInfo.name,
    serviceType: 'self-drive',
    serviceDisplayName: 'Self Drive Car',
  }).catch((err: any) => console.error('[Notification] Failed:', err));

  return {
    success: true,
    message: 'Quote request submitted. Vendors will respond within 24-48 hours.',
    request_id: quoteRequest.id,
    request_number: quoteRequest.requestNumber,
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    },
    redirect_to: `/customer/self-drive-quotes/${quoteRequest.id}`,
  };
}

// ============= MAIN POST HANDLER =============

export async function POST(request: NextRequest) {
  // Rate limiting
  const { limited, remaining, resetIn } = checkRateLimit(
    request,
    RATE_LIMITS.booking,
    'booking-create'
  );

  if (limited) {
    logger.logSecurityEvent('Booking rate limit exceeded', 'medium', {
      ip: request.headers.get('x-forwarded-for'),
    });
    return NextResponse.json(
      { success: false, message: 'Too many booking requests. Please try again later.', retryAfter: resetIn },
      { status: 429, headers: { 'Retry-After': String(resetIn) } }
    );
  }

  try {
    const body = await request.json();
    const { bookingType, customerInfo, bookingData, isLoggedIn } = body;

    // Validate required fields
    if (!bookingType || !customerInfo || !bookingData) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if customer is B2B approved (skip payment)
    let isB2B = false;
    if (customerInfo.email || customerInfo.phone) {
      const existingCustomer = await prisma.customers.findFirst({
        where: {
          OR: [
            ...(customerInfo.email ? [{ email: customerInfo.email }] : []),
            ...(customerInfo.phone ? [{ phone: customerInfo.phone }] : []),
          ],
        },
        select: { isB2B: true, b2bStatus: true },
      });
      if (existingCustomer?.isB2B && existingCustomer?.b2bStatus === 'APPROVED') {
        isB2B = true;
      }
    }

    let result;

    // Route to appropriate handler based on booking type
    // BIKE QUOTE REQUEST (BROWSE_FIRST: non-fleet bike → quote request flow)
    if (bookingType === 'bike-quote-request') {
      result = await handleBikeQuoteRequest(customerInfo, bookingData);
    }
    // SELF-DRIVE QUOTE REQUEST (BROWSE_FIRST: non-fleet self-drive → quote request flow)
    else if (bookingType === 'selfdrive-quote-request') {
      result = await handleSelfDriveQuoteRequest(customerInfo, bookingData);
    }
    // BIKE SERVICES (direct booking - fleet bikes with known vendor)
    else if (bookingType === 'bike' || bookingType.includes('bike') || bookingType.includes('scooter') || bookingType.includes('activa')) {
      result = await handleBikeBooking(customerInfo, bookingData, isB2B);
    }
    // CAR SERVICES (with driver)
    else if (bookingType === 'car-roundtrip' || bookingType === 'car-oneway' || bookingType === 'car-airport' || bookingType === 'car' || bookingType === 'one-way-cab') {
      result = await handleCarBooking(customerInfo, bookingData);
    }
    // SELF-DRIVE CAR (direct booking - fleet cars with known vendor)
    else if (bookingType === 'selfdrive' || bookingType.includes('self-drive')) {
      result = await handleSelfDriveBooking(customerInfo, bookingData, isB2B);
    }
    // TRUCK SERVICES
    else if (bookingType.startsWith('truck-') || bookingType === 'truck' || bookingType === 'transporter' || bookingType.includes('mini-truck')) {
      result = await handleTruckQuoteRequest(customerInfo, bookingData);
    }
    // TRAILER
    else if (bookingType === 'trailer' || bookingType.includes('trailer')) {
      result = await handleTrailerBooking(customerInfo, bookingData);
    }
    // PACKERS & MOVERS
    else if (bookingType.startsWith('packers-') || bookingType === 'packers' || bookingType.includes('packers') || bookingType.includes('movers')) {
      result = await handlePackersQuoteRequest(customerInfo, bookingData);
    }
    // EQUIPMENT
    else if (bookingType === 'equipment' || bookingType.includes('equipment') || bookingType.includes('jcb') || bookingType.includes('crane') || bookingType.includes('excavator') || bookingType.includes('generator') || bookingType.includes('hydra')) {
      result = await handleEquipmentQuoteRequest(customerInfo, bookingData);
    }
    // BUS SERVICES
    else if (bookingType.startsWith('bus-') || bookingType === 'bus' || bookingType.includes('tempo-traveller')) {
      result = await handleBusQuoteRequest(customerInfo, bookingData);
    }
    // LUXURY QUOTE REQUEST (BROWSE_FIRST: non-fleet luxury → quote request flow)
    else if (bookingType === 'luxury-quote-request') {
      result = await handleLuxuryQuoteRequest(customerInfo, bookingData);
    }
    // LUXURY CAR (direct booking - legacy/fleet)
    else if (bookingType === 'luxury' || bookingType.includes('luxury') || bookingType.includes('wedding-car') || bookingType.includes('vintage') || bookingType.includes('sports-car')) {
      result = await handleLuxuryBooking(customerInfo, bookingData, isLoggedIn);
    }
    // DEFAULT - try to determine from service name
    else {
      // Check if it looks like a bike service
      if (bookingData.bike_type || bookingData.bike_duration) {
        result = await handleBikeBooking(customerInfo, bookingData, isB2B);
      }
      // Check if it looks like a car service
      else if (bookingData.trip_type || bookingData.car_type) {
        result = await handleCarBooking(customerInfo, bookingData);
      }
      // Default to generic booking error
      else {
        return NextResponse.json(
          { success: false, message: `Unknown booking type: ${bookingType}. Please try again.` },
          { status: 400 }
        );
      }
    }

    // Add B2B flag to result
    if (isB2B && result) {
      (result as any).isB2B = true;
      (result as any).paymentRequired = false;
    }

    return NextResponse.json(result);

  } catch (error) {
    logger.error('Booking API error', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// ============= GET HANDLER =============

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('id');
    const bookingNumber = searchParams.get('number');
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');
    const type = searchParams.get('type'); // truck, packers, equipment, bus, luxury, bike, car

    const customerIdRes = searchParams.get('customerId') || searchParams.get('customer_id');

    // If customerId provided, fetch all bookings/requests for that customer
    if (customerIdRes && !type) {
      const data: { success: boolean; bookings?: any[]; requests?: any[] } = { success: true };

      data.bookings = [
        ...(await prisma.bike_bookings.findMany({ where: { customerId: customerIdRes }, orderBy: { createdAt: 'desc' } })),
        ...(await prisma.car_bookings.findMany({ where: { customerId: customerIdRes }, orderBy: { createdAt: 'desc' } })),
        ...(await prisma.luxury_bookings.findMany({ where: { customerId: customerIdRes }, orderBy: { createdAt: 'desc' } })),
      ];
      data.requests = [
        ...(await prisma.truck_quote_requests.findMany({ where: { customerId: customerIdRes }, orderBy: { createdAt: 'desc' } })),
        ...(await prisma.packers_quote_requests.findMany({ where: { customerId: customerIdRes }, orderBy: { createdAt: 'desc' } })),
        ...(await prisma.equipment_quote_requests.findMany({ where: { customerId: customerIdRes }, orderBy: { createdAt: 'desc' } })),
        ...(await prisma.bus_quote_requests.findMany({ where: { customerId: customerIdRes }, orderBy: { createdAt: 'desc' } })),
      ];

      return NextResponse.json(data);
    }

    // If type specified, fetch from local DB
    if (type && (phone || email || customerIdRes)) {
      console.log('🔍 Bookings GET - Params:', { type, customerIdRes, phone, email });

      let customer;
      if (customerIdRes) {
        customer = await prisma.customers.findUnique({ where: { id: customerIdRes } });
      }

      // If customer not found by ID, try phone or email with OR logic
      if (!customer && (phone || email)) {
        const customerConditions: any[] = [];
        if (phone) customerConditions.push({ phone });
        if (email) customerConditions.push({ email });

        customer = await prisma.customers.findFirst({
          where: { OR: customerConditions }
        });
      }

      console.log('🔍 Customer found:', customer ? `${customer.id} (${customer.name})` : 'NOT FOUND');

      if (!customer) {
        return NextResponse.json({ success: true, bookings: [], requests: [] });
      }

      const data: { success: boolean; bookings?: unknown[]; requests?: unknown[] } = { success: true };

      switch (type) {
        case 'bike':
          data.bookings = await prisma.bike_bookings.findMany({
            where: { customerId: customer.id },
            orderBy: { createdAt: 'desc' },
          });
          break;
        case 'car':
        case 'selfdrive':
        case 'one-way-cab':
          data.bookings = await prisma.car_bookings.findMany({
            where: { customerId: customer.id },
            orderBy: { createdAt: 'desc' },
          });
          break;
        case 'truck':
          data.requests = await prisma.truck_quote_requests.findMany({
            where: { customerId: customer.id },
            include: { truck_quotes: { where: { status: { in: ['SENT', 'VIEWED'] } } } },
            orderBy: { createdAt: 'desc' },
          });
          data.bookings = await prisma.truck_bookings.findMany({
            where: { customerId: customer.id },
            orderBy: { createdAt: 'desc' },
          });
          break;
        case 'packers':
          data.requests = await prisma.packers_quote_requests.findMany({
            where: { customerId: customer.id },
            include: { packers_quotes: { where: { status: { in: ['SENT', 'VIEWED'] } } } },
            orderBy: { createdAt: 'desc' },
          });
          data.bookings = await prisma.packers_bookings.findMany({
            where: { customerId: customer.id },
            orderBy: { createdAt: 'desc' },
          });
          break;
        case 'equipment':
          data.requests = await prisma.equipment_quote_requests.findMany({
            where: { customerId: customer.id },
            include: { equipment_quotes: { where: { status: { in: ['SENT', 'VIEWED'] } } } },
            orderBy: { createdAt: 'desc' },
          });
          data.bookings = await prisma.equipment_bookings.findMany({
            where: { customerId: customer.id },
            orderBy: { createdAt: 'desc' },
          });
          break;
        case 'bus':
          data.requests = await prisma.bus_quote_requests.findMany({
            where: { customerId: customer.id },
            include: {
              bus_quotes_bus_quotes_requestIdTobus_quote_requests: {
                where: { status: { in: ['SENT', 'VIEWED'] } },
                select: {
                  id: true,
                  quoteNumber: true,
                  vendorId: true,
                  totalAmount: true,
                  status: true,
                  validTill: true,
                },
                orderBy: { totalAmount: 'asc' },
              }
            },
            orderBy: { createdAt: 'desc' },
          });
          data.bookings = await prisma.bus_bookings.findMany({
            where: { customerId: customer.id },
            orderBy: { createdAt: 'desc' },
          });
          break;
        case 'luxury':
          data.bookings = await prisma.luxury_bookings.findMany({
            where: { customerId: customer.id },
            include: { luxury_bids: { where: { status: 'PENDING' } } },
            orderBy: { createdAt: 'desc' },
          });
          break;
        default:
          // Return all bookings
          data.bookings = [
            ...(await prisma.bike_bookings.findMany({ where: { customerId: customer.id }, orderBy: { createdAt: 'desc' } })),
            ...(await prisma.car_bookings.findMany({ where: { customerId: customer.id }, orderBy: { createdAt: 'desc' } })),
            ...(await prisma.luxury_bookings.findMany({ where: { customerId: customer.id }, orderBy: { createdAt: 'desc' } })),
          ];
          data.requests = [
            ...(await prisma.truck_quote_requests.findMany({ where: { customerId: customer.id }, orderBy: { createdAt: 'desc' } })),
            ...(await prisma.packers_quote_requests.findMany({ where: { customerId: customer.id }, orderBy: { createdAt: 'desc' } })),
            ...(await prisma.equipment_quote_requests.findMany({ where: { customerId: customer.id }, orderBy: { createdAt: 'desc' } })),
            ...(await prisma.bus_quote_requests.findMany({ where: { customerId: customer.id }, orderBy: { createdAt: 'desc' } })),
          ];
      }

      return NextResponse.json(data);
    }

    // Fetch by booking ID or number
    if (bookingId || bookingNumber) {
      const searchId = bookingNumber || bookingId || '';

      // Try each booking type
      const bikeBooking = await prisma.bike_bookings.findFirst({
        where: bookingNumber ? { bookingNumber } : { id: searchId },
        include: {
          vendors_bike_bookings_assignedVendorIdTovendors: {
            select: { id: true, businessName: true, phone: true, email: true },
          },
          vendors_bike_bookings_acceptedVendorIdTovendors: {
            select: { id: true, businessName: true, phone: true, email: true },
          },
          vehicle_models: {
            select: { sideImage: true, images: true }
          }
        },
      });
      if (bikeBooking) {
        // Check if customer is B2B
        const bikeCustomer = bikeBooking.customerId ? await prisma.customers.findUnique({ where: { id: bikeBooking.customerId }, select: { isB2B: true } }) : null;
        // Add vendor info to response
        const vendor = bikeBooking.vendors_bike_bookings_acceptedVendorIdTovendors || bikeBooking.vendors_bike_bookings_assignedVendorIdTovendors;

        // Resolve vehicle image
        let vehicleImage = '/images/fleet/default-bike.jpg';

        // Try to fetch image from requestedVehicleId (VendorFleet) if available
        if (bikeBooking.requestedVehicleId) {
          const fleet = await prisma.vendor_fleets.findUnique({
            where: { id: bikeBooking.requestedVehicleId },
            include: { vehicle_models: true }
          });

          if (fleet) {
            if (fleet.images) {
              const imgs = fleet.images.split(',').map((img: string) => img.trim());
              if (imgs.length > 0) vehicleImage = imgs[0];
            } else if (fleet.vehicle_models?.sideImage) {
              vehicleImage = fleet.vehicle_models.sideImage;
            } else if (fleet.vehicle_models?.images) {
              const imgs = fleet.vehicle_models.images.split(',').map((img: string) => img.trim());
              if (imgs.length > 0) vehicleImage = imgs[0];
            }
          }
        }

        // Fallback to vehicle_models if still default and vehicle_models is available
        if (vehicleImage === '/images/fleet/default-bike.jpg' && bikeBooking.vehicle_models) {
          if (bikeBooking.vehicle_models.sideImage) {
            vehicleImage = bikeBooking.vehicle_models.sideImage;
          } else if (bikeBooking.vehicle_models.images) {
            const imgs = bikeBooking.vehicle_models.images.split(',').map((img: string) => img.trim());
            if (imgs.length > 0) vehicleImage = imgs[0];
          }
        }

        return NextResponse.json({
          success: true,
          booking: {
            ...bikeBooking,
            vendorId: vendor?.id || bikeBooking.acceptedVendorId || bikeBooking.assignedVendorId,
            vendorName: vendor?.businessName || null,
            vendorPhone: vendor?.phone || null,
            vendorEmail: vendor?.email || null,
            vehicleImage,
            isB2B: bikeCustomer?.isB2B || false,
          },
          type: 'bike',
        });
      }

      const carBooking = await prisma.car_bookings.findFirst({
        where: bookingNumber ? { bookingNumber } : { id: searchId },
        include: {
          vendors_car_bookings_assignedVendorIdTovendors: {
            select: { id: true, businessName: true, phone: true, email: true },
          },
          vendors_car_bookings_acceptedVendorIdTovendors: {
            select: { id: true, businessName: true, phone: true, email: true },
          },
        },
      });
      if (carBooking) {
        // Check if customer is B2B
        const carCustomer = carBooking.customerId ? await prisma.customers.findUnique({ where: { id: carBooking.customerId }, select: { isB2B: true } }) : null;
        // Add vendor info to response
        const vendor = carBooking.vendors_car_bookings_acceptedVendorIdTovendors || carBooking.vendors_car_bookings_assignedVendorIdTovendors;

        // Resolve vehicle image
        let vehicleImage = '/images/fleet/default-car.jpg';

        // Try to fetch image from requestedVehicleId (VendorFleet)
        if (carBooking.requestedVehicleId) {
          const fleet = await prisma.vendor_fleets.findUnique({
            where: { id: carBooking.requestedVehicleId },
            include: { vehicle_models: true }
          });

          if (fleet) {
            if (fleet.images) {
              const imgs = fleet.images.split(',').map((img: string) => img.trim());
              if (imgs.length > 0) vehicleImage = imgs[0];
            } else if (fleet.vehicle_models?.sideImage) {
              vehicleImage = fleet.vehicle_models.sideImage;
            } else if (fleet.vehicle_models?.images) {
              const imgs = fleet.vehicle_models.images.split(',').map((img: string) => img.trim());
              if (imgs.length > 0) vehicleImage = imgs[0];
            }
          }
        }

        return NextResponse.json({
          success: true,
          booking: {
            ...carBooking,
            vendorId: vendor?.id || carBooking.acceptedVendorId || carBooking.assignedVendorId,
            vendorName: vendor?.businessName || null,
            vendorPhone: vendor?.phone || null,
            vendorEmail: vendor?.email || null,
            vehicleImage,
            isB2B: carCustomer?.isB2B || false,
          },
          type: 'car',
        });
      }

      const luxuryBooking = await prisma.luxury_bookings.findFirst({
        where: bookingNumber ? { bookingNumber } : { id: searchId }
      });
      if (luxuryBooking) return NextResponse.json({ success: true, booking: luxuryBooking, type: 'luxury' });

      // Try quote requests
      const truckRequest = await prisma.truck_quote_requests.findFirst({ where: { requestNumber: searchId } });
      if (truckRequest) return NextResponse.json({ success: true, request: truckRequest, type: 'truck' });

      const packersRequest = await prisma.packers_quote_requests.findFirst({ where: { requestNumber: searchId } });
      if (packersRequest) return NextResponse.json({ success: true, request: packersRequest, type: 'packers' });

      const equipmentRequest = await prisma.equipment_quote_requests.findFirst({ where: { requestNumber: searchId } });
      if (equipmentRequest) return NextResponse.json({ success: true, request: equipmentRequest, type: 'equipment' });

      const busRequest = await prisma.bus_quote_requests.findFirst({ where: { requestNumber: searchId } });
      if (busRequest) return NextResponse.json({ success: true, request: busRequest, type: 'bus' });

      return NextResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json(
      { success: false, message: 'Booking ID, phone, or email required' },
      { status: 400 }
    );

  } catch (error) {
    logger.error('Booking fetch error', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
