import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

type NormalizedRow = {
  serviceKey: string;
  value: number;
  collected: number;
  refunded: number;
  method: string;
  status: string;
  createdAt: Date;
};

const SERVICE_LABELS: Record<string, string> = {
  bike: 'Bike Rental',
  car: 'Self-Drive Car',
  chauffeur: 'Car with Driver',
  bus: 'Bus Rental',
  truck: 'Truck Rental',
  equipment: 'Equipment Rental',
  packers: 'Packers & Movers',
  luxury: 'Luxury Car',
  wander: 'Wander Tour',
};

const ALL_SERVICE_KEYS = Object.keys(SERVICE_LABELS);
const ALL_STATUS_KEYS = ['PENDING', 'SUBMITTED', 'PARTIAL', 'PAID', 'REFUNDED', 'FAILED'];

function normalizeMethod(method: string | null | undefined): string {
  if (!method) return 'UNKNOWN';
  const m = method.toUpperCase();
  if (m === 'RAZORPAY' || m === 'ONLINE') return 'RAZORPAY';
  if (m === 'UPI') return 'UPI';
  if (m === 'BANK_TRANSFER') return 'BANK_TRANSFER';
  return m;
}

function getDateRange(searchParams: URLSearchParams): { gte?: Date; lte?: Date } {
  const range = searchParams.get('range') || 'all';
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');

  if (range === 'custom' && fromParam && toParam) {
    const to = new Date(toParam);
    to.setHours(23, 59, 59, 999); // custom "to" is a calendar day — include all of it
    return { gte: new Date(fromParam), lte: to };
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (range === 'today') return { gte: todayStart };
  if (range === 'yesterday') {
    const y = new Date(todayStart);
    y.setDate(y.getDate() - 1);
    return { gte: y, lte: todayStart };
  }
  if (range === 'last7') {
    const d = new Date(todayStart);
    d.setDate(d.getDate() - 6);
    return { gte: d };
  }
  if (range === 'last30') {
    const d = new Date(todayStart);
    d.setDate(d.getDate() - 29);
    return { gte: d };
  }
  return {};
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { gte, lte } = getDateRange(searchParams);
    const where = {
      createdAt: {
        ...(gte && { gte }),
        ...(lte && { lte }),
      },
    };

    const servicesParam = searchParams.get('services');
    const wantedServices = new Set(
      servicesParam && servicesParam !== 'all' ? servicesParam.split(',').filter(Boolean) : ALL_SERVICE_KEYS,
    );
    const statusParam = searchParams.get('status');
    const wantedStatus = statusParam && statusParam !== 'all' ? statusParam.toUpperCase() : null;

    const allRows: NormalizedRow[] = [];

    // --- Family A: grandTotal + paidAmount tables ---
    const [bike, car, chauffeur] = await Promise.all([
      wantedServices.has('bike')
        ? prisma.bike_bookings.findMany({
            where,
            select: { grandTotal: true, paidAmount: true, refundAmount: true, paymentMethod: true, paymentStatus: true, createdAt: true },
          })
        : Promise.resolve([]),
      wantedServices.has('car')
        ? prisma.car_bookings.findMany({
            where,
            select: { grandTotal: true, paidAmount: true, refundAmount: true, paymentMethod: true, paymentStatus: true, createdAt: true },
          })
        : Promise.resolve([]),
      wantedServices.has('chauffeur')
        ? prisma.chauffeur_bookings.findMany({
            where,
            select: { grandTotal: true, paidAmount: true, refundAmount: true, paymentMethod: true, paymentStatus: true, createdAt: true },
          })
        : Promise.resolve([]),
    ]);
    bike.forEach((b) => allRows.push({
      serviceKey: 'bike', value: b.grandTotal || 0, collected: b.paidAmount || 0, refunded: b.refundAmount || 0,
      method: normalizeMethod(b.paymentMethod), status: b.paymentStatus, createdAt: b.createdAt,
    }));
    car.forEach((b) => allRows.push({
      serviceKey: 'car', value: b.grandTotal || 0, collected: b.paidAmount || 0, refunded: b.refundAmount || 0,
      method: normalizeMethod(b.paymentMethod), status: b.paymentStatus, createdAt: b.createdAt,
    }));
    chauffeur.forEach((b) => allRows.push({
      serviceKey: 'chauffeur', value: b.grandTotal || 0, collected: b.paidAmount || 0, refunded: b.refundAmount || 0,
      method: normalizeMethod(b.paymentMethod), status: b.paymentStatus, createdAt: b.createdAt,
    }));

    // --- Luxury: grandTotal + advancePaid (no paidAmount field) ---
    if (wantedServices.has('luxury')) {
      const luxury = await prisma.luxury_bookings.findMany({
        where,
        select: { grandTotal: true, advancePaid: true, refundAmount: true, paymentMethod: true, paymentStatus: true, createdAt: true },
      });
      luxury.forEach((b) => allRows.push({
        serviceKey: 'luxury', value: b.grandTotal || 0, collected: b.advancePaid || 0, refunded: b.refundAmount || 0,
        method: normalizeMethod(b.paymentMethod), status: b.paymentStatus, createdAt: b.createdAt,
      }));
    }

    // --- Family B: totalAmount + advancePaid/balancePaid tables ---
    const [bus, truck, packers] = await Promise.all([
      wantedServices.has('bus')
        ? prisma.bus_bookings.findMany({
            where,
            select: { totalAmount: true, advancePaid: true, balancePaid: true, refundAmount: true, paymentMethod: true, paymentStatus: true, createdAt: true },
          })
        : Promise.resolve([]),
      wantedServices.has('truck')
        ? prisma.truck_bookings.findMany({
            where,
            select: { totalAmount: true, advancePaid: true, balancePaid: true, refundAmount: true, paymentMethod: true, paymentStatus: true, createdAt: true },
          })
        : Promise.resolve([]),
      wantedServices.has('packers')
        ? prisma.packers_bookings.findMany({
            where,
            select: { totalAmount: true, advancePaid: true, balancePaid: true, refundAmount: true, paymentMethod: true, paymentStatus: true, createdAt: true },
          })
        : Promise.resolve([]),
    ]);
    bus.forEach((b) => allRows.push({
      serviceKey: 'bus', value: b.totalAmount || 0, collected: (b.advancePaid || 0) + (b.balancePaid || 0), refunded: b.refundAmount || 0,
      method: normalizeMethod(b.paymentMethod), status: b.paymentStatus, createdAt: b.createdAt,
    }));
    truck.forEach((b) => allRows.push({
      serviceKey: 'truck', value: b.totalAmount || 0, collected: (b.advancePaid || 0) + (b.balancePaid || 0), refunded: b.refundAmount || 0,
      method: normalizeMethod(b.paymentMethod), status: b.paymentStatus, createdAt: b.createdAt,
    }));
    packers.forEach((b) => allRows.push({
      serviceKey: 'packers', value: b.totalAmount || 0, collected: (b.advancePaid || 0) + (b.balancePaid || 0), refunded: b.refundAmount || 0,
      method: normalizeMethod(b.paymentMethod), status: b.paymentStatus, createdAt: b.createdAt,
    }));

    // --- Equipment: totalAmount + advancePaid/balancePaid/depositPaid ---
    if (wantedServices.has('equipment')) {
      const equipment = await prisma.equipment_bookings.findMany({
        where,
        select: { totalAmount: true, advancePaid: true, balancePaid: true, depositPaid: true, refundAmount: true, paymentMethod: true, paymentStatus: true, createdAt: true },
      });
      equipment.forEach((b) => allRows.push({
        serviceKey: 'equipment', value: b.totalAmount || 0,
        collected: (b.advancePaid || 0) + (b.balancePaid || 0) + (b.depositPaid || 0),
        refunded: b.refundAmount || 0,
        method: normalizeMethod(b.paymentMethod), status: b.paymentStatus, createdAt: b.createdAt,
      }));
    }

    // --- Wander: different schema — boolean flags instead of paymentStatus enum ---
    if (wantedServices.has('wander')) {
      try {
        const wander = await prisma.wander_bookings.findMany({
          where,
          select: { amount: true, advanceAmount: true, advancePaid: true, balancePaid: true, paymentMethod: true, status: true, createdAt: true },
        });
        wander.forEach((b) => {
          const collected = b.balancePaid ? (b.amount || 0) : b.advancePaid ? (b.advanceAmount || 0) : 0;
          const status = b.balancePaid ? 'PAID' : b.advancePaid ? 'PARTIAL' : 'PENDING';
          allRows.push({
            serviceKey: 'wander', value: b.amount || 0, collected, refunded: 0,
            method: normalizeMethod(b.paymentMethod), status, createdAt: b.createdAt,
          });
        });
      } catch (e) {
        logger.error('Tally: wander bookings fetch failed (continuing without)', e);
      }
    }

    const filteredRows = wantedStatus ? allRows.filter((r) => r.status === wantedStatus) : allRows;

    // --- Aggregate ---
    const totals = filteredRows.reduce(
      (acc, r) => {
        acc.value += r.value;
        acc.collected += r.collected;
        acc.refunded += r.refunded;
        return acc;
      },
      { value: 0, collected: 0, refunded: 0 },
    );

    const byService: Record<string, { label: string; count: number; value: number; collected: number; refunded: number }> = {};
    const byMethod: Record<string, { count: number; collected: number }> = {};
    const byStatus: Record<string, number> = {};
    const byDate: Record<string, { value: number; collected: number }> = {};

    for (const r of filteredRows) {
      if (!byService[r.serviceKey]) {
        byService[r.serviceKey] = { label: SERVICE_LABELS[r.serviceKey] || r.serviceKey, count: 0, value: 0, collected: 0, refunded: 0 };
      }
      byService[r.serviceKey].count += 1;
      byService[r.serviceKey].value += r.value;
      byService[r.serviceKey].collected += r.collected;
      byService[r.serviceKey].refunded += r.refunded;

      if (!byMethod[r.method]) byMethod[r.method] = { count: 0, collected: 0 };
      byMethod[r.method].count += 1;
      byMethod[r.method].collected += r.collected;

      byStatus[r.status] = (byStatus[r.status] || 0) + 1;

      const dateKey = toDateKey(r.createdAt);
      if (!byDate[dateKey]) byDate[dateKey] = { value: 0, collected: 0 };
      byDate[dateKey].value += r.value;
      byDate[dateKey].collected += r.collected;
    }

    return NextResponse.json({
      success: true,
      totals: {
        totalBookings: filteredRows.length,
        totalValue: totals.value,
        totalCollected: totals.collected,
        totalPending: Math.max(totals.value - totals.collected - totals.refunded, 0),
        totalRefunded: totals.refunded,
      },
      byService: Object.entries(byService).map(([key, v]) => ({ key, ...v })),
      byMethod: Object.entries(byMethod).map(([key, v]) => ({ key, ...v })),
      byStatus,
      byDate: Object.entries(byDate)
        .map(([date, v]) => ({ date, ...v }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      availableServices: ALL_SERVICE_KEYS,
      availableStatuses: ALL_STATUS_KEYS,
    });
  } catch (error) {
    logger.error('Payments tally fetch failed', error);
    return NextResponse.json({ success: false, error: 'Failed to compute payments tally' }, { status: 500 });
  }
}
