import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { getDateRange } from '@/lib/manager-performance';

export const dynamic = 'force-dynamic';

const SERVICE_NAMES: Record<string, string> = {
  'bike-rental': 'Bike Rental',
  'bus-rental': 'Bus Rental',
  'self-drive': 'Self Drive',
  'equipment-rental': 'Equipment Rental',
  'luxury-car-rental': 'Luxury Cars',
  'packers-and-movers': 'Packers & Movers',
  'truck-transport': 'Truck Transport',
  'contact-inquiry': 'Contact Inquiry',
};

// contact_inquiries has no location field — the subject line fills the
// "locationName" slot in the shared UI ("Contact Inquiry · <subject> · INQ-xxxxxx").
async function fetchContactInquirySummary(id: string) {
  const r = await prisma.contact_inquiries.findUnique({
    where: { id },
    select: { name: true, phone: true, subject: true, createdAt: true },
  });
  if (!r) return null;
  return {
    requestNumber: `INQ-${id.slice(-6).toUpperCase()}`,
    customerName: r.name,
    customerPhone: r.phone,
    locationName: r.subject,
    createdAt: r.createdAt,
  };
}

// Look up a single quote-request's customer/location details by its known serviceType
// (stored on the action log itself, so no need to search all 7 tables blindly).
async function fetchInquirySummary(id: string, serviceType: string) {
  const customerSelect = { select: { name: true, phone: true } } as const;
  switch (serviceType) {
    case 'bike-rental': {
      const r = await prisma.bike_quote_requests.findUnique({ where: { id }, select: { requestNumber: true, customerName: true, customerPhone: true, locationName: true, createdAt: true, customers: customerSelect } });
      return r && { requestNumber: r.requestNumber, customerName: r.customers?.name || r.customerName, customerPhone: r.customers?.phone || r.customerPhone, locationName: r.locationName, createdAt: r.createdAt };
    }
    case 'bus-rental': {
      const r = await prisma.bus_quote_requests.findUnique({ where: { id }, select: { requestNumber: true, customerName: true, customerPhone: true, pickupCity: true, createdAt: true, customers: customerSelect } });
      return r && { requestNumber: r.requestNumber, customerName: r.customers?.name || r.customerName, customerPhone: r.customers?.phone || r.customerPhone, locationName: r.pickupCity, createdAt: r.createdAt };
    }
    case 'self-drive': {
      const r = await prisma.self_drive_quote_requests.findUnique({ where: { id }, select: { requestNumber: true, customerName: true, customerPhone: true, locationName: true, createdAt: true, customers: customerSelect } });
      return r && { requestNumber: r.requestNumber, customerName: r.customers?.name || r.customerName, customerPhone: r.customers?.phone || r.customerPhone, locationName: r.locationName, createdAt: r.createdAt };
    }
    case 'equipment-rental': {
      const r = await prisma.equipment_quote_requests.findUnique({ where: { id }, select: { requestNumber: true, customerName: true, customerPhone: true, deliveryCity: true, createdAt: true, customers: customerSelect } });
      return r && { requestNumber: r.requestNumber, customerName: r.customers?.name || r.customerName, customerPhone: r.customers?.phone || r.customerPhone, locationName: r.deliveryCity, createdAt: r.createdAt };
    }
    case 'luxury-car-rental': {
      const r = await prisma.luxury_quote_requests.findUnique({ where: { id }, select: { requestNumber: true, customerName: true, customerPhone: true, pickupCity: true, createdAt: true, customers: customerSelect } });
      return r && { requestNumber: r.requestNumber, customerName: r.customers?.name || r.customerName, customerPhone: r.customers?.phone || r.customerPhone, locationName: r.pickupCity, createdAt: r.createdAt };
    }
    case 'packers-and-movers': {
      const r = await prisma.packers_quote_requests.findUnique({ where: { id }, select: { requestNumber: true, customerName: true, customerPhone: true, pickupCity: true, createdAt: true, customers: customerSelect } });
      return r && { requestNumber: r.requestNumber, customerName: r.customers?.name || r.customerName, customerPhone: r.customers?.phone || r.customerPhone, locationName: r.pickupCity, createdAt: r.createdAt };
    }
    case 'truck-transport': {
      const r = await prisma.truck_quote_requests.findUnique({ where: { id }, select: { requestNumber: true, customerName: true, customerPhone: true, pickupCity: true, createdAt: true, customers: customerSelect } });
      return r && { requestNumber: r.requestNumber, customerName: r.customers?.name || r.customerName, customerPhone: r.customers?.phone || r.customerPhone, locationName: r.pickupCity, createdAt: r.createdAt };
    }
    default:
      return null;
  }
}

