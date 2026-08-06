// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { isVendorServiceActive } from '@/lib/services/vendor-service-status';

export const dynamic = 'force-dynamic';

// Normalise raw status → display bucket
function normStatus(s: string): 'new' | 'active' | 'completed' | 'cancelled' {
  const u = (s ?? '').toUpperCase();
  if (['CANCELLED', 'EXPIRED', 'DROPPED', 'REFUNDED'].includes(u))        return 'cancelled';
  if (['COMPLETED'].includes(u))                                            return 'completed';
  if (['PENDING_VENDOR', 'BROADCASTED', 'PAYMENT_SUBMITTED',
       'PAYMENT_VERIFIED', 'ADVANCE_PAID', 'CONFIRMED',
       'PENDING_PAYMENT', 'PAYMENT_PENDING'].includes(u))                   return 'new';
  // ACCEPTED, DRIVER_ASSIGNED, IN_PROGRESS, VEHICLE_ASSIGNED, TEAM_ASSIGNED,
  // PACKING, LOADING, IN_TRANSIT, UNLOADING, UNPACKING, READY_FOR_PICKUP …
  return 'active';
}

function normPayStatus(ps: string): 'paid' | 'partial' | 'pending' {
  const s = (ps ?? '').toUpperCase();
  if (['PAID', 'PAID_ONLINE', 'COLLECTED', 'WAIVED'].includes(s)) return 'paid';
  if (s === 'PARTIAL') return 'partial';
  return 'pending';
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vid = auth.vendorId;
    const { searchParams } = new URL(request.url);
    const statusFilter  = searchParams.get('status');   // 'new' | 'active' | 'completed' | 'cancelled' | null
    const serviceFilter = searchParams.get('service');  // service name string | null
    const search        = searchParams.get('q')?.toLowerCase() || '';
    const page          = parseInt(searchParams.get('page') || '1');
    const ALLOWED_LIMITS = [10, 20, 50, 100];
    const requestedLimit = parseInt(searchParams.get('limit') || '10');
    const limit         = ALLOWED_LIMITS.includes(requestedLimit) ? requestedLimit : 10;

    type UB = {
      id: string; bookingNumber: string;
      service: string; serviceKey: string;
      customerName: string; customerPhone: string;
      totalAmount: number; paidAmount: number;
      paymentStatus: 'paid' | 'partial' | 'pending';
      rawStatus: string;
      status: 'new' | 'active' | 'completed' | 'cancelled';
      tripDate: Date | null;
      createdAt: Date;
      detailUrl: string;
    };

    const all: UB[] = [];

    // A vendor who's deactivated a service on /vendor/services must stop
    // seeing its bookings here too — same convention as the quote-requests
    // widget. Car Rental (chauffeur, direct-booking flow), Wander Tours and
    // Direct Bookings sit outside the vendor_approved_services quote system
    // entirely, so they're intentionally left ungated.
    const [bikeActive, busActive, packersActive, truckActive, luxuryActive] = await Promise.all([
      isVendorServiceActive(vid, 'bike'),
      isVendorServiceActive(vid, 'bus'),
      isVendorServiceActive(vid, 'packers'),
      isVendorServiceActive(vid, 'truck'),
      isVendorServiceActive(vid, 'luxury'),
    ]);

    // ── 1. Bike Rentals ─────────────────────────────────────────────
    if (bikeActive) try {
      const rows = await prisma.bike_bookings.findMany({
        where: { acceptedVendorId: vid },
        select: {
          id: true, bookingNumber: true, customerName: true, customerPhone: true,
          totalAmount: true, paidAmount: true, paymentStatus: true,
          status: true, pickupDate: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      for (const b of rows) all.push({
        id: b.id, bookingNumber: b.bookingNumber,
        service: 'Bike Rental', serviceKey: 'bike',
        customerName: b.customerName, customerPhone: b.customerPhone,
        totalAmount: Number(b.totalAmount || 0), paidAmount: Number(b.paidAmount || 0),
        paymentStatus: normPayStatus(b.paymentStatus),
        rawStatus: b.status, status: normStatus(b.status),
        tripDate: b.pickupDate, createdAt: b.createdAt,
        detailUrl: `/vendor/bike-rentals/bookings/${b.id}`,
      });
    } catch (_) {}

    // ── 2. Bus & Tempo ──────────────────────────────────────────────
    if (busActive) try {
      const rows = await prisma.bus_bookings.findMany({
        where: { vendorId: vid },
        select: {
          id: true, bookingNumber: true, customerName: true, customerPhone: true,
          totalAmount: true, paymentStatus: true,
          status: true, pickupDate: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      for (const b of rows) {
        const ps = normPayStatus(b.paymentStatus);
        all.push({
          id: b.id, bookingNumber: b.bookingNumber,
          service: 'Bus & Tempo', serviceKey: 'bus',
          customerName: b.customerName, customerPhone: b.customerPhone,
          totalAmount: Number(b.totalAmount || 0),
          paidAmount: ps === 'paid' ? Number(b.totalAmount || 0) : 0,
          paymentStatus: ps, rawStatus: b.status, status: normStatus(b.status),
          tripDate: b.pickupDate, createdAt: b.createdAt,
          detailUrl: `/vendor/bus/bookings/${b.id}`,
        });
      }
    } catch (_) {}

    // ── 3. Packers & Movers ────────────────────────────────────────
    if (packersActive) try {
      const rows = await prisma.packers_bookings.findMany({
        where: { vendorId: vid },
        select: {
          id: true, bookingNumber: true, customerName: true, customerPhone: true,
          totalAmount: true, paymentStatus: true,
          status: true, scheduledDate: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      for (const b of rows) {
        const ps = normPayStatus(b.paymentStatus);
        all.push({
          id: b.id, bookingNumber: b.bookingNumber,
          service: 'Packers & Movers', serviceKey: 'packers',
          customerName: b.customerName, customerPhone: b.customerPhone,
          totalAmount: Number(b.totalAmount || 0),
          paidAmount: ps === 'paid' ? Number(b.totalAmount || 0) : 0,
          paymentStatus: ps, rawStatus: b.status, status: normStatus(b.status),
          tripDate: b.scheduledDate, createdAt: b.createdAt,
          detailUrl: `/vendor/packers/bookings/${b.id}`,
        });
      }
    } catch (_) {}

    // ── 4. Transporter (Truck) ─────────────────────────────────────
    if (truckActive) try {
      const rows = await prisma.truck_bookings.findMany({
        where: { vendorId: vid },
        select: {
          id: true, bookingNumber: true, customerName: true, customerPhone: true,
          totalAmount: true, paymentStatus: true,
          status: true, pickupDate: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      for (const b of rows) {
        const ps = normPayStatus(b.paymentStatus);
        all.push({
          id: b.id, bookingNumber: b.bookingNumber,
          service: 'Transporter', serviceKey: 'truck',
          customerName: b.customerName, customerPhone: b.customerPhone,
          totalAmount: Number(b.totalAmount || 0),
          paidAmount: ps === 'paid' ? Number(b.totalAmount || 0) : 0,
          paymentStatus: ps, rawStatus: b.status, status: normStatus(b.status),
          tripDate: b.pickupDate, createdAt: b.createdAt,
          detailUrl: `/vendor/transporter/bookings/${b.id}`,
        });
      }
    } catch (_) {}

    // ── 5. Car Rental (Chauffeur) ──────────────────────────────────
    try {
      const rows = await prisma.chauffeur_bookings.findMany({
        where: { acceptedVendorId: vid },
        select: {
          id: true, bookingNumber: true, customerName: true, customerPhone: true,
          grandTotal: true, paidAmount: true, paymentStatus: true,
          status: true, pickupDate: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      for (const b of rows) all.push({
        id: b.id, bookingNumber: b.bookingNumber,
        service: 'Car Rental', serviceKey: 'car',
        customerName: b.customerName, customerPhone: b.customerPhone,
        totalAmount: Number(b.grandTotal || 0), paidAmount: Number(b.paidAmount || 0),
        paymentStatus: normPayStatus(b.paymentStatus),
        rawStatus: b.status, status: normStatus(b.status),
        tripDate: b.pickupDate, createdAt: b.createdAt,
        detailUrl: `/vendor/car-rental/bookings/${b.bookingNumber}`,
      });
    } catch (_) {}

    // ── 6. Luxury Cars ─────────────────────────────────────────────
    if (luxuryActive) try {
      const rows = await prisma.luxury_bookings.findMany({
        where: { acceptedVendorId: vid },
        select: {
          id: true, bookingNumber: true, customerName: true, customerPhone: true,
          finalAmount: true, paymentStatus: true,
          status: true, pickupDate: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      for (const b of rows) {
        const ps = normPayStatus(b.paymentStatus);
        all.push({
          id: b.id, bookingNumber: b.bookingNumber,
          service: 'Luxury Cars', serviceKey: 'luxury',
          customerName: b.customerName, customerPhone: b.customerPhone,
          totalAmount: Number(b.finalAmount || 0),
          paidAmount: ps === 'paid' ? Number(b.finalAmount || 0) : 0,
          paymentStatus: ps, rawStatus: b.status, status: normStatus(b.status),
          tripDate: b.pickupDate, createdAt: b.createdAt,
          detailUrl: `/vendor/luxury/bookings/${b.id}`,
        });
      }
    } catch (_) {}

    // ── 7. Wander Tours ────────────────────────────────────────────
    try {
      const rows = await prisma.wander_bookings.findMany({
        where: { vendorId: vid },
        select: {
          id: true, bookingId: true,
          amount: true, advanceAmount: true, advancePaid: true, balancePaid: true,
          status: true, travelDate: true, createdAt: true,
          customer: { select: { name: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      for (const b of rows) {
        const ps = b.balancePaid ? 'paid' : b.advancePaid ? 'partial' : 'pending';
        const paid = b.balancePaid ? Number(b.amount) : b.advancePaid ? Number(b.advanceAmount || 0) : 0;
        all.push({
          id: b.id, bookingNumber: b.bookingId,
          service: 'Wander Tours', serviceKey: 'wander',
          customerName: b.customer?.name || 'Tour Customer',
          customerPhone: b.customer?.phone || '',
          totalAmount: Number(b.amount || 0), paidAmount: paid,
          paymentStatus: ps as any, rawStatus: b.status, status: normStatus(b.status),
          tripDate: b.travelDate, createdAt: b.createdAt,
          detailUrl: `/vendor/wander/bookings/${b.id}`,
        });
      }
    } catch (_) {}

    // ── 8. Direct Bookings ─────────────────────────────────────────
    try {
      const rows = await prisma.vendor_direct_bookings.findMany({
        where: { vendorId: vid },
        select: {
          id: true, bookingNumber: true, customerName: true, customerPhone: true,
          serviceType: true, totalAmount: true, paidAmount: true, paymentStatus: true,
          status: true, pickupDate: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      for (const b of rows) all.push({
        id: b.id, bookingNumber: b.bookingNumber,
        service: 'Direct Booking', serviceKey: 'direct',
        customerName: b.customerName, customerPhone: b.customerPhone,
        totalAmount: Number(b.totalAmount || 0), paidAmount: Number(b.paidAmount || 0),
        paymentStatus: normPayStatus(b.paymentStatus),
        rawStatus: b.status, status: normStatus(b.status),
        tripDate: b.pickupDate ?? null, createdAt: b.createdAt,
        detailUrl: `/vendor/direct-bookings/${b.id}`,
      });
    } catch (_) {}

    // ── Sort by createdAt desc ──────────────────────────────────────
    all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // ── Filter ─────────────────────────────────────────────────────
    let result = all;
    if (statusFilter && statusFilter !== 'all') result = result.filter(b => b.status === statusFilter);
    if (serviceFilter) result = result.filter(b => b.serviceKey === serviceFilter);
    if (search) result = result.filter(b =>
      b.customerName.toLowerCase().includes(search) ||
      b.bookingNumber.toLowerCase().includes(search) ||
      b.customerPhone.includes(search)
    );

    // ── Summary counts ─────────────────────────────────────────────
    const counts = {
      all:       all.length,
      new:       all.filter(b => b.status === 'new').length,
      active:    all.filter(b => b.status === 'active').length,
      completed: all.filter(b => b.status === 'completed').length,
      cancelled: all.filter(b => b.status === 'cancelled').length,
    };

    const services = [...new Set(all.map(b => b.serviceKey))].map(key => ({
      key,
      label: all.find(b => b.serviceKey === key)?.service ?? key,
      count: all.filter(b => b.serviceKey === key).length,
    }));

    // ── Paginate ───────────────────────────────────────────────────
    const total  = result.length;
    const offset = (page - 1) * limit;
    const items  = result.slice(offset, offset + limit);

    return NextResponse.json({ counts, services, total, page, limit, bookings: items });
  } catch (err) {
    console.error('[all-bookings]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
