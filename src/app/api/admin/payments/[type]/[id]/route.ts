import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// One booking's payment, for the detail page behind a row on /admin/payments.
//
// Each service keeps its own bookings table and they do not agree on field
// names — luxury calls the reference `paymentTransactionId`, wander calls the
// total `amount` and tracks payment with booleans instead of the status enum.
// The list endpoint already flattens all of that; this does the same for a
// single row so the page has one shape to render, and then hands over every
// remaining column as `extra` so nothing about the booking is hidden from an
// admin who has to make a decision about it.

interface TypeConfig {
  model: string;
  serviceType: string;
  include?: any;
  map: (b: any) => Record<string, any>;
}

// Fields already shown in their own place on the page, or of no use to a human.
const HIDDEN_EXTRA = new Set([
  'id', 'bookingNumber', 'bookingId', 'customerName', 'customerPhone', 'customerEmail',
  'grandTotal', 'advanceAmount', 'balanceAmount', 'advancePaymentRef', 'advancePaymentProof',
  'advancePaymentDate', 'paymentMethod', 'paymentStatus', 'status', 'createdAt', 'updatedAt',
  'paymentTransactionId', 'paymentProof', 'paymentSubmittedAt', 'advancePaidAt', 'amount',
  'password', 'otp', 'otpExpiry', 'verificationToken',
]);

const TYPES: Record<string, TypeConfig> = {
  bike: {
    model: 'bike_bookings',
    serviceType: 'Bike Rental',
    map: (b) => ({
      vehicleName: b.requestedVehicleName,
      location: b.locationName,
      pickupDate: b.pickupDate,
      dropDate: b.dropDate ?? null,
    }),
  },
  car: {
    model: 'car_bookings',
    serviceType: 'Self-Drive Car Rental',
    map: (b) => ({
      vehicleName: b.requestedVehicleName,
      location: b.locationName,
      pickupDate: b.pickupDate,
      dropDate: b.dropDate ?? null,
      totalDays: b.totalDays ?? null,
      securityDeposit: b.securityDeposit ?? null,
    }),
  },
  chauffeur: {
    model: 'chauffeur_bookings',
    serviceType: 'Car with Driver',
    map: (b) => ({
      vehicleName: b.carCategoryName || b.carCategory,
      location: b.pickupCity,
      pickupDate: b.pickupDate,
      from: b.pickupCity,
      to: b.dropCity ?? null,
      // This table has no advance* columns: what has been paid so far lives
      // in paidAmount, and the reference in transactionId.
      advanceAmount: b.paidAmount,
      balanceAmount: b.remainingPayment ?? null,
      advancePaymentRef: b.transactionId,
      advancePaymentProof: null,
      advancePaymentDate: b.updatedAt,
    }),
  },
  bus: {
    model: 'bus_bookings',
    serviceType: 'Bus Rental',
    map: (b) => ({
      vehicleName: b.vehicleName,
      location: b.pickupCity,
      pickupDate: b.pickupDate,
      from: b.pickupCity,
      to: b.dropCity ?? null,
      grandTotal: b.totalAmount,
    }),
  },
  truck: {
    model: 'truck_bookings',
    serviceType: 'Truck Rental',
    map: (b) => ({
      vehicleName: b.vehicleName,
      location: b.pickupCity,
      pickupDate: b.pickupDate,
      from: b.pickupCity,
      to: b.dropCity ?? null,
      grandTotal: b.totalAmount,
    }),
  },
  equipment: {
    model: 'equipment_bookings',
    serviceType: 'Equipment Rental',
    map: (b) => ({
      vehicleName: b.equipmentName || b.equipmentType,
      location: b.deliveryCity,
      advancePaymentProof: null,
      pickupDate: b.startDate,
      dropDate: b.endDate ?? null,
      grandTotal: b.totalAmount,
    }),
  },
  packers: {
    model: 'packers_bookings',
    serviceType: 'Packers & Movers',
    map: (b) => ({
      vehicleName: b.shiftingType || b.serviceType,
      advancePaymentProof: null,
      location: [b.pickupCity, b.dropCity].filter(Boolean).join(' → '),
      pickupDate: b.scheduledDate,
      from: b.pickupCity,
      to: b.dropCity,
      grandTotal: b.totalAmount,
      advancePaymentDate: b.advancePaymentDate || b.advancePaidAt,
    }),
  },
  luxury: {
    model: 'luxury_bookings',
    serviceType: 'Luxury Car Rental',
    include: { luxury_quotes: { select: { vehicleName: true } } },
    map: (b) => ({
      vehicleName: b.luxury_quotes?.vehicleName || b.vehicleModel || b.carCategoryName || b.carCategory,
      location: b.pickupCity,
      pickupDate: b.pickupDate,
      // This table names its payment columns differently from the rest.
      advancePaymentRef: b.paymentTransactionId,
      advancePaymentProof: b.paymentProof,
      advancePaymentDate: b.paymentSubmittedAt,
    }),
  },
  wander: {
    model: 'wander_bookings',
    serviceType: 'Wander Tour',
    include: {
      customer: { select: { id: true, name: true, phone: true, email: true } },
      quoteRequest: { select: { pickupLocation: true, listing: { select: { title: true } } } },
    },
    map: (b) => {
      const tourName = b.quoteRequest?.listing?.title || b.quoteRequest?.pickupLocation || 'Wander Tour';
      return {
        bookingNumber: b.bookingId,
        customerName: b.customer?.name || 'Customer',
        customerPhone: b.customer?.phone || '',
        customerEmail: b.customer?.email || '',
        customerId: b.customer?.id || null,
        vehicleName: tourName,
        location: tourName,
        pickupDate: b.travelDate,
        grandTotal: b.amount,
        advancePaymentDate: b.advancePaidAt,
        // Wander tracks payment with two booleans rather than the enum.
        paymentStatus: b.balancePaid ? 'PAID' : b.advancePaid ? 'PARTIAL' : 'PENDING',
      };
    },
  },
};

