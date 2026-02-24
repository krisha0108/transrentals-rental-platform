// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

// Per-type valid statuses (each booking type has its own enum in Prisma)
const BIKE_CAR_STATUSES = ['PAYMENT_VERIFIED', 'ACCEPTED', 'READY_FOR_PICKUP', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const LUXURY_STATUSES = ['ADVANCE_PAID', 'CONFIRMED', 'ACCEPTED', 'DRIVER_ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const BUS_STATUSES = ['ADVANCE_PAID', 'CONFIRMED', 'VEHICLE_ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const TRUCK_STATUSES = ['ADVANCE_PAID', 'CONFIRMED', 'VEHICLE_ASSIGNED', 'LOADING', 'IN_TRANSIT', 'UNLOADING', 'COMPLETED', 'CANCELLED'];
const EQUIPMENT_STATUSES = ['ADVANCE_PAID', 'CONFIRMED', 'DELIVERED', 'IN_USE', 'PICKUP_SCHEDULED', 'RETURNED', 'COMPLETED', 'CANCELLED'];
const PACKERS_STATUSES = ['ADVANCE_PAID', 'CONFIRMED', 'TEAM_ASSIGNED', 'PACKING', 'LOADING', 'IN_TRANSIT', 'UNLOADING', 'UNPACKING', 'COMPLETED', 'CANCELLED'];
// Chauffeur: show when vendor is assigned (no advance concept — uses paidAmount)
const CHAUFFEUR_STATUSES = ['DRIVER_ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

// Fetch all confirmed bookings for a vendor across all 8 services
async function fetchVendorBookings(vendorId: string, paidBookingIds: Set<string>) {
  const bookings: any[] = [];

  // Get vendor's approved services with commission %
  const approvedServices = await prisma.vendor_approved_services.findMany({
    where: { vendorId, isActive: true },
    include: { services: { select: { id: true, name: true, slug: true } } },
  });

  const commissionMap: Record<string, number> = {};
  approvedServices.forEach((as: any) => {
    commissionMap[as.services.slug] = as.commissionPercent;
  });

  // Helper to check if booking is already paid
  const isAlreadyPaid = (id: string) => paidBookingIds.has(id);

  // 1. BIKE bookings — acceptedVendorId
  const bikeBookings = await prisma.bike_bookings.findMany({
    where: {
      acceptedVendorId: vendorId,
      status: { in: BIKE_CAR_STATUSES as any },
    },
    select: {
      id: true, bookingNumber: true, status: true,
      grandTotal: true, advanceAmount: true, refundAmount: true,
      pickupDate: true,
      customers: { select: { name: true } },
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  }).catch(() => []);

  bikeBookings.forEach((b: any) => {
    if (isAlreadyPaid(b.id)) return;
    const isCancelled = b.status === 'CANCELLED';
    const commission = commissionMap['bike-on-rent'] ?? commissionMap['bike-rental'] ?? 0;
    const total = b.grandTotal || 0;
    const advance = b.advanceAmount || 0;
    const commissionAmount = isCancelled ? 0 : (total * commission) / 100;
    bookings.push({
      id: b.id, bookingNumber: b.bookingNumber, bookingType: 'BIKE',
      serviceName: 'Bike Rental', status: b.status,
      totalAmount: total, advanceAmount: advance,
      commissionPercent: commission, commissionAmount,
      vendorPayoutAmount: isCancelled ? 0 : advance - commissionAmount,
      refundAmount: b.refundAmount || 0,
      customerName: b.customers?.name || '-',
      createdAt: b.createdAt,
      serviceDate: b.pickupDate,
    });
  });

  // 2. CAR bookings — acceptedVendorId
  const carBookings = await prisma.car_bookings.findMany({
    where: {
      acceptedVendorId: vendorId,
      status: { in: BIKE_CAR_STATUSES as any },
    },
    select: {
      id: true, bookingNumber: true, status: true,
      grandTotal: true, advanceAmount: true, refundAmount: true,
      pickupDate: true,
      customers: { select: { name: true } },
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  }).catch(() => []);

  carBookings.forEach((b: any) => {
    if (isAlreadyPaid(b.id)) return;
    const isCancelled = b.status === 'CANCELLED';
    const commission = commissionMap['self-drive-car-rentals'] ?? commissionMap['car-rental'] ?? 0;
    const total = b.grandTotal || 0;
    const advance = b.advanceAmount || 0;
    const commissionAmount = isCancelled ? 0 : (total * commission) / 100;
    bookings.push({
      id: b.id, bookingNumber: b.bookingNumber, bookingType: 'CAR',
      serviceName: 'Self Drive', status: b.status,
      totalAmount: total, advanceAmount: advance,
      commissionPercent: commission, commissionAmount,
      vendorPayoutAmount: isCancelled ? 0 : advance - commissionAmount,
      refundAmount: b.refundAmount || 0,
      customerName: b.customers?.name || '-',
      createdAt: b.createdAt,
      serviceDate: b.pickupDate,
    });
  });

  // 3. LUXURY bookings — acceptedVendorId
  const luxuryBookings = await prisma.luxury_bookings.findMany({
    where: {
      acceptedVendorId: vendorId,
      status: { in: LUXURY_STATUSES as any },
    },
    select: {
      id: true, bookingNumber: true, status: true,
      grandTotal: true, advanceAmount: true, refundAmount: true,
      pickupDate: true,
      customers: { select: { name: true } },
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  }).catch(() => []);

  luxuryBookings.forEach((b: any) => {
    if (isAlreadyPaid(b.id)) return;
    const isCancelled = b.status === 'CANCELLED';
    const commission = commissionMap['luxury-car-rental'] ?? commissionMap['luxury'] ?? 0;
    const total = b.grandTotal || 0;
    const advance = b.advanceAmount || 0;
    const commissionAmount = isCancelled ? 0 : (total * commission) / 100;
    bookings.push({
      id: b.id, bookingNumber: b.bookingNumber, bookingType: 'LUXURY',
      serviceName: 'Luxury Car', status: b.status,
      totalAmount: total, advanceAmount: advance,
      commissionPercent: commission, commissionAmount,
      vendorPayoutAmount: isCancelled ? 0 : advance - commissionAmount,
      refundAmount: b.refundAmount || 0,
      customerName: b.customers?.name || '-',
      createdAt: b.createdAt,
      serviceDate: b.pickupDate,
    });
  });

  // 4. BUS bookings — vendorId
  const busBookings = await prisma.bus_bookings.findMany({
    where: {
      vendorId,
      status: { in: BUS_STATUSES as any },
    },
    select: {
      id: true, bookingNumber: true, status: true,
      totalAmount: true, advanceAmount: true, refundAmount: true,
      customerName: true, createdAt: true, pickupDate: true,
    },
    orderBy: { createdAt: 'desc' },
  }).catch(() => []);

  busBookings.forEach((b: any) => {
    if (isAlreadyPaid(b.id)) return;
    const isCancelled = b.status === 'CANCELLED';
    const commission = commissionMap['bus-rental'] ?? commissionMap['bus'] ?? 0;
    const total = b.totalAmount || 0;
    const advance = b.advanceAmount || 0;
    const commissionAmount = isCancelled ? 0 : (total * commission) / 100;
    bookings.push({
      id: b.id, bookingNumber: b.bookingNumber, bookingType: 'BUS',
      serviceName: 'Bus Rental', status: b.status,
      totalAmount: total, advanceAmount: advance,
      commissionPercent: commission, commissionAmount,
      vendorPayoutAmount: isCancelled ? 0 : advance - commissionAmount,
      refundAmount: b.refundAmount || 0,
      customerName: b.customerName || '-',
      createdAt: b.createdAt,
      serviceDate: b.pickupDate,
    });
  });

  // 5. TRUCK bookings — vendorId
  const truckBookings = await prisma.truck_bookings.findMany({
    where: {
      vendorId,
      status: { in: TRUCK_STATUSES as any },
    },
    select: {
      id: true, bookingNumber: true, status: true,
      totalAmount: true, advanceAmount: true, refundAmount: true,
      customerName: true, createdAt: true, pickupDate: true,
    },
    orderBy: { createdAt: 'desc' },
  }).catch(() => []);

  truckBookings.forEach((b: any) => {
    if (isAlreadyPaid(b.id)) return;
    const isCancelled = b.status === 'CANCELLED';
    const commission = commissionMap['transporter'] ?? commissionMap['truck-rental'] ?? 0;
    const total = b.totalAmount || 0;
    const advance = b.advanceAmount || 0;
    const commissionAmount = isCancelled ? 0 : (total * commission) / 100;
    bookings.push({
      id: b.id, bookingNumber: b.bookingNumber, bookingType: 'TRUCK',
      serviceName: 'Truck Transport', status: b.status,
      totalAmount: total, advanceAmount: advance,
      commissionPercent: commission, commissionAmount,
      vendorPayoutAmount: isCancelled ? 0 : advance - commissionAmount,
      refundAmount: b.refundAmount || 0,
      customerName: b.customerName || '-',
      createdAt: b.createdAt,
      serviceDate: b.pickupDate,
    });
  });

  // 6. EQUIPMENT bookings — vendorId
  const equipmentBookings = await prisma.equipment_bookings.findMany({
    where: {
      vendorId,
      status: { in: EQUIPMENT_STATUSES as any },
    },
    select: {
      id: true, bookingNumber: true, status: true,
      totalAmount: true, advanceAmount: true, refundAmount: true,
      customerName: true, createdAt: true, startDate: true,
    },
    orderBy: { createdAt: 'desc' },
  }).catch(() => []);

  equipmentBookings.forEach((b: any) => {
    if (isAlreadyPaid(b.id)) return;
    const isCancelled = b.status === 'CANCELLED';
    const commission = commissionMap['equipment-rental'] ?? commissionMap['equipment'] ?? 0;
    const total = b.totalAmount || 0;
    const advance = b.advanceAmount || 0;
    const commissionAmount = isCancelled ? 0 : (total * commission) / 100;
    bookings.push({
      id: b.id, bookingNumber: b.bookingNumber, bookingType: 'EQUIPMENT',
      serviceName: 'Equipment Rental', status: b.status,
      totalAmount: total, advanceAmount: advance,
      commissionPercent: commission, commissionAmount,
      vendorPayoutAmount: isCancelled ? 0 : advance - commissionAmount,
      refundAmount: b.refundAmount || 0,
      customerName: b.customerName || '-',
      createdAt: b.createdAt,
      serviceDate: b.startDate,
    });
  });

  // 7. PACKERS bookings — vendorId
  const packersBookings = await prisma.packers_bookings.findMany({
    where: {
      vendorId,
      status: { in: PACKERS_STATUSES as any },
    },
    select: {
      id: true, bookingNumber: true, status: true,
      totalAmount: true, advanceAmount: true, refundAmount: true,
      customerName: true, createdAt: true, scheduledDate: true,
    },
    orderBy: { createdAt: 'desc' },
  }).catch(() => []);

  packersBookings.forEach((b: any) => {
    if (isAlreadyPaid(b.id)) return;
    const isCancelled = b.status === 'CANCELLED';
    const commission = commissionMap['packers-and-movers'] ?? commissionMap['packers-movers'] ?? 0;
    const total = b.totalAmount || 0;
    const advance = b.advanceAmount || 0;
    const commissionAmount = isCancelled ? 0 : (total * commission) / 100;
    bookings.push({
      id: b.id, bookingNumber: b.bookingNumber, bookingType: 'PACKERS',
      serviceName: 'Packers & Movers', status: b.status,
      totalAmount: total, advanceAmount: advance,
      commissionPercent: commission, commissionAmount,
      vendorPayoutAmount: isCancelled ? 0 : advance - commissionAmount,
      refundAmount: b.refundAmount || 0,
      customerName: b.customerName || '-',
      createdAt: b.createdAt,
      serviceDate: b.scheduledDate,
    });
  });

  // 8. CHAUFFEUR bookings (Car Rental) — acceptedVendorId
  // Different model: no advanceAmount, uses paidAmount; shows when vendor is DRIVER_ASSIGNED
  const chauffeurBookings = await prisma.chauffeur_bookings.findMany({
    where: {
      acceptedVendorId: vendorId,
      status: { in: CHAUFFEUR_STATUSES as any },
    },
    select: {
      id: true, bookingNumber: true, status: true,
      grandTotal: true, paidAmount: true, refundAmount: true,
      customerName: true, createdAt: true, pickupDate: true,
    },
    orderBy: { createdAt: 'desc' },
  }).catch(() => []);

  chauffeurBookings.forEach((b: any) => {
    if (isAlreadyPaid(b.id)) return;
    const isCancelled = b.status === 'CANCELLED';
    const commission = commissionMap['car-rental'] ?? 0;
    const total = b.grandTotal || 0;
    const received = b.paidAmount || 0;
    const commissionAmount = isCancelled ? 0 : (total * commission) / 100;
    bookings.push({
      id: b.id, bookingNumber: b.bookingNumber, bookingType: 'CHAUFFEUR',
      serviceName: 'Car Rental', status: b.status,
      totalAmount: total, advanceAmount: received,
      commissionPercent: commission, commissionAmount,
      vendorPayoutAmount: isCancelled ? 0 : received - commissionAmount,
      refundAmount: b.refundAmount || 0,
      customerName: b.customerName || '-',
      createdAt: b.createdAt,
      serviceDate: b.pickupDate,
    });
  });

  return bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// GET — fetch pending payout bookings + history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const currentUser = await prisma.admin_users.findUnique({ where: { id: session.user.id } });
    if (!currentUser || !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { vendorId } = await params;

    // Get all booking IDs that are already in a paid batch
    const paidItems = await prisma.vendor_payout_batch_items.findMany({
      where: { vendor_payout_batches: { vendorId } },
      select: { bookingId: true },
    });
    const paidBookingIds = new Set(paidItems.map((i: any) => i.bookingId));

    // Fetch all pending bookings
    const pendingBookings = await fetchVendorBookings(vendorId, paidBookingIds);

    // Calculate totals (exclude cancelled from payout totals)
    const activeBookings = pendingBookings.filter((b) => b.status !== 'CANCELLED');
    const cancelledBookings = pendingBookings.filter((b) => b.status === 'CANCELLED');
    const totalPending = activeBookings.reduce((sum, b) => sum + b.vendorPayoutAmount, 0);
    const totalCommission = activeBookings.reduce((sum, b) => sum + b.commissionAmount, 0);
    const totalAdvance = activeBookings.reduce((sum, b) => sum + b.advanceAmount, 0);
    const totalRefundsDue = cancelledBookings.reduce((sum, b) => sum + (b.refundAmount || 0), 0);

    // Payout history
    const payoutHistory = await prisma.vendor_payout_batches.findMany({
      where: { vendorId },
      include: {
        admin_users: { select: { name: true } },
        vendor_payout_batch_items: true,
      },
      orderBy: { paidAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      pendingBookings,
      summary: {
        totalPending: Math.round(totalPending * 100) / 100,
        totalCommission: Math.round(totalCommission * 100) / 100,
        totalAdvance: Math.round(totalAdvance * 100) / 100,
        bookingCount: activeBookings.length,
        cancelledCount: cancelledBookings.length,
        totalRefundsDue: Math.round(totalRefundsDue * 100) / 100,
      },
      payoutHistory,
    });
  } catch (error: any) {
    logger.error('Vendor payout GET error', error);
    return NextResponse.json({ error: 'Failed to fetch payouts', details: error?.message }, { status: 500 });
  }
}

// POST — mark all pending bookings as paid (create a batch)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const currentUser = await prisma.admin_users.findUnique({ where: { id: session.user.id } });
    if (!currentUser || !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { vendorId } = await params;
    const body = await request.json();
    const { paymentMethod, referenceNumber, notes } = body;

    // Get already paid booking IDs
    const paidItems = await prisma.vendor_payout_batch_items.findMany({
      where: { vendor_payout_batches: { vendorId } },
      select: { bookingId: true },
    });
    const paidBookingIds = new Set(paidItems.map((i: any) => i.bookingId));

    // Fetch current pending bookings — exclude CANCELLED from payout batch
    const allPendingBookings = await fetchVendorBookings(vendorId, paidBookingIds);
    const pendingBookings = allPendingBookings.filter((b) => b.status !== 'CANCELLED');

    if (pendingBookings.length === 0) {
      return NextResponse.json({ error: 'No active bookings to mark as paid' }, { status: 400 });
    }

    const totalAmount = pendingBookings.reduce((sum, b) => sum + b.vendorPayoutAmount, 0);

    // Create payout batch + items in a transaction
    const batch = await prisma.$transaction(async (tx) => {
      const newBatch = await tx.vendor_payout_batches.create({
        data: {
          id: generateId(),
          vendorId,
          totalAmount: Math.round(totalAmount * 100) / 100,
          paidAt: new Date(),
          paidById: session.user.id,
          paymentMethod: paymentMethod || null,
          referenceNumber: referenceNumber || null,
          notes: notes || null,
          vendor_payout_batch_items: {
            create: pendingBookings.map((b) => ({
              id: generateId(),
              bookingId: b.id,
              bookingType: b.bookingType,
              bookingNumber: b.bookingNumber,
              totalAmount: b.totalAmount,
              advanceAmount: b.advanceAmount,
              commissionPercent: b.commissionPercent,
              commissionAmount: b.commissionAmount,
              vendorPayoutAmount: b.vendorPayoutAmount,
            })),
          },
        },
        include: {
          vendor_payout_batch_items: true,
          admin_users: { select: { name: true } },
        },
      });
      return newBatch;
    });

    return NextResponse.json({
      success: true,
      batch,
      message: `Marked ${pendingBookings.length} bookings as paid. Total: ₹${totalAmount.toFixed(2)}`,
    });
  } catch (error: any) {
    logger.error('Vendor payout POST error', error);
    return NextResponse.json({ error: 'Failed to mark as paid', details: error?.message }, { status: 500 });
  }
}