// GET — which inquiries a manager actually took action on in a date range, and
// what those actions were. Complements /untouched (which shows the opposite).
// ?managerId=&filter=&dateFrom=&dateTo=
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.admin_users.findUnique({ where: { id: session.user.id } });
    if (!currentUser || !['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const managerId = searchParams.get('managerId');
    if (!managerId) {
      return NextResponse.json({ error: 'managerId is required' }, { status: 400 });
    }
    const filter = searchParams.get('filter') || 'today';
    const customFrom = searchParams.get('dateFrom');
    const customTo = searchParams.get('dateTo');
    const dateFilter = getDateRange(filter, customFrom, customTo);
    const dateFilterObj = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const logs = await prisma.manager_action_logs.findMany({
      where: { recordType: { in: ['INQUIRY', 'CONTACT_INQUIRY'] }, managerId, ...dateFilterObj },
      orderBy: { createdAt: 'desc' },
    });

    // Group log entries by record, keep each record's own action history.
    const byRecord = new Map<string, { recordType: string; serviceType: string; actions: { actionType: string; note: string | null; createdAt: Date }[] }>();
    for (const log of logs) {
      if (!byRecord.has(log.recordId)) byRecord.set(log.recordId, { recordType: log.recordType, serviceType: log.serviceType, actions: [] });
      byRecord.get(log.recordId)!.actions.push({ actionType: log.actionType, note: log.note, createdAt: log.createdAt });
    }

    const entries = await Promise.all(
      Array.from(byRecord.entries()).map(async ([id, { recordType, serviceType, actions }]) => {
        const summary = recordType === 'CONTACT_INQUIRY'
          ? await fetchContactInquirySummary(id).catch(() => null)
          : await fetchInquirySummary(id, serviceType).catch(() => null);
        if (!summary) return null;
        return {
          id,
          recordType,
          requestNumber: summary.requestNumber,
          customerName: summary.customerName,
          customerPhone: summary.customerPhone,
          serviceName: SERVICE_NAMES[serviceType] || serviceType,
          locationName: summary.locationName,
          submittedAt: summary.createdAt,
          actions: actions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
        };
      })
    );

    const sortByLastAction = (a: any, b: any) => new Date(b.actions[0].createdAt).getTime() - new Date(a.actions[0].createdAt).getTime();

    // Contact inquiries are a separate, unscoped queue (see manager-performance.ts) —
    // kept out of `actioned` so its count stays in sync with the `inquiries.actioned`
    // stat above (which only counts recordType 'INQUIRY'), and get their own list
    // instead of being invisibly mixed in.
    const actioned = entries.filter(Boolean).filter((e: any) => e.recordType !== 'CONTACT_INQUIRY').sort(sortByLastAction);
    const contactInquiries = entries.filter(Boolean).filter((e: any) => e.recordType === 'CONTACT_INQUIRY').sort(sortByLastAction);

    return NextResponse.json({ actioned, contactInquiries });
  } catch (error: any) {
    logger.error('Manager actioned-inquiries fetch error', error);
    return NextResponse.json(
      { error: 'Failed to fetch actioned inquiries', details: error?.message },
      { status: 500 }
    );
  }
}