// self-drive is how the list page spells the car type in some links.
const ALIASES: Record<string, string> = { 'self-drive': 'car' };

function toExtras(row: any): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  for (const [key, value] of Object.entries(row)) {
    if (HIDDEN_EXTRA.has(key)) continue;
    if (value === null || value === undefined || value === '') continue;
    if (typeof value === 'object' && !(value instanceof Date)) continue;
    const label = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (c) => c.toUpperCase())
      .replace(/\bId\b/, 'ID')
      .trim();
    out.push({
      label,
      value: value instanceof Date ? value.toISOString() : String(value),
    });
  }
  return out.sort((a, b) => a.label.localeCompare(b.label));
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { type: string; id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const type = ALIASES[params.type] || params.type;
    const config = TYPES[type];
    if (!config) {
      return NextResponse.json({ error: `Unknown booking type "${params.type}"` }, { status: 400 });
    }

    const row = await (prisma as any)[config.model].findUnique({
      where: { id: params.id },
      ...(config.include ? { include: config.include } : {}),
    });

    if (!row) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Common shape first, then the per-type map overrides anything this table
    // spells differently.
    const payment = {
      id: row.id,
      bookingType: type,
      bookingNumber: row.bookingNumber,
      serviceType: config.serviceType,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      customerEmail: row.customerEmail,
      customerId: row.customerId ?? null,
      grandTotal: row.grandTotal ?? null,
      advanceAmount: row.advanceAmount ?? null,
      balanceAmount: row.balanceAmount ?? null,
      advancePaymentRef: row.advancePaymentRef ?? null,
      advancePaymentProof: row.advancePaymentProof ?? null,
      advancePaymentDate: row.advancePaymentDate ?? null,
      paymentMethod: row.paymentMethod ?? null,
      paymentStatus: row.paymentStatus ?? null,
      status: row.status ?? null,
      createdAt: row.createdAt ?? null,
      updatedAt: row.updatedAt ?? null,
      ...config.map(row),
    };

    // A balance the table does not store is still worth showing.
    if (payment.balanceAmount == null && payment.grandTotal != null && payment.advanceAmount != null) {
      payment.balanceAmount = Number(payment.grandTotal) - Number(payment.advanceAmount);
    }

    return NextResponse.json({ success: true, payment, extra: toExtras(row) });
  } catch (error: any) {
    logger.error('Admin payment detail error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment', details: error?.message },
      { status: 500 },
    );
  }
}
